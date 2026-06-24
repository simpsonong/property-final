import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import TelegramBot from 'node-telegram-bot-api'
import { setupCommands } from './bot/commands'
import { setupCallbacks } from './bot/callbacks'
import { setupCron } from './bot/cron'
import formRouter from './routes/form'
import roomsRouter from './routes/rooms'
import leadsRouter from './routes/leads'
import calendarRouter from './routes/calendar'
import telegramRouter from './routes/telegram'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/form', formRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/leads', leadsRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/telegram', telegramRouter)

app.get('/health', (_, res) => res.json({ ok: true }))

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))

// Start Telegram bot (polling — this is the ONLY process that polls)
if (process.env.TELEGRAM_BOT_TOKEN) {
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
  setupCommands(bot)
  setupCallbacks(bot)
  setupCron(bot)
  console.log('Telegram bot started (polling)')
} else {
  console.warn('TELEGRAM_BOT_TOKEN not set — bot disabled')
}

// Keep-alive self-ping for Render free tier (prevents sleep)
if (process.env.BACKEND_URL) {
  setInterval(() => {
    fetch(`${process.env.BACKEND_URL}/health`).catch(() => {})
  }, 14 * 60 * 1000)
}
