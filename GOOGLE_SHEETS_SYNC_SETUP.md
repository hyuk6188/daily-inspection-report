# Google Sheets 공유 저장 설정

공유 데이터 시트:

https://docs.google.com/spreadsheets/d/1Egpz6f5SjwrwIIncoTzWA6Qsh1W5cx7oUF9OYYsiSXw/edit

## 1. Apps Script 만들기

1. 위 Google Sheet를 엽니다.
2. `확장 프로그램` > `Apps Script`를 엽니다.
3. `google-sheets-web-app.gs` 내용을 Apps Script 편집기에 붙여 넣습니다.
4. 저장합니다.

## 2. 웹 앱 배포

1. `배포` > `새 배포`를 선택합니다.
2. 유형은 `웹 앱`을 선택합니다.
3. 실행 권한: `나`
4. 액세스 권한: `모든 사용자`
5. 배포 후 생성되는 웹 앱 URL을 복사합니다.

## 3. 대시보드에 URL 붙여넣기

`index.html`과 `daily_inspection_report_v2.html`에서 아래 값을 바꿉니다.

```js
const GOOGLE_SHEETS_WEB_APP_URL = '';
```

복사한 Apps Script 웹 앱 URL을 넣습니다.

```js
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/.../exec';
```

## 동작 방식

- 페이지를 열 때 공유 데이터를 자동으로 불러옵니다.
- `보고서에 적용`을 누르면 Google Sheets에 자동 저장됩니다.
- `엑셀 붙여넣기` 데이터를 적용할 때도 자동 저장됩니다.
- 보고서 화면에서는 30초마다 공유 데이터를 다시 불러옵니다.
- 이미지가 있으면 Apps Script가 Google Drive 파일로 저장하고 공유 URL로 바꿉니다.