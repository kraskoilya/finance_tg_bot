const { EMOJI } = require('../config')

const CANCEL_BTN = [{ text: `${EMOJI.cancel} Отмена`, callback_data: 'cancel' }]
const BACK_BTN = [{ text: `${EMOJI.back} Назад`, callback_data: 'back' }]
const REPORT_BTN = [{ text: `${EMOJI.report} Отчёт`, callback_data: 'report' }]

function getTypeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: `${EMOJI.income} Доход`, callback_data: 'type:Доход' },
        { text: `${EMOJI.expense} Расход`, callback_data: 'type:Расход' },
      ],
      REPORT_BTN,
      CANCEL_BTN,
    ],
  }
}

function getCurrencyKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: `${EMOJI.usd} Доллар`, callback_data: 'currency:доллар' },
        { text: `${EMOJI.rub} Рубль`, callback_data: 'currency:рубль' },
        { text: `${EMOJI.gel} Лари`, callback_data: 'currency:лари' },
      ],
      BACK_BTN,
      CANCEL_BTN,
    ],
  }
}

function getAmountKeyboard() {
  return {
    inline_keyboard: [BACK_BTN, CANCEL_BTN],
  }
}

function getReportPeriodKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '7 дней', callback_data: 'report:week' },
        { text: 'Месяц', callback_data: 'report:month' },
      ],
      BACK_BTN,
      CANCEL_BTN,
    ],
  }
}

function getLaunchKeyboard() {
  return {
    keyboard: [['🚀 Запустить бота']],
    resize_keyboard: true,
    one_time_keyboard: true,
  }
}

function getRemoveKeyboard() {
  return { remove_keyboard: true }
}

module.exports = {
  getTypeKeyboard,
  getCurrencyKeyboard,
  getAmountKeyboard,
  getReportPeriodKeyboard,
  getLaunchKeyboard,
  getRemoveKeyboard,
}
