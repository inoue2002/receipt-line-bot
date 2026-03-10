#!/bin/bash
set -e

echo "=== receipt-line-bot セットアップ ==="
echo ""

# 1. npm install
echo "[1/6] パッケージインストール..."
npm install

# 2. clasp ログイン確認
echo ""
echo "[2/6] Google アカウント認証..."
if ! npx clasp login --status 2>/dev/null | grep -q "You are logged in"; then
  npx clasp login
fi
echo "  ✅ ログイン済み"

# 3. GAS プロジェクト作成
echo ""
echo "[3/6] GAS プロジェクト作成..."
if [ -f .clasp.json ]; then
  echo "  ⚠️  .clasp.json が既に存在します。スキップします。"
else
  npx clasp create --title "receipt-line-bot" --type webapp
  echo "  ✅ 作成完了"
fi

# 4. コードをプッシュ
echo ""
echo "[4/6] コードをGASにプッシュ..."
npx clasp push
echo "  ✅ プッシュ完了"

# 5. API キー設定
echo ""
echo "[5/6] API キーを設定します"
echo ""
read -p "LINE_CHANNEL_ACCESS_TOKEN: " LINE_TOKEN
read -p "LINE_CHANNEL_SECRET: " LINE_SECRET
read -p "GEMINI_API_KEY: " GEMINI_KEY

# GAS の Script Properties に設定するためのコードを実行
SCRIPT_ID=$(cat .clasp.json | grep scriptId | cut -d'"' -f4)
echo ""
echo "  GAS エディタを開きます。以下を Script Properties に設定してください："
echo "  LINE_CHANNEL_ACCESS_TOKEN = ${LINE_TOKEN}"
echo "  LINE_CHANNEL_SECRET = ${LINE_SECRET}"
echo "  GEMINI_API_KEY = ${GEMINI_KEY}"
echo ""
echo "  設定方法: プロジェクトの設定（⚙️） → スクリプトプロパティ → プロパティを追加"
echo ""
npx clasp open
read -p "  設定できたら Enter を押してください..."

# 6. setup関数でスプレッドシート作成 + デプロイ
echo ""
echo "[6/6] デプロイ..."
DEPLOY_OUTPUT=$(npx clasp deploy 2>&1)
echo "$DEPLOY_OUTPUT"
WEBAPP_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://script.google.com[^ ]*' || true)

echo ""
echo "=== セットアップ完了！ ==="
echo ""
echo "残りの手順:"
echo "  1. GAS エディタで setup 関数を実行（スプレッドシート自動作成）"
echo "  2. LINE Developers → Webhook URL に以下を設定:"
if [ -n "$WEBAPP_URL" ]; then
  echo "     $WEBAPP_URL"
else
  echo "     (npx clasp deploy の出力に表示される URL)"
fi
echo "  3. Webhook の利用をオンにする"
echo ""
echo "テスト: LINE Bot にレシートの写真を送ってみてください！"
