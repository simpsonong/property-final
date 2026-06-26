import { Component, ReactNode } from 'react'
  import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
  import Pipeline from './pages/Pipeline'
  import Rooms from './pages/Rooms'
  import Calendar from './pages/Calendar'
  import Profile from './pages/Profile'

  class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
    constructor(props: any) {
      super(props)
      this.state = { error: null }
    }
    static getDerivedStateFromError(error: Error) {
      return { error: error.message }
    }
    render() {
      if (this.state.error) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 max-w-md w-full">
              <p className="text-red-500 font-semibold mb-2">Something went wrong</p>
              <p className="text-gray-500 text-sm mb-4">{this.state.error}</p>
              <button onClick={() => this.setState({ error: null })}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">Try again</button>
            </div>
          </div>
        )
      }
      return this.props.children
    }
  }

  export default function App() {
    return (
      <BrowserRouter>
        <ErrorBoundary>
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
        </ErrorBoundary>
      </BrowserRouter>
    )
  }
  