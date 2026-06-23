import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchTable } from '../../config/airtable'

const titles = {
  '/': 'Overview',
  '/chat': 'Chat',
  '/orders': 'Orders',
  '/buyers': 'Buyers',
  '/pipeline': 'Pipeline',
  '/products': 'Products',
  '/analytics': 'Analytics',
  '/followups': 'Follow-ups',
  '/settings': 'Settings',
}

export default function TopBar({ onMenuToggle, onLogout, currentUser }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = titles[pathname] || 'Nantara'
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  const user = currentUser || { name: 'Guest', role: 'Viewer' }
  const profileRef = useRef(null)
  const notificationRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    const results = []
    const q = query.toLowerCase()

    try {
      const tables = ['Orders', 'Buyers', 'Products', 'Chats']
      for (const table of tables) {
        try {
          const records = await fetchTable(table)
          const filtered = records.filter(record => {
            const searchableFields = Object.values(record)
              .map(v => String(v).toLowerCase())
              .join(' ')
            return searchableFields.includes(q)
          }).slice(0, 3)

          filtered.forEach(record => {
            results.push({
              type: table,
              id: record.id,
              data: record,
              title: record.name || record.email || record.product_name || record.customer_name || 'Unnamed',
              subtitle: record.email || record.status || record.amount || '',
            })
          })
        } catch {}
      }
    } catch {}

    setSearchResults(results.slice(0, 8))
    setSearchLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) performSearch(searchQuery)
      else setSearchResults([])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleLogout = () => {
    if (window.confirm('Yakin mau sign out?')) {
      setProfileOpen(false)
      navigate('/signout')
    }
  }

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-[24px] font-bold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden md:block relative" ref={searchRef}>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search orders, buyers, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="bg-transparent text-[13px] text-white placeholder:text-slate-400 outline-none w-48"
            />
          </div>

          {searchOpen && (
            <div className="absolute top-12 left-0 w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
              {searchQuery && (
                <>
                  {searchLoading && (
                    <div className="p-4 text-center text-slate-400 text-[13px]">
                      🔍 Searching...
                    </div>
                  )}

                  {!searchLoading && searchResults.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-[13px]">
                      No results found
                    </div>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <>
                      <div className="p-3 border-b border-slate-700">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase">Results</div>
                      </div>
                      <div className="divide-y divide-slate-700">
                        {searchResults.map((result, idx) => (
                          <button
                            key={`${result.type}-${result.id}-${idx}`}
                            onClick={() => {
                              setSearchOpen(false)
                              setSearchQuery('')
                              navigate(`/${result.type.toLowerCase()}`)
                            }}
                            className="w-full text-left px-3 py-3 hover:bg-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-white truncate">{result.title}</div>
                                {result.subtitle && (
                                  <div className="text-[12px] text-slate-400 truncate mt-0.5">{result.subtitle}</div>
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-slate-500 ml-2 px-2 py-1 bg-slate-700/50 rounded">
                                {result.type}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {searchResults.length >= 8 && (
                        <div className="p-3 text-center text-[12px] text-slate-400 border-t border-slate-700">
                          Showing top 8 results
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {!searchQuery && (
                <div className="p-4 text-center text-slate-400 text-[13px]">
                  Type to search orders, buyers, products, chats...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full shadow-sm"></span>
          </button>

          {notificationOpen && (
            <div className="absolute right-0 top-12 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 z-50">
              <div className="text-white font-semibold mb-3">Notifikasi</div>
              <div className="space-y-2">
                <div className="bg-slate-700/50 p-3 rounded text-[13px] text-slate-200">
                  ✓ Order baru dari Budi Santoso
                </div>
                <div className="bg-slate-700/50 p-3 rounded text-[13px] text-slate-200">
                  💬 Pesan masuk dari customer
                </div>
                <div className="bg-slate-700/50 p-3 rounded text-[13px] text-slate-200">
                  ⏰ Follow-up reminder untuk hari ini
                </div>
              </div>
              <button
                onClick={() => setNotificationOpen(false)}
                className="w-full mt-3 px-3 py-2 text-[12px] font-medium bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 pl-4 border-l border-slate-700 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-semibold text-white">{user.name}</div>
              <div className="text-[11px] text-slate-400">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer">
              <span className="text-white text-[14px] font-bold">A</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-700">
                <div className="text-white font-semibold text-[13px]">{user.name}</div>
                <div className="text-slate-400 text-[12px]">{user.email}</div>
                <div className="text-slate-500 text-[11px] mt-1">Role: {user.role}</div>
              </div>
              <div className="p-2">
                {user.role === 'Owner' && (
                  <>
                    <a
                      href="/users"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-200 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 4.354a4 4 0 110 5.292M19 12a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      User Management
                    </a>
                    <a
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-200 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                      Settings
                    </a>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
