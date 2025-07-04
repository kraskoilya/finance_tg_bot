const { Client } = require('@notionhq/client')
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config')

const notion = new Client({ auth: NOTION_TOKEN })

async function addOperation({ type, currency, amount, comment, user, date }) {
  return notion.pages.create({
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      Тип: { select: { name: type } },
      Валюта: { select: { name: currency } },
      Сумма: { number: amount },
      Дата: { date: { start: date } },
      Комментарий: { title: comment ? [{ text: { content: comment } }] : [] },
      Пользователь: { select: { name: user } },
    },
  })
}

async function getExpensesReport({ startDate, endDate }) {
  // endDateNext — следующий день после endDate
  const endDateObj = new Date(endDate)
  endDateObj.setDate(endDateObj.getDate() + 1)
  const endDateNext = endDateObj.toISOString().split('T')[0]
  const filter = {
    and: [
      { property: 'Тип', select: { equals: 'Расход' } },
      { property: 'Дата', date: { on_or_after: startDate, before: endDateNext } },
    ],
  }
  let results = []
  let cursor = undefined
  do {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter,
      start_cursor: cursor,
    })
    results = results.concat(response.results)
    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)
  // Группировка по валютам
  const sums = {}
  for (const page of results) {
    const props = page.properties
    const currency = props['Валюта']?.select?.name || '—'
    const amount = props['Сумма']?.number || 0
    sums[currency] = (sums[currency] || 0) + amount
  }
  return { sums, count: results.length, startDate, endDate }
}

module.exports = { addOperation, getExpensesReport }
