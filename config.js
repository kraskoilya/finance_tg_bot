// Конфигурация и константы
module.exports = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '7666710506:AAGJMFrGJxHIBcW0-87PdCkuDRNTUpY06dA',
  NOTION_TOKEN: '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',
  NOTION_DATABASE_ID: '226b2be08a9a802688a9f0b933f5b8ac',
  ALLOWED_USER_ID: 346531302,
  HISTORY_LIMIT: 10,
  EMOJI: {
    income: '💸',
    expense: '💰',
    report: '📊',
    cancel: '❌',
    back: '⬅️',
    rub: '🇧🇾',
    usd: '🇺🇸',
    gel: '🇬🇪',
  },
  CURRENCIES: ['доллар', 'рубль', 'лари'],
  TYPES: ['Доход', 'Расход'],
}
