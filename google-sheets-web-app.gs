const SPREADSHEET_ID = '1Egpz6f5SjwrwIIncoTzWA6Qsh1W5cx7oUF9OYYsiSXw';
const SHEET_NAME = 'Sheet1';
const IMAGE_FOLDER_NAME = '일일 품질점검 이미지';

function doGet(e) {
  var callback = e && e.parameter && e.parameter.callback;
  var payload = loadState_();
  var output = callback
    ? callback + '(' + JSON.stringify(payload) + ');'
    : JSON.stringify(payload);
  var mimeType = callback
    ? ContentService.MimeType.JAVASCRIPT
    : ContentService.MimeType.JSON;

  return ContentService.createTextOutput(output).setMimeType(mimeType);
}

function doPost(e) {
  try {
    var raw = e && e.parameter && e.parameter.payload;
    if (!raw) throw new Error('Missing payload');

    var payload = JSON.parse(raw);
    var state = payload.state || {};
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
  var sheet = getSheet_();
  var stateText = sheet.getRange('B2').getValue();
  return {
    ok: true,
    state: stateText ? JSON.parse(stateText) : null,
    updatedAt: sheet.getRange('B3').getValue() || '',
    updatedBy: sheet.getRange('B4').getValue() || ''
  };
}

function saveState_(state, updatedBy) {
  var sheet = getSheet_();
  sheet.getRange('A1:B5').setValues([
    ['key', 'value'],
    ['state', JSON.stringify(state)],
    ['updatedAt', new Date().toISOString()],
    ['updatedBy', updatedBy],
    ['note', 'GitHub Pages dashboard shared state storage']
  ]);
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function saveImages_(defects) {
  var folder = getImageFolder_();
  return defects.map(function(defect, index) {
    if (!defect || !defect.img || !String(defect.img).startsWith('data:image/')) {
      return defect;
    }

    var match = String(defect.img).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return defect;

    var extension = match[1].split('/')[1].replace('jpeg', 'jpg');
    var bytes = Utilities.base64Decode(match[2]);
    var name = 'inspection-' + Date.now() + '-' + index + '.' + extension;
    var blob = Utilities.newBlob(bytes, match[1], name);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var copied = {};
    Object.keys(defect).forEach(function(key) {
      copied[key] = defect[key];
    });
    copied.img = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    return copied;
  });
}

function getImageFolder_() {
  var existing = DriveApp.getFoldersByName(IMAGE_FOLDER_NAME);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(IMAGE_FOLDER_NAME);
}
