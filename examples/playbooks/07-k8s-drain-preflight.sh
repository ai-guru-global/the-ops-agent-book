#!/usr/bin/env bash
# SYNTHETIC / 脱敏示例（PLAY-07）：drain 前只读证据采集与 fail-closed 门禁。
# 仅允许 kind-ops-test / ops-test；不执行 cordon、drain、delete、patch 或 exec。
# API 只能证明 emptyDir 声明，不能证明其中没有本地文件；声明即按 UNKNOWN 阻断默认 drain。
set -euo pipefail
umask 077

readonly EXPECTED_CONTEXT="kind-ops-test"
readonly EXPECTED_NAMESPACE="ops-test"
readonly NODE="${NODE:-synthetic-node-a}"
readonly EVIDENCE_DIR="${EVIDENCE_DIR:-}"

if [[ ! "$NODE" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]]; then
  printf 'REFUSED: NODE must be a synthetic DNS name.\n' >&2
  exit 2
fi
if [[ -z "$EVIDENCE_DIR" ]]; then
  printf 'REFUSED: set EVIDENCE_DIR to a new or empty local staging directory.\n' >&2
  exit 2
fi
if [[ -L "$EVIDENCE_DIR" || ( -e "$EVIDENCE_DIR" && ! -d "$EVIDENCE_DIR" ) ]]; then
  printf 'REFUSED: EVIDENCE_DIR must be a real directory, not a symlink or file.\n' >&2
  exit 2
fi
for tool in kubectl python3; do
  command -v "$tool" >/dev/null 2>&1 || {
    printf 'MISSING_TOOL: %s\n' "$tool" >&2
    exit 2
  }
done

current_context="$(kubectl config current-context 2>/dev/null || true)"
if [[ "$current_context" != "$EXPECTED_CONTEXT" ]]; then
  printf 'REFUSED: expected context %s, got %s.\n' "$EXPECTED_CONTEXT" "${current_context:-<none>}" >&2
  exit 2
fi

if [[ ! -d "$EVIDENCE_DIR" ]]; then
  mkdir -m 700 -- "$EVIDENCE_DIR"
fi
if [[ -n "$(find "$EVIDENCE_DIR" -mindepth 1 -print -quit)" ]]; then
  printf 'REFUSED: EVIDENCE_DIR must be empty; evidence is never overwritten.\n' >&2
  exit 2
fi
readonly RUN_STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '%s\n' "$RUN_STARTED_AT" > "$EVIDENCE_DIR/snapshot-time.txt"
printf 'data_classification: synthetic/脱敏\nmode: readonly_preflight_not_authorization\ncontext: %s\nnamespace: %s\nnode: %s\nstarted_at: %s\n' \
  "$EXPECTED_CONTEXT" "$EXPECTED_NAMESPACE" "$NODE" "$RUN_STARTED_AT" \
  > "$EVIDENCE_DIR/run-metadata.txt"

