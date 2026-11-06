#!/usr/bin/env bash
# 部署后健康检查：后端公开接口 + 前端首页
# 用法：
#   deploy/health-check.sh
#   API_URL=http://127.0.0.1:3083 WEB_URL=http://127.0.0.1 deploy/health-check.sh
#   TIMEOUT=10 deploy/health-check.sh
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:${PORT:-3083}}"
WEB_URL="${WEB_URL:-http://127.0.0.1}"
TIMEOUT="${TIMEOUT:-5}"
failed=0

check_api() {
  local url="$1"
  local body
  body="$(curl -fsS --max-time "$TIMEOUT" "$url" 2>/dev/null)" || {
    printf '[FAIL] 后端接口不可访问：%s\n' "$url"
    failed=1
    return
  }
  # 全局响应拦截器固定返回 {"code":200,"message":"success","data":...}
  if printf '%s' "$body" | grep -q '"code":200'; then
    printf '[ OK ] 后端接口正常：%s\n' "$url"
  else
    printf '[FAIL] 后端接口返回异常：%s\n' "$url"
    printf '       %s\n' "$(printf '%s' "$body" | head -c 200)"
    failed=1
  fi
}

check_web() {
  local url="${WEB_URL%/}/"
  local code
  code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$url" 2>/dev/null || true)"
  if [ "$code" = "200" ]; then
    printf '[ OK ] 前端首页正常：%s\n' "$url"
  else
    printf '[FAIL] 前端首页异常（HTTP %s）：%s\n' "${code:-000}" "$url"
    failed=1
  fi
}

check_api "$API_URL/api/v1/visitor/cliffs"
check_web

if [ "$failed" -ne 0 ]; then
  printf '健康检查未通过\n' >&2
  exit 1
fi
printf '健康检查通过\n'
