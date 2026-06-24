import { useEffect, useState } from 'react'
  import axios from 'axios'
  import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'

  const API = import.meta.env.VITE_API_URL ?? ''

  type EventType = 'viewHouse' | 'moveIn' | 'payRent'

  export default function Calendar() {
    const [date, setDate] = useState(new Date())
    const [events, setEvents] = useState<any>({ viewHouse: [], moveIn: [], payRent: [] })
    const [activeDay, setActiveDay] = useState<string | null>(null)
    const [activeType, setActiveType] = useState<EventType | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const y = date.getFullYear(), m = date.getMonth() + 1
      setLoading(true)
      axios.get(`${API}/api/calendar/${y}/${m}`).then(r => { setEvents(r.data); setLoading(false) })
    }, [date])

    const days = eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) })
    const firstDayOfWeek = getDay(startOfMonth(date))

    function getEventsForDay(day: Date, type: EventType) {
      const key = format(day, 'yyyy-MM-dd')
      const arr = type === 'viewHouse' ? events.viewHouse : type === 'moveIn' ? events.moveIn : events.payRent
      return arr.filter((e: any) => {
        const d = new Date(e.date)
        return format(d, 'yyyy-MM-dd') === key
      })
    }

    function hasEvents(day: Date) {
      return ['viewHouse', 'moveIn', 'payRent'].some(t => getEventsForDay(day, t as EventType).length > 0)
    }

    const selectedEvents = activeDay && activeType ? getEventsForDay(new Date(activeDay), activeType) : []

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Calendar</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setDate(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n })}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">‹</button>
            <span className="font-semibold text-gray-800 w-32 text-center">{format(date, 'MMMM yyyy')}</span>
            <button onClick={() => setDate(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n })}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">›</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-7 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={i} />)}
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd')
              const isToday = format(new Date(), 'yyyy-MM-dd') === key
              const busy = hasEvents(day)
              return (
                <div key={key} className={`min-h-[72px] rounded-xl p-1 border ${isToday ? 'border-blue-200 bg-blue-50' : 'border-transparent hover:border-gray-100'}`}>
                  <p className={`text-xs text-center font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </p>
                  {busy && (
                    <div className="flex flex-col gap-0.5">
                      {(['viewHouse', 'moveIn', 'payRent'] as EventType[]).map(type => {
                        const cnt = getEventsForDay(day, type).length
                        if (!cnt) return null
                        const colors = { viewHouse: 'bg-yellow-100 text-yellow-700', moveIn: 'bg-green-100 text-green-700', payRent: 'bg-purple-100 text-purple-700' }
                        const labels = { viewHouse: '👁 View', moveIn: '📦 Move In', payRent: '💰 Rent' }
                        return (
                          <button key={type} onClick={() => { setActiveDay(key); setActiveType(type) }}
                            className={`text-[10px] rounded px-1 py-0.5 ${colors[type]} text-left leading-tight`}>
                            {labels[type]} ({cnt})
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Event detail panel */}
        {activeDay && activeType && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">
                {activeType === 'viewHouse' ? '👁 View House' : activeType === 'moveIn' ? '📦 Move In' : '💰 Pay Rent'} — {format(new Date(activeDay), 'd MMM yyyy')}
              </h2>
              <button onClick={() => { setActiveDay(null); setActiveType(null) }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-gray-400 text-sm">No events.</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.leadName}</p>
                      <p className="text-xs text-gray-400">{e.roomAddress}</p>
                      {activeType === 'moveIn' && e.status && (
                        <span className={`text-xs rounded-full px-2 py-0.5 mt-1 inline-block ${e.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-green-100 text-green-700'}`}>
                          {e.status}
                        </span>
                      )}
                    </div>
                    {e.waLink && (
                      <a href={e.waLink} target="_blank" rel="noopener noreferrer"
                        className="text-sm bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg transition">
                        WhatsApp
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
  