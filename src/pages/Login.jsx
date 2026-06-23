import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/Toast'
import { authenticateUser, initializeUsers } from '../utils/userManagement'

export default function SignIn({ onLogin }) {
  const [email, setEmail] = useState('admin@nantara.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    initializeUsers()
  }, [])

  const handleSignIn = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Email tidak boleh kosong')
      return
    }
    if (!password.trim()) {
      toast.error('Password tidak boleh kosong')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Format email tidak valid')
      return
    }

    setLoading(true)

    setTimeout(() => {
      const user = authenticateUser(email, password)
      if (user) {
        localStorage.setItem('nantara_user', JSON.stringify(user))
        onLogin(user)
        toast.success(`Selamat datang, ${user.name}!`)
        navigate('/')
      } else {
        toast.error('Email atau password salah')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Nantara"
                className="h-16 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<div class="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><span class="text-white text-2xl font-bold">N</span></div>'
                }}
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Nantara</h1>
            <p className="text-slate-400">Sign In to Dashboard</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-[13px] font-semibold text-slate-300 block mb-2">
                📧 Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nantara.com"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                disabled={loading}
              />
              <div className="text-[11px] text-slate-500 mt-1">Demo: admin@nantara.com</div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-slate-300 block mb-2">
                🔐 Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Demo: admin123</div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-300 mt-6"
            >
              {loading ? 'Signing in...' : '✓ Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <p className="text-[12px] text-slate-500">Demo credentials provided for testing</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-slate-400 text-[13px]">© 2026 Nantara. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
