// Script Properties に設定する値
// LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API のチャネルアクセストークン
// LINE_CHANNEL_SECRET: LINE Messaging API のチャネルシークレット
// GEMINI_API_KEY: Google Gemini API キー
// SPREADSHEET_ID: 保存先の Google Sheets の ID

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    LINE_CHANNEL_ACCESS_TOKEN: props.getProperty("LINE_CHANNEL_ACCESS_TOKEN") || "",
    LINE_CHANNEL_SECRET: props.getProperty("LINE_CHANNEL_SECRET") || "",
    GEMINI_API_KEY: props.getProperty("GEMINI_API_KEY") || "",
    SPREADSHEET_ID: props.getProperty("SPREADSHEET_ID") || "",
  };
}
