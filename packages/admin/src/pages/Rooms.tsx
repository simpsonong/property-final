import { useEffect, useState, useRef } from 'react'
  import axios from 'axios'

  const API = import.meta.env.VITE_API_URL ?? ''

  export default function Rooms() {
    const [rooms, setRooms] = useState<any[]>([])
    const [tab, setTab] = useState<'available' | 'booked'>('available')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [newAddress, setNewAddress] = useState('')
    const [newPhoto, setNewPhoto] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    function load() {
      setLoading(true)
      axios.get(`${API}/api/rooms`).then(r => { setRooms(r.data); setLoading(false) })
    }

    useEffect(() => { load() }, [])

    const filtered = rooms.filter(r =>
      r.status === tab &&
      (!search || r.address.toLowerCase().includes(search.toLowerCase()))
    )

    async function addRoom(e: React.FormEvent) {
      e.preventDefault()
      if (!newAddress) return
      setSubmitting(true)
      const fd = new FormData()
      fd.append('address', newAddress)
      if (newPhoto) fd.append('photo', newPhoto)
      await axios.post(`${API}/api/rooms`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setNewAddress(''); setNewPhoto(null); setAdding(false); setSubmitting(false)
      load()
    }

    async function deleteRoom(id: string) {
      if (!confirm('Delete this room?')) return
      await axios.delete(`${API}/api/rooms/${id}`)
      load()
    }

    async function copyFormLink(id: string) {
      const { data } = await axios.get(`${API}/api/rooms/${id}/form-link`)
      await navigator.clipboard.writeText(data.formUrl)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Rooms</h1>
          <button onClick={() => setAdding(!adding)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
            + New Room
          </button>
        </div>

        {adding && (
          <form onSubmit={addRoom} className="bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-3">
            <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Room address *" required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-sm text-blue-600 hover:underline">
                {newPhoto ? newPhoto.name : '+ Add photo (optional)'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => setNewPhoto(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add Room'}
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-sm text-gray-400 px-4 py-2">Cancel</button>
            </div>
          </form>
        )}

        <div className="flex gap-2 mb-4">
          {(['available', 'booked'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
              {t === 'available' ? 'Available' : 'Booked'}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by address..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm text-center py-8">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
            {tab === 'available' ? 'No available rooms. Add one above.' : 'No booked rooms yet.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(room => (
              <div key={room.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4">
                {room.photoUrl
                  ? <img src={room.photoUrl} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  : <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center text-gray-300 text-2xl">🏠</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{room.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{room.status}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {tab === 'available' && (
                    <button onClick={() => copyFormLink(room.id)}
                      className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                      {copiedId === room.id ? '✅ Copied!' : 'Copy Link'}
                    </button>
                  )}
                  <button onClick={() => deleteRoom(room.id)}
                    className="text-sm text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  