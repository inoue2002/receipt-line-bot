/**
 * ローディングアニメーションを表示する（最大60秒）
 */
function showLoading(userId: string): void {
  const config = getConfig();
  UrlFetchApp.fetch("https://api.line.me/v2/bot/chat/loading/start", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}` },
    payload: JSON.stringify({ chatId: userId, loadingSeconds: 60 }),
    muteHttpExceptions: true,
  });
}

/**
 * LINE にテキストメッセージを返信する（クイックリプライ付きオプション）
 */
function replyMessage(replyToken: string, message: string, quickReply?: any): void {
  const config = getConfig();
  const url = "https://api.line.me/v2/bot/message/reply";

  const msg: any = { type: "text", text: message };
  if (quickReply) {
    msg.quickReply = quickReply;
  }

  const payload = {
    replyToken: replyToken,
    messages: [msg],
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
 * メニュー用のクイックリプライオブジェクト
 */
function getMenuQuickReply(): any {
  return {
    items: [
      { type: "action", action: { type: "message", label: "登録確認", text: "登録確認" } },
      { type: "action", action: { type: "uri", label: "友達に共有", uri: "https://line.me/R/nv/recommendOA/" + encodeURIComponent(getBotId()) } },
    ],
  };
}

/**
 * Bot ID を取得
 */
function getBotId(): string {
  return getConfig().LINE_BOT_ID;
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
 * Flex Message で確認メッセージを送る
 */
function replyWithConfirmation(replyToken: string, data: ReceiptData, isDuplicate: boolean = false): void {
  const config = getConfig();
  const url = "https://api.line.me/v2/bot/message/reply";

  const bodyContents: any[] = [];

  if (isDuplicate) {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      contents: [{ type: "text", text: "⚠️ 同じデータが既にあります", size: "xs", color: "#ff6b6b", wrap: true }],
      margin: "none",
    });
  }

  bodyContents.push(
    makeFlexRow("日付", data.date),
    makeSeparator(),
    makeFlexRow("金額", "¥" + data.amount.toLocaleString()),
    makeSeparator(),
    makeFlexRow("店名", data.store),
    makeSeparator(),
    makeFlexRow("科目", data.category),
    makeSeparator(),
    makeFlexRow("備考", data.note),
  );

  const flexMessage = {
    type: "flex",
    altText: `${data.date} ¥${data.amount.toLocaleString()} ${data.store} - これでOK？`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: "レシート読み取り結果", weight: "bold", size: "md", color: "#ffffff" }],
        backgroundColor: "#27ACB2",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
        spacing: "sm",
        paddingAll: "15px",
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "button", action: { type: "message", label: "OK", text: "OK" }, style: "primary", color: "#27ACB2" },
              { type: "button", action: { type: "message", label: "やり直し", text: "やり直し" }, style: "secondary" },
            ],
            spacing: "md",
          },
          {
            type: "text",
            text: "修正: 「日付 2025/04/01」「金額 1500」のように送信",
            size: "xxs",
            color: "#999999",
            margin: "lg",
            wrap: true,
          },
        ],
        paddingAll: "15px",
      },
    },
  };

  const payload = {
    replyToken: replyToken,
    messages: [flexMessage],
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
 * 登録確認の Flex Message を返信する
 */
function replyWithSummary(replyToken: string, data: RecentSummaryResult): void {
  const config = getConfig();
  const url = "https://api.line.me/v2/bot/message/reply";

  const bodyContents: any[] = [];

  if (data.entries.length === 0) {
    bodyContents.push({ type: "text", text: "直近7週間の登録はありません。", size: "sm", color: "#888888" });
  } else {
    // 直近20件まで表示
    const show = data.entries.slice(0, 20);
    for (let i = 0; i < show.length; i++) {
      const e = show[i];
      if (i > 0) bodyContents.push(makeSeparator());
      bodyContents.push({
        type: "box",
        layout: "horizontal",
        contents: [
          { type: "text", text: e.date.substring(5), size: "xs", color: "#888888", flex: 2 },
          { type: "text", text: e.store, size: "xs", flex: 4, wrap: true },
          { type: "text", text: "¥" + e.amount.toLocaleString(), size: "xs", align: "end", flex: 3 },
        ],
      });
    }
    if (data.entries.length > 20) {
      bodyContents.push(makeSeparator());
      bodyContents.push({ type: "text", text: "他 " + (data.entries.length - 20) + " 件...", size: "xs", color: "#888888" });
    }
  }

  const flexMessage = {
    type: "flex",
    altText: "登録確認: " + data.totalCount + "件 ¥" + data.totalAmount.toLocaleString(),
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "直近7週間の登録", weight: "bold", size: "md", color: "#ffffff" },
          { type: "text", text: data.totalCount + "件  合計 ¥" + data.totalAmount.toLocaleString(), size: "sm", color: "#ffffffcc", margin: "xs" },
        ],
        backgroundColor: "#27ACB2",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
        spacing: "sm",
        paddingAll: "15px",
      },
    },
    quickReply: getMenuQuickReply(),
  };

  const payload = {
    replyToken: replyToken,
    messages: [flexMessage],
  };

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}

function makeFlexRow(label: string, value: string): any {
  return {
    type: "box",
    layout: "horizontal",
    contents: [
      { type: "text", text: label, size: "sm", color: "#888888", flex: 2 },
      { type: "text", text: value || "不明", size: "sm", weight: "bold", flex: 5, wrap: true },
    ],
  };
}

function makeSeparator(): any {
  return { type: "separator", margin: "sm" };
}
