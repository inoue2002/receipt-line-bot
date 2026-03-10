#!/bin/bash
set -e

if [ ! -f .deployment_id ]; then
  echo "❌ .deployment_id が見つかりません。先に bash setup.sh を実行してください。"
  exit 1
fi

DEPLOY_ID=$(cat .deployment_id)

echo "コードをプッシュ..."
echo "y" | npx clasp push

echo "デプロイ更新..."
npx clasp deploy -i "$DEPLOY_ID"

echo "✅ 更新完了（URLは変わりません）"
