import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SignOut({ onLogout }) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Logout immediately
    onLogout()

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onLogout, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-white mb-2">Signed Out</h1>
          <p className="text-slate-400 mb-6">You have been successfully signed out from Nantara Dashboard</p>

          {/* Countdown */}
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-300 mb-2">Redirecting to Sign In page in...</p>
            <div className="text-4xl font-bold text-emerald-400">{countdown}</div>
            <p className="text-xs text-slate-500 mt-2">seconds</p>
          </div>

          {/* Manual redirect button */}
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg transition-all duration-300"
          >
            ← Back to Sign In
          </button>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-[12px] text-slate-500">See you soon!</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-slate-400 text-[13px]">© 2026 Nantara. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
