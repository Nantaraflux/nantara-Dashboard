import React, { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout({ children, onLogout, currentUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCollapseChange={setSidebarCollapsed}
        currentUser={currentUser}
      />
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px'
        }}
      >
        <TopBar onMenuToggle={() => setSidebarOpen(s => !s)} onLogout={onLogout} currentUser={currentUser} />
        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
