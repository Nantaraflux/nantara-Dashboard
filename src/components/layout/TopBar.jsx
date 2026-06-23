import React from 'react'
import { useLocation } from 'react-router-dom'

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

export default function TopBar({ onMenuToggle }) {
  const { pathname } = useLocation()
  const title = titles[pathname] || 'Nantara'

  return (
    <header className="h-14 bg-bg-surface border-b border-border flex items-center justify-between px-5 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded hover:bg-bg-elevated text-txt-secondary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-[15px] font-semibold text-txt-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 bg-bg-elevated border border-border rounded-md px-3 py-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A5568" strokeWidth="1.5">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none w-40"
          />
          <kbd className="text-[10px] text-txt-tertiary bg-bg-surface px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </div>

        <button className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-bg-elevated text-txt-secondary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent-primary rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center ml-1">
          <span className="text-white text-[12px] font-semibold">A</span>
        </div>
      </div>
    </header>
  )
}
