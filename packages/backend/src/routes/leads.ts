import { Router } from 'express'
  import { db } from '../db'
  import { leads, viewings, rooms } from '../db/schema'
  import { eq } from 'drizzle-orm'
  import { buildWaLink, getWaMessage } from '../lib/messages'

  const router = Router()

  async function enrichViewings(leadViewings: any[], lead: any) {
    return Promise.all(leadViewings.map(async (v) => {
      const room = await db.query.rooms.findFirst({ where: eq(rooms.id, v.roomId) })
      const message = getWaMessage(v.status, lead.race, room?.address ?? '', !!v.confirmedMoveInDate)
      const waLink = message ? buildWaLink(lead.phone, message) : null
      return { ...v, roomAddress: room?.address ?? '', waLink, taskChecked: v.taskChecked ?? false }
    }))
  }

  // GET /api/leads
  router.get('/', async (req, res) => {
    try {
      const allLeads = await db.query.leads.findMany({ orderBy: (l, { desc }) => [desc(l.createdAt)] })
      const result = await Promise.all(allLeads.map(async (lead) => {
        const leadViewings = await db.query.viewings.findMany({ where: eq(viewings.leadId, lead.id) })
        return { ...lead, viewings: await enrichViewings(leadViewings, lead) }
      }))
      res.json(result)
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // GET /api/leads/:id
  router.get('/:id', async (req, res) => {
    try {
      const lead = await db.query.leads.findFirst({ where: eq(leads.id, req.params.id) })
      if (!lead) return res.status(404).json({ error: 'Lead not found' })
      const leadViewings = await db.query.viewings.findMany({ where: eq(viewings.leadId, lead.id) })
      res.json({ ...lead, viewings: await enrichViewings(leadViewings, lead) })
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // GET /api/leads/:id/share-text
  router.get('/:id/share-text', async (req, res) => {
    try {
      const lead = await db.query.leads.findFirst({ where: eq(leads.id, req.params.id) })
      if (!lead) return res.status(404).json({ error: 'Lead not found' })
      const text = [
        'Tenant Profile', '──────────────',
        `Name: ${lead.name}`, `Age: ${lead.age ?? '-'}`,
        `Phone: ${lead.phone}`, `Nationality: ${lead.nationality ?? '-'}`,
        `Race: ${lead.race}`, `Gender: ${lead.gender ?? '-'}`,
        `Occupation: ${lead.occupation ?? '-'}`, `Job Location: ${lead.jobLocation ?? '-'}`,
        `Budget: ${lead.budget ?? '-'}`, `Pax Staying: ${lead.paxStaying ?? '-'}`,
        `Move In Date: ${lead.moveInDate ?? '-'}`, `Tenancy Period: ${lead.tenancyPeriod ?? '-'}`,
      ].join('\n')
      res.json({ text })
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // PATCH /api/leads/viewings/:id — toggle taskChecked
  router.patch('/viewings/:id', async (req, res) => {
    try {
      const { taskChecked } = req.body
      await db.update(viewings)
        .set({ taskChecked: !!taskChecked, updatedAt: new Date() })
        .where(eq(viewings.id, req.params.id))
      res.json({ ok: true })
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  })

  export default router
  