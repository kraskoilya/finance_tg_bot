const cron = require('node-cron')
const { NOTION_DATABASE_ID, ALLOWED_USER_ID_1, ALLOWED_USER_ID_2, USERS } = require('./config')
const { Client } = require('@notionhq/client')

function initMonthlyReport(bot) {
  // Ежемесячный отчёт: 1-го числа в 00:05 (за прошлый месяц)
  cron.schedule('5 0 1 * *', async () => {
    const users = [ALLOWED_USER_ID_1, ALLOWED_USER_ID_2]
    const userNames = USERS
    const now = new Date()
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const month = now.getMonth() === 0 ? 12 : now.getMonth()
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(
      year,
      month,
      0
    ).getDate()}`

    // Получаем все операции за месяц из Notion
    const notionClient = new Client({ auth: process.env.NOTION_TOKEN })
    const response = await notionClient.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        and: [{ property: 'Дата', date: { on_or_after: startDate, on_or_before: endDate } }],
      },
      page_size: 100,
    })
    // Группируем по пользователям
    const userOps = {}
    for (const page of response.results) {
      const props = page.properties
      const user = props['Пользователь']?.select?.name
      const currency = props['Валюта']?.select?.name
      const amount = props['Сумма']?.number || 0
      const comment = props['Комментарий']?.title?.[0]?.plain_text || ''
      const date = props['Дата']?.date?.start
      if (!user) continue
      if (!userOps[user]) userOps[user] = []
      userOps[user].push({ amount, currency, comment, date })
    }
    // Формируем отчёт
    const currencyEmojis = { лари: '🇬🇪', доллар: '🇺🇸', рубль: '🇧🇾' }
    let report = '📊 *Расходы за месяц:*\n'
    for (const user of Object.values(userNames)) {
      const ops = userOps[user] || []
      const sums = { лари: 0, доллар: 0, рубль: 0 }
      let maxOp = null
      for (const op of ops) {
        if (sums[op.currency] !== undefined) sums[op.currency] += op.amount
        if (!maxOp || op.amount > maxOp.amount) maxOp = op
      }
      report += `\n*${user}:*\n`
      for (const cur of ['лари', 'доллар', 'рубль']) {
        report += `${currencyEmojis[cur] || ''} ${cur.charAt(0).toUpperCase() + cur.slice(1)} — *${
          sums[cur]
        }*\n`
      }
      if (maxOp) {
        report += `🔝 Максимальный расход: *${maxOp.amount}* — _${
          maxOp.comment || 'без комментария'
        }_\n`
      } else {
        report += 'Нет расходов за месяц\n'
      }
    }
    // Отправляем отчёт каждому пользователю
    for (const userId of users) {
      await bot.sendMessage(userId, report, { parse_mode: 'Markdown' })
    }
  })
}

module.exports = { initMonthlyReport }
