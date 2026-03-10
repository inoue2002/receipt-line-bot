/**
 * Gemini API でレシート画像を解析し、構造化データを返す
 */
function analyzeReceipt(imageBase64: string, mimeType: string): ReceiptData | null {
  const config = getConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.GEMINI_API_KEY}`;

  const prompt = `このレシート画像から以下の情報をJSON形式で抽出してください。
必ず以下のフォーマットで返してください。JSON以外のテキストは含めないでください。

{
  "date": "YYYY/MM/DD",
  "amount": 数値（税込合計、整数）,
  "store": "店名",
  "category": "勘定科目",
  "note": "備考（主な購入品目など簡潔に）"
}

勘定科目は以下から選んでください:
- 交際費（飲食店、食料品）
- 消耗品費（日用品、電子機器、文房具）
- 会議費（カフェでの打ち合わせ）
- 新聞図書費（書籍、雑誌）
- 旅費交通費（タクシー、駐車場、ガソリン）
- 雑費（上記に当てはまらないもの）

読み取れない項目がある場合は "不明" としてください。`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
  };

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const statusCode = response.getResponseCode();

  Logger.log("Gemini status: " + statusCode);
  Logger.log("Gemini response: " + responseText.substring(0, 500));

  if (statusCode !== 200) {
    throw new Error("Gemini API error (" + statusCode + "): " + responseText.substring(0, 200));
  }

  const result = JSON.parse(responseText);

  try {
    const text = result.candidates[0].content.parts[0].text;
    Logger.log("Gemini text: " + text);
    // JSON部分を抽出（```json ... ``` で囲まれている場合にも対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ReceiptData;
    }
    throw new Error("JSONが見つかりません: " + text.substring(0, 100));
  } catch (e) {
    throw new Error("Gemini解析エラー: " + e);
  }
}

interface ReceiptData {
  date: string;
  amount: number;
  store: string;
  category: string;
  note: string;
}
