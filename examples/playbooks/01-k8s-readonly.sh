#!/usr/bin/env bash
# SYNTHETIC / 脱敏示例（PLAY-01）：只读审计，不是变更授权。
# 仅允许 kind-ops-test / ops-test；拒绝生产、drain、delete、patch、exec。
set -euo pipefail

readonly EXPECTED_CONTEXT="kind-ops-test"
readonly NAMESPACE="ops-test"
readonly NODE="${NODE:-synthetic-node-a}"
readonly PROMETHEUS_URL="${PROMETHEUS_URL:-http://127.0.0.1:9090}"

if [[ ! "$NODE" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]]; then
  printf 'REFUSED: NODE must be a synthetic DNS name.\n' >&2
  exit 2
fi
for tool in kubectl curl python3; do
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
if [[ "$PROMETHEUS_URL" != http://127.0.0.1:* && "$PROMETHEUS_URL" != http://localhost:* ]]; then
  printf 'REFUSED: Prometheus must be a local test endpoint.\n' >&2
  exit 2
fi

printf 'data_classification: synthetic/脱敏\nmode: readonly\ncontext: %s\nnamespace: %s\nnode: %s\n' \
  "$EXPECTED_CONTEXT" "$NAMESPACE" "$NODE"
printf '# Gate: use PLAY-07 for the full emptyDir/PDB/capacity/Ready drain preflight.\n'

# PDB first across namespaces. This audit never performs drain or approves one;
# PLAY-07 adds target identity, emptyDir inventory and fail-closed gate evidence.
kubectl --context "$EXPECTED_CONTEXT" get pdb --all-namespaces -o wide
kubectl --context "$EXPECTED_CONTEXT" get pdb --all-namespaces -o json
kubectl --context "$EXPECTED_CONTEXT" get pods --all-namespaces -o wide

kubectl --context "$EXPECTED_CONTEXT" get node "$NODE" -o wide
kubectl --context "$EXPECTED_CONTEXT" get node "$NODE" \
  -o jsonpath='{range .status.conditions[*]}{.type}{"="}{.status}{"\n"}{end}'
kubectl --context "$EXPECTED_CONTEXT" describe node "$NODE"
kubectl --context "$EXPECTED_CONTEXT" -n "$NAMESPACE" get events \
  --sort-by=.metadata.creationTimestamp
kubectl --context "$EXPECTED_CONTEXT" -n "$NAMESPACE" get pods -o wide

promql() {
  local title="$1" query="$2"
  printf '\n# SYNTHETIC PromQL: %s\n' "$title"
  curl --fail --silent --show-error --max-time 10 --get \
    --data-urlencode "query=$query" "$PROMETHEUS_URL/api/v1/query"
  printf '\n'
}

# Exporter names/labels are deployment-specific; no data is still a finding, not zero.
promql 'memory available ratio' \
  '1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes'
promql 'root filesystem available ratio' \
  'node_filesystem_avail_bytes{fstype=~"ext4|xfs"} / node_filesystem_size_bytes{fstype=~"ext4|xfs"}'
promql 'inode available ratio' \
  'node_filesystem_files_free{fstype=~"ext4|xfs"} / node_filesystem_files{fstype=~"ext4|xfs"}'
promql 'container PID ratio (requires cAdvisor pids exporter)' \
  'container_pids_current / container_pids_max'
promql 'pod restarts over five minutes' \
  'sum by (namespace, pod, container) (increase(kube_pod_container_status_restarts_total{namespace="ops-test"}[5m]))'

printf '# Complete: preserve raw outputs, time range, SHA-256, TTL and concurrent versions.\n'
