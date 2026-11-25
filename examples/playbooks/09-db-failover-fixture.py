#!/usr/bin/env python3
"""PLAY-09: offline, synthetic PostgreSQL/MySQL failover state-machine fixture.

This program never opens a database connection, imports a database driver, runs a
subprocess, or mutates a database. It validates immutable plans, evaluates fixed
synthetic evidence, and simulates operator-authorized outcomes for tests only.
All endpoint names use the reserved .invalid domain.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

FIXTURE_NOW = "2026-11-25T12:05:00Z"
SUPPORTED = {"postgresql": "16.4", "mysql": "8.0.40"}
ENDPOINTS = {
    "postgresql": ("pg-source.example.invalid", "pg-target.example.invalid"),
    "mysql": ("mysql-source.example.invalid", "mysql-target.example.invalid"),
}


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sha256(value: Any) -> str:
    return hashlib.sha256(canonical_json(value)).hexdigest()


def timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def action(
    action_id: str,
    action_class: str,
    tool: str,
    purpose: str,
    timeout_seconds: int,
    *,
    mutation: tuple[str, str] | None = None,
    params: dict[str, Any] | None = None,
    max_rows: int | None = None,
) -> dict[str, Any]:
    item: dict[str, Any] = {
        "id": action_id,
        "action_class": action_class,
        "tool": tool,
        "purpose": purpose,
        "params": params or {},
        "timeout_seconds": timeout_seconds,
        "limits": {"max_attempts": 1, "max_output_bytes": 65536, "max_rows": max_rows or 200},
        "cancel_point": "before_dispatch",
    }
    if mutation:
        item["side_effects"] = True
        item["operator_authorized"] = True
        item["expected_mutation"] = {"field": mutation[0], "value": mutation[1]}
    else:
        item["side_effects"] = False
        item["operator_authorized"] = action_class in {"approval", "verify"}
    return item


def sample_evidence(engine: str) -> dict[str, dict[str, Any]]:
    source, target = ENDPOINTS[engine]
    common = {
        "quiesce": {
            "values": {
                "writer_fence_acks": 3,
                "active_transactions": 0,
                "active_write_transactions": 0,
                "two_consecutive_clean_samples": True,
            }
        },
        "capacity": {
            "values": {
                "target_cpu_pct": 42,
                "target_disk_free_pct": 55,
                "connection_utilisation_pct": 31,
                "p95_latency_ms": 80,
                "p95_baseline_ms": 85,
            }
        },
        "route": {
            "values": {
                "route_primary": source,
                "target_writer_connections": 0,
                "target_read_connections": 0,
                "writer_leases": ["writer-api-r7", "writer-batch-r3", "writer-cdc-r2"],
            }
        },
    }
    if engine == "postgresql":
        evidence = {
            "identity": {
                "values": {
                    "source_version": "16.4",
                    "target_version": "16.4",
                    "system_identifier": "7612345678901234567",
                    "target_is_replica": True,
                    "replication_connected": True,
                }
            },
            "replication": {
                "values": {
                    "source_flush_lsn": "0/200000A0",
                    "target_receive_lsn": "0/200000A0",
                    "target_replay_lsn": "0/200000A0",
                    "replication_lag_ms": 50,
                    "receiver_error": None,
                }
            },
            **common,
        }
    else:
        evidence = {
            "identity": {
            "values": {
                "source_version": "8.0.40",
                "target_version": "8.0.40",
                "group_name_sha256": sha256("synthetic-orders-group"),
                "target_role": "SECONDARY",
                "target_state": "ONLINE",
                "group_members": 3,
                "primary_count": 1,
            }
        },
        "replication": {
            "values": {
                "source_gtid_executed": "24bc7850-2c16-11ee-be56-0242ac120002:1-120",
                "target_gtid_executed": "24bc7850-2c16-11ee-be56-0242ac120002:1-120",
                "source_gtid_subset_target": True,
                "transactions_in_queue": 0,
                "replication_lag_ms": 50,
                "receiver_error": None,
            }
        },
        **common,
    }
    for item in evidence.values():
        item["observed_at"] = "2026-11-25T12:04:30Z"
    return evidence


def evidence_refs(engine: str) -> list[dict[str, Any]]:
    queries = {
        "postgresql": {
            "identity": "PG-F01",
            "replication": "PG-F02/PG-F03",
            "quiesce": "PG-F05",
            "capacity": "PG-F06 + infra.metrics",
            "route": "db.route_inventory",
        },
        "mysql": {
            "identity": "MY-F01/MY-F02",
            "replication": "MY-F03",
            "quiesce": "MY-F04",
            "capacity": "MY-F06 + infra.metrics",
            "route": "db.route_inventory",
        },
    }[engine]
    result = []
    for evidence_id, item in sample_evidence(engine).items():
        values = item.get("values", item)
        result.append(
            {
                "id": evidence_id,
                "source_query": queries[evidence_id],
                "observed_at": "2026-11-25T12:04:30Z",
                "fresh_within_seconds": 300,
                "required_fields": sorted(values),
                "values_sha256": sha256(values),
            }
        )
    return result


def build_plan(engine: str) -> dict[str, Any]:
    if engine not in SUPPORTED:
        raise ValueError(f"unsupported engine: {engine}")
    source, target = ENDPOINTS[engine]
    version = SUPPORTED[engine]
    prefix = "pg" if engine == "postgresql" else "my"
    actions = [
        action(
            "preflight",
            "read",
            "db.preflight",
            "Revalidate engine, role, replication, capacity and route evidence.",
            30,
            params={"engine": engine, "source_endpoint_ref": source, "target_endpoint_ref": target},
            max_rows=500,
        ),
        action(
            "approval",
            "approval",
            "change.approval_check",
            "Check two independent approvals bound to this exact plan hash and revision.",
            10,
            params={"minimum_approvers": 2, "required_roles": ["dba", "service_owner"]},
            max_rows=20,
        ),
        action(
            "close_writer_fence",
            "write",
            "change.fence_apply",
            "Close every inventoried writer lease and quarantine the old writer endpoint.",
            45,
            mutation=("writer_fence", "closed"),
            params={
                "writer_inventory": ["writer-api-r7", "writer-batch-r3", "writer-cdc-r2"],
                "source_endpoint_ref": source,
                "fence_mode": "deny_new_writes_and_quarantine",
            },
        ),
        action(
            "drain_writers",
            "write",
            "change.writer_drain",
            "Wait for acknowledged in-flight writes to finish; never kill sessions implicitly.",
            120,
            mutation=("quiesced", True),
            params={"require_all_writer_acks": True, "terminate_sessions": False},
        ),
        action(
            "quiesce_probe",
            "read",
            "db.quiesce_probe",
            "Require two consecutive clean transaction snapshots after all writer acknowledgements.",
            15,
            params={"required_clean_samples": 2, "sample_interval_seconds": 2},
            max_rows=10,
        ),
    ]
    if engine == "postgresql":
        actions.append(
            action(
                "pause_target_replay",
                "write",
                "db.replica_pause",
                "Pause target replay, then compare the final durable source flush LSN with target replay LSN.",
                30,
                mutation=("replay_paused", True),
                params={"target_endpoint_ref": target, "require_replay_gte_source_flush": True},
                max_rows=10,
            )
        )
    else:
        actions.append(
            action(
                "confirm_final_gtid",
                "read",
                "db.replication_position_probe",
                "Require the final source GTID set to be a subset of target executed GTID with an empty queue.",
                20,
                params={"target_endpoint_ref": target, "require_empty_applier_queue": True},
                max_rows=10,
            )
        )
    actions.extend(
        [
            action(
                "promote",
                "write",
                "db.promote",
                "Run the engine-specific operator procedure; timeout does not cancel server-side promotion.",
                120,
                mutation=("target_role", "primary"),
                params={"engine": engine, "target_endpoint_ref": target, "force_election": False},
                max_rows=20,
            ),
            action(
                "switch_route",
                "write",
                "db.route_switch",
                "Atomically move the single writer route revision to the confirmed primary and drain old pools.",
                60,
                mutation=("route_primary", target),
                params={
                    "route_ref": "orders-primary",
                    "from_endpoint_ref": source,
                    "to_endpoint_ref": target,
                    "drain_old_writer_connections": True,
                },
                max_rows=100,
            ),
            action(
                "verify",
                "verify",
                "db.verify",
                "Verify one writer, a rolled-back synthetic canary, application SLO and stable observations.",
                300,
                params={"stable_window_seconds": 300, "require_synthetic_canary": True},
                max_rows=200,
            ),
        ]
    )
    body: dict[str, Any] = {
        "artifact_type": "synthetic-failover-plan",
        "plan_id": f"FAIL-{prefix.upper()}-2026-001",
        "plan_version": 1,
        "synthetic": True,
        "data_classification": "synthetic",
        "hash_algorithm": "sha256-canonical-json-sorted-keys",
        "created_at": "2026-11-25T12:00:00Z",
        "expires_at": "2026-11-25T12:15:00Z",
        "engine": engine,
        "mode": "planned_switchover",
        "source": {"endpoint_ref": source, "version": version, "role": "primary", "revision": f"{prefix}-source-r17"},
        "target": {"endpoint_ref": target, "version": version, "role": "replica", "revision": f"{prefix}-target-r17"},
        "rpo_seconds": 0,
        "rto_seconds": 600,
        "thresholds": {
            "max_replication_lag_ms": 1000,
            "max_target_cpu_pct": 70,
            "min_target_disk_free_pct": 30,
            "max_connection_utilisation_pct": 70,
            "max_p95_latency_ms": 100,
            "max_evidence_age_seconds": 300,
        },
        "writer_inventory": ["writer-api-r7", "writer-batch-r3", "writer-cdc-r2"],
        "evidence": evidence_refs(engine),
        "route": {"route_ref": "orders-primary", "current_revision": "route-r7-source", "target_revision": "route-r8-target"},
        "runtime_binding_fields": [
            "plan_version",
            "plan_hash",
            "approval_ids",
            "expected_resource_revision",
            "idempotency_key",
        ],
        "actions": actions,
        "rollback": {
            "allowed_before": "promotion_confirmed",
            "max_minutes": 5,
            "requires": ["old_source_still_authoritative", "no_target_writes", "writer_fence_closed"],
            "automatic": False,
        },
        "rejoin": {
            "method": "pg_rewind_or_rebuild" if engine == "postgresql" else "innodb_cluster_rejoin_or_clone",
            "requires_new_plan_and_approval": True,
            "requires_old_endpoint_isolated": True,
        },
    }
    plan_hash = sha256(body)
    approvals = [
        {
            "approval_id": f"APR-{prefix.upper()}-DBA-001",
            "role": "dba",
            "independent": True,
            "approved_at": "2026-11-25T12:01:00Z",
            "plan_hash": plan_hash,
        },
        {
            "approval_id": f"APR-{prefix.upper()}-APP-001",
            "role": "service_owner",
            "independent": True,
            "approved_at": "2026-11-25T12:01:30Z",
            "plan_hash": plan_hash,
        },
    ]
    return {**body, "plan_hash": plan_hash, "approvals": approvals}


def plan_body(plan: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in plan.items() if key not in {"plan_hash", "approvals"}}


def validate_plan(plan: dict[str, Any], now: str = FIXTURE_NOW) -> list[str]:
    errors: list[str] = []
    if plan.get("synthetic") is not True or plan.get("data_classification") != "synthetic":
        errors.append("plan must be explicitly synthetic")
    engine = plan.get("engine")
    if engine not in SUPPORTED:
        errors.append("unsupported engine; asynchronous MySQL replication is outside PLAY-09")
    if plan.get("mode") != "planned_switchover" or plan.get("rpo_seconds") != 0:
        errors.append("only zero-RPO planned switchover is supported by this fixture")
    if plan.get("hash_algorithm") != "sha256-canonical-json-sorted-keys":
        errors.append("unsupported plan hash algorithm")
    if sha256(plan_body(plan)) != plan.get("plan_hash"):
        errors.append("plan hash mismatch; mutation requires a new version and approval")
    if timestamp(plan.get("created_at", "1970-01-01T00:00:00Z")) >= timestamp(plan.get("expires_at", "1970-01-01T00:00:00Z")):
        errors.append("invalid plan validity window")
    if not (timestamp(plan.get("created_at", "1970-01-01T00:00:00Z")) <= timestamp(now) < timestamp(plan.get("expires_at", "1970-01-01T00:00:00Z"))):
        errors.append("plan is expired or not yet valid at the supplied clock")
    approvals = plan.get("approvals", [])
    roles = {item.get("role") for item in approvals if item.get("independent") is True}
    if len(approvals) < 2 or not {"dba", "service_owner"}.issubset(roles):
        errors.append("two independent DBA and service-owner approvals are required")
    if any(item.get("plan_hash") != plan.get("plan_hash") for item in approvals):
        errors.append("approval is not bound to the plan hash")
    endpoints = [plan.get("source", {}).get("endpoint_ref", ""), plan.get("target", {}).get("endpoint_ref", "")]
    if len(set(endpoints)) != 2 or any(not value.endswith(".invalid") for value in endpoints):
        errors.append("source and target must be distinct reserved .invalid endpoints")
    ids = [item.get("id") for item in plan.get("actions", [])]
    if len(ids) != len(set(ids)) or not {"preflight", "approval", "close_writer_fence", "promote", "switch_route", "verify"}.issubset(ids):
        errors.append("action inventory is incomplete or duplicated")
    for item in plan.get("actions", []):
        if item.get("side_effects"):
            if item.get("operator_authorized") is not True or item.get("cancel_point") != "before_dispatch":
                errors.append(f"{item.get('id')}: write lacks operator authorization or a pre-dispatch cancel point")
            if item.get("timeout_seconds", 0) < 1 or item.get("limits", {}).get("max_attempts") != 1:
                errors.append(f"{item.get('id')}: invalid timeout or retry limit")
            if not item.get("expected_mutation"):
                errors.append(f"{item.get('id')}: write lacks a reconcilable postcondition")
        if item.get("tool") == "db.promote" and item.get("params", {}).get("force_election") is not False:
            errors.append("forced election is not allowed by PLAY-09")
    return errors


def evaluate_preconditions(plan: dict[str, Any], evidence: dict[str, dict[str, Any]], now: str = FIXTURE_NOW) -> list[str]:
    errors = validate_plan(plan, now)
    if errors:
        return errors
    expected = {item["id"]: item for item in plan["evidence"]}
    if set(evidence) != set(expected):
        return ["evidence inventory differs from the approved plan"]
    for evidence_id, ref in expected.items():
        item = evidence[evidence_id]
        values = item.get("values", {})
        if sha256(values) != ref["values_sha256"]:
            errors.append(f"{evidence_id}: evidence hash mismatch")
        if set(values) != set(ref["required_fields"]):
            errors.append(f"{evidence_id}: required evidence fields differ")
        age = (timestamp(now) - timestamp(item["observed_at"])).total_seconds()
        if age < 0 or age > min(ref["fresh_within_seconds"], plan["thresholds"]["max_evidence_age_seconds"]):
            errors.append(f"{evidence_id}: evidence is stale or from the future")
    identity = evidence["identity"]["values"]
    replication = evidence["replication"]["values"]
    quiesce = evidence["quiesce"]["values"]
    capacity = evidence["capacity"]["values"]
    route = evidence["route"]["values"]
    thresholds = plan["thresholds"]
    if identity.get("source_version") != plan["source"]["version"] or identity.get("target_version") != plan["target"]["version"]:
        errors.append("identity: engine version differs from the approved plan")
    if replication.get("replication_lag_ms", 10**9) > thresholds["max_replication_lag_ms"]:
        errors.append("replication: lag exceeds the approved budget")
    if replication.get("receiver_error") is not None:
        errors.append("replication: receiver error is present")
    if quiesce.get("active_transactions") != 0 or quiesce.get("active_write_transactions") != 0:
        errors.append("quiesce: transactions are still active")
    if quiesce.get("writer_fence_acks") != len(plan["writer_inventory"]) or quiesce.get("two_consecutive_clean_samples") is not True:
        errors.append("quiesce: writer acknowledgements or clean samples are incomplete")
    if capacity.get("target_cpu_pct", 101) >= thresholds["max_target_cpu_pct"]:
        errors.append("capacity: target CPU exceeds budget")
    if capacity.get("target_disk_free_pct", -1) <= thresholds["min_target_disk_free_pct"]:
        errors.append("capacity: target disk free space is insufficient")
    if capacity.get("connection_utilisation_pct", 101) >= thresholds["max_connection_utilisation_pct"]:
        errors.append("capacity: target connection budget exceeded")
    if capacity.get("p95_latency_ms", 10**9) > thresholds["max_p95_latency_ms"]:
        errors.append("capacity: target latency budget exceeded")
    if route.get("route_primary") != plan["source"]["endpoint_ref"] or route.get("target_writer_connections") != 0:
        errors.append("route: initial writer route or target writer isolation is invalid")
    if route.get("writer_leases") != plan["writer_inventory"]:
        errors.append("route: writer lease inventory differs from the plan")
    if plan["engine"] == "postgresql":
        if identity.get("target_is_replica") is not True or identity.get("replication_connected") is not True:
            errors.append("postgresql: target role or streaming connection is invalid")
        if not (replication.get("source_flush_lsn") == replication.get("target_receive_lsn") == replication.get("target_replay_lsn")):
            errors.append("postgresql: zero-RPO LSN equality is not proven")
    else:
        if identity.get("target_role") != "SECONDARY" or identity.get("target_state") != "ONLINE":
            errors.append("mysql: candidate is not an ONLINE SECONDARY")
        if identity.get("primary_count") != 1 or identity.get("group_members", 0) < 3:
            errors.append("mysql: group membership or single-primary invariant is invalid")
        if replication.get("source_gtid_subset_target") is not True or replication.get("transactions_in_queue") != 0:
            errors.append("mysql: final GTID subset or empty applier queue is not proven")
    return errors


def initial_state(plan: dict[str, Any]) -> dict[str, Any]:
    return {
        "writer_fence": "open",
        "quiesced": False,
        "replay_paused": False,
        "target_role": "replica",
        "route_primary": plan["source"]["endpoint_ref"],
        "promotion_confirmed": False,
    }


def run_simulation(
    plan: dict[str, Any],
    evidence: dict[str, dict[str, Any]],
    outcomes: dict[str, Any] | None = None,
    now: str = FIXTURE_NOW,
) -> dict[str, Any]:
    """Simulate, but never perform, actions. Dispatched timeouts stop the run."""
    outcomes = outcomes or {}
    errors = evaluate_preconditions(plan, evidence, now)
    if errors:
        return {"status": "rejected", "partial_success": False, "steps": [], "error": {"category": "validation", "messages": errors}}
    state = initial_state(plan)
    steps: list[dict[str, Any]] = []
    for item in plan["actions"]:
        outcome = outcomes.get(item["id"], "succeeded")
        detail = outcome if isinstance(outcome, dict) else {"kind": outcome}
        kind = detail.get("kind", "succeeded")
        entry = {
            "id": item["id"],
            "tool": item["tool"],
            "idempotency_key": f"{plan['plan_id']}:{item['id']}",
            "timeout_seconds": item["timeout_seconds"],
        }
        if kind in {"timeout", "cancelled"} and detail.get("dispatched", True):
            entry["status"] = "unknown_outcome"
            steps.append(entry)
            return {
                "status": "unknown_outcome",
                "partial_success": any(step["status"] == "succeeded" for step in steps),
                "steps": steps,
                "error": {"category": "unknown_outcome", "action_id": item["id"], "retry_allowed": False},
                "observed_state": state,
            }
        if kind in {"timeout", "cancelled"}:
            entry["status"] = "not_dispatched"
            steps.append(entry)
            return {
                "status": "cancelled",
                "partial_success": any(step["status"] == "succeeded" for step in steps),
                "steps": steps,
                "error": {"category": "cancelled", "action_id": item["id"], "retry_allowed": False},
                "observed_state": state,
            }
        if kind == "failed":
            entry["status"] = "failed"
            steps.append(entry)
            return {
                "status": "failed",
                "partial_success": any(step["status"] == "succeeded" for step in steps),
                "steps": steps,
                "error": {"category": "known_failure", "action_id": item["id"], "retry_allowed": False},
                "observed_state": state,
            }
        mutation = item.get("expected_mutation")
        if mutation:
            state[mutation["field"]] = mutation["value"]
        if item["id"] == "promote":
            state["promotion_confirmed"] = True
        entry["status"] = "succeeded"
        steps.append(entry)
    return {"status": "succeeded", "partial_success": False, "steps": steps, "error": None, "observed_state": state}


def reconcile_action(plan: dict[str, Any], action_id: str, observations: dict[str, Any]) -> dict[str, Any]:
    """Classify a timed-out write using only read-only observations; never retry."""
    errors = validate_plan(plan)
    if errors:
        return {"decision": "invalid_plan", "errors": errors}
    item = next((step for step in plan["actions"] if step["id"] == action_id), None)
    if item is None or not item.get("expected_mutation"):
        return {"decision": "no_mutation_reobserve_preconditions"}
    mutation = item["expected_mutation"]
    initial = initial_state(plan)
    observed = observations.get(mutation["field"])
    if observed == mutation["value"]:
        return {"decision": "applied_confirm_and_replan", "observed": observed, "automatic_retry": False}
    if observed == initial[mutation["field"]]:
        return {"decision": "not_applied_operator_may_resume_same_key", "observed": observed, "automatic_retry": False}
    return {"decision": "unresolved_keep_fenced_and_escalate", "observed": observed, "automatic_retry": False}


def rollback_eligibility(state: dict[str, Any], confirmations: dict[str, Any]) -> dict[str, Any]:
    allowed = (
        state.get("promotion_confirmed") is False
        and state.get("target_role") != "primary"
        and state.get("writer_fence") == "closed"
        and state.get("route_primary") == confirmations.get("source_endpoint_ref")
        and confirmations.get("old_source_authoritative") is True
        and confirmations.get("target_writes") == 0
    )
    return {"allowed": allowed, "automatic": False, "requires_operator_approval": True}


def rejoin_eligibility(plan: dict[str, Any], state: dict[str, Any], confirmations: dict[str, Any]) -> dict[str, Any]:
    base = (
        state.get("promotion_confirmed") is True
        and state.get("target_role") == "primary"
        and state.get("route_primary") == plan["target"]["endpoint_ref"]
        and state.get("writer_fence") == "closed"
        and confirmations.get("old_endpoint_isolated") is True
        and confirmations.get("old_client_connections") == 0
        and confirmations.get("old_writes_after_fence") == 0
        and confirmations.get("new_primary_healthy") is True
    )
    engine_ready = confirmations.get("old_clean_shutdown") is True if plan["engine"] == "postgresql" else confirmations.get("group_primary_stable") is True
    return {
        "eligible_for_new_plan": bool(base and engine_ready),
        "automatic": False,
        "requires_new_plan_and_approval": True,
        "method": plan["rejoin"]["method"],
    }


def self_test() -> None:
    for engine in SUPPORTED:
        plan = build_plan(engine)
        assert not validate_plan(plan)
        result = run_simulation(plan, sample_evidence(engine))
        assert result["status"] == "succeeded"
        unknown = run_simulation(plan, sample_evidence(engine), {"promote": {"kind": "timeout", "dispatched": True}})
        assert unknown["status"] == "unknown_outcome" and unknown["partial_success"] is True
    print("PLAY-09 offline self-test passed for PostgreSQL and MySQL; no database connections were made.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--emit-plan", choices=sorted(SUPPORTED))
    parser.add_argument("--run", help="Simulate a built-in engine or read a synthetic JSON plan")
    parser.add_argument("--outcome", action="append", default=[], metavar="ACTION=TIMEOUT_AFTER_DISPATCH")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if args.emit_plan:
        print(json.dumps(build_plan(args.emit_plan), ensure_ascii=False, indent=2))
        return
    if args.run:
        plan = build_plan(args.run) if args.run in SUPPORTED else json.loads(Path(args.run).read_text(encoding="utf-8"))
        outcomes = {}
        for value in args.outcome:
            action_id, kind = value.split("=", 1)
            dispatched = kind.endswith("_after_dispatch")
            if dispatched:
                kind = kind.removesuffix("_after_dispatch")
            outcomes[action_id] = {"kind": kind, "dispatched": dispatched}
        print(json.dumps(run_simulation(plan, sample_evidence(plan["engine"]), outcomes), ensure_ascii=False, indent=2))
        return
    parser.error("choose --self-test, --emit-plan, or --run")


if __name__ == "__main__":
    main()
