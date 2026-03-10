#!/bin/bash
set -e

echo "=== receipt-line-bot セットアップ ==="
echo ""

# 1. npm install
echo "[1/5] パッケージインストール..."
npm install

# 2. clasp ログイン確認
echo ""
echo "[2/5] Google アカウント認証..."
if ! npx clasp login --status 2>/dev/null | grep -q "You are logged in"; then
  npx clasp login
fi
echo "  ✅ ログイン済み"

# 3. スプレッドシート + GAS プロジェクト同時作成
echo ""
echo "[3/5] スプレッドシート & GAS プロジェクト作成..."
if [ -f .clasp.json ]; then
  echo "  ⚠️  .clasp.json が既に存在します。スキップします。"
else
  npx clasp create --title "レシート経費記録" --type sheets
  echo "  ✅ スプレッドシート + GAS プロジェクト作成完了"
fi

# 4. コードをプッシュ
echo ""
echo "[4/5] コードをGASにプッシュ..."
echo "y" | npx clasp push
echo "  ✅ プッシュ完了"

# 5. API キー設定案内
echo ""
echo "[5/5] API キーの設定"
echo ""
echo "  GAS エディタを開きます。以下を実行してください："
echo ""
echo "  1. プロジェクトの設定（⚙️）→ スクリプトプロパティ に以下を追加："
echo "     - LINE_CHANNEL_ACCESS_TOKEN"
echo "     - LINE_CHANNEL_SECRET"
echo "     - GEMINI_API_KEY"
echo ""
echo "  2. setup 関数を実行（ヘッダー・フォーマット設定）"
echo ""
echo "  3. デプロイ → 新しいデプロイ → ウェブアプリ"
echo "     - 次のユーザーとして実行: 自分"
echo "     - アクセスできるユーザー: 全員"
echo ""
npx clasp open
echo ""
echo "=== デプロイ後の手順 ==="
echo "  1. デプロイで表示される URL をコピー"
echo "  2. LINE Developers → Webhook URL に貼り付け"
echo "  3. Webhook の利用をオン"
echo "  4. 応答メッセージをオフ"
echo ""
echo "テスト: LINE Bot にレシートの写真を送ってみてください！"
