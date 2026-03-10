/**
 * Google Sheets にレシートデータを追記する
 */
function appendToSheet(data: ReceiptData): void {
  const config = getConfig();
  const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
  const sheet = ss.getSheetByName("レシート") || ss.insertSheet("レシート");

  // ヘッダーがなければ追加
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["日付", "金額", "店名", "勘定科目", "備考", "登録日時"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
  }

  const now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm");
  sheet.appendRow([data.date, data.amount, data.store, data.category, data.note, now]);
}
