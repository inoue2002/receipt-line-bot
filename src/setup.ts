/**
 * 初回セットアップ: スプレッドシートのヘッダーとフォーマットを設定する
 * GAS エディタから手動で1回だけ実行する
 */
function setup(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("レシート");

  if (sheet) {
    Logger.log("「レシート」シートは既に存在します。スキップします。");
    return;
  }

  // デフォルトシートをリネーム or 新規作成
  sheet = ss.getSheets()[0];
  sheet.setName("レシート");

  // ヘッダー追加
  const headers = ["日付", "金額", "店名", "勘定科目", "備考", "登録日時", "画像"];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

  // 列幅調整
  sheet.setColumnWidth(1, 120); // 日付
  sheet.setColumnWidth(2, 100); // 金額
  sheet.setColumnWidth(3, 200); // 店名
  sheet.setColumnWidth(4, 120); // 勘定科目
  sheet.setColumnWidth(5, 250); // 備考
  sheet.setColumnWidth(6, 160); // 登録日時
  sheet.setColumnWidth(7, 200); // 画像

  // 金額列のフォーマット
  sheet.getRange("B:B").setNumberFormat("#,##0");

  // logs シート作成
  if (!ss.getSheetByName("logs")) {
    const logSheet = ss.insertSheet("logs");
    logSheet.appendRow(["日時", "レベル", "メッセージ", "詳細"]);
    logSheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    logSheet.setColumnWidth(1, 160);
    logSheet.setColumnWidth(2, 60);
    logSheet.setColumnWidth(3, 300);
    logSheet.setColumnWidth(4, 500);
  }

  Logger.log("セットアップ完了！");
  Logger.log("スプレッドシート: " + ss.getUrl());
}
