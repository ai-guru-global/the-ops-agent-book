#!/usr/bin/env python3
"""Regression tests for synthetic RDMA and database playbook fixtures."""
from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAYBOOKS = ROOT / "examples" / "playbooks"
RDMA = PLAYBOOKS / "08-rdma-rail-audit.py"
DB = PLAYBOOKS / "09-db-failover-fixture.py"
TARGET_SHA256 = "e774835ab6073099ef2fef58db58c098fa626c8687c5311caaca908e6e72d50d"


def run(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=ROOT, capture_output=True, text=True, timeout=30)


def rdma(*extra: str, evaluated_at: str = "2026-11-25T10:05:00Z") -> subprocess.CompletedProcess[str]:
    with tempfile.TemporaryDirectory(prefix="rdma-fixture-test-") as output:
        return run(
            "python3", str(RDMA),
            "--input-dir", str(PLAYBOOKS),
            "--output-dir", output,
            "--expected-target-sha256", TARGET_SHA256,
            "--evaluated-at", evaluated_at,
            *extra,
        )


class RdmaRailAuditTests(unittest.TestCase):
    def test_valid_fixture_requires_human_authorization(self) -> None:
        result = rdma()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("canary_gate=ELIGIBLE_FOR_HUMAN_AUTHORIZATION_NOT_GRANTED", result.stdout)
        self.assertIn("authorization=NONE_READ_ONLY_LOCAL_PARSE", result.stdout)

    def test_changed_target_hash_is_rejected(self) -> None:
        result = rdma("--expected-target-sha256", "0" * 64)
        self.assertEqual(result.returncode, 2)
        self.assertIn("target SHA-256 mismatch", result.stderr)

    def test_row_limit_is_enforced(self) -> None:
        result = rdma("--max-rows", "1")
        self.assertEqual(result.returncode, 2)
        self.assertIn("exceeds --max-rows", result.stderr)

    def test_expired_approval_is_not_eligible(self) -> None:
        result = rdma(evaluated_at="2026-11-25T12:04:00Z")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("canary_gate=NOT_ELIGIBLE", result.stdout)


class DatabaseFailoverTests(unittest.TestCase):
    def test_offline_self_test(self) -> None:
        result = run("python3", str(DB), "--self-test")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("no database connections were made", result.stdout)

    def test_promote_timeout_is_unknown_and_not_retried(self) -> None:
        result = run("python3", str(DB), "--run", "postgresql", "--outcome", "promote=timeout_after_dispatch")
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["status"], "unknown_outcome")
        self.assertTrue(payload["partial_success"])
        self.assertFalse(payload["error"]["retry_allowed"])
        self.assertEqual(payload["observed_state"]["writer_fence"], "closed")

    def test_cancel_before_dispatch_does_not_mutate(self) -> None:
        result = run("python3", str(DB), "--run", "mysql", "--outcome", "promote=cancelled")
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["status"], "cancelled")
        self.assertFalse(payload["error"]["retry_allowed"])
        self.assertEqual(payload["steps"][-1]["status"], "not_dispatched")
        self.assertEqual(payload["observed_state"]["target_role"], "replica")


if __name__ == "__main__":
    unittest.main(verbosity=2)
