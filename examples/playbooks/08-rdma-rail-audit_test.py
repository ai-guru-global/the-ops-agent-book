#!/usr/bin/env python3
"""Unit tests for PLAY-08; all inputs are synthetic and no device is contacted."""
from __future__ import annotations

import contextlib
import copy
import hashlib
import importlib.util
import io
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("rdma_rail_audit", HERE / "08-rdma-rail-audit.py")
audit = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(audit)
EVALUATED = datetime(2026, 11, 25, 10, 5, tzinfo=timezone.utc)
LIMITS = {"max_input_bytes": 1024 * 1024, "max_rows": 256, "max_samples_per_port": 5, "max_performance_cases": 8, "timeout_seconds": 30.0}


def encoded(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def load(name: str) -> dict:
    return json.loads((HERE / name).read_text(encoding="utf-8"))


class RailAuditTests(unittest.TestCase):
    def setUp(self) -> None:
        self.target = load(audit.TARGET_FILE)
        self.evidence = load(audit.EVIDENCE_FILE)
        self.approvals = load(audit.APPROVALS_FILE)

    def rebind(self, target=None, evidence=None, approvals=None) -> tuple[dict, dict, dict, str, str, str]:
        target = copy.deepcopy(target if target is not None else self.target)
        evidence = copy.deepcopy(evidence if evidence is not None else self.evidence)
        approvals = copy.deepcopy(approvals if approvals is not None else self.approvals)
        evidence_hash = digest(encoded(evidence))
        target["evidence_sha256"] = evidence_hash
        target_hash = digest(encoded(target))
        approvals["target_sha256"] = target_hash
        approvals["evidence_sha256"] = evidence_hash
        for approval in approvals["approvals"]:
            approval["target_sha256"] = target_hash
            approval["evidence_sha256"] = evidence_hash
        approvals_hash = digest(encoded(approvals))
        return target, evidence, approvals, target_hash, evidence_hash, approvals_hash

    def run_build(self, target=None, evidence=None, approvals=None, evaluated=EVALUATED, limits=None, deadline=None):
        target, evidence, approvals, th, eh, ah = self.rebind(target, evidence, approvals)
        return audit.build_audit(target, evidence, approvals, th, eh, ah, evaluated, limits or LIMITS, deadline if deadline is not None else audit.time.monotonic() + 30)

    def bad_port(self) -> dict:
        return next(port for port in self.evidence["counter_sampling"]["ports"] if port["host"] == "node-b.lab.invalid" and port["nic"] == "mlx5_b0" and port["port"] == 1)

    def test_committed_fixture_hashes_and_approval_binding(self) -> None:
        target_hash = digest((HERE / audit.TARGET_FILE).read_bytes())
        evidence_hash = digest((HERE / audit.EVIDENCE_FILE).read_bytes())
        self.assertEqual(target_hash, "e774835ab6073099ef2fef58db58c098fa626c8687c5311caaca908e6e72d50d")
        self.assertEqual(evidence_hash, "b9dda1daa786a77bd5f6ffd17eb0a2a0b381d2793a760e6329a977908d7e57a0")
        self.assertEqual(self.target["evidence_sha256"], evidence_hash)
        self.assertEqual(self.approvals["target_sha256"], target_hash)
        report = audit.build_audit(self.target, self.evidence, self.approvals, target_hash, evidence_hash, digest((HERE / audit.APPROVALS_FILE).read_bytes()), EVALUATED, LIMITS, audit.time.monotonic() + 30)
        self.assertTrue(report["dual_approval_valid"])
        self.assertTrue(report["single_rail_canary_valid"])

    def test_synthetic_mismatch_and_regression_end_to_end(self) -> None:
        report = self.run_build()
        self.assertEqual(report["review_status"], "REMEDIATION_REQUIRED_SINGLE_RAIL_ONLY")
        self.assertEqual(report["canary_gate"], "ELIGIBLE_FOR_HUMAN_AUTHORIZATION_NOT_GRANTED")
        self.assertEqual(report["authorization"], "NONE_THIS_TOOL_NEVER_CHANGES_CONFIGURATION")
        self.assertFalse(report["fabric_wide_change_allowed"])
        self.assertEqual(report["row_count"], 34)
        self.assertEqual(len(report["rail_mismatches"]), 1)
        mismatch = report["rail_mismatches"][0]
        self.assertEqual(mismatch["port"], "node-b.lab.invalid/mlx5_b0/port1")
        self.assertEqual(mismatch["fields"], ["rail", "leaf"])
        self.assertEqual(report["unknowns"], [])
        self.assertFalse(report["hard_stop"])

    def test_counter_delta_units_rates_and_baseline_ratio(self) -> None:
        report = self.run_build()
        row = next(row for row in report["counter_windows"] if row["port"] == "node-b.lab.invalid/mlx5_b0/port1")
        healthy = next(row for row in report["counter_windows"] if row["port"] == "node-a.lab.invalid/mlx5_a0/port0")
        self.assertEqual(row["rx_pause_delta"], 84000)
        self.assertEqual(row["rx_pause_duration_ns_delta"], 7_200_000_000)
        self.assertEqual(row["rx_pause_per_second"], 1400.0)
        self.assertEqual(row["pause_duration_ratio"], 0.12)
        self.assertEqual(row["ecn_ratio_vs_lkg"], 8.0)
        self.assertEqual(healthy["rx_pause_per_second"], 200.0)
        self.assertAlmostEqual(healthy["pause_duration_ratio"], 1 / 300)
        self.assertEqual(row["mtu_delta"], 0)
        self.assertEqual(row["link_downed_delta"], 0)

    def test_nccl_and_perftest_use_same_parameter_lkg_comparison(self) -> None:
        findings = self.run_build()["performance_regressions"]
        nccl = next(item for item in findings if item["case_id"].startswith("syn-nccl") and item["signal"] == "throughput_ratio_vs_lkg")
        perftest = next(item for item in findings if item["case_id"].startswith("syn-perftest") and item["signal"] == "throughput_ratio_vs_lkg")
        self.assertAlmostEqual(nccl["value"], 112 / 210)
        self.assertAlmostEqual(perftest["value"], 47 / 96)
        self.assertTrue(all(item["signal"] == "cross_rail_percent" or "throughput" in item["signal"] for item in findings))

    def test_negative_counter_is_unknown_not_zero(self) -> None:
        self.bad_port()["samples"][1]["rx_pause"] = 1
        report = self.run_build()
        self.assertEqual(report["review_status"], "BLOCK_UNKNOWN")
        self.assertEqual(report["canary_gate"], "NOT_ELIGIBLE")
        self.assertTrue(any("rx_pause" in item["fields"] for item in report["unknowns"]))

    def test_missing_mtu_is_unknown_not_zero(self) -> None:
        del self.bad_port()["samples"][1]["mtu"]
        report = self.run_build()
        self.assertEqual(report["review_status"], "BLOCK_UNKNOWN")
        row = next(row for row in report["counter_windows"] if row["port"] == "node-b.lab.invalid/mlx5_b0/port1")
        self.assertIsNone(row["mtu_delta"])

    def test_new_link_error_is_hard_stop(self) -> None:
        self.bad_port()["samples"][1]["crc_error"] = 1
        report = self.run_build()
        self.assertEqual(report["review_status"], "BLOCK_HARD_STOP")
        self.assertTrue(report["hard_stop"])
        self.assertEqual(report["canary_gate"], "NOT_ELIGIBLE")

    def test_mtu_drift_is_hard_stop(self) -> None:
        self.bad_port()["samples"][1]["mtu"] = 4096
        report = self.run_build()
        self.assertTrue(report["hard_stop"])
        self.assertTrue(any(item.get("signal") == "mtu_drift" for item in report["findings"]))

    def test_missing_topology_port_is_mismatch(self) -> None:
        self.evidence["topology_observed"].pop()
        report = self.run_build()
        self.assertTrue(any(item["kind"] == "missing-or-extra-port" for item in report["rail_mismatches"]))
        self.assertEqual(report["review_status"], "BLOCK_UNKNOWN")
        self.assertEqual(report["canary_gate"], "NOT_ELIGIBLE")

    def test_duplicate_topology_port_is_rejected(self) -> None:
        self.evidence["topology_observed"].append(copy.deepcopy(self.evidence["topology_observed"][0]))
        with self.assertRaises(audit.AuditError):
            self.run_build()

    def test_sample_limit_is_enforced(self) -> None:
        for index in range(4):
            sample = copy.deepcopy(self.bad_port()["samples"][-1])
            sample["t"] = f"2026-11-25T10:0{index + 2}:00Z"
            self.bad_port()["samples"].append(sample)
        with self.assertRaisesRegex(audit.AuditError, "samples must be 2..5"):
            self.run_build()

    def test_row_limit_is_enforced(self) -> None:
        with self.assertRaisesRegex(audit.AuditError, "derived row count 34 exceeds"):
            self.run_build(limits={**LIMITS, "max_rows": 33})

    def test_duplicate_approver_fails_dual_control(self) -> None:
        self.approvals["approvals"][1]["approver"] = self.approvals["approvals"][0]["approver"]
        report = self.run_build()
        self.assertFalse(report["dual_approval_valid"])
        self.assertEqual(report["canary_gate"], "NOT_ELIGIBLE")

    def test_wrong_role_fails_dual_control(self) -> None:
        self.approvals["approvals"][1]["role"] = "network_owner"
        self.assertFalse(self.run_build()["dual_approval_valid"])

    def test_expired_approval_fails_closed(self) -> None:
        report = self.run_build(evaluated=datetime(2026, 11, 25, 13, tzinfo=timezone.utc))
        self.assertFalse(report["dual_approval_valid"])
        self.assertEqual(report["canary_gate"], "NOT_ELIGIBLE")

    def test_approval_for_changed_target_is_rejected(self) -> None:
        changed = copy.deepcopy(self.target)
        changed["canary"]["max_duration_seconds"] = 299
        eh = digest(encoded(self.evidence))
        changed["evidence_sha256"] = eh
        th = digest(encoded(changed))
        with self.assertRaisesRegex(audit.AuditError, "approval envelope hash binding mismatch"):
            audit.build_audit(changed, self.evidence, self.approvals, th, eh, "0" * 64, EVALUATED, LIMITS, audit.time.monotonic() + 30)

    def test_multi_port_canary_is_rejected(self) -> None:
        self.target["canary"]["affected_port_count"] = 2
        report = self.run_build()
        self.assertFalse(report["single_rail_canary_valid"])
        self.assertEqual(report["canary_gate"], "NOT_ELIGIBLE")

    def test_non_reserved_host_is_rejected(self) -> None:
        self.target["rail_map"][0]["host"] = "real-host.example"
        with self.assertRaisesRegex(audit.AuditError, "reserved .invalid"):
            self.run_build()

    def test_processing_timeout_has_unknown_outcome(self) -> None:
        with self.assertRaises(audit.AuditTimeout):
            self.run_build(deadline=audit.time.monotonic() - 1)

    def test_mock_clock_timeout_is_not_success(self) -> None:
        stdout, stderr = io.StringIO(), io.StringIO()
        with tempfile.TemporaryDirectory() as temporary:
            target_hash = digest((HERE / audit.TARGET_FILE).read_bytes())
            argv = ["--input-dir", str(HERE), "--output-dir", str(Path(temporary) / "out"), "--expected-target-sha256", target_hash, "--evaluated-at", "2026-11-25T10:05:00Z"]
            with mock.patch.object(audit.time, "monotonic", side_effect=[100.0, 131.0]), contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                status = audit.main(argv)
            self.assertEqual(status, 4)
            self.assertFalse((Path(temporary) / "out").exists())
        self.assertIn("TIMEOUT_UNKNOWN", stderr.getvalue())

    def test_cli_hash_mismatch_writes_nothing(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            out = Path(temporary) / "out"
            stderr = io.StringIO()
            with contextlib.redirect_stderr(stderr):
                status = audit.main(["--input-dir", str(HERE), "--output-dir", str(out), "--expected-target-sha256", "0" * 64])
            self.assertEqual(status, 2)
            self.assertFalse(out.exists())
            self.assertIn("target SHA-256 mismatch", stderr.getvalue())

    def test_cli_outputs_are_complete_and_hash_manifested(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            out = Path(temporary) / "out"
            target_hash = digest((HERE / audit.TARGET_FILE).read_bytes())
            with contextlib.redirect_stdout(io.StringIO()):
                status = audit.main(["--input-dir", str(HERE), "--output-dir", str(out), "--expected-target-sha256", target_hash, "--evaluated-at", "2026-11-25T10:05:00Z"])
            self.assertEqual(status, 0)
            self.assertEqual({path.name for path in out.iterdir()}, {"rail-audit.json", "port-deltas.tsv", "run-summary.txt", "SHA256SUMS"})
            for line in (out / "SHA256SUMS").read_text().splitlines():
                expected, name = line.split("  ", 1)
                self.assertEqual(digest((out / name).read_bytes()), expected)
            with self.assertRaises(audit.AuditError):
                audit.write_outputs(out, {})

    def test_symlink_input_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / audit.TARGET_FILE).symlink_to(HERE / audit.TARGET_FILE)
            with self.assertRaisesRegex(audit.AuditError, "non-symlink"):
                audit.read_limited(root / audit.TARGET_FILE, 1024, audit.time.monotonic() + 30)


if __name__ == "__main__":
    unittest.main()
