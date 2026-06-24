import TelegramBot from 'node-telegram-bot-api'
import axios from 'axios'

const API = process.env.BACKEND_URL ?? 'http://localhost:3000'
const AGENT_CHAT_ID = () => process.env.TELEGRAM_AGENT_CHAT_ID!

export function setupCommands(bot: TelegramBot) {
  // /id command — returns chat ID (useful for setup)
  bot.onText(/^\/id$/, async (msg) => {
    await bot.sendMessage(msg.chat.id, `Your Chat ID: ${msg.chat.id}\nUsername: @${msg.chat.username ?? 'unknown'}`)
  })

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    if (chatId.toString() !== AGENT_CHAT_ID()) return
    const text = msg.text?.trim() ?? ''
    if (!text || text.startsWith('/')) return

    try {
      // 1. view house scheduled: "Name view house Address DD/MM/YY"
      const viewHouseMatch = text.match(/^(.+?)\s+view house\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})$/i)
      if (viewHouseMatch) {
        const [, name, address, dateStr] = viewHouseMatch
        await axios.post(`${API}/api/telegram/command`, { type: 'view_house_scheduled', name: name.trim(), address: address.trim(), dateStr })
        await bot.sendMessage(chatId, `✅ View house scheduled\n*${name.trim()}* at ${address.trim()} on ${dateStr}`, { parse_mode: 'Markdown' })
        return
      }

      // 2. view house done: "Name view house done Address"
      const viewHouseDoneMatch = text.match(/^(.+?)\s+view house done\s+(.+)$/i)
      if (viewHouseDoneMatch) {
        const [, name, address] = viewHouseDoneMatch
        await axios.post(`${API}/api/telegram/command`, { type: 'view_house_done', name: name.trim(), address: address.trim() })
        await bot.sendMessage(chatId, `✅ Viewing done\n*${name.trim()}* at ${address.trim()}`, { parse_mode: 'Markdown' })
        return
      }

      // 3. booked/paid with date: "Name booked/paid Address DD/MM/YY"
      const bookedWithDateMatch = text.match(/^(.+?)\s+(booked|paid)\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})$/i)
      if (bookedWithDateMatch) {
        const [, name, status, address, dateStr] = bookedWithDateMatch
        await axios.post(`${API}/api/telegram/command`, { type: status.toLowerCase(), name: name.trim(), address: address.trim(), dateStr })
        await bot.sendMessage(chatId, `✅ ${status} (move in ${dateStr})\n*${name.trim()}* at ${address.trim()}`, { parse_mode: 'Markdown' })
        return
      }

      // 4. booked/paid no date: "Name booked/paid Address"
      const bookedNoDateMatch = text.match(/^(.+?)\s+(booked|paid)\s+(.+)$/i)
      if (bookedNoDateMatch) {
        const [, name, status, address] = bookedNoDateMatch
        await axios.post(`${API}/api/telegram/command`, { type: status.toLowerCase(), name: name.trim(), address: address.trim() })
        await bot.sendMessage(chatId, `✅ ${status}\n*${name.trim()}* at ${address.trim()}`, { parse_mode: 'Markdown' })
        return
      }

      // 5. pay rent: "Name pay rent-DD-Xmonths/Xyear"
      // e.g. "Linn Mei Yong pay rent-21-1year" or "Linn Mei Yong pay rent-21-6months"
      const payRentMatch = text.match(/^(.+?)\s+pay rent-(\d+)-(\d+)(year|years|month|months)$/i)
      if (payRentMatch) {
        const [, name, rentDayStr, durationNum, durationUnit] = payRentMatch
        const rentDay = parseInt(rentDayStr)
        const isYear = durationUnit.toLowerCase().startsWith('year')
        const durationMonths = isYear ? parseInt(durationNum) * 12 : parseInt(durationNum)
        await axios.post(`${API}/api/telegram/command`, { type: 'pay_rent', name: name.trim(), rentDay, durationMonths })
        await bot.sendMessage(chatId, `✅ Pay rent set\n*${name.trim()}* — day ${rentDay} every month for ${durationNum}${durationUnit}`, { parse_mode: 'Markdown' })
        return
      }

      // Unknown command
      await bot.sendMessage(chatId, `❓ Command not recognized. Examples:\n\`Name view house Address 21/7/26\`\n\`Name view house done Address\`\n\`Name booked Address 31/7/26\`\n\`Name paid Address\`\n\`Name pay rent-21-1year\``, { parse_mode: 'Markdown' })
    } catch (err: any) {
      console.error(err)
      await bot.sendMessage(chatId, `❌ Error: ${err?.response?.data?.error ?? err.message}`)
    }
  })
}
