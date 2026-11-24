#!/usr/bin/env bash
# SYNTHETIC / 脱敏示例（PLAY-03）：GPU 推理只读预检。
# 不发送推理请求，不 drain/restart/reset/替换；不轮询 TensorRT-LLM 的消费式 /metrics。
set -euo pipefail

readonly EXPECTED_CONTEXT="kind-ops-test"
readonly NAMESPACE="ops-test"
readonly POD="${POD:-gpu-test-0}"
readonly BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"

if [[ ! "$POD" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]]; then
  printf 'REFUSED: POD must be a synthetic DNS name.\n' >&2
  exit 2
fi
for tool in kubectl curl; do
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
if [[ "$BASE_URL" != http://127.0.0.1:* && "$BASE_URL" != http://localhost:* && "$BASE_URL" != http://*.svc.cluster.local:* ]]; then
  printf 'REFUSED: BASE_URL must be local or a synthetic in-cluster test service.\n' >&2
  exit 2
fi

printf 'data_classification: synthetic/脱敏\nmode: readonly\n'
printf 'context=%s namespace=%s pod=%s base_url=%s\n' \
  "$EXPECTED_CONTEXT" "$NAMESPACE" "$POD" "$BASE_URL"
printf '# Capture model/framework version before interpreting metric names.\n'
kubectl --context "$EXPECTED_CONTEXT" -n "$NAMESPACE" get pod "$POD" -o wide
kubectl --context "$EXPECTED_CONTEXT" -n "$NAMESPACE" describe pod "$POD"
kubectl --context "$EXPECTED_CONTEXT" -n "$NAMESPACE" get events --sort-by=.metadata.creationTimestamp
kubectl --context "$EXPECTED_CONTEXT" -n "$NAMESPACE" logs "$POD" --tail=200 --timestamps=true
kubectl --context "$EXPECTED_CONTEXT" get nodes -o wide

if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia-smi --query-gpu=index,name,uuid,driver_version,memory.total,memory.used,temperature.gpu,clocks.current.sm \
    --format=csv,noheader
else
  printf 'nvidia-smi: unavailable; collect DCGM evidence separately.\n'
fi

# Health/models are read-only discovery. No completion call means no new inference load.
printf '# GET /health\n'
curl --fail --silent --show-error --max-time 5 "$BASE_URL/health" || true
printf '\n# GET /v1/models\n'
curl --fail --silent --show-error --max-time 5 "$BASE_URL/v1/models" || true
printf '\n# TensorRT-LLM /metrics intentionally not polled: its runtime queue is consumed on read.\n'
printf '# Next: map metrics by version, calculate KV budget, then use the diagram 18 gates for any action.\n'
