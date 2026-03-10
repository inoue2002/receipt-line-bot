#!/bin/bash
set -e

echo "=== receipt-line-bot セットアップ ==="
echo ""

# 1. npm install
echo "[1/7] パッケージインストール..."
npm install

# 2. clasp ログイン確認
echo ""
echo "[2/7] Google アカウント認証..."
if ! npx clasp login --status 2>/dev/null | grep -q "You are logged in"; then
  npx clasp login
fi
echo "  ✅ ログイン済み"

# 3. GAS プロジェクト接続 or 新規作成
echo ""
echo "[3/7] GAS プロジェクト..."
if [ -f .clasp.json ]; then
  echo "  ⚠️  .clasp.json が既に存在します。スキップします。"
else
  echo "  既存のGASプロジェクトに接続する場合は Script ID を入力してください。"
  echo "  新規作成する場合はそのまま Enter を押してください。"
  echo ""
  echo "  Script ID は GAS エディタの URL から取得できます:"
  echo "  https://script.google.com/d/【この部分】/edit"
  echo ""
  read -p "  Script ID (新規作成は Enter): " SCRIPT_ID
  if [ -n "$SCRIPT_ID" ]; then
    npx clasp clone "$SCRIPT_ID" --rootDir .
    echo "  ✅ 既存プロジェクトに接続完了"
  else
    npx clasp create --title "レシート経費記録" --type sheets
    echo "  ✅ スプレッドシート + GAS プロジェクト作成完了"
  fi
fi

# 4. コードをプッシュ
echo ""
echo "[4/7] コードをGASにプッシュ..."
echo "y" | npx clasp push
echo "  ✅ プッシュ完了"

# 5. GAS エディタで手動設定
echo ""
echo "[5/7] GAS エディタで手動設定"
echo ""
echo "  GAS エディタを開きます。以下を実行してください："
echo ""
echo "  1. set_props.ts の setProperties にAPIキーを入れて実行"
echo "     - LINE_CHANNEL_ACCESS_TOKEN"
echo "     - LINE_CHANNEL_SECRET"
echo "     - GEMINI_API_KEY"
echo ""
echo "  2. setup 関数を実行（ヘッダー・フォーマット設定）"
echo ""
npx clasp open
echo ""
read -p "  完了したら Enter を押してください... "

# 6. デプロイ
echo ""
echo "[6/7] デプロイ..."
DEPLOY_OUTPUT=$(npx clasp deploy 2>&1)
echo "$DEPLOY_OUTPUT"
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'AKfycb[a-zA-Z0-9_-]+')
if [ -z "$DEPLOY_URL" ]; then
  echo "  ⚠️  デプロイIDの取得に失敗しました。手動でWebhook URLを設定してください。"
else
  echo "$DEPLOY_URL" > .deployment_id
  WEBHOOK_URL="https://script.google.com/macros/s/${DEPLOY_URL}/exec"
  echo "  ✅ デプロイ完了"
  echo "  デプロイID を .deployment_id に保存しました"
  echo "  Webhook URL: $WEBHOOK_URL"

  # 7. LINE Webhook URL を自動設定
  echo ""
  echo "[7/7] LINE Webhook URL 設定..."
  # set_props.ts で設定した LINE_CHANNEL_ACCESS_TOKEN を取得するため入力を求める
  read -p "  LINE_CHANNEL_ACCESS_TOKEN を入力（Webhook自動設定用）: " LINE_TOKEN
  if [ -n "$LINE_TOKEN" ]; then
    RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
      https://api.line.me/v2/bot/channel/webhook/endpoint \
      -H "Authorization: Bearer ${LINE_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"endpoint\":\"${WEBHOOK_URL}\"}")
    if [ "$RESULT" = "200" ]; then
      echo "  ✅ Webhook URL 設定完了"
    else
      echo "  ⚠️  Webhook URL の設定に失敗しました（HTTP ${RESULT}）"
      echo "  手動で設定してください: $WEBHOOK_URL"
    fi
  else
    echo "  スキップしました。手動で設定してください: $WEBHOOK_URL"
  fi
fi

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "  初回のみ手動で設定が必要な項目："
echo "  - LINE Developers → Webhook の利用をオン"
echo "  - LINE Developers → 応答メッセージをオフ"
echo ""
echo "テスト: LINE Bot にレシートの写真を送ってみてください！"
