const TelegramBot = require('node-telegram-bot-api')
const { TELEGRAM_TOKEN, ALLOWED_USER_ID } = require('./config')
const {
  getTypeKeyboard,
  getCurrencyKeyboard,
  getAmountKeyboard,
  getReportPeriodKeyboard,
  getLaunchKeyboard,
  getRemoveKeyboard,
} = require('./handlers/keyboard')
const {
  handleStart,
  handleHelp,
  handleCancel,
  handleHistory,
  handleTotal,
} = require('./handlers/commands')
const {
  handleAmountInput,
  handleType,
  handleCurrency,
  handleReport,
} = require('./handlers/finance')
const { getState, setState, resetState, isEmptyState } = require('./handlers/state')

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true })

const NOTION_TOKEN = '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'
const NOTION_DATABASE_ID = '226b2be08a9a802688a9f0b933f5b8ac?v=226b2be08a9a80f1b94a000caf4c0446'

// Состояния пользователей
const userStates = {}

// История операций (в памяти)
const userHistory = {}
const HISTORY_LIMIT = 10

const CANCEL_BTN = [{ text: '❌ Отмена', callback_data: 'cancel' }]
const BACK_BTN = [{ text: '⬅️ Назад', callback_data: 'back' }]
const REPORT_BTN = [{ text: '📊 Отчёт', callback_data: 'report' }]

const TYPE_CHOICES = [
  [
    { text: '💸 Доход', callback_data: 'type:доход' },
    { text: '💰 Расход', callback_data: 'type:расход' },
  ],
  REPORT_BTN,
  CANCEL_BTN,
]
const CURRENCY_CHOICES = [
  [
    { text: '🇺🇸 Доллар', callback_data: 'currency:доллар' },
    { text: '🇧🇾 Рубль', callback_data: 'currency:рубль' },
    { text: '🇬🇪 Лари', callback_data: 'currency:лари' },
  ],
  BACK_BTN,
  CANCEL_BTN,
]
const REPORT_PERIOD_CHOICES = [
  [
    { text: '7 дней', callback_data: 'report:week' },
    { text: 'Месяц', callback_data: 'report:month' },
  ],
  BACK_BTN,
  CANCEL_BTN,
]
const AMOUNT_MARKUP = {
  reply_markup: {
    inline_keyboard: [BACK_BTN, CANCEL_BTN],
  },
}

const { Client } = require('@notionhq/client')
const notion = new Client({ auth: NOTION_TOKEN })

function isAllowedUser(msg) {
  const userId = msg.from ? msg.from.id : msg.chat ? msg.chat.id : null
  if (String(userId) !== String(ALLOWED_USER_ID)) {
    console.log('Попытка доступа от чужого пользователя:', userId)
    return false
  }
  return true
}

// Команды
bot.onText(/\/start/, msg => {
  if (isAllowedUser(msg)) handleStart(bot, msg)
})
bot.onText(/\/help/, msg => {
  if (isAllowedUser(msg)) handleHelp(bot, msg)
})
bot.onText(/\/cancel/, msg => {
  if (isAllowedUser(msg)) handleCancel(bot, msg)
})
bot.onText(/\/history/, msg => {
  if (isAllowedUser(msg)) handleHistory(bot, msg)
})
bot.onText(/\/total/, msg => {
  if (isAllowedUser(msg)) handleTotal(bot, msg)
})

// Callback-кнопки
bot.on('callback_query', async query => {
  const chatId = query.message.chat.id
  if (!isAllowedUser(query)) {
    bot.answerCallbackQuery(query.id, { text: 'Нет доступа.' })
    return
  }
  const data = query.data
  try {
    if (data === 'cancel') {
      resetState(chatId)
      bot.sendMessage(chatId, 'Ввод отменён. Для начала нажмите кнопку ниже:', {
        reply_markup: getLaunchKeyboard(),
      })
      bot.answerCallbackQuery(query.id)
      return
    }
    if (data === 'back') {
      const state = getState(chatId)
      if (state.currency) {
        resetState(chatId)
        bot.sendMessage(chatId, 'Выберите тип операции:', {
          reply_markup: getTypeKeyboard(),
        })
      } else if (state.type) {
        resetState(chatId)
        bot.sendMessage(chatId, 'Выберите тип операции:', {
          reply_markup: getTypeKeyboard(),
        })
      } else {
        bot.sendMessage(chatId, 'Вы уже на первом шаге.')
      }
      bot.answerCallbackQuery(query.id)
      return
    }
    if (data === 'report') {
      bot.sendMessage(chatId, 'Выберите период для отчёта:', {
        reply_markup: getReportPeriodKeyboard(),
      })
      bot.answerCallbackQuery(query.id)
      return
    }
    if (data.startsWith('report:')) {
      const period = data.split(':')[1]
      await handleReport(bot, chatId, period)
      bot.answerCallbackQuery(query.id)
      return
    }
    if (data.startsWith('type:')) {
      const type = data.split(':')[1]
      handleType(bot, chatId, type)
      bot.answerCallbackQuery(query.id)
      return
    }
    if (data.startsWith('currency:')) {
      const currency = data.split(':')[1]
      handleCurrency(bot, chatId, currency)
      bot.answerCallbackQuery(query.id)
      return
    }
    bot.answerCallbackQuery(query.id)
  } catch (err) {
    console.error('Callback error:', err)
    bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте ещё раз или /cancel.')
  }
})

// Сообщения (ввод суммы, запуск бота)
bot.on('message', msg => {
  const chatId = msg.chat.id
  if (!isAllowedUser(msg)) return
  if (msg.text && msg.text.startsWith('/')) return
  if (isEmptyState(chatId)) {
    if (msg.text === '🚀 Запустить бота') {
      resetState(chatId)
      bot.sendMessage(chatId, '...', { reply_markup: getRemoveKeyboard() })
      bot.sendMessage(chatId, 'Выберите тип операции:', {
        reply_markup: getTypeKeyboard(),
      })
    } else {
      bot.sendMessage(chatId, 'Для начала работы нажмите кнопку ниже:', {
        reply_markup: getLaunchKeyboard(),
      })
    }
    return
  }
  const state = getState(chatId)
  if (state && state.type && state.currency && !state.amount) {
    handleAmountInput(bot, msg)
  } else if (state && (state.type || state.currency)) {
    bot.sendMessage(
      chatId,
      'Пожалуйста, следуйте шагам: выберите тип, валюту, затем введите сумму. Для сброса — /cancel.',
      {
        reply_markup: getAmountKeyboard(),
      }
    )
  }
})
