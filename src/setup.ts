/**
 * 初回セットアップ: スプレッドシートを自動作成し、Script Properties に保存する
 * GAS エディタから手動で1回だけ実行する
 */
function setup(): void {
  const props = PropertiesService.getScriptProperties();
  const existing = props.getProperty("SPREADSHEET_ID");

  if (existing) {
    Logger.log("既にスプレッドシートが設定済みです: " + existing);
    Logger.log("URL: https://docs.google.com/spreadsheets/d/" + existing);
    return;
  }

  // スプレッドシート作成
  const ss = SpreadsheetApp.create("レシート経費記録");
  const sheet = ss.getActiveSheet();
  sheet.setName("レシート");

  // ヘッダー追加
  const headers = ["日付", "金額", "店名", "勘定科目", "備考", "登録日時"];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

  // 列幅調整
  sheet.setColumnWidth(1, 120); // 日付
  sheet.setColumnWidth(2, 100); // 金額
  sheet.setColumnWidth(3, 200); // 店名
  sheet.setColumnWidth(4, 120); // 勘定科目
  sheet.setColumnWidth(5, 250); // 備考
  sheet.setColumnWidth(6, 160); // 登録日時

  // 金額列のフォーマット
  sheet.getRange("B:B").setNumberFormat("#,##0");

  // Script Properties に保存
  props.setProperty("SPREADSHEET_ID", ss.getId());

  Logger.log("スプレッドシートを作成しました！");
  Logger.log("ID: " + ss.getId());
  Logger.log("URL: " + ss.getUrl());
}
