const { HISTORY_LIMIT } = require('../config')

const userStates = {}
const userHistory = {}

function getState(chatId) {
  return userStates[chatId] || {}
}
function setState(chatId, state) {
  userStates[chatId] = state
}
function resetState(chatId) {
  userStates[chatId] = {}
}
function isEmptyState(chatId) {
  return !userStates[chatId] || Object.keys(userStates[chatId]).length === 0
}
function addHistory(chatId, op) {
  if (!userHistory[chatId]) userHistory[chatId] = []
  userHistory[chatId].push(op)
  if (userHistory[chatId].length > HISTORY_LIMIT) {
    userHistory[chatId] = userHistory[chatId].slice(-HISTORY_LIMIT)
  }
}
function getHistory(chatId) {
  return userHistory[chatId] || []
}
function resetHistory(chatId) {
  userHistory[chatId] = []
}

module.exports = {
  getState,
  setState,
  resetState,
  isEmptyState,
  addHistory,
  getHistory,
  resetHistory,
}
