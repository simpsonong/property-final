import { Router } from 'express'
import { db } from '../db'
import { rooms } from '../db/schema'
import { eq } from 'drizzle-orm'
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query
    let all = await db.query.rooms.findMany({ orderBy: (r, { desc }) => [desc(r.createdAt)] })
    if (search && typeof search === 'string')
      all = all.filter(r => r.address.toLowerCase().includes(search.toLowerCase()))
    if (status === 'available' || status === 'booked')
      all = all.filter(r => r.status === status)
    res.json(all)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/rooms — create room with optional photo
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { address } = req.body
    if (!address) return res.status(400).json({ error: 'Address required' })
    let photoUrl = null, cloudinaryPublicId = null
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype)
      photoUrl = result.secure_url
      cloudinaryPublicId = result.public_id
    }
    const [room] = await db.insert(rooms).values({ address, photoUrl, cloudinaryPublicId, status: 'available' }).returning()
    res.json(room)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/rooms/:id
router.delete('/:id', async (req, res) => {
  try {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, req.params.id) })
    if (!room) return res.status(404).json({ error: 'Room not found' })
    if (room.cloudinaryPublicId) await deleteFromCloudinary(room.cloudinaryPublicId)
    await db.delete(rooms).where(eq(rooms.id, req.params.id))
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/rooms/:id/form-link
router.get('/:id/form-link', async (req, res) => {
  try {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, req.params.id) })
    if (!room) return res.status(404).json({ error: 'Room not found' })
    if (room.status === 'booked') return res.status(400).json({ error: 'Room is booked' })
    res.json({ formUrl: `${process.env.FORM_URL}/apply?room=${room.id}` })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
