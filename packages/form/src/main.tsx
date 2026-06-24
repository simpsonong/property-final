import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/apply" element={<App />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-gray-400">
            Invalid link. Please contact your agent.
          </div>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
