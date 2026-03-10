/**
 * Script Properties を一括設定するヘルパー
 * GAS エディタで1回だけ実行する
 *
 * 使い方:
 *   1. 下の値を自分のキーに書き換える
 *   2. GAS エディタで setProperties を実行
 *   3. 実行後、値をコミットしないよう注意
 */
function setProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    LINE_CHANNEL_ACCESS_TOKEN: "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
    LINE_CHANNEL_SECRET: "YOUR_LINE_CHANNEL_SECRET",
    GEMINI_API_KEY: "YOUR_GEMINI_API_KEY",
    LINE_BOT_ID: "YOUR_LINE_BOT_ID",
  });
  Logger.log("Properties set!");
}
