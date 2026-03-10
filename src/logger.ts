/**
 * スプレッドシートの「logs」シートにログを書き込む
 */
function logToSheet(level: string, message: string, detail: string = ""): void {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("logs");
    if (!sheet) {
      sheet = ss.insertSheet("logs");
      sheet.appendRow(["日時", "レベル", "メッセージ", "詳細"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
      sheet.setColumnWidth(1, 160);
      sheet.setColumnWidth(2, 60);
      sheet.setColumnWidth(3, 300);
      sheet.setColumnWidth(4, 500);
    }

    const now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
    sheet.appendRow([now, level, message, detail]);

    // 1000行超えたら古いログを削除
    const lastRow = sheet.getLastRow();
    if (lastRow > 1000) {
      sheet.deleteRows(2, lastRow - 500);
    }
  } catch (_e) {
    // ログ書き込み自体の失敗でアプリを止めない
  }
}

function logInfo(message: string, detail: string = ""): void {
  logToSheet("INFO", message, detail);
}

function logError(message: string, detail: string = ""): void {
  logToSheet("ERROR", message, detail);
}
