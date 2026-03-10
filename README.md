# receipt-line-bot

LINEでレシートを撮影 → Gemini AIで読み取り → Google Sheetsに自動記録するBotです。

Google Apps Script + clasp で構築。サーバー不要・完全無料で運用できます。

## 仕組み

```
レシート撮影 → LINE → GAS(Webhook) → Gemini API(OCR) → 確認メッセージ → OK → Google Sheets
```

1. LINEでレシートの写真を送る
2. Gemini APIが日付・金額・店名・カテゴリを抽出
3. 確認メッセージが返ってくる（OK / やり直し）
4. OKを押すとGoogle Sheetsに1行追加

## セットアップ

### クイックスタート

```bash
git clone https://github.com/inoue2002/receipt-line-bot.git
cd receipt-line-bot
bash setup.sh
```

対話形式でAPIキーの入力 → GASプロジェクト作成 → デプロイまで一気に実行します。

---

### 手動セットアップ（個別にやる場合）

### 1. LINE Messaging API

1. [LINE Developers](https://developers.line.biz/) でチャネルを作成
2. チャネルアクセストークンとチャネルシークレットを取得

### 2. Gemini API

1. [Google AI Studio](https://aistudio.google.com/) で API キーを取得

### 3. Google Sheets

1. 新しいスプレッドシートを作成
2. URLから Spreadsheet ID をコピー（`/d/` と `/edit` の間の文字列）

### 4. Google Apps Script

```bash
# clasp をインストール
npm install

# Google アカウントでログイン
npx clasp login

# スプレッドシート + GAS プロジェクトを同時作成
npx clasp create --title "レシート経費記録" --type sheets

# コードをプッシュ
npx clasp push

# Web アプリとしてデプロイ
npx clasp deploy
```

### 5. Script Properties を設定

GAS エディタ（`npx clasp open`）→ プロジェクトの設定 → スクリプトプロパティ に以下を追加：

| プロパティ名 | 値 |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINEのチャネルアクセストークン |
| `LINE_CHANNEL_SECRET` | LINEのチャネルシークレット |
| `GEMINI_API_KEY` | Gemini APIキー |

### 6. シートのセットアップ

GAS エディタで `setup` 関数を実行すると、ヘッダーとフォーマットが設定されます。
スプレッドシート自体は `clasp create --type sheets` で自動作成済みです。

### 7. LINE Webhook URL を設定

1. `npx clasp deploy` で表示される Web アプリ URL をコピー
2. LINE Developers → チャネル → Messaging API → Webhook URL に貼り付け
3. Webhook の利用をオンにする

## Google Sheets の出力フォーマット

| 日付 | 金額 | 店名 | 勘定科目 | 備考 | 登録日時 |
|------|------|------|---------|------|---------|

## 勘定科目の自動分類

| 科目 | 例 |
|------|---|
| 交際費 | 飲食店、食料品 |
| 消耗品費 | 日用品、電子機器 |
| 会議費 | カフェ（打ち合わせ） |
| 新聞図書費 | 書籍、雑誌 |
| 旅費交通費 | タクシー、駐車場 |
| 雑費 | その他 |

## 更新

コードを変更したら:

```bash
bash update.sh   # プッシュ＋デプロイ（URLは変わりません）
```

または:

```bash
npm run push     # コードをGASにプッシュのみ
npm run deploy   # プッシュ＋デプロイ
npm run open     # GASエディタを開く
npm run logs     # ログを確認
```

## 削除

```bash
bash delete.sh
```

GAS エディタが開くので、左メニュー「概要」→ 右上「︙」→「ゴミ箱に移動」で削除できます。
削除後は `rm .clasp.json` でローカルの設定も消してください。

## License

MIT
