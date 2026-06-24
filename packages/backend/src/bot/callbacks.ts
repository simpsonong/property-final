import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'

const API = process.env.BACKEND_URL ?? 'http://localhost:3000'
const OWNER_CHAT_ID = () => process.env.TELEGRAM_OWNER_CHAT_ID!

// Tracks viewingIds waiting for owner to type rejection reason
const pendingRejections: Record<number, string> = {}

export function setupCallbacks(bot: TelegramBot) {
  bot.on('callback_query', async (query) => {
    const data = query.data ?? ''
    const chatId = query.message?.chat.id!
    const messageId = query.message?.message_id!
    await bot.answerCallbackQuery(query.id)

    if (data.startsWith('owner_yes:')) {
      const viewingId = data.replace('owner_yes:', '')
      try {
        await axios.post(`${API}/api/telegram/owner-confirm`, { viewingId })
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId })
        await bot.sendMessage(chatId, '✅ Confirmed! Agent has been notified.')
      } catch {
        await bot.sendMessage(chatId, '❌ Error confirming. Please try again.')
      }
    }

    if (data.startsWith('owner_no:')) {
      const viewingId = data.replace('owner_no:', '')
      pendingRejections[chatId] = viewingId
      await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId })
      await bot.sendMessage(chatId, 'Please type the reason for rejection:')
    }
  })

  // Owner types rejection reason
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    if (chatId.toString() !== OWNER_CHAT_ID()) return
    if (!pendingRejections[chatId]) return
    const reason = msg.text?.trim() ?? ''
    if (!reason) return
    const viewingId = pendingRejections[chatId]
    delete pendingRejections[chatId]
    try {
      await axios.post(`${API}/api/telegram/owner-reject`, { viewingId, reason })
      await bot.sendMessage(chatId, '❌ Rejection recorded. Agent has been notified.')
    } catch {
      await bot.sendMessage(chatId, '❌ Error recording rejection. Please try again.')
    }
  })
}
