import TelegramBot from 'node-telegram-bot-api'
import { waMessages, buildWaLink } from './messages'

// polling: false — this instance only SENDS. The bot in src/bot/ polls.
let _bot: TelegramBot | null = null
function getBot() {
  if (!_bot) _bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false })
  return _bot
}

const OWNER = () => process.env.TELEGRAM_OWNER_CHAT_ID!
const AGENT = () => process.env.TELEGRAM_AGENT_CHAT_ID!

export async function sendOwnerNewLeadNotification(lead: any, address: string, viewingId: string) {
  const text = [
    `🏠 *New Tenant Enquiry*`,
    ``,
    `*Room:* ${address}`,
    ``,
    `*Name:* ${lead.name}`,
    `*Age:* ${lead.age ?? '-'}`,
    `*Phone:* ${lead.phone}`,
    `*Nationality:* ${lead.nationality ?? '-'}`,
    `*Race:* ${lead.race}`,
    `*Gender:* ${lead.gender ?? '-'}`,
    `*Occupation:* ${lead.occupation ?? '-'}`,
    `*Job Location:* ${lead.jobLocation ?? '-'}`,
    `*Budget:* ${lead.budget ?? '-'}`,
    `*Pax Staying:* ${lead.paxStaying ?? '-'}`,
    `*Move In Date:* ${lead.moveInDate ?? '-'}`,
    `*Tenancy Period:* ${lead.tenancyPeriod ?? '-'}`,
  ].join('\n')

  await getBot().sendMessage(OWNER(), text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Yes — Confirm', callback_data: `owner_yes:${viewingId}` },
        { text: '❌ No — Reject', callback_data: `owner_no:${viewingId}` },
      ]]
    }
  })
}

export async function sendAgentOwnerConfirmed(lead: any, address: string) {
  const race = lead.race as keyof typeof waMessages.invite_viewing
  const message = waMessages.invite_viewing[race]?.(address) ?? waMessages.invite_viewing.other(address)
  const waLink = buildWaLink(lead.phone, message)
  const text = [
    `✅ *Owner Confirmed*`,
    ``,
    `*Tenant:* ${lead.name}`,
    `*Room:* ${address}`,
    ``,
    `Tap to invite for viewing:`,
    `[WhatsApp ${lead.name}](${waLink})`,
  ].join('\n')
  await getBot().sendMessage(AGENT(), text, { parse_mode: 'Markdown' })
}

export async function sendAgentOwnerRejected(lead: any, address: string, reason: string) {
  const text = [
    `❌ *Owner Rejected*`,
    ``,
    `*Tenant:* ${lead.name}`,
    `*Room:* ${address}`,
    `*Reason:* ${reason}`,
  ].join('\n')
  await getBot().sendMessage(AGENT(), text, { parse_mode: 'Markdown' })
}

export async function sendAgentRoomTaken(otherLeads: any[], address: string) {
  for (const lead of otherLeads) {
    const race = lead.race as keyof typeof waMessages.room_no_longer_available
    const message = waMessages.room_no_longer_available[race]?.(address) ?? waMessages.room_no_longer_available.other(address)
    const waLink = buildWaLink(lead.phone, message)
    const text = [
      `⚠️ *Room Taken — Notify Other Lead*`,
      ``,
      `*Tenant:* ${lead.name}`,
      `*Room:* ${address}`,
      ``,
      `[WhatsApp ${lead.name}](${waLink})`,
    ].join('\n')
    await getBot().sendMessage(AGENT(), text, { parse_mode: 'Markdown' })
  }
}

export async function sendAgentRentReminder(lead: any, address: string) {
  const race = lead.race as keyof typeof waMessages.pay_rent
  const message = waMessages.pay_rent[race]?.() ?? waMessages.pay_rent.other()
  const waLink = buildWaLink(lead.phone, message)
  const text = [
    `💰 *Rent Due Today*`,
    ``,
    `*Tenant:* ${lead.name}`,
    `*Room:* ${address}`,
    ``,
    `[WhatsApp ${lead.name}](${waLink})`,
  ].join('\n')
  await getBot().sendMessage(AGENT(), text, { parse_mode: 'Markdown' })
}
