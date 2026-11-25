#!/usr/bin/env python3
"""PLAY-08: read-only local RoCE rail-mismatch evidence auditor (SYNTHETIC/脱敏).

Reads exactly three named JSON files; never connects to a device, runs a command,
or changes network/host configuration. A report is evidence, not authorization.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

TARGET_FILE = "08-rdma-rail-target.json"
EVIDENCE_FILE = "08-rdma-rail-evidence.json"
APPROVALS_FILE = "08-rdma-rail-approvals.json"
COUNTERS = (
    "link_downed", "symbol_error", "crc_error", "fec_error", "rx_pause",
    "tx_pause", "rx_pause_duration_ns", "ecn_marked", "cnp_rx",
)
ERROR_COUNTERS = ("link_downed", "symbol_error", "crc_error", "fec_error")
HEX256 = re.compile(r"^[0-9a-f]{64}$")


class AuditError(Exception):
    """Invalid, mismatched, or unsafe input (exit 2)."""


class AuditTimeout(Exception):
    """The local processing deadline expired (exit 4)."""


def check_deadline(deadline: float) -> None:
    if time.monotonic() > deadline:
        raise AuditTimeout("local audit deadline exceeded; outcome is UNKNOWN, not success")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def bounded(name: str, value: int, maximum: int, minimum: int = 1) -> int:
    if not minimum <= value <= maximum:
        raise argparse.ArgumentTypeError(f"{name} must be {minimum}..{maximum}")
    return value


def positive_seconds(value: str) -> float:
    number = float(value)
    if not math.isfinite(number) or not 0.1 <= number <= 120:
        raise argparse.ArgumentTypeError("timeout-seconds must be 0.1..120")
    return number


def digest_arg(value: str) -> str:
    if not HEX256.fullmatch(value):
        raise argparse.ArgumentTypeError("expected SHA-256 must be 64 lowercase hex characters")
    return value


def read_limited(path: Path, max_bytes: int, deadline: float) -> tuple[bytes, str]:
    check_deadline(deadline)
    if path.is_symlink() or not path.is_file():
        raise AuditError(f"input must be a regular non-symlink file: {path.name}")
    with path.open("rb") as handle:
        data = handle.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise AuditError(f"input exceeds --max-input-bytes: {path.name}")
    check_deadline(deadline)
    return data, sha256(data)


def object_value(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise AuditError(f"{label} must be an object")
    return value


def list_value(value: Any, label: str) -> list[Any]:
    if not isinstance(value, list):
        raise AuditError(f"{label} must be an array")
    return value


def text_value(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise AuditError(f"{label} must be a non-empty string")
    return value


def nonnegative_number(value: Any) -> float | None:
    if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
        return None
    return float(value)


def required_number(obj: dict[str, Any], key: str) -> float:
    value = nonnegative_number(obj.get(key))
    if value is None:
        raise AuditError(f"threshold {key} must be a finite non-negative number")
    return value


def utc_time(value: Any, label: str) -> datetime:
    text = text_value(value, label)
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as exc:
        raise AuditError(f"{label} must be ISO-8601 UTC") from exc
    if parsed.tzinfo is None or parsed.utcoffset() != timezone.utc.utcoffset(parsed):
        raise AuditError(f"{label} must include a zero UTC offset")
    return parsed.astimezone(timezone.utc)


def iso(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def port_key(row: dict[str, Any]) -> tuple[str, str, int]:
    host = text_value(row.get("host"), "host")
    nic = text_value(row.get("nic"), "nic")
    port = row.get("port")
    if not host.endswith(".invalid"):
        raise AuditError("synthetic mode requires reserved .invalid host names")
    if type(port) is not int or port < 0:
        raise AuditError("port must be a non-negative integer")
    return host, nic, port


def key_text(key: tuple[str, str, int]) -> str:
    return f"{key[0]}/{key[1]}/port{key[2]}"


def require_synthetic(document: dict[str, Any], label: str) -> None:
    if document.get("schema_version") != "1.0":
        raise AuditError(f"{label}: unsupported or missing schema_version")
    if document.get("data_classification") != "synthetic/脱敏":
        raise AuditError(f"{label}: only synthetic/脱敏 evidence is accepted")


def parse_topology(target: dict[str, Any], evidence: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    expected: dict[tuple[str, str, int], dict[str, Any]] = {}
    for item in list_value(target.get("rail_map"), "rail_map"):
        row = object_value(item, "rail_map row")
        key = port_key(row)
        if key in expected:
            raise AuditError(f"duplicate expected topology key: {key_text(key)}")
        rail = row.get("rail")
        gpu_ids = row.get("gpu_ids")
        if type(rail) is not int or rail not in (0, 1) or not isinstance(gpu_ids, list):
            raise AuditError("rail must be 0/1 and gpu_ids must be an array")
        if any(type(gpu) is not int or gpu < 0 for gpu in gpu_ids) or len(set(gpu_ids)) != len(gpu_ids):
            raise AuditError("gpu_ids must be unique non-negative integers")
        expected[key] = row

    observed: dict[tuple[str, str, int], dict[str, Any]] = {}
    for item in list_value(evidence.get("topology_observed"), "topology_observed"):
        row = object_value(item, "topology_observed row")
        key = port_key(row)
        if key in observed:
            raise AuditError(f"duplicate observed topology key: {key_text(key)}")
        observed[key] = row

    mismatches: list[dict[str, Any]] = []
    for key in sorted(set(expected) | set(observed)):
        exp, obs = expected.get(key), observed.get(key)
        if exp is None or obs is None:
            mismatches.append({"port": key_text(key), "kind": "missing-or-extra-port", "expected": exp, "observed": obs})
            continue
        different = [name for name in ("rail", "leaf", "gpu_ids") if exp.get(name) != obs.get(name)]
        if different:
            mismatches.append({"port": key_text(key), "kind": "rail-map-mismatch", "fields": different, "expected": exp, "observed": obs})
    rows = [{"port": key_text(key), **observed[key]} for key in sorted(observed)]
    return rows, mismatches, list(expected.values())


def parse_counters(evidence: dict[str, Any], limits: dict[str, int], deadline: float) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    sampling = object_value(evidence.get("counter_sampling"), "counter_sampling")
    if not text_value(sampling.get("unit_contract"), "unit_contract").strip():
        raise AuditError("counter unit contract is required")
    ports = list_value(sampling.get("ports"), "counter_sampling.ports")
    output: list[dict[str, Any]] = []
    findings: list[dict[str, Any]] = []
    for item in ports:
        check_deadline(deadline)
        port = object_value(item, "counter port")
        key = port_key(port)
        samples = list_value(port.get("samples"), "samples")
        if not 2 <= len(samples) <= limits["max_samples_per_port"]:
            raise AuditError(f"{key_text(key)}: samples must be 2..{limits['max_samples_per_port']}")
        parsed: list[tuple[datetime, dict[str, Any]]] = []
        for raw in samples:
            sample = object_value(raw, "counter sample")
            parsed.append((utc_time(sample.get("t"), "sample.t"), sample))
        if any(parsed[i][0] >= parsed[i + 1][0] for i in range(len(parsed) - 1)):
            raise AuditError(f"{key_text(key)}: sample timestamps must be unique and increasing")
        for (t0, first), (t1, second) in zip(parsed, parsed[1:]):
            seconds = (t1 - t0).total_seconds()
            row: dict[str, Any] = {"port": key_text(key), "start": iso(t0), "end": iso(t1), "seconds": seconds}
            unknown: list[str] = []
            for metric in COUNTERS:
                a, b = nonnegative_number(first.get(metric)), nonnegative_number(second.get(metric))
                if a is None or b is None or b < a:
                    row[metric] = None
                    row[f"{metric}_delta"] = None
                    unknown.append(metric)
                else:
                    row[metric], row[f"{metric}_delta"] = b, b - a
            for metric in ("mtu", "speed_gbps"):
                a, b = nonnegative_number(first.get(metric)), nonnegative_number(second.get(metric))
                if a is None or b is None:
                    row[metric] = None
                    row[f"{metric}_delta"] = None
                    unknown.append(metric)
                else:
                    # Gauges may decrease; only monotonic counters treat a
                    # decrease as reset/invalid evidence.
                    row[metric], row[f"{metric}_delta"] = b, b - a
            link_up = second.get("link_up")
            if type(link_up) is not bool:
                unknown.append("link_up")
            row["link_up"] = link_up
            row["rx_pause_per_second"] = None if row["rx_pause_delta"] is None else row["rx_pause_delta"] / seconds
            duration = row["rx_pause_duration_ns_delta"]
            row["pause_duration_ratio"] = None if duration is None else duration / (seconds * 1_000_000_000)
            row["ecn_marked_per_second"] = None if row["ecn_marked_delta"] is None else row["ecn_marked_delta"] / seconds
            if unknown:
                findings.append({"kind": "UNKNOWN", "port": key_text(key), "fields": sorted(set(unknown))})
            output.append(row)
    return output, findings


def analyze_counters(rows: list[dict[str, Any]], thresholds: dict[str, float]) -> tuple[list[dict[str, Any]], bool]:
    findings: list[dict[str, Any]] = []
    hard_stop = False
    for row in rows:
        port = row["port"]
        if row["link_up"] is not True:
            hard_stop = True
            findings.append({"kind": "HARD_STOP", "port": port, "signal": "link_not_up_or_unknown"})
        for metric in ("mtu", "speed_gbps"):
            expected = thresholds[f"expected_{metric}"]
            if row[metric] is not None and row[metric] != expected:
                hard_stop = True
                findings.append({"kind": "HARD_STOP", "port": port, "signal": f"{metric}_drift", "value": row[metric], "expected": expected})
        for metric in ERROR_COUNTERS:
            delta = row[f"{metric}_delta"]
            if delta is not None and delta > thresholds["max_new_link_error_delta"]:
                hard_stop = True
                findings.append({"kind": "HARD_STOP", "port": port, "signal": f"new_{metric}", "delta": delta})
        if row["rx_pause_per_second"] is not None and row["rx_pause_per_second"] > thresholds["pause_packets_per_second"]:
            findings.append({"kind": "CONGESTION", "port": port, "signal": "rx_pause_per_second", "value": row["rx_pause_per_second"], "threshold": thresholds["pause_packets_per_second"]})
        if row["pause_duration_ratio"] is not None and row["pause_duration_ratio"] > thresholds["pause_duration_ratio"]:
            findings.append({"kind": "CONGESTION", "port": port, "signal": "pause_duration_ratio", "value": row["pause_duration_ratio"], "threshold": thresholds["pause_duration_ratio"]})
        rate = row["ecn_marked_per_second"]
        if rate is not None:
            baseline = thresholds["lkg_ecn_marked_per_second"]
            ratio = None if baseline == 0 else rate / baseline
            row["ecn_ratio_vs_lkg"] = ratio
            if ratio is None and rate > 0:
                findings.append({"kind": "UNKNOWN", "port": port, "signal": "ecn_ratio_zero_baseline"})
            elif ratio is not None and ratio > thresholds["ecn_ratio_vs_lkg"]:
                findings.append({"kind": "CONGESTION", "port": port, "signal": "ecn_ratio_vs_lkg", "value": ratio, "threshold": thresholds["ecn_ratio_vs_lkg"]})
    return findings, hard_stop


def analyze_performance(evidence: dict[str, Any], thresholds: dict[str, float], deadline: float) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for raw in list_value(evidence.get("performance_baselines"), "performance_baselines"):
        check_deadline(deadline)
        case = object_value(raw, "performance baseline")
        case_id = text_value(case.get("case_id"), "case_id")
        text_value(case.get("tool"), "performance.tool")
        object_value(case.get("parameters"), "performance.parameters")
        lkg = object_value(case.get("lkg"), "performance.lkg")
        observed = object_value(case.get("observed"), "performance.observed")
        base = required_number(lkg, "throughput_gbps")
        current = required_number(observed, "throughput_gbps")
        base_cross = required_number(lkg, "cross_rail_percent")
        current_cross = required_number(observed, "cross_rail_percent")
        if base == 0 or base_cross > 100 or current_cross > 100:
            raise AuditError(f"{case_id}: invalid throughput/cross-rail percentage")
        ratio = current / base
        if current_cross > thresholds["max_cross_rail_percent"]:
            findings.append({"kind": "REGRESSION", "case_id": case_id, "signal": "cross_rail_percent", "value": current_cross, "lkg": base_cross})
        if ratio < thresholds["min_throughput_ratio_vs_lkg"]:
            findings.append({"kind": "REGRESSION", "case_id": case_id, "signal": "throughput_ratio_vs_lkg", "value": ratio, "lkg_gbps": base, "observed_gbps": current})
    return findings


def validate_approvals(target: dict[str, Any], approvals_doc: dict[str, Any], target_hash: str, evidence_hash: str, evaluated_at: datetime) -> tuple[list[dict[str, Any]], bool]:
    require_synthetic(approvals_doc, APPROVALS_FILE)
    canary = object_value(target.get("canary"), "canary")
    action_id = text_value(canary.get("action_id"), "canary.action_id")
    if approvals_doc.get("target_id") != target.get("target_id") or approvals_doc.get("change_id") != target.get("change_id"):
        raise AuditError("approval target/change identity mismatch")
    if approvals_doc.get("target_sha256") != target_hash or approvals_doc.get("evidence_sha256") != evidence_hash:
        raise AuditError("approval envelope hash binding mismatch")
    approvals = list_value(approvals_doc.get("approvals"), "approvals")
    checked: list[dict[str, Any]] = []
    roles: set[str] = set()
    approvers: set[str] = set()
    valid = len(approvals) == 2
    for raw in approvals:
        approval = object_value(raw, "approval")
        role = text_value(approval.get("role"), "approval.role")
        approver = text_value(approval.get("approver"), "approval.approver")
        approved_at = utc_time(approval.get("approved_at"), "approval.approved_at")
        expires_at = utc_time(approval.get("expires_at"), "approval.expires_at")
        passed = (
            approval.get("decision") == "APPROVE"
            and approval.get("target_sha256") == target_hash
            and approval.get("evidence_sha256") == evidence_hash
            and approval.get("action_id") == action_id
            and approved_at <= evaluated_at < expires_at
        )
        valid = valid and passed and role not in roles and approver not in approvers
        roles.add(role)
        approvers.add(approver)
        checked.append({"approval_id": approval.get("approval_id"), "role": role, "approver": approver, "bound_and_current": passed})
    valid = valid and roles == {"network_owner", "service_owner"}
    return checked, valid


def validate_canary(target: dict[str, Any], expected_map: list[dict[str, Any]]) -> tuple[dict[str, Any], bool]:
    canary = object_value(target.get("canary"), "canary")
    key = port_key(canary)
    expected = next((row for row in expected_map if port_key(row) == key), None)
    valid = (
        canary.get("affected_port_count") == 1
        and type(canary.get("max_duration_seconds")) is int
        and 1 <= canary["max_duration_seconds"] <= 300
        and canary.get("rail") in (0, 1)
        and expected is not None
        and expected.get("rail") == canary.get("rail")
        and expected.get("leaf") == canary.get("expected_leaf")
        and bool(HEX256.fullmatch(text_value(canary.get("lkg_config_sha256"), "lkg_config_sha256")))
        and bool(text_value(canary.get("lkg_config_id"), "lkg_config_id"))
    )
    return canary, valid


def build_audit(target: dict[str, Any], evidence: dict[str, Any], approvals_doc: dict[str, Any], target_hash: str, evidence_hash: str, approvals_hash: str, evaluated_at: datetime, limits: dict[str, int], deadline: float) -> dict[str, Any]:
    require_synthetic(target, TARGET_FILE)
    require_synthetic(evidence, EVIDENCE_FILE)
    target_id = text_value(target.get("target_id"), "target_id")
    if target_id != text_value(evidence.get("target_id"), "evidence.target_id"):
        raise AuditError("target/evidence target_id mismatch")
    if target.get("evidence_sha256") != evidence_hash:
        raise AuditError("evidence SHA-256 does not match immutable target binding")
    if target.get("protocol") != "RoCEv2":
        raise AuditError("PLAY-08 accepts the synthetic RoCEv2 contract only")
    check_deadline(deadline)
    topology, mismatches, expected_map = parse_topology(target, evidence)
    check_deadline(deadline)
    counter_rows, counter_unknown = parse_counters(evidence, limits, deadline)
    row_count = len(topology) + len(counter_rows) + len(list_value(evidence.get("performance_baselines"), "performance_baselines"))
    if row_count > limits["max_rows"]:
        raise AuditError(f"derived row count {row_count} exceeds --max-rows {limits['max_rows']}")
    threshold_raw = object_value(target.get("thresholds"), "thresholds")
    thresholds = {name: required_number(threshold_raw, name) for name in (
        "expected_mtu", "expected_speed_gbps", "pause_packets_per_second", "pause_duration_ratio",
        "lkg_ecn_marked_per_second", "ecn_ratio_vs_lkg", "max_cross_rail_percent",
        "min_throughput_ratio_vs_lkg", "max_new_link_error_delta",
    )}
    congestion, hard_stop = analyze_counters(counter_rows, thresholds)
    performance = analyze_performance(evidence, thresholds, deadline)
    approvals, approvals_valid = validate_approvals(target, approvals_doc, target_hash, evidence_hash, evaluated_at)
    canary, canary_valid = validate_canary(target, expected_map)
    unknown = counter_unknown + [finding for finding in congestion if finding["kind"] == "UNKNOWN"] + [finding for finding in mismatches if finding["kind"] == "missing-or-extra-port"]
    findings = mismatches + congestion + performance
    check_deadline(deadline)
    if unknown:
        review_status = "BLOCK_UNKNOWN"
    elif hard_stop:
        review_status = "BLOCK_HARD_STOP"
    elif findings:
        review_status = "REMEDIATION_REQUIRED_SINGLE_RAIL_ONLY"
    else:
        review_status = "NO_ACTION_REQUIRED"
    if unknown or hard_stop or not approvals_valid or not canary_valid:
        canary_gate = "NOT_ELIGIBLE"
    elif not findings:
        canary_gate = "NO_CANARY_REQUIRED"
    else:
        canary_gate = "ELIGIBLE_FOR_HUMAN_AUTHORIZATION_NOT_GRANTED"
    return {
        "schema_version": "1.0",
        "data_classification": "synthetic/脱敏",
        "evaluated_at": iso(evaluated_at),
        "execution": "NOT_EXECUTED_READ_ONLY_LOCAL_PARSE",
        "target": {"target_id": target_id, "sha256": target_hash},
        "evidence": {"evidence_id": evidence.get("evidence_id"), "sha256": evidence_hash},
        "approvals_envelope_sha256": approvals_hash,
        "limits": limits,
        "row_count": row_count,
        "topology": topology,
        "rail_mismatches": mismatches,
        "counter_windows": counter_rows,
        "performance_regressions": performance,
        "findings": findings,
        "unknowns": unknown,
        "hard_stop": hard_stop,
        "approvals": approvals,
        "dual_approval_valid": approvals_valid,
        "canary": canary,
        "single_rail_canary_valid": canary_valid,
        "canary_gate": canary_gate,
        "review_status": review_status,
        "fabric_wide_change_allowed": False,
        "authorization": "NONE_THIS_TOOL_NEVER_CHANGES_CONFIGURATION",
        "rollback": {"lkg_config_id": canary.get("lkg_config_id"), "lkg_config_sha256": canary.get("lkg_config_sha256"), "unknown_outcome": "STOP_AND_RECONCILE_NEVER_BLIND_RETRY"},
        "post_change_verification_required": ["rail-map-and-peer-identity", "five-60s-counter-windows", "same-parameter-nccl-or-perftest", "unaffected-rail-and-business-health"],
    }


def write_outputs(out: Path, report: dict[str, Any]) -> list[str]:
    if out.is_symlink() or (out.exists() and not out.is_dir()):
        raise AuditError("output directory must be a real directory, not a symlink or file")
    out.mkdir(mode=0o700, parents=True, exist_ok=True)
    if any(out.iterdir()):
        raise AuditError("output directory must be empty; evidence is never overwritten")
    report_bytes = (json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()
    stream = io.StringIO(newline="")
    columns = ["port", "start", "end", "seconds", "link_up", "speed_gbps", "mtu"] + [f"{name}_delta" for name in COUNTERS] + ["rx_pause_per_second", "pause_duration_ratio", "ecn_marked_per_second", "ecn_ratio_vs_lkg"]
    writer = csv.DictWriter(stream, fieldnames=columns, delimiter="\t", lineterminator="\n", extrasaction="ignore")
    writer.writeheader()
    writer.writerows(report["counter_windows"])
    summary = "\n".join([
        f"data_classification={report['data_classification']}",
        f"review_status={report['review_status']}",
        f"target_sha256={report['target']['sha256']}",
        f"evidence_sha256={report['evidence']['sha256']}",
        f"approvals_envelope_sha256={report['approvals_envelope_sha256']}",
        f"rail_mismatch_count={len(report['rail_mismatches'])}",
        f"finding_count={len(report['findings'])}",
        f"unknown_count={len(report['unknowns'])}",
        f"hard_stop={str(report['hard_stop']).lower()}",
        f"dual_approval_valid={str(report['dual_approval_valid']).lower()}",
        f"single_rail_canary_valid={str(report['single_rail_canary_valid']).lower()}",
        f"canary_gate={report['canary_gate']}",
        "authorization=NONE_READ_ONLY_LOCAL_PARSE",
        "unknown_outcome=STOP_AND_RECONCILE_NEVER_BLIND_RETRY",
    ]) + "\n"
    files = {
        "rail-audit.json": report_bytes,
        "port-deltas.tsv": stream.getvalue().encode(),
        "run-summary.txt": summary.encode(),
    }
    for name, data in files.items():
        with (out / name).open("xb") as handle:
            handle.write(data)
    sums = "".join(f"{sha256(data)}  {name}\n" for name, data in files.items())
    with (out / "SHA256SUMS").open("xb") as handle:
        handle.write(sums.encode())
    return [*files, "SHA256SUMS"]


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--input-dir", type=Path, required=True)
    result.add_argument("--output-dir", type=Path, required=True, help="new or empty directory; never overwritten")
    result.add_argument("--expected-target-sha256", type=digest_arg, required=True)
    result.add_argument("--evaluated-at", help="ISO-8601 UTC; default now (fixture uses 2026-11-25T10:05:00Z)")
    result.add_argument("--timeout-seconds", type=positive_seconds, default=30.0)
    result.add_argument("--max-input-bytes", type=lambda value: bounded("max-input-bytes", int(value), 4 * 1024 * 1024), default=1024 * 1024, help="per JSON file; maximum 4194304")
    result.add_argument("--max-rows", type=lambda value: bounded("max-rows", int(value), 2000), default=256, help="topology + counter windows + performance cases; maximum 2000")
    result.add_argument("--max-samples-per-port", type=lambda value: bounded("max-samples-per-port", int(value), 20), default=5, help="includes t0/t1; maximum 20")
    result.add_argument("--max-performance-cases", type=lambda value: bounded("max-performance-cases", int(value), 32), default=8)
    return result


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    deadline = time.monotonic() + args.timeout_seconds
    try:
        target_bytes, target_hash = read_limited(args.input_dir / TARGET_FILE, args.max_input_bytes, deadline)
        evidence_bytes, evidence_hash = read_limited(args.input_dir / EVIDENCE_FILE, args.max_input_bytes, deadline)
        approvals_bytes, approvals_hash = read_limited(args.input_dir / APPROVALS_FILE, args.max_input_bytes, deadline)
        if target_hash != args.expected_target_sha256:
            raise AuditError("target SHA-256 mismatch; approvals cannot be reused for changed bytes")
        try:
            target = json.loads(target_bytes)
            evidence = json.loads(evidence_bytes)
            approvals_doc = json.loads(approvals_bytes)
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise AuditError("inputs must be UTF-8 JSON") from exc
        target = object_value(target, TARGET_FILE)
        evidence = object_value(evidence, EVIDENCE_FILE)
        approvals_doc = object_value(approvals_doc, APPROVALS_FILE)
        evaluated_at = utc_time(args.evaluated_at, "evaluated-at") if args.evaluated_at else datetime.now(timezone.utc)
        limits = {"max_input_bytes": args.max_input_bytes, "max_rows": args.max_rows, "max_samples_per_port": args.max_samples_per_port, "max_performance_cases": args.max_performance_cases, "timeout_seconds": args.timeout_seconds}
        if len(list_value(evidence.get("performance_baselines"), "performance_baselines")) > args.max_performance_cases:
            raise AuditError("performance cases exceed --max-performance-cases")
        report = build_audit(target, evidence, approvals_doc, target_hash, evidence_hash, approvals_hash, evaluated_at, limits, deadline)
        names = write_outputs(args.output_dir, report)
    except AuditTimeout as exc:
        print(f"TIMEOUT_UNKNOWN: {exc}; do not retry or infer success", file=sys.stderr)
        return 4
    except (AuditError, OSError) as exc:
        print(f"REFUSED: {exc}", file=sys.stderr)
        return 2
    print(f"review_status={report['review_status']}")
    print(f"canary_gate={report['canary_gate']}")
    print(f"target_sha256={target_hash}")
    print(f"evidence_sha256={evidence_hash}")
    print(f"approvals_envelope_sha256={approvals_hash}")
    print(f"output_files={','.join(names)}")
    print("authorization=NONE_READ_ONLY_LOCAL_PARSE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
