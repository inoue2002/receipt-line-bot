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
    const image = getImageFromLine(messageId);
    Logger.log("Image received: " + image.mimeType + ", base64 length: " + image.base64.length);
    const data = analyzeReceipt(image.base64, image.mimeType);

    // 重複チェック
    const dupCount = countDuplicates(data);
    if (dupCount > 0) {
      data.store = data.store + "(" + (dupCount + 1) + ")";
    }

    // 一時保存（ユーザーの確認待ち）
    savePendingData(userId, data);
    replyWithConfirmation(replyToken, data, dupCount > 0);
  } catch (e) {
    Logger.log("Error: " + e);
    const errorMsg = e instanceof Error ? e.message : String(e);
    replyMessage(replyToken, "エラー: " + errorMsg);
  }
}

/**
 * テキストメッセージ: OK → 登録、やり直し → 破棄
 */
function handleTextMessage(text: string, replyToken: string, userId: string): void {
  if (text === "OK") {
    const data = getPendingData(userId);
    if (data) {
      clearPendingData(userId); // 先にクリアして重複登録を防止
      appendToSheet(data);
      replyMessage(replyToken, "登録しました！");
    } else {
      replyMessage(replyToken, "登録待ちのデータがありません。レシートの写真を送ってください。");
    }
  } else if (text === "やり直し") {
    clearPendingData(userId);
    replyMessage(replyToken, "キャンセルしました。もう一度レシートの写真を送ってください。");
  } else {
    replyMessage(replyToken, "レシートの写真を送ってください。");
  }
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
