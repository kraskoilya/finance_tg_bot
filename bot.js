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
const { TELEGRAM_TOKEN, ALLOWED_USER_ID_1, ALLOWED_USER_ID_2, USERS } = require('./config')
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
const { getState, resetState, isEmptyState, setState } = require('./handlers/state')
const { initMonthlyReport } = require('./monthlyReport')

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true })

function isAllowedUser(msg) {
  const userId = String(msg.from ? msg.from.id : msg.chat ? msg.chat.id : null)
  return userId === String(ALLOWED_USER_ID_1) || userId === String(ALLOWED_USER_ID_2)
}

bot.onText(/\/start/, msg => {
  if (isAllowedUser(msg)) handleStart(bot, msg, USERS[String(msg.from.id)])
})
bot.onText(/\/help/, msg => {
  if (isAllowedUser(msg)) handleHelp(bot, msg, USERS[String(msg.from.id)])
})
bot.onText(/\/cancel/, msg => {
  if (isAllowedUser(msg)) handleCancel(bot, msg, USERS[String(msg.from.id)])
})
bot.onText(/\/history/, msg => {
  if (isAllowedUser(msg)) handleHistory(bot, msg, USERS[String(msg.from.id)])
})
bot.onText(/\/total/, msg => {
  if (isAllowedUser(msg)) handleTotal(bot, msg, USERS[String(msg.from.id)])
})

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

bot.on('message', msg => {
  const chatId = msg.chat.id
  if (!isAllowedUser(msg)) return
  if (msg.text && msg.text.startsWith('/')) return
  const user = USERS[String(msg.from.id)]
  if (isEmptyState(chatId)) {
    if (msg.text === '🚀 Запустить бота') {
      resetState(chatId)
      setState(chatId, { user })
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
    state.user = user
    setState(chatId, state)
    handleAmountInput(bot, msg, user)
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

initMonthlyReport(bot)
