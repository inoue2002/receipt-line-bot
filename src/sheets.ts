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