cleanup_partial_files() {
  rm -f -- "$EVIDENCE_DIR"/*.tmp
}
trap cleanup_partial_files EXIT

snapshot() {
  local name="$1"
  shift
  if ! kubectl --context "$EXPECTED_CONTEXT" --request-timeout=30s "$@" \
    > "$EVIDENCE_DIR/$name.tmp"; then
    printf 'BLOCKED: snapshot %s failed; discard this incomplete evidence set.\n' "$name" >&2
    exit 3
  fi
  mv -- "$EVIDENCE_DIR/$name.tmp" "$EVIDENCE_DIR/$name"
}

# Collect identity, every Pod assigned to the target node, all potentially
# impacting PDBs, candidate-node conditions and allocatable capacity, and events.
snapshot namespace.json get namespace "$EXPECTED_NAMESPACE" -o json
snapshot node.json get node "$NODE" -o json
snapshot target-pods.json get pods --all-namespaces \
  --field-selector="spec.nodeName=$NODE" -o json
snapshot pdb.json get pdb --all-namespaces -o json
snapshot nodes.json get nodes -o json
snapshot node-events.json get events --all-namespaces \
  --field-selector="involvedObject.kind=Node,involvedObject.name=$NODE" -o json

if python3 - "$EVIDENCE_DIR" "$NODE" <<'PY'
import csv
import json
import sys
from pathlib import Path

out = Path(sys.argv[1])
target_node = sys.argv[2]


def load(name):
    try:
        with (out / name).open(encoding="utf-8") as handle:
            value = json.load(handle)
        if not isinstance(value, dict):
            raise ValueError(f"{name} is not a JSON object")
        return value
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"BLOCKED_INVALID_EVIDENCE: {exc}", file=sys.stderr)
        sys.exit(3)


def condition_status(obj, kind):
    for condition in obj.get("status", {}).get("conditions", []):
        if condition.get("type") == kind:
            return condition.get("status", "Unknown")
    return "Unknown"


def is_daemonset(pod):
    return any(
        owner.get("kind") == "DaemonSet"
        for owner in pod.get("metadata", {}).get("ownerReferences", [])
    )


def selector_matches(selector, labels):
    if not selector:
        return False
    for key, value in selector.get("matchLabels", {}).items():
        if labels.get(key) != value:
            return False
    for expression in selector.get("matchExpressions", []):
        key = expression.get("key")
        operator = expression.get("operator")
        values = expression.get("values", [])
        present = key in labels
        value = labels.get(key)
        if operator == "In" and (not present or value not in values):
            return False
        if operator == "NotIn" and present and value in values:
            return False
        if operator == "Exists" and not present:
            return False
        if operator == "DoesNotExist" and present:
            return False
        if operator not in {"In", "NotIn", "Exists", "DoesNotExist"}:
            return False
    return True


def quantity(value):
    """Parse the common Kubernetes quantity forms for display only."""
    if value is None:
        return 0.0
    text = str(value)
    multipliers = {
        "Ki": 1024, "Mi": 1024**2, "Gi": 1024**3, "Ti": 1024**4,
        "K": 1000, "M": 1000**2, "G": 1000**3, "T": 1000**4,
        "m": 0.001, "u": 0.000001, "n": 0.000000001,
    }
    for suffix, multiplier in multipliers.items():
        if text.endswith(suffix):
            try:
                return float(text[:-len(suffix)]) * multiplier
            except ValueError:
                return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


try:
    node = load("node.json")
    pods = load("target-pods.json").get("items", [])
    pdbs = load("pdb.json").get("items", [])
    nodes = load("nodes.json").get("items", [])
except (AttributeError, TypeError):
    print("BLOCKED_INVALID_EVIDENCE: snapshot items must be arrays", file=sys.stderr)
    sys.exit(3)

if node.get("metadata", {}).get("name") != target_node:
    print("BLOCKED_INVALID_EVIDENCE: target node identity mismatch", file=sys.stderr)
    sys.exit(3)

inventory_rows = []
emptydir_candidates = []
retained_emptydir = []
for pod in sorted(pods, key=lambda item: (item.get("metadata", {}).get("namespace", ""), item.get("metadata", {}).get("name", ""))):
    metadata = pod.get("metadata", {})
    spec = pod.get("spec", {})
    namespace = metadata.get("namespace", "<missing>")
    name = metadata.get("name", "<missing>")
    uid = metadata.get("uid", "<missing>")
    retained = is_daemonset(pod)
    disposition = "retained-daemonset" if retained else "eviction-candidate"
    if metadata.get("annotations", {}).get("kubernetes.io/config.mirror") == "true":
        disposition = "static-mirror-manual-review"
    volume_by_name = {
        volume.get("name"): volume
        for volume in spec.get("volumes", [])
        if isinstance(volume, dict)
    }
    pod_has_emptydir = False
    containers = [
        ("init", container) for container in spec.get("initContainers", [])
    ] + [
        ("app", container) for container in spec.get("containers", [])
    ] + [
        ("ephemeral", container) for container in spec.get("ephemeralContainers", [])
    ]
    for container_kind, container in containers:
        for mount in container.get("volumeMounts", []):
            volume = volume_by_name.get(mount.get("name"), {})
            if "emptyDir" not in volume:
                continue
            pod_has_emptydir = True
            empty = volume.get("emptyDir") or {}
            inventory_rows.append([
                namespace, name, uid, disposition, container_kind,
                container.get("name", "<missing>"), mount.get("name", "<missing>"),
                mount.get("mountPath", "<missing>"), str(mount.get("readOnly", False)),
                mount.get("subPath", ""), empty.get("medium", ""),
                empty.get("sizeLimit", ""), "UNKNOWN_API_ONLY",
            ])
    if pod_has_emptydir:
        if retained:
            retained_emptydir.append(f"{namespace}/{name}")
        else:
            emptydir_candidates.append(f"{namespace}/{name}")

with (out / "emptydir-inventory.tsv").open("w", encoding="utf-8", newline="") as handle:
    writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
    writer.writerow([
        "namespace", "pod", "uid", "disposition", "container_kind", "container",
        "volume", "mount_path", "read_only", "sub_path", "medium", "size_limit",
        "local_data_state",
    ])
    writer.writerows(inventory_rows)

# Report PDBs that select target Pods. A zero/missing disruptionsAllowed blocks;
# selector matching and reported status are evidence, not a substitute for review.
pdb_rows = []
pdb_blocked = False
impacting_pdb_count = 0
for pdb in sorted(pdbs, key=lambda item: (item.get("metadata", {}).get("namespace", ""), item.get("metadata", {}).get("name", ""))):
    metadata = pdb.get("metadata", {})
    selector = pdb.get("spec", {}).get("selector")
    impacted = [
        pod for pod in pods
        if pod.get("metadata", {}).get("namespace") == metadata.get("namespace")
        and selector_matches(selector, pod.get("metadata", {}).get("labels", {}))
    ]
    if not impacted:
        continue
    impacting_pdb_count += 1
    status = pdb.get("status", {})
    allowed = status.get("disruptionsAllowed")
    observed = status.get("observedGeneration")
    generation = metadata.get("generation")
    fresh = observed is not None and observed == generation
    blocked = (
        not fresh or isinstance(allowed, bool) or not isinstance(allowed, int)
        or allowed < 1
    )
    pdb_blocked = pdb_blocked or blocked
    pdb_rows.append([
        metadata.get("namespace", "<missing>"), metadata.get("name", "<missing>"),
        len(impacted), status.get("currentHealthy", "<missing>"),
        status.get("desiredHealthy", "<missing>"), allowed,
        "fresh" if fresh else "stale-or-missing", "BLOCK" if blocked else "REPORTED_ALLOWED",
        ",".join(sorted(f"{pod.get('metadata', {}).get('name', '<missing>')}" for pod in impacted)),
    ])

with (out / "pdb-impact.tsv").open("w", encoding="utf-8", newline="") as handle:
    writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
    writer.writerow([
        "namespace", "pdb", "impacted_pods", "current_healthy", "desired_healthy",
        "disruptions_allowed", "status_freshness", "gate", "pods",
    ])
    writer.writerows(pdb_rows)

pod_readiness_rows = []
unready_target_pods = []
unknown_target_pods = []
for pod in sorted(pods, key=lambda item: (item.get("metadata", {}).get("namespace", ""), item.get("metadata", {}).get("name", ""))):
    metadata = pod.get("metadata", {})
    pod_name = f"{metadata.get('namespace', '<missing>')}/{metadata.get('name', '<missing>')}"
    ready = condition_status(pod, "Ready")
    if ready == "Unknown":
        unknown_target_pods.append(pod_name)
    elif ready != "True":
        unready_target_pods.append(pod_name)
    pod_readiness_rows.append([
        pod_name, metadata.get("uid", "<missing>"), pod.get("status", {}).get("phase", "<missing>"),
        ready, str(bool(metadata.get("deletionTimestamp"))), "retained-daemonset" if is_daemonset(pod) else "eviction-candidate",
    ])

with (out / "pod-readiness.tsv").open("w", encoding="utf-8", newline="") as handle:
    writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
    writer.writerow(["pod", "uid", "phase", "ready", "terminating", "disposition"])
    writer.writerows(pod_readiness_rows)

# Candidate conditions and allocatable are screening signals only. Cluster-wide
# assigned requests, taints, tolerations, affinity, topology, quotas and scheduler
# decisions require separate evidence and are deliberately not guessed here.
candidate_rows = []
for candidate in sorted(nodes, key=lambda item: item.get("metadata", {}).get("name", "")):
    name = candidate.get("metadata", {}).get("name", "<missing>")
    if name == target_node:
        continue
    ready = condition_status(candidate, "Ready")
    unschedulable = candidate.get("spec", {}).get("unschedulable", False)
    allocatable = candidate.get("status", {}).get("allocatable", {})
    cpu = quantity(allocatable.get("cpu"))
    memory = quantity(allocatable.get("memory"))
    ephemeral = quantity(allocatable.get("ephemeral-storage"))
    candidate_rows.append([
        name, ready, str(unschedulable), allocatable.get("cpu", "<missing>"),
        allocatable.get("memory", "<missing>"), allocatable.get("ephemeral-storage", "<missing>"),
        f"cpu={cpu:g};memory={memory:g};ephemeral_storage={ephemeral:g}",
        "REVIEW" if ready == "True" and not unschedulable else "NOT_READY_OR_UNSCHEDULABLE",
    ])

with (out / "candidate-nodes.tsv").open("w", encoding="utf-8", newline="") as handle:
    writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
    writer.writerow([
        "node", "ready", "unschedulable", "allocatable_cpu", "allocatable_memory",
        "allocatable_ephemeral_storage", "parsed_allocatable", "screening",
    ])
    writer.writerows(candidate_rows)

ready_candidates = [row for row in candidate_rows if row[-1] == "REVIEW"]
target_ready = condition_status(node, "Ready")
static_mirrors = [
    f"{pod.get('metadata', {}).get('namespace', '<missing>')}/{pod.get('metadata', {}).get('name', '<missing>')}"
    for pod in pods
    if pod.get("metadata", {}).get("annotations", {}).get("kubernetes.io/config.mirror") == "true"
]
ready_blocked = (
    target_ready == "Unknown" or not ready_candidates or bool(static_mirrors)
    or bool(unknown_target_pods)
)
pdb_gate = "BLOCK" if pdb_blocked else (
    "REPORTED_ALLOWED" if impacting_pdb_count else "NO_IMPACTING_PDB_REVIEW_AVAILABILITY"
)
ready_gate = "BLOCK" if ready_blocked else "REVIEW_TARGET_AND_REPLACEMENT_READINESS"
emptydir_gate = "BLOCK_DECLARED_EMPTYDIR" if emptydir_candidates else "NO_EVICTION_CANDIDATE_EMPTYDIR"
overall_blocked = bool(emptydir_candidates) or pdb_blocked or ready_blocked

summary = [
    f"data_classification=synthetic/脱敏",
    f"target_node={target_node}",
    f"node_uid={node.get('metadata', {}).get('uid', '<missing>')}",
    f"node_resource_version={node.get('metadata', {}).get('resourceVersion', '<missing>')}",
    f"target_ready={target_ready}",
    f"target_pod_count={len(pods)}",
    f"unready_target_pods={','.join(unready_target_pods) or '<none>'}",
    f"unknown_readiness_target_pods={','.join(unknown_target_pods) or '<none>'}",
    f"emptydir_gate={emptydir_gate}",
    f"emptydir_eviction_candidates={','.join(emptydir_candidates) or '<none>'}",
    f"emptydir_retained_daemonsets={','.join(retained_emptydir) or '<none>'}",
    f"pdb_gate={pdb_gate}",
    f"capacity_gate=MANUAL_SCHEDULING_AND_HEADROOM_REVIEW_REQUIRED",
    f"ready_gate={ready_gate}",
    f"static_mirror_pods={','.join(static_mirrors) or '<none>'}",
    "local_data_inventory=NOT_COLLECTED_API_CANNOT_PROVE_EMPTINESS",
    f"overall_gate={'BLOCK' if overall_blocked else 'REVIEW_REQUIRED_NOT_APPROVED'}",
    "authorization=NONE_THIS_SCRIPT_NEVER_DRAINS",
]
(out / "gate-summary.txt").write_text("\n".join(summary) + "\n", encoding="utf-8")
print("\n".join(summary))
sys.exit(3 if overall_blocked else 0)
PY
then
  preflight_status=0
else
  preflight_status=$?
  if [[ "$preflight_status" -ne 3 ]]; then
    printf 'BLOCKED_INVALID_EVIDENCE: inventory processing failed.\n' >&2
    preflight_status=3
  fi
fi

# Hash both passing and blocked evidence sets. Move them to write-once/object-locked
# storage and bind a passing set's digest into the approved plan; this directory
# is local staging only. Invalid snapshots may not have every derived report.
evidence_files=()
for evidence_file in "$EVIDENCE_DIR"/*; do
  [[ -f "$evidence_file" ]] && evidence_files+=("${evidence_file##*/}")
done
if command -v shasum >/dev/null 2>&1; then
  hash_command=(shasum -a 256)
elif command -v sha256sum >/dev/null 2>&1; then
  hash_command=(sha256sum)
else
  printf 'MISSING_TOOL: shasum or sha256sum\n' >&2
  exit 2
fi
(
  cd "$EVIDENCE_DIR"
  "${hash_command[@]}" "${evidence_files[@]}" > SHA256SUMS
)

if [[ "$preflight_status" -ne 0 ]]; then
  printf '# Preflight blocked. Do not drain; preserve and escalate the hashed evidence.\n' >&2
  exit 3
fi

printf '# Evidence complete; overall status REVIEW_REQUIRED_NOT_APPROVED.\n'
printf '# This is not drain authorization. Verify local data, capacity, approvals and plan drift.\n'
