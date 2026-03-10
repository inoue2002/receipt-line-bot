const PROJECT_FOLDER_NAME = "レシート経費記録";

/**
 * プロジェクトフォルダを取得（なければ作成し、スプレッドシートも移動）
 */
function getProjectFolder(): GoogleAppsScript.Drive.Folder {
  const folders = DriveApp.getFoldersByName(PROJECT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }

  // プロジェクトフォルダ作成
  const folder = DriveApp.createFolder(PROJECT_FOLDER_NAME);

  // スプレッドシートをフォルダに移動
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  return folder;
}

/**
 * レシート画像を Google Drive に年/月フォルダで保存し、URLを返す
 */
function saveImageToDrive(base64: string, mimeType: string, fileName: string, date: string): string {
  const projectFolder = getProjectFolder();

  // 画像/YYYY/MM フォルダを取得or作成
  const imageFolder = getOrCreateSubFolder(projectFolder, "画像");
  const year = (date || "").substring(0, 4) || new Date().getFullYear().toString();
  const month = (date || "").substring(5, 7) || ("0" + (new Date().getMonth() + 1)).slice(-2);
  const yearFolder = getOrCreateSubFolder(imageFolder, year);
  const monthFolder = getOrCreateSubFolder(yearFolder, month);

  const ext = mimeType.includes("png") ? ".png" : ".jpg";
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName + ext);
  const file = monthFolder.createFile(blob);
  return file.getUrl();
}

/**
 * サブフォルダを取得（なければ作成）
 */
function getOrCreateSubFolder(
  parent: GoogleAppsScript.Drive.Folder,
  name: string,
): GoogleAppsScript.Drive.Folder {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}
