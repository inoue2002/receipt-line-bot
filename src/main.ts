/**
 * GET リクエスト（LINE Webhook URL検証用）
 */
function doGet(): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput("OK");
}

/**
 * LINE Webhook のエントリポイント
 * GAS の Web アプリとしてデプロイし、Webhook URL に設定する
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  const json = JSON.parse(e.postData.contents);
  const events = json.events;

  for (const event of events) {
    logInfo("event: " + event.type, event.message ? event.message.type : "");

    if (event.type !== "message") continue;

    const replyToken = event.replyToken;
    const userId = event.source.userId;

    if (event.message.type === "image") {
      handleImageMessage(event.message.id, replyToken, userId);
    } else if (event.message.type === "text") {
      handleTextMessage(event.message.text, replyToken, userId);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * 画像メッセージ: レシートを解析して確認を返す
 */
function handleImageMessage(messageId: string, replyToken: string, userId: string): void {
  try {
    showLoading(userId);
    logInfo("画像受信", "messageId: " + messageId);
    const image = getImageFromLine(messageId);
    const data = analyzeReceipt(image.base64, image.mimeType);
    logInfo("Gemini解析完了", JSON.stringify(data));

    // 画像を Drive に保存
    const fileName = (data.date || "unknown") + "_" + (data.store || "unknown");
    data.imageUrl = saveImageToDrive(image.base64, image.mimeType, fileName, data.date || "");
    logInfo("画像保存", data.imageUrl);

    // 重複チェック
    const dupCount = countDuplicates(data);
    if (dupCount > 0) {
      data.store = data.store + "(" + (dupCount + 1) + ")";
      logInfo("重複検出", "count: " + dupCount);
    }

    // 一時保存（ユーザーの確認待ち）
    savePendingData(userId, data);
    replyWithConfirmation(replyToken, data, dupCount > 0);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    logError("画像処理エラー", errorMsg);
    replyMessage(replyToken, "エラー: " + errorMsg);
  }
}

/**
 * テキストメッセージ: OK → 登録、やり直し → 破棄、修正 → 編集
 */
function handleTextMessage(text: string, replyToken: string, userId: string): void {
  const data = getPendingData(userId);

  if (text === "OK") {
    if (data) {
      clearPendingData(userId); // 先にクリアして重複登録を防止
      appendToSheet(data);
      logInfo("登録完了", JSON.stringify(data));
      replyMessage(replyToken, "登録しました！");
    } else {
      replyMessage(replyToken, "登録待ちのデータがありません。レシートの写真を送ってください。");
    }
  } else if (text === "やり直し") {
    clearPendingData(userId);
    logInfo("キャンセル", "userId: " + userId);
    replyMessage(replyToken, "キャンセルしました。もう一度レシートの写真を送ってください。");
  } else if (data && tryEditPendingData(text, data, replyToken, userId)) {
    // 修正処理が成功した場合は tryEditPendingData 内で返信済み
  } else {
    replyMessage(replyToken, "レシートの写真を送ってください。\n\nあなたのユーザーID:\n" + userId);
  }
}

/**
 * 「項目名 値」形式のテキストで pending データを修正する
 * 修正できた場合は true を返す
 */
function tryEditPendingData(text: string, data: ReceiptData, replyToken: string, userId: string): boolean {
  const fieldMap: { [key: string]: string } = {
    "日付": "date",
    "金額": "amount",
    "店名": "store",
    "科目": "category",
    "勘定科目": "category",
    "備考": "note",
  };

  for (const [label, field] of Object.entries(fieldMap)) {
    if (text.startsWith(label)) {
      const value = text.substring(label.length).trim();
      if (!value) return false;

      if (field === "amount") {
        (data as any)[field] = Number(value.replace(/[,¥￥]/g, "")) || data.amount;
      } else {
        (data as any)[field] = value;
      }

      savePendingData(userId, data);
      logInfo("修正", field + " → " + value);
      replyWithConfirmation(replyToken, data, false);
      return true;
    }
  }
  return false;
}

// --- 一時保存（CacheService） ---

function savePendingData(userId: string, data: ReceiptData): void {
  const cache = CacheService.getScriptCache();
  cache.put(`pending_${userId}`, JSON.stringify(data), 600); // 10分間保持
}

function getPendingData(userId: string): ReceiptData | null {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(`pending_${userId}`);
  return raw ? JSON.parse(raw) : null;
}

function clearPendingData(userId: string): void {
  const cache = CacheService.getScriptCache();
  cache.remove(`pending_${userId}`);
}
