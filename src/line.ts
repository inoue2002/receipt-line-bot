/**
 * LINE にテキストメッセージを返信する
 */
function replyMessage(replyToken: string, message: string): void {
  const config = getConfig();
  const url = "https://api.line.me/v2/bot/message/reply";

  const payload = {
    replyToken: replyToken,
    messages: [{ type: "text", text: message }],
  };

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}

/**
 * LINE から画像のバイナリデータを取得する
 */
function getImageFromLine(messageId: string): { base64: string; mimeType: string } {
  const config = getConfig();
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;

  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}` },
    muteHttpExceptions: true,
  });

  const blob = response.getBlob();
  const base64 = Utilities.base64Encode(blob.getBytes());
  const mimeType = blob.getContentType() || "image/jpeg";

  return { base64, mimeType };
}

/**
 * LINE にクイックリプライ付きメッセージを送る（OK / やり直し）
 */
function replyWithConfirmation(replyToken: string, data: ReceiptData, isDuplicate: boolean = false): void {
  const config = getConfig();
  const url = "https://api.line.me/v2/bot/message/reply";

  let summary = `${data.date} ¥${data.amount.toLocaleString()} ${data.store}\n科目: ${data.category}\n備考: ${data.note}`;
  if (isDuplicate) {
    summary = "⚠️ 同じ日付・金額・店名のデータが既にあります\n\n" + summary;
  }

  const payload = {
    replyToken: replyToken,
    messages: [
      {
        type: "template",
        altText: summary + "\n\nこれでOK？",
        template: {
          type: "confirm",
          text: summary + "\n\nこれで登録する？",
          actions: [
            { type: "message", label: "OK", text: "OK" },
            { type: "message", label: "やり直し", text: "やり直し" },
          ],
        },
      },
    ],
  };

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}
