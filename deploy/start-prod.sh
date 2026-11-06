#!/usr/bin/env bash
# 生产构建与启动脚本：前端构建 → 后端生成/构建 → 数据库迁移 → 启动 API
# 用法：deploy/start-prod.sh
# 可选环境变量：
#   SKIP_INSTALL=1     跳过 npm ci（依赖已安装时）
#   SKIP_WEB_BUILD=1   跳过前端构建（仅更新后端时）
#   SKIP_API_BUILD=1   跳过 Prisma Client 生成与后端构建（产物已存在时）
#   ALLOW_LOCAL_MODE=1 允许 VITE_LOCAL_MODE=true 构建演示版（生产禁用）
#   API_ENV_FILE      指定后端环境变量文件，默认 hanheritage-api/.env
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/hanheritage-api"
WEB_DIR="$ROOT_DIR/hanheritage-web"
ENV_FILE="${API_ENV_FILE:-$API_DIR/.env}"

log() { printf '[deploy] %s\n' "$*"; }
fail() { printf '[deploy] 错误：%s\n' "$*" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "未找到 node，请先安装 Node.js 20+"
command -v npm >/dev/null 2>&1 || fail "未找到 npm"
node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 20 ]; then
  fail "Node.js 版本过低（当前 $(node -v)），要求 >= 20"
fi

[ -f "$ENV_FILE" ] || fail "缺少环境变量文件 ${ENV_FILE}，请从 hanheritage-api/.env.example 复制并填写"

WEB_ENV_FILE="$WEB_DIR/.env"
if [ ! -f "$WEB_ENV_FILE" ]; then
  log "未找到 hanheritage-web/.env，将使用默认值（VITE_LOCAL_MODE=false）"
elif grep -Eq '^[[:space:]]*VITE_LOCAL_MODE[[:space:]]*=[[:space:]]*true' "$WEB_ENV_FILE" \
  && [ "${ALLOW_LOCAL_MODE:-0}" != "1" ]; then
  fail "hanheritage-web/.env 中 VITE_LOCAL_MODE=true，生产构建会使用演示数据；如确需构建演示版请设置 ALLOW_LOCAL_MODE=1"
fi

if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  log "安装前端依赖"
  (cd "$WEB_DIR" && npm ci)
  log "安装后端依赖（迁移需要 prisma CLI，故保留 devDependencies）"
  (cd "$API_DIR" && npm ci)
else
  log "跳过依赖安装（SKIP_INSTALL=1）"
fi

if [ "${SKIP_WEB_BUILD:-0}" != "1" ]; then
  log "构建前端 → hanheritage-web/dist（由 Nginx 托管）"
  (cd "$WEB_DIR" && npm run build)
else
  log "跳过前端构建（SKIP_WEB_BUILD=1）"
fi

if [ "${SKIP_API_BUILD:-0}" != "1" ]; then
  log "生成 Prisma Client"
  (cd "$API_DIR" && npm run db:generate)

  log "构建后端"
  (cd "$API_DIR" && npm run build)
else
  log "跳过 Prisma Client 生成与后端构建（SKIP_API_BUILD=1）"
  [ -f "$API_DIR/dist/src/main.js" ] || fail "未找到 $API_DIR/dist/src/main.js，请先执行后端构建"
fi

log "加载环境变量并执行数据库迁移（prisma migrate deploy）"
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
(cd "$API_DIR" && npm run db:migrate:deploy)

log "启动后端（端口 ${PORT:-3083}，工作目录 hanheritage-api）"
cd "$API_DIR"
exec node dist/src/main.js
