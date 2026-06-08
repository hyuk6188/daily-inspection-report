const SPREADSHEET_ID = '1FN6rsz2Rm-UKKmPBRUfdQNW86IY0a_BCOKNiRC-yT08';
const SHEET_NAME = 'Sheet1';
const IMAGE_FOLDER_NAME = '일일 품질점검 이미지';

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;
  const payload = loadState_();
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(payload)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const raw = e && e.parameter && e.parameter.payload;
    if (!raw) throw new Error('Missing payload');
    const payload = JSON.parse(raw);
    const state = payload.state || {};
    state.defects = saveImages_(state.defects || []);
    saveState_(state, payload.updatedBy || 'anonymous');
    return ContentService
      .createTextOutput(JSON.stringify({ok: true, updatedAt: new Date().toISOString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function loadState_() {
  const sheet = getSheet_();
  const stateText = sheet.getRange('B2').getValue();
  return {
    ok: true,
    state: stateText ? JSON.parse(stateText) : null,
    updatedAt: sheet.getRange('B3').getValue() || '',
    updatedBy: sheet.getRange('B4').getValue() || ''
  };
}

function saveState_(state, updatedBy) {
  const sheet = getSheet_();
  sheet.getRange('A1:B5').setValues([
    ['key', 'value'],
    ['state', JSON.stringify(state)],
    ['updatedAt', new Date().toISOString()],
    ['updatedBy', updatedBy],
    ['note', 'GitHub Pages dashboard shared state storage']
  ]);
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function saveImages_(defects) {
  const folder = getImageFolder_();
  return defects.map((defect, index) => {
    if (!defect || !defect.img || !String(defect.img).startsWith('data:image/')) {
      return defect;
    }
    const match = String(defect.img).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return defect;
    const extension = match[1].split('/')[1].replace('jpeg', 'jpg');
    const bytes = Utilities.base64Decode(match[2]);
    const name = `inspection-${Date.now()}-${index}.${extension}`;
    const blob = Utilities.newBlob(bytes, match[1], name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return {
      ...defect,
      img: `https://drive.google.com/uc?export=view&id=${file.getId()}`
    };
  });
}

function getImageFolder_() {
  const existing = DriveApp.getFoldersByName(IMAGE_FOLDER_NAME);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(IMAGE_FOLDER_NAME);
}
