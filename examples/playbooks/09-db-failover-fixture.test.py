#!/usr/bin/env python3
"""Offline tests for PLAY-09. No database driver, socket or subprocess is used."""

from __future__ import annotations

import copy
import importlib.util
import json
import re
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SPEC = importlib.util.spec_from_file_location("db_failover_fixture", HERE / "09-db-failover-fixture.py")
FIXTURE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(FIXTURE)


class FailoverFixtureTests(unittest.TestCase):
    def test_both_engine_plans_are_deterministic_and_hash_bound(self):
        for engine in FIXTURE.SUPPORTED:
            with self.subTest(engine=engine):
                plan = FIXTURE.build_plan(engine)
                self.assertEqual(plan, FIXTURE.build_plan(engine))
                self.assertEqual([], FIXTURE.validate_plan(plan))
                self.assertEqual(plan, json.loads(json.dumps(plan)))
                self.assertTrue(all(item["plan_hash"] == plan["plan_hash"] for item in plan["approvals"]))
                self.assertEqual(["dba", "service_owner"], [item["role"] for item in plan["approvals"]])

    def test_success_paths_require_one_writer_and_target_route(self):
        for engine in FIXTURE.SUPPORTED:
            with self.subTest(engine=engine):
                plan = FIXTURE.build_plan(engine)
                result = FIXTURE.run_simulation(plan, FIXTURE.sample_evidence(engine))
                self.assertEqual("succeeded", result["status"])
                self.assertFalse(result["partial_success"])
                self.assertEqual("closed", result["observed_state"]["writer_fence"])
                self.assertEqual("primary", result["observed_state"]["target_role"])
                self.assertEqual(plan["target"]["endpoint_ref"], result["observed_state"]["route_primary"])
                self.assertTrue(result["observed_state"]["promotion_confirmed"])

    def test_plan_mutation_invalidates_hash_and_approvals(self):
        plan = FIXTURE.build_plan("postgresql")
        plan["target"]["revision"] = "unapproved-target-r18"
        self.assertTrue(any("plan hash mismatch" in error for error in FIXTURE.validate_plan(plan)))

    def test_missing_independent_approval_is_rejected(self):
        plan = FIXTURE.build_plan("mysql")
        plan["approvals"][1]["independent"] = False
        self.assertTrue(any("independent" in error for error in FIXTURE.validate_plan(plan)))

    def test_expired_plan_is_rejected(self):
        plan = FIXTURE.build_plan("postgresql")
        self.assertTrue(any("expired" in error for error in FIXTURE.validate_plan(plan, "2026-11-25T12:16:00Z")))

    def test_stale_or_changed_evidence_is_rejected(self):
        plan = FIXTURE.build_plan("postgresql")
        evidence = FIXTURE.sample_evidence("postgresql")
        evidence["identity"]["observed_at"] = "2026-11-25T11:00:00Z"
        self.assertTrue(any("stale" in error for error in FIXTURE.evaluate_preconditions(plan, evidence)))
        evidence = FIXTURE.sample_evidence("postgresql")
        evidence["capacity"]["values"]["target_cpu_pct"] = 43
        self.assertTrue(any("hash mismatch" in error for error in FIXTURE.evaluate_preconditions(plan, evidence)))

    def test_postgresql_requires_equal_zero_rpo_lsn(self):
        plan = FIXTURE.build_plan("postgresql")
        evidence = FIXTURE.sample_evidence("postgresql")
        evidence["replication"]["values"]["target_replay_lsn"] = "0/1FFFFFF0"
        errors = FIXTURE.evaluate_preconditions(plan, evidence)
        self.assertTrue(any("LSN equality" in error for error in errors))

    def test_mysql_requires_gtid_subset_and_empty_queue(self):
        plan = FIXTURE.build_plan("mysql")
        evidence = FIXTURE.sample_evidence("mysql")
        evidence["replication"]["values"]["transactions_in_queue"] = 1
        errors = FIXTURE.evaluate_preconditions(plan, evidence)
        self.assertTrue(any("GTID subset" in error for error in errors))

    def test_unproven_quiesce_or_existing_target_writer_blocks_plan(self):
        plan = FIXTURE.build_plan("postgresql")
        evidence = FIXTURE.sample_evidence("postgresql")
        evidence["quiesce"]["values"]["active_transactions"] = 1
        self.assertTrue(any("transactions are still active" in error for error in FIXTURE.evaluate_preconditions(plan, evidence)))
        evidence = FIXTURE.sample_evidence("postgresql")
        evidence["route"]["values"]["target_writer_connections"] = 1
        self.assertTrue(any("target writer isolation" in error for error in FIXTURE.evaluate_preconditions(plan, evidence)))

    def test_asynchronous_mysql_is_not_silently_supported(self):
        plan = FIXTURE.build_plan("mysql")
        plan["engine"] = "mysql_async"
        self.assertTrue(any("asynchronous" in error for error in FIXTURE.validate_plan(plan)))

    def test_dispatched_timeout_is_unknown_and_stops_later_writes(self):
        plan = FIXTURE.build_plan("postgresql")
        result = FIXTURE.run_simulation(
            plan,
            FIXTURE.sample_evidence("postgresql"),
            {"promote": {"kind": "timeout", "dispatched": True}},
        )
        self.assertEqual("unknown_outcome", result["status"])
        self.assertTrue(result["partial_success"])
        self.assertFalse(result["error"]["retry_allowed"])
        self.assertNotIn("switch_route", [step["id"] for step in result["steps"]])
        self.assertFalse(result["observed_state"]["promotion_confirmed"])

    def test_cancel_before_dispatch_does_not_create_unknown_outcome(self):
        plan = FIXTURE.build_plan("mysql")
        result = FIXTURE.run_simulation(
            plan,
            FIXTURE.sample_evidence("mysql"),
            {"promote": {"kind": "cancelled", "dispatched": False}},
        )
        self.assertEqual("cancelled", result["status"])
        self.assertEqual("not_dispatched", result["steps"][-1]["status"])
        self.assertNotIn("switch_route", [step["id"] for step in result["steps"]])

    def test_partial_route_timeout_is_reconciled_without_retry(self):
        plan = FIXTURE.build_plan("mysql")
        result = FIXTURE.run_simulation(
            plan,
            FIXTURE.sample_evidence("mysql"),
            {"switch_route": {"kind": "timeout", "dispatched": True}},
        )
        self.assertEqual("unknown_outcome", result["status"])
        self.assertTrue(result["partial_success"])
        self.assertTrue(result["observed_state"]["promotion_confirmed"])
        applied = FIXTURE.reconcile_action(plan, "switch_route", {"route_primary": plan["target"]["endpoint_ref"]})
        absent = FIXTURE.reconcile_action(plan, "switch_route", {"route_primary": plan["source"]["endpoint_ref"]})
        mixed = FIXTURE.reconcile_action(plan, "switch_route", {"route_primary": "mixed-unresolved"})
        self.assertEqual("applied_confirm_and_replan", applied["decision"])
        self.assertEqual("not_applied_operator_may_resume_same_key", absent["decision"])
        self.assertEqual("unresolved_keep_fenced_and_escalate", mixed["decision"])
        self.assertFalse(applied["automatic_retry"])

    def test_rollback_is_only_eligible_before_confirmed_promotion(self):
        plan = FIXTURE.build_plan("postgresql")
        before = FIXTURE.initial_state(plan)
        before["writer_fence"] = "closed"
        confirmations = {"source_endpoint_ref": plan["source"]["endpoint_ref"], "old_source_authoritative": True, "target_writes": 0}
        self.assertTrue(FIXTURE.rollback_eligibility(before, confirmations)["allowed"])
        after = FIXTURE.run_simulation(plan, FIXTURE.sample_evidence("postgresql"))["observed_state"]
        self.assertFalse(FIXTURE.rollback_eligibility(after, confirmations)["allowed"])

    def test_rejoin_requires_isolation_new_primary_and_engine_specific_proof(self):
        for engine in FIXTURE.SUPPORTED:
            with self.subTest(engine=engine):
                plan = FIXTURE.build_plan(engine)
                state = FIXTURE.run_simulation(plan, FIXTURE.sample_evidence(engine))["observed_state"]
                confirmations = {
                    "old_endpoint_isolated": True,
                    "old_client_connections": 0,
                    "old_writes_after_fence": 0,
                    "new_primary_healthy": True,
                    "old_clean_shutdown": engine == "postgresql",
                    "group_primary_stable": engine == "mysql",
                }
                result = FIXTURE.rejoin_eligibility(plan, state, confirmations)
                self.assertTrue(result["eligible_for_new_plan"])
                self.assertFalse(result["automatic"])
                self.assertTrue(result["requires_new_plan_and_approval"])
                confirmations["old_writes_after_fence"] = 1
                self.assertFalse(FIXTURE.rejoin_eligibility(plan, state, confirmations)["eligible_for_new_plan"])

    def test_read_only_sql_contains_no_operator_mutations(self):
        banned = re.compile(
            r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|GRANT|REVOKE|KILL|TRUNCATE|"
            r"RESET|PROMOTE|REPLACE|RENAME|ATTACH|DETACH)\b",
            re.IGNORECASE,
        )
        for name in ("09-db-failover-postgresql-readonly.sql", "09-db-failover-mysql-readonly.sql"):
            with self.subTest(file=name):
                text = (HERE / name).read_text(encoding="utf-8")
                sql = re.sub(r"--[^\n]*", "", text)
                self.assertIsNone(banned.search(sql), f"operator mutation token in {name}")
                self.assertNotRegex(sql, r"(?i)\bSET\s+(SESSION\s+|GLOBAL\s+)?(?:read_only|super_read_only|primary_conninfo)\b")
                statements = [part.strip() for part in sql.split(";") if part.strip()]
                self.assertGreater(len(statements), 10)
                allowed = {"SET", "BEGIN", "SELECT", "COMMIT", "SHOW", "START"}
                for statement in statements:
                    first = statement.split(None, 1)[0].upper()
                    self.assertIn(first, allowed, f"unexpected statement in {name}: {first}")

    def test_fixture_has_no_database_or_network_execution_path(self):
        source = (HERE / "09-db-failover-fixture.py").read_text(encoding="utf-8")
        for forbidden in ("import socket", "import subprocess", "psycopg", "pymysql", "mysql.connector", "sqlalchemy"):
            self.assertNotIn(forbidden, source.lower())


if __name__ == "__main__":
    unittest.main(verbosity=2)
