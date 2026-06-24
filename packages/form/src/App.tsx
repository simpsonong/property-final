import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? ''

type RoomInfo = { address: string; photoUrl: string | null }

function Field({ label, name, value, onChange, placeholder, required }: {
  label: string; name: string; value: string; required?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  )
}

export default function App() {
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get('room') ?? ''
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', age: '', phone: '', nationality: '',
    race: '', gender: '', occupation: '', jobLocation: '',
    budget: '', paxStaying: '', moveInDate: '', tenancyPeriod: '',
  })

  useEffect(() => {
    if (!roomId) return
    axios.get(`${API}/api/form/room/${roomId}`)
      .then(r => setRoom(r.data))
      .catch(() => setError('Room not found. Please check your link.'))
  }, [roomId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone || !form.race) { setError('Please fill in Name, Phone, and Race.'); return }
    setLoading(true); setError('')
    try {
      await axios.post(`${API}/api/form/submit`, { ...form, roomId })
      setSubmitted(true)
    } catch { setError('Submission failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (!roomId) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Invalid link. Please contact your agent.</p>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank you!</h1>
      <p className="text-gray-500">We have received your details. We will contact you soon. 😊</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {room && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex items-center gap-4">
            {room.photoUrl && <img src={room.photoUrl} alt="Room" className="w-20 h-20 object-cover rounded-xl" />}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Room</p>
              <p className="font-semibold text-gray-800">{room.address}</p>
            </div>
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-800 mb-1">Tenant Application</h1>
        <p className="text-sm text-gray-400 mb-6">Please fill in your details below.</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Linn Mei Yong" required />
          <Field label="Age" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 28" />
          <Field label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 012-3456789" required />
          <Field label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} placeholder="e.g. Malaysian" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Race *</label>
            <select name="race" value={form.race} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">Select race</option>
              <option value="chinese">Chinese</option>
              <option value="malay">Malay</option>
              <option value="indian">Indian</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <Field label="Occupation" name="occupation" value={form.occupation} onChange={handleChange} placeholder="e.g. Software Engineer" />
          <Field label="Job Location" name="jobLocation" value={form.jobLocation} onChange={handleChange} placeholder="e.g. Johor Bahru" />
          <Field label="Budget (RM/month)" name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. RM 800" />
          <Field label="Pax Staying" name="paxStaying" value={form.paxStaying} onChange={handleChange} placeholder="e.g. 2" />
          <Field label="Preferred Move In Date" name="moveInDate" value={form.moveInDate} onChange={handleChange} placeholder="e.g. August 2026" />
          <Field label="Tenancy Period" name="tenancyPeriod" value={form.tenancyPeriod} onChange={handleChange} placeholder="e.g. 1 year" />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}
