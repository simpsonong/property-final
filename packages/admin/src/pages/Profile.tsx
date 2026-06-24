import { useEffect, useState } from 'react'
  import { useParams, useNavigate } from 'react-router-dom'
  import axios from 'axios'

  const API = import.meta.env.VITE_API_URL ?? ''

  const STATUS_COLORS: Record<string, string> = {
    new_customer: 'bg-gray-100 text-gray-600',
    owner_confirmed: 'bg-blue-100 text-blue-700',
    owner_rejected: 'bg-red-100 text-red-600',
    viewing_scheduled: 'bg-yellow-100 text-yellow-700',
    viewing_done: 'bg-purple-100 text-purple-700',
    booked: 'bg-green-100 text-green-700',
    paid: 'bg-emerald-100 text-emerald-700',
    moved_in: 'bg-teal-100 text-teal-700',
    lost: 'bg-gray-100 text-gray-400',
  }

  export default function Profile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [lead, setLead] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [shared, setShared] = useState(false)

    useEffect(() => {
      axios.get(`${API}/api/leads/${id}`).then(r => { setLead(r.data); setLoading(false) })
    }, [id])

    async function handleShare() {
      const { data } = await axios.get(`${API}/api/leads/${id}/share-text`)
      if (navigator.share) {
        await navigator.share({ text: data.text })
      } else {
        await navigator.clipboard.writeText(data.text)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    }

    if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Loading...</div>
    if (!lead) return <div className="text-gray-400 text-sm py-8 text-center">Lead not found.</div>

    const fields = [
      ['Name', lead.name], ['Age', lead.age], ['Phone', lead.phone],
      ['Nationality', lead.nationality], ['Race', lead.race], ['Gender', lead.gender],
      ['Occupation', lead.occupation], ['Job Location', lead.jobLocation],
      ['Budget', lead.budget], ['Pax Staying', lead.paxStaying],
      ['Move In Date', lead.moveInDate], ['Tenancy Period', lead.tenancyPeriod],
    ]

    return (
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-xl font-bold text-gray-800">{lead.name}</h1>
          <button onClick={handleShare}
            className="ml-auto bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm px-4 py-2 rounded-xl transition">
            {shared ? '✅ Copied!' : '📤 Share'}
          </button>
        </div>

        {/* Profile fields */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Details</h2>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Viewing history */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Room History ({lead.viewings?.length ?? 0})</h2>
          {lead.viewings?.length === 0 && <p className="text-gray-400 text-sm">No viewings yet.</p>}
          <div className="space-y-3">
            {lead.viewings?.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{v.roomAddress}</p>
                  {v.task && <p className="text-xs text-gray-400 mt-0.5">{v.task}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[v.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {v.status.replace(/_/g, ' ')}
                  </span>
                  {v.waLink && (
                    <a href={v.waLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded-lg">
                      WA
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  