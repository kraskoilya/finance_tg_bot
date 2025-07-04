const { getTypeKeyboard, getLaunchKeyboard } = require('./keyboard')
const { resetState, getHistory } = require('./state')

function handleStart(bot, msg) {
  resetState(msg.chat.id)
  bot.sendMessage(msg.chat.id, 'Выберите тип операции:', {
    reply_markup: getTypeKeyboard(),
  })
}

function handleHelp(bot, msg) {
  bot.sendMessage(
    msg.chat.id,
    `Этот бот помогает вести учёт финансов.\n\n` +
      `1. Нажмите кнопку "Доход" или "Расход".\n` +
      `2. Выберите валюту.\n` +
      `3. Введите сумму (только число).\n` +
      `4. Для сброса в любой момент используйте /cancel.\n` +
      `5. Для истории операций используйте /history.\n` +
      `6. Для отчёта используйте /total.\n`
  )
}

function handleCancel(bot, msg) {
  resetState(msg.chat.id)
  bot.sendMessage(msg.chat.id, 'Ввод отменён. Для начала нажмите кнопку ниже:', {
    reply_markup: getLaunchKeyboard(),
  })
}

function handleHistory(bot, msg) {
  const history = getHistory(msg.chat.id)
  if (history.length === 0) {
    bot.sendMessage(msg.chat.id, 'История пуста.')
    return
  }
  let text = 'Последние операции:'
  history
    .slice()
    .reverse()
    .forEach((op, i) => {
      text += `\n${i + 1}. ${op.date} — ${op.type}, ${op.amount} ${op.currency}`
      if (op.comment) text += ` (${op.comment})`
    })
  bot.sendMessage(msg.chat.id, text)
}

function handleTotal(bot, msg) {
  const history = getHistory(msg.chat.id)
  const today = new Date().toISOString().split('T')[0]
  let income = 0,
    expense = 0
  history.forEach(op => {
    if (op.date === today) {
      if (op.type === 'Доход') income += op.amount
      if (op.type === 'Расход') expense += op.amount
    }
  })
  bot.sendMessage(msg.chat.id, `Сегодня:\nДоход: ${income}\nРасход: ${expense}`)
}

module.exports = {
  handleStart,
  handleHelp,
  handleCancel,
  handleHistory,
  handleTotal,
}
