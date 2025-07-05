const { addOperation: addToNotion, getExpensesReport } = require('../notion')
const {
  getTypeKeyboard,
  getCurrencyKeyboard,
  getAmountKeyboard,
  getReportPeriodKeyboard,
} = require('./keyboard')
const { getState, setState, resetState, addHistory } = require('./state')

async function handleAmountInput(bot, msg, user) {
  const chatId = msg.chat.id
  const state = getState(chatId)
  const match = msg.text.match(/^\s*([\d.,]+)\s*(.*)$/)
  let amount = null,
    comment = ''
  if (match) {
    amount = parseFloat(match[1].replace(',', '.'))
    comment = match[2] ? match[2].trim() : ''
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    bot.sendMessage(chatId, 'Пожалуйста, введите корректную сумму (например: 12.5 такси).', {
      reply_markup: getAmountKeyboard(),
    })
    return
  }
  state.amount = amount
  state.comment = comment
  state.user = user
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  addHistory(chatId, {
    type: state.type,
    currency: state.currency,
    amount: state.amount,
    comment: state.comment,
    user: state.user,
    date: dateStr,
  })
  try {
    await addToNotion({
      type: state.type,
      currency: state.currency,
      amount: state.amount,
      comment: state.comment,
      user: state.user,
      date: dateStr,
    })
    bot
      .sendMessage(
        chatId,
        `✅ *Записано в Notion!*

        *Тип:* ${state.type}
        *Валюта:* ${
          state.currency === 'лари'
            ? '🇬🇪'
            : state.currency === 'доллар'
            ? '🇺🇸'
            : state.currency === 'рубль'
            ? '🇷🇺'
            : ''
        } ${state.currency}
        *Сумма:* *${state.amount}*
        *Комментарий:* _${state.comment || '—'}_
        📅 *Дата:* ${dateStr}`,
        { parse_mode: 'Markdown' }
      )
      .then(() => {
        resetState(chatId)
        bot.sendMessage(chatId, 'Хотите добавить ещё одну операцию?', {
          reply_markup: getTypeKeyboard(),
        })
      })
  } catch (err) {
    let userMsg = 'Ошибка при записи в Notion.'
    if (err && err.body && err.body.code === 'validation_error') {
      if (err.body.message && err.body.message.includes('select option')) {
        userMsg =
          'Ошибка: в базе Notion не заведено нужное значение для поля select (например, валюта или тип). Добавьте это значение вручную в Notion.'
      } else {
        userMsg = 'Ошибка валидации данных для Notion. Проверьте структуру базы и значения.'
      }
    } else if (err && err.body && err.body.code === 'object_not_found') {
      userMsg =
        'Ошибка: база Notion не найдена или нет доступа. Проверьте права доступа интеграции.'
    } else if (err && err.body && err.body.message) {
      userMsg += '\n' + err.body.message
    }
    console.error('Notion error:', err.body || err)
    bot.sendMessage(chatId, userMsg)
  }
}

function handleType(bot, chatId, type) {
  setState(chatId, { type })
  bot.sendMessage(chatId, 'Выберите валюту:', {
    reply_markup: getCurrencyKeyboard(),
  })
}

function handleCurrency(bot, chatId, currency) {
  const state = getState(chatId)
  state.currency = currency
  setState(chatId, state)
  bot.sendMessage(chatId, 'Введите сумму (только число):', {
    reply_markup: getAmountKeyboard(),
  })
}

async function handleReport(bot, chatId, period) {
  let startDate, endDate
  const now = new Date()
  if (period === 'week') {
    endDate = now.toISOString().split('T')[0]
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 6)
    startDate = weekAgo.toISOString().split('T')[0]
  } else if (period === 'month') {
    endDate = now.toISOString().split('T')[0]
    startDate = now.toISOString().slice(0, 8) + '01'
  }
  try {
    const { sums, startDate: s, endDate: e } = await getExpensesReport({ startDate, endDate })
    const currencyEmojis = { лари: '🇬🇪', доллар: '🇺🇸', рубль: '🇧🇾' }
    let text = `📊 *Расходы за период* _${s} — ${e}_:`
    if (Object.keys(sums).length === 0) {
      text += '\n\n❗️ Нет расходов за выбранный период.'
    } else {
      for (const [cur, sum] of Object.entries(sums)) {
        text += `\n${currencyEmojis[cur] || ''} *${
          cur.charAt(0).toUpperCase() + cur.slice(1)
        }*: *${sum}*`
      }
    }
    bot.sendMessage(chatId, text, { parse_mode: 'Markdown' })
  } catch (err) {
    console.error('Notion report error:', err.body || err)
    bot.sendMessage(chatId, 'Ошибка при получении отчёта из Notion.')
  }
}

module.exports = {
  handleAmountInput,
  handleType,
  handleCurrency,
  handleReport,
}
