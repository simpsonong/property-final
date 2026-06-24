import { Router } from 'express'
import { db } from '../db'
import { viewings, leads, rooms } from '../db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { sendAgentOwnerConfirmed, sendAgentOwnerRejected, sendAgentRoomTaken } from '../lib/telegram'
import { addMonths, setDate } from 'date-fns'
import { rentPayments } from '../db/schema'

const router = Router()

// POST /api/telegram/owner-confirm — called by bot when owner taps Yes
router.post('/owner-confirm', async (req, res) => {
  try {
    const { viewingId } = req.body
    const viewing = await db.query.viewings.findFirst({ where: eq(viewings.id, viewingId) })
    if (!viewing) return res.status(404).json({ error: 'Viewing not found' })
    const lead = await db.query.leads.findFirst({ where: eq(leads.id, viewing.leadId) })
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, viewing.roomId) })
    if (!lead || !room) return res.status(404).json({ error: 'Lead or room not found' })

    await db.update(viewings).set({ status: 'owner_confirmed', task: 'Invite view house', updatedAt: new Date() }).where(eq(viewings.id, viewingId))
    await sendAgentOwnerConfirmed(lead, room.address)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/telegram/owner-reject — called by bot when owner types rejection reason
router.post('/owner-reject', async (req, res) => {
  try {
    const { viewingId, reason } = req.body
    const viewing = await db.query.viewings.findFirst({ where: eq(viewings.id, viewingId) })
    if (!viewing) return res.status(404).json({ error: 'Viewing not found' })
    const lead = await db.query.leads.findFirst({ where: eq(leads.id, viewing.leadId) })
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, viewing.roomId) })
    if (!lead || !room) return res.status(404).json({ error: 'Lead or room not found' })

    await db.update(viewings).set({ status: 'owner_rejected', ownerRejectionReason: reason, task: null, updatedAt: new Date() }).where(eq(viewings.id, viewingId))
    await sendAgentOwnerRejected(lead, room.address, reason)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/telegram/command — agent commands from bot
router.post('/command', async (req, res) => {
  try {
    const { type, name, address, dateStr } = req.body

    // Find lead by name (case-insensitive)
    const allLeads = await db.query.leads.findMany()
    const lead = allLeads.find(l => l.name.toLowerCase() === name.toLowerCase())
    if (!lead) return res.status(404).json({ error: `Lead not found: ${name}` })

    // Find room by address (partial match)
    const allRooms = await db.query.rooms.findMany()
    const room = allRooms.find(r => r.address.toLowerCase().includes(address.toLowerCase()))
    if (!room) return res.status(404).json({ error: `Room not found: ${address}` })

    // Find the viewing for this lead+room
    const viewing = await db.query.viewings.findFirst({
      where: and(eq(viewings.leadId, lead.id), eq(viewings.roomId, room.id))
    })
    if (!viewing) return res.status(404).json({ error: 'No viewing record found for this lead+room' })

    if (type === 'view_house_scheduled') {
      const parts = (dateStr as string).split('/')
      const day = parseInt(parts[0]), mon = parseInt(parts[1]), yr = parseInt(parts[2])
      const d = new Date(yr < 100 ? 2000 + yr : yr, mon - 1, day)
      const task = `View house ${dateStr}`
      await db.update(viewings).set({ status: 'viewing_scheduled', scheduledDate: d, task, updatedAt: new Date() }).where(eq(viewings.id, viewing.id))
    }

    else if (type === 'view_house_done') {
      await db.update(viewings).set({ status: 'viewing_done', task: 'Book?', updatedAt: new Date() }).where(eq(viewings.id, viewing.id))
    }

    else if (type === 'booked' || type === 'paid') {
      let update: any = { status: type, updatedAt: new Date() }
      if (dateStr) {
        const parts = (dateStr as string).split('/')
        const d = new Date(parseInt(parts[2]) < 100 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        update.confirmedMoveInDate = d
        update.task = `Move in ${dateStr}`
      } else {
        update.task = null
      }
      await db.update(viewings).set(update).where(eq(viewings.id, viewing.id))

      // Mark room as booked
      await db.update(rooms).set({ status: 'booked', updatedAt: new Date() }).where(eq(rooms.id, room.id))

      // Notify agent about other leads on same room
      const otherViewings = await db.query.viewings.findMany({
        where: and(eq(viewings.roomId, room.id), ne(viewings.leadId, lead.id))
      })
      if (otherViewings.length > 0) {
        const otherLeads = await Promise.all(otherViewings.map(v => db.query.leads.findFirst({ where: eq(leads.id, v.leadId) })))
        await sendAgentRoomTaken(otherLeads.filter(Boolean), room.address)
      }
    }

    else if (type === 'pay_rent') {
      const { rentDay, durationMonths } = req.body
      const rentStart = new Date()
      await db.update(viewings).set({
        status: 'moved_in', task: 'Pay Rent',
        payRentDay: rentDay, payRentDurationMonths: durationMonths,
        rentStartDate: rentStart, updatedAt: new Date()
      }).where(eq(viewings.id, viewing.id))

      // Generate monthly rent payment records
      const records = []
      for (let i = 0; i < durationMonths; i++) {
        const base = addMonths(rentStart, i)
        const dueDate = setDate(base, rentDay)
        const month = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`
        records.push({ viewingId: viewing.id, leadId: lead.id, roomId: room.id, month, dueDate })
      }
      await db.insert(rentPayments).values(records)
    }

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
