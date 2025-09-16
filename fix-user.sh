#!/bin/bash

# 修复用户数据的脚本
# 请确保已安装curl

echo "开始修复用户数据..."

# 用户信息
USER_ID="3f1dd61c-4cfe-4282-9cb0-c3181f200f46"
USER_EMAIL="1@1.com"

# Supabase配置
SUPABASE_URL="https://ncgjyulrxlavejpgriju.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ2p5dWxyeGxhdmVqcGdyaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDc2MzIsImV4cCI6MjA3MzM4MzYzMn0.yM0nV0WUOO1UdUuRWCKjs4k3-W3FkflrpzK1cD3ULkk"

# 检查用户是否已存在
echo "检查用户是否已存在..."
curl -s -X GET "${SUPABASE_URL}/rest/v1/users?id=eq.${USER_ID}" \
  -H "apikey: ${API_KEY}" \
  -H "Authorization: Bearer ${API_KEY}" \
  | grep -q "${USER_ID}"

if [ $? -eq 0 ]; then
  echo "用户已存在，无需创建"
  exit 0
fi

# 创建用户记录
echo "创建用户记录..."
curl -X POST "${SUPABASE_URL}/rest/v1/users" \
  -H "apikey: ${API_KEY}" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "id": "'${USER_ID}'",
    "email": "'${USER_EMAIL}'",
    "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "updated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'

echo ""
echo "用户数据修复完成"