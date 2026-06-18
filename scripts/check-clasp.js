const fs = require('fs');
const path = require('path');

const claspPath = path.join(__dirname, '..', '.clasp.json');

if (!fs.existsSync(claspPath)) {
  console.error('Файл .clasp.json не найден.');
  console.error('Скопируйте: copy .clasp.json.example .clasp.json');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(claspPath, 'utf8'));
const scriptId = String(config.scriptId || '').trim();
const placeholder = /PASTE_YOUR_SCRIPT_ID|ВАШ_SCRIPT_ID/i;

if (!scriptId || placeholder.test(scriptId)) {
  console.error('В .clasp.json не указан настоящий Script ID.');
  console.error('');
  console.error('1. Откройте script.google.com → ваш проект');
  console.error('2. Проект → Настройки проекта (шестерёнка)');
  console.error('3. Скопируйте «Идентификатор скрипта»');
  console.error('4. Вставьте в .clasp.json в поле "scriptId"');
  process.exit(1);
}

if (!/^[A-Za-z0-9_-]{20,}$/.test(scriptId)) {
  console.error('Script ID выглядит некорректно:', scriptId);
  console.error('Должна быть длинная строка латиницы, цифр, _ и -');
  process.exit(1);
}

console.log('Script ID задан:', scriptId);
