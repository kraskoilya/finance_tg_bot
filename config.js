// Конфигурация и константы
// Все секреты должны быть заданы через переменные окружения!
module.exports = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  NOTION_TOKEN: process.env.NOTION_TOKEN,
  NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
  ALLOWED_USER_ID: process.env.ALLOWED_USER_ID,
  HISTORY_LIMIT: 10,
  EMOJI: {
    income: '\ud83d\udcb8',
    expense: '\ud83d\udcb0',
    report: '\ud83d\udcca',
    cancel: '\u274c',
    back: '\u2b05\ufe0f',
    rub: '\ud83c\udde7\ud83c\uddfe',
    usd: '\ud83c\uddfa\ud83c\uddf8',
    gel: '\ud83c\uddec\ud83c\uddea',
  },
  CURRENCIES: [
    '\u0434\u043e\u043b\u043b\u0430\u0440',
    '\u0440\u0443\u0431\u043b\u044c',
    '\u043b\u0430\u0440\u0438',
  ],
  TYPES: ['\u0414\u043e\u0445\u043e\u0434', '\u0420\u0430\u0441\u0445\u043e\u0434'],
}
