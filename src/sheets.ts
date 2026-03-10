/**
 * Google Sheets にレシートデータを追記する（年ごとにシートを分ける）
 */
function appendToSheet(data: ReceiptData): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = (data.date || "").substring(0, 4) || new Date().getFullYear().toString();
  const sheetName = "レシート_" + year;
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["日付", "金額", "店名", "勘定科目", "備考", "登録日時", "画像"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold");
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 120);
    sheet.setColumnWidth(5, 250);
    sheet.setColumnWidth(6, 160);
    sheet.setColumnWidth(7, 200);
    sheet.getRange("B:B").setNumberFormat("#,##0");
  }

  const now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm");
  sheet.appendRow([data.date, data.amount, data.store, data.category, data.note, now, data.imageUrl || ""]);
}

/**
 * 直近7週間の登録データを週ごとに集計して返す
 */
function getRecentSummary(): string {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date();
  const sevenWeeksAgo = new Date(now.getTime() - 49 * 24 * 60 * 60 * 1000);

  // 全年度シートからデータを集める
  const allRows: { date: string; amount: number; store: string }[] = [];
  const sheets = ss.getSheets();
  for (const sheet of sheets) {
    if (!sheet.getName().startsWith("レシート_")) continue;
    if (sheet.getLastRow() <= 1) continue;
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
    for (const row of rows) {
      allRows.push({ date: String(row[0]), amount: Number(row[1]), store: String(row[2]) });
    }
  }

  // 週ごとに集計
  const weekMap: { [key: string]: { count: number; total: number } } = {};
  for (const row of allRows) {
    const d = new Date(row.date.replace(/\//g, "-"));
    if (isNaN(d.getTime()) || d < sevenWeeksAgo) continue;
    // 週の月曜日を基準にキーを作る
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = Utilities.formatDate(monday, "Asia/Tokyo", "MM/dd");
    if (!weekMap[key]) weekMap[key] = { count: 0, total: 0 };
    weekMap[key].count++;
    weekMap[key].total += row.amount;
  }

  const sortedKeys = Object.keys(weekMap).sort();
  if (sortedKeys.length === 0) return "直近7週間の登録はありません。";

  let totalCount = 0;
  let totalAmount = 0;
  const lines = sortedKeys.map((key) => {
    const w = weekMap[key];
    totalCount += w.count;
    totalAmount += w.total;
    return `${key}〜: ${w.count}件 ¥${w.total.toLocaleString()}`;
  });
  lines.push(`\n合計: ${totalCount}件 ¥${totalAmount.toLocaleString()}`);
  return lines.join("\n");
}

/**
 * 同じ日付・金額・店名のデータが既にあるか確認し、件数を返す
 */
function countDuplicates(data: ReceiptData): number {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = (data.date || "").substring(0, 4) || new Date().getFullYear().toString();
  const sheet = ss.getSheetByName("レシート_" + year);
  if (!sheet || sheet.getLastRow() <= 1) return 0;

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  let count = 0;
  for (const row of rows) {
    const date = String(row[0]);
    const amount = Number(row[1]);
    const store = String(row[2]).replace(/\(\d+\)$/, ""); // (2)等を除いて比較
    if (date === data.date && amount === data.amount && store === data.store) {
      count++;
    }
  }
  return count;
}
