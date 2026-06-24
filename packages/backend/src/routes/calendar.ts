import { Router } from 'express'
import { db } from '../db'
import { viewings, leads, rooms, rentPayments } from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { buildWaLink, waMessages } from '../lib/messages'

const router = Router()

// GET /api/calendar/:year/:month
router.get('/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    const month = parseInt(req.params.month)
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)

    // VIEW HOUSE events
    const viewHouseRows = await db.query.viewings.findMany({
      where: and(eq(viewings.status, 'viewing_scheduled'), gte(viewings.scheduledDate!, start), lte(viewings.scheduledDate!, end))
    })
    const viewHouseEvents = await Promise.all(viewHouseRows.map(async (v) => {
      const lead = await db.query.leads.findFirst({ where: eq(leads.id, v.leadId) })
      const room = await db.query.rooms.findFirst({ where: eq(rooms.id, v.roomId) })
      const race = lead?.race ?? 'other'
      const msg = waMessages.viewing_reminder[race]?.() ?? waMessages.viewing_reminder.other()
      return {
        date: v.scheduledDate, leadId: v.leadId,
        leadName: lead?.name ?? '', roomAddress: room?.address ?? '',
        waLink: lead ? buildWaLink(lead.phone, msg) : null,
      }
    }))

    // MOVE IN events
    const moveInRows = await db.query.viewings.findMany({
      where: and(gte(viewings.confirmedMoveInDate!, start), lte(viewings.confirmedMoveInDate!, end))
    })
    const moveInEvents = await Promise.all(moveInRows.map(async (v) => {
      const lead = await db.query.leads.findFirst({ where: eq(leads.id, v.leadId) })
      const room = await db.query.rooms.findFirst({ where: eq(rooms.id, v.roomId) })
      const race = lead?.race ?? 'other'
      const msg = waMessages.move_in_reminder[race]?.() ?? waMessages.move_in_reminder.other()
      return {
        date: v.confirmedMoveInDate, leadId: v.leadId,
        leadName: lead?.name ?? '', roomAddress: room?.address ?? '',
        status: v.status,
        waLink: lead ? buildWaLink(lead.phone, msg) : null,
      }
    }))

    // PAY RENT events
    const rentRows = await db.query.rentPayments.findMany({
      where: and(gte(rentPayments.dueDate, start), lte(rentPayments.dueDate, end), eq(rentPayments.status, 'pending'))
    })
    const payRentEvents = await Promise.all(rentRows.map(async (r) => {
      const lead = await db.query.leads.findFirst({ where: eq(leads.id, r.leadId) })
      const room = await db.query.rooms.findFirst({ where: eq(rooms.id, r.roomId) })
      const race = lead?.race ?? 'other'
      const msg = waMessages.pay_rent[race]?.() ?? waMessages.pay_rent.other()
      return {
        date: r.dueDate, leadId: r.leadId,
        leadName: lead?.name ?? '', roomAddress: room?.address ?? '',
        waLink: lead ? buildWaLink(lead.phone, msg) : null,
      }
    }))

    res.json({ viewHouse: viewHouseEvents, moveIn: moveInEvents, payRent: payRentEvents })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
