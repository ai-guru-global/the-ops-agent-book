#!/usr/bin/env bash
# SYNTHETIC / 脱敏示例（PLAY-02）：单端口只读 flap/pause 采样。
# 不执行 perftest/NCCL，不隔离端口，不修改 QoS；主动施压必须另行审批。
set -euo pipefail

readonly IFACE="${IFACE:-eth10}"
readonly IB_DEVICE="${IB_DEVICE:-mlx5_0}"
readonly IB_PORT="${IB_PORT:-1}"
readonly SAMPLE_SECONDS="${SAMPLE_SECONDS:-60}"
readonly PAUSE_DURATION_UNIT="${PAUSE_DURATION_UNIT:-unknown}"

if [[ "${TEST_TARGET_CONFIRMED:-no}" != "yes" ]]; then
  printf 'REFUSED: set TEST_TARGET_CONFIRMED=yes only for an isolated synthetic test target.\n' >&2
  exit 2
fi
if [[ ! "$IFACE" =~ ^[a-zA-Z0-9_.:-]+$ || ! "$IB_DEVICE" =~ ^[a-zA-Z0-9_.:-]+$ || ! "$IB_PORT" =~ ^[0-9]+$ ]]; then
  printf 'REFUSED: invalid interface/device/port.\n' >&2
  exit 2
fi
if [[ ! "$SAMPLE_SECONDS" =~ ^[0-9]+$ ]] || (( SAMPLE_SECONDS < 5 || SAMPLE_SECONDS > 300 )); then
  printf 'REFUSED: SAMPLE_SECONDS must be 5..300.\n' >&2
  exit 2
fi
for tool in ethtool python3; do
  command -v "$tool" >/dev/null 2>&1 || {
    printf 'MISSING_TOOL: %s (IB counters are optional)\n' "$tool" >&2
    exit 2
  }
done

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

ethtool_counter() {
  local name="$1"
  ethtool -S "$IFACE" 2>/dev/null | awk -v wanted="$name" '
    $1 == wanted { print $2; found=1; exit }
    END { if (!found) exit 3 }
  ' || true
}

ib_counter() {
  local name="$1"
  local path="/sys/class/infiniband/$IB_DEVICE/ports/$IB_PORT/counters/$name"
  if [[ -r "$path" ]]; then
    tr -d '[:space:]' < "$path"
  else
    printf 'NA\n'
  fi
}

snapshot() {
  printf 'timestamp_utc=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf 'monotonic_ns=%s\n' "$(python3 -c 'import time; print(time.monotonic_ns())')"
  printf 'link_downed=%s\n' "$(ib_counter link_downed)"
  printf 'symbol_error=%s\n' "$(ib_counter symbol_error)"
  printf 'port_rcv_errors=%s\n' "$(ib_counter port_rcv_errors)"
  printf 'rx_pause=%s\n' "$(ethtool_counter rx_pause)"
  printf 'rx_pause_duration=%s\n' "$(ethtool_counter rx_pause_duration)"
  printf 'pause_duration_unit=%s\n' "$PAUSE_DURATION_UNIT"
}

printf 'data_classification: synthetic/脱敏\nmode: readonly\n'
printf 'iface=%s ib_device=%s ib_port=%s sample_seconds=%s\n' \
  "$IFACE" "$IB_DEVICE" "$IB_PORT" "$SAMPLE_SECONDS"
printf '# Counter names/units are driver-specific. NA is missing evidence, not zero.\n'
snapshot > "$workdir/t0.txt"
printf '# t0 snapshot\n'
# Output is already synthetic/redacted; no credentials or customer data are queried.
while IFS= read -r line; do printf '%s\n' "$line"; done < "$workdir/t0.txt"
sleep "$SAMPLE_SECONDS"
snapshot > "$workdir/t1.txt"
printf '# t1 snapshot\n'
while IFS= read -r line; do printf '%s\n' "$line"; done < "$workdir/t1.txt"

python3 - "$workdir/t0.txt" "$workdir/t1.txt" <<'PY'
from __future__ import annotations

import sys
from pathlib import Path


def load(path: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if "=" in line:
            key, value = line.split("=", 1)
            values[key] = value
    return values


t0, t1 = map(load, sys.argv[1:])
dt = (int(t1["monotonic_ns"]) - int(t0["monotonic_ns"])) / 1_000_000_000
print("# delta/rate report")
print(f"elapsed_seconds={dt:.6f}")
print("metric,t0,t1,delta,rate_per_s,unit")
metrics = (
    ("link_downed", "events"),
    ("symbol_error", "events"),
    ("port_rcv_errors", "events"),
    ("rx_pause", "packets"),
    ("rx_pause_duration", t0.get("pause_duration_unit", "unknown")),
)
invalid = False
rates: dict[str, float] = {}
for name, unit in metrics:
    try:
        before, after = int(t0[name]), int(t1[name])
    except (KeyError, ValueError):
        print(f"{name},{t0.get(name, 'NA')},{t1.get(name, 'NA')},NA,NA,{unit}")
        continue
    delta = after - before
    if delta < 0:
        invalid = True
        rate = float("nan")
        print(f"{name},{before},{after},RESET,INVALID,{unit}")
    else:
        rate = delta / dt if dt > 0 else float("nan")
        rates[name] = rate
        print(f"{name},{before},{after},{delta},{rate:.6f},{unit}")

pause_ratio = None
if t0.get("pause_duration_unit") == "ns" and not invalid and dt > 0:
    try:
        pause_ratio = (int(t1["rx_pause_duration"]) - int(t0["rx_pause_duration"])) / (dt * 1_000_000_000)
    except (KeyError, ValueError):
        pause_ratio = None
print(f"pause_time_ratio={pause_ratio if pause_ratio is not None else 'NA'}")
print(f"counter_sample_valid={str(not invalid).lower()}")
print(f"link_flap_observed={str(rates.get('link_downed', 0) > 0).lower()} (inspect full 5m decision window)")
print(f"synthetic_pause_rate_trigger={str(rates.get('rx_pause', 0) > 1000).lower()}")
print(f"synthetic_pause_ratio_trigger={str(pause_ratio is not None and pause_ratio > 0.05).lower()}")
print("decision=manual_review_required; no_port_action_taken")
PY
