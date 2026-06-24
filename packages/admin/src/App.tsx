import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Pipeline from './pages/Pipeline'
import Rooms from './pages/Rooms'
import Calendar from './pages/Calendar'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white border-b border-gray-100 px-6 py-3 flex gap-6 items-center sticky top-0 z-10">
          <span className="font-bold text-gray-800 mr-2">🏠 Property Agent</span>
          {[['/', 'Pipeline'], ['/rooms', 'Rooms'], ['/calendar', 'Calendar']].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => isActive
                ? 'text-blue-600 font-semibold text-sm border-b-2 border-blue-600 pb-0.5'
                : 'text-gray-500 hover:text-gray-800 text-sm'
              }>{label}</NavLink>
          ))}
        </nav>
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Pipeline />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/profile/:id" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
