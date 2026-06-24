import TelegramBot from 'node-telegram-bot-api'
import cron from 'node-cron'
import { db } from '../db'
import { rentPayments, leads, rooms } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { sendAgentRentReminder } from '../lib/telegram'

export function setupCron(_bot: TelegramBot) {
  // Run daily at 8:00 AM — check if any rent is due today
  cron.schedule('0 8 * * *', async () => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

      const dueTodayPayments = await db.query.rentPayments.findMany({
        where: and(
          eq(rentPayments.status, 'pending')
        )
      })

      // Filter to those actually due today
      const todayPayments = dueTodayPayments.filter(r => {
        const due = new Date(r.dueDate)
        return due >= startOfDay && due <= endOfDay
      })

      for (const payment of todayPayments) {
        const lead = await db.query.leads.findFirst({ where: eq(leads.id, payment.leadId) })
        const room = await db.query.rooms.findFirst({ where: eq(rooms.id, payment.roomId) })
        if (lead && room) {
          await sendAgentRentReminder(lead, room.address)
        }
      }
    } catch (err) {
      console.error('[CRON] Rent reminder error:', err)
    }
  }, { timezone: 'Asia/Kuala_Lumpur' })

  console.log('[CRON] Rent reminder scheduled — daily 8:00 AM KL time')
}
