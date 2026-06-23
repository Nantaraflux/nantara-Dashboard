import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { canAccessPage } from '../../utils/userManagement'

const nav = [
  { to: '/', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { to: '/chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { to: '/orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { to: '/buyers', label: 'Buyers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { to: '/pipeline', label: 'Pipeline', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { to: '/products', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/followups', label: 'Follow-ups', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M19 12a7 7 0 11-14 0 7 7 0 0114 0z', adminOnly: true },
  { to: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', adminOnly: true },
]

export default function Sidebar({ open, onClose, onCollapseChange, currentUser }) {
  const companyName = process.env.REACT_APP_COMPANY_NAME || 'Nantara'
  const [collapsed, setCollapsed] = useState(false)

  const handleToggleCollapse = () => {
    const newState = !collapsed
    setCollapsed(newState)
    if (onCollapseChange) onCollapseChange(newState)
  }

  // Filter navigation based on user role
  const visibleNav = currentUser ? nav.filter(item => {
    const path = item.to.substring(1) || 'overview'
    return canAccessPage(currentUser.role, path)
  }) : nav
  const sidebarWidth = collapsed ? 'w-[80px]' : 'w-[280px]'

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full ${sidebarWidth} z-50 flex flex-col transition-all duration-300 shadow-lg ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`} style={{ backgroundColor: '#190429' }}>
        {/* Logo Section */}
        <div className="h-20 flex items-center px-4 border-b border-purple-400/20 justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <img
                  src="/logo.png?v=1"
                  alt="Nantara Logo"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.innerHTML = '<div class="w-11 h-11 rounded-lg gradient-accent flex items-center justify-center"><span class="text-white text-base font-bold">N</span></div>'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[20px] font-bold text-white" style={{ fontFamily: "'Gentium Plus', serif" }}>{companyName}</div>
                <div className="text-[12px] text-white/60">v1.0.0</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg shadow-md hover:shadow-lg transition-shadow mx-auto">
              <img
                src="/logo.png?v=1"
                alt="Nantara"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<div class="w-11 h-11 rounded-lg gradient-accent flex items-center justify-center"><span class="text-white text-base font-bold">N</span></div>'
                }}
              />
            </div>
          )}
          <button
            onClick={handleToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors flex-shrink-0"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? (
                <path d="M15 19l-7-7 7-7" />
              ) : (
                <path d="M9 19l7-7-7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-2 overflow-y-auto">
          {!collapsed && (
            <div className="text-[12px] font-semibold text-white/50 uppercase tracking-widest px-4 mb-4">Menu</div>
          )}
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-lg text-[15px] font-medium transition-all mb-2 justify-${collapsed ? 'center' : 'start'} ${
                  collapsed ? 'px-2' : 'px-4'
                } ${
                  isActive
                    ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
              title={collapsed ? item.label : ''}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t border-purple-400/20 text-center`}>
          {!collapsed && (
            <>
              <div className="text-[12px] text-white font-medium">Nantara Dashboard</div>
              <div className="text-[10px] text-white/60 mt-1">Enterprise Edition</div>
            </>
          )}
          {collapsed && (
            <div className="text-[10px] text-white/60">v1</div>
          )}
        </div>
      </aside>
    </>
  )
}
