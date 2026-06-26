import { useEffect, useState } from 'react'
  import { useNavigate } from 'react-router-dom'
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

  const STATUS_LABELS: Record<string, string> = {
    new_customer: 'New Customer',
    owner_confirmed: 'Owner Confirmed',
    owner_rejected: 'Owner Rejected',
    viewing_scheduled: 'Viewing Scheduled',
    viewing_done: 'Viewing Done',
    booked: 'Booked',
    paid: 'Paid',
    moved_in: 'Moved In',
    lost: 'Lost',
  }

  export default function Pipeline() {
    const [leads, setLeads] = useState<any[]>([])
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
      axios.get(`${API}/api/leads`)
        .then(r => {
          setLeads(Array.isArray(r.data) ? r.data : [])
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to load leads. Please refresh.')
          setLoading(false)
        })
    }, [])

    function toggle(id: string) {
      setExpanded(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    }

    async function toggleCheck(viewingId: string, currentChecked: boolean) {
      const newChecked = !currentChecked
      setLeads(prev => prev.map(lead => ({
        ...lead,
        viewings: lead.viewings?.map((v: any) =>
          v.id === viewingId ? { ...v, taskChecked: newChecked } : v
        )
      })))
      try {
        await axios.patch(`${API}/api/leads/viewings/${viewingId}`, { taskChecked: newChecked })
      } catch {
        setLeads(prev => prev.map(lead => ({
          ...lead,
          viewings: lead.viewings?.map((v: any) =>
            v.id === viewingId ? { ...v, taskChecked: currentChecked } : v
          )
        })))
      }
    }

    if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Loading...</div>
    if (error) return <div className="text-red-500 text-sm py-8 text-center">{error}</div>

    return (
      <div>
        <h1 className="text-xl font-bold text-gray-800 mb-4">Pipeline</h1>
        {leads.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">No leads yet.</div>
        )}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {leads.map(lead => (
            <div key={lead.id}>
              <div className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => toggle(lead.id)}>
                <button className="text-gray-400 mr-3 text-xs w-4">{expanded.has(lead.id) ? '▼' : '▶'}</button>
                <div className="flex-1 min-w-0">
                  <button
                    className="font-medium text-gray-800 hover:text-blue-600 text-left"
                    onClick={e => { e.stopPropagation(); navigate(`/profile/${lead.id}`) }}
                  >{lead.name}</button>
                  <span className="text-gray-400 text-xs ml-2">{lead.phone}</span>
                </div>
                <span className="text-xs text-gray-400 mr-3 capitalize">{lead.race}</span>
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{lead.viewings?.length ?? 0} room{lead.viewings?.length !== 1 ? 's' : ''}</span>
              </div>

              {expanded.has(lead.id) && (lead.viewings ?? []).map((v: any) => (
                <div key={v.id ?? Math.random()} className="pl-10 pr-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {v.waLink ? (
                      <a href={v.waLink} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline text-sm">{lead.name}</a>
                    ) : (
                      <span className="font-medium text-gray-600 text-sm">{lead.name}</span>
                    )}
                    <span className="text-gray-400 text-xs ml-2 truncate">{v.roomAddress}</span>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[v.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[v.status] ?? v.status}
                  </span>
                  {v.task && <span className="text-xs text-gray-400 truncate max-w-[140px]">{String(v.task)}</span>}
                  {v.task && (
                    <button
                      onClick={e => { e.stopPropagation(); toggleCheck(v.id, !!v.taskChecked) }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        v.taskChecked
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                      title={v.taskChecked ? 'Mark as undone' : 'Mark as done'}
                    >
                      {v.taskChecked && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
  