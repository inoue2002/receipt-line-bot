const DRIVE_FOLDER_NAME = "レシート画像";

/**
 * レシート画像を Google Drive に保存し、URLを返す
 */
function saveImageToDrive(base64: string, mimeType: string, fileName: string): string {
  const folder = getOrCreateFolder();
  const ext = mimeType.includes("png") ? ".png" : ".jpg";
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName + ext);
  const file = folder.createFile(blob);
  return file.getUrl();
}

/**
 * Drive フォルダを取得（なければ作成）
 */
function getOrCreateFolder(): GoogleAppsScript.Drive.Folder {
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}
