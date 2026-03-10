/**
 * Google Sheets にレシートデータを追記する
 */
function appendToSheet(data: ReceiptData): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("レシート") || ss.insertSheet("レシート");

  // ヘッダーがなければ追加
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["日付", "金額", "店名", "勘定科目", "備考", "登録日時"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
  }

  const now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm");
  sheet.appendRow([data.date, data.amount, data.store, data.category, data.note, now]);
}

/**
 * 同じ日付・金額・店名のデータが既にあるか確認し、件数を返す
 */
function countDuplicates(data: ReceiptData): number {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("レシート");
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
