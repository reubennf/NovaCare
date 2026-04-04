const IDLE_TIMEOUT = 24 * 60 * 60 * 1000
const KEY_MESSAGES = 'novacare_chat_messages'
const KEY_THREAD = 'novacare_chat_thread'
const KEY_ACTIVITY = 'novacare_chat_activity'

const isExpired = () => {
  const lastActivity = localStorage.getItem(KEY_ACTIVITY)
  if (!lastActivity) return false
  return Date.now() - parseInt(lastActivity) > IDLE_TIMEOUT
}

export const getChatMessages = () => {
  if (isExpired()) {
    clearChatStore()
    return []
  }
  try {
    return JSON.parse(localStorage.getItem(KEY_MESSAGES) || '[]')
  } catch {
    return []
  }
}

export const getChatThreadId = () => {
  if (isExpired()) {
    clearChatStore()
    return null
  }
  return localStorage.getItem(KEY_THREAD) || null
}

export const setChatMessages = (messages) => {
  localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages))
  localStorage.setItem(KEY_ACTIVITY, Date.now().toString())
}

export const setChatThreadId = (threadId) => {
  localStorage.setItem(KEY_THREAD, threadId)
  localStorage.setItem(KEY_ACTIVITY, Date.now().toString())
}

export const clearChatStore = () => {
  localStorage.removeItem(KEY_MESSAGES)
  localStorage.removeItem(KEY_THREAD)
  localStorage.removeItem(KEY_ACTIVITY)
}