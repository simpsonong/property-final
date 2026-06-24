import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { leads, viewings, rooms } from '../db/schema'
import { eq } from 'drizzle-orm'
import { sendOwnerNewLeadNotification } from '../lib/telegram'

const router = Router()

const formSchema = z.object({
  roomId: z.string(),
  name: z.string().min(1),
  age: z.string().optional(),
  phone: z.string().min(1),
  nationality: z.string().optional(),
  race: z.enum(['chinese', 'malay', 'indian', 'other']),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  jobLocation: z.string().optional(),
  budget: z.string().optional(),
  paxStaying: z.string().optional(),
  moveInDate: z.string().optional(),
  tenancyPeriod: z.string().optional(),
})

// GET /api/form/room/:roomId — return room info for public form
router.get('/room/:roomId', async (req, res) => {
  try {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, req.params.roomId) })
    if (!room) return res.status(404).json({ error: 'Room not found' })
    res.json({ address: room.address, photoUrl: room.photoUrl })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/form/submit — submit tenant application
router.post('/submit', async (req, res) => {
  try {
    const data = formSchema.parse(req.body)
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, data.roomId) })
    if (!room) return res.status(404).json({ error: 'Room not found' })

    const [lead] = await db.insert(leads).values({
      name: data.name, age: data.age, phone: data.phone,
      nationality: data.nationality, race: data.race, gender: data.gender,
      occupation: data.occupation, jobLocation: data.jobLocation,
      budget: data.budget, paxStaying: data.paxStaying,
      moveInDate: data.moveInDate, tenancyPeriod: data.tenancyPeriod,
    }).returning()

    const [viewing] = await db.insert(viewings).values({
      leadId: lead.id, roomId: data.roomId,
      status: 'new_customer', task: 'Wait owner confirm',
    }).returning()

    await sendOwnerNewLeadNotification(lead, room.address, viewing.id)
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: 'Invalid form data' })
  }
})

export default router
