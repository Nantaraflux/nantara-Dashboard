import React, { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-[240px] flex flex-col min-h-screen">
        <TopBar onMenuToggle={() => setSidebarOpen(s => !s)} />
        <main className="flex-1 p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
