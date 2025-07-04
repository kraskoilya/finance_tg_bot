const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Bot is running!')
})

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`)
})

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
const { getState, resetState, isEmptyState } = require('./handlers/state')

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true })

// Проверка доступа пользователя
function isAllowedUser(msg) {
  const userId = msg.from ? msg.from.id : msg.chat ? msg.chat.id : null
  if (String(userId) !== String(ALLOWED_USER_ID)) {
    console.log('Попытка доступа от чужого пользователя:', userId)
    return false
  }
  return true
}

// Обработка команд
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

// Обработка inline-кнопок
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
      resetState(chatId)
      bot.sendMessage(chatId, 'Выберите тип операции:', {
        reply_markup: getTypeKeyboard(),
      })
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

// Обработка обычных сообщений (ввод суммы, запуск бота)
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
