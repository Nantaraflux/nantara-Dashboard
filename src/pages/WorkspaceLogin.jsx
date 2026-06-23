import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWorkspace, authenticateWorkspaceUser, getWorkspaceId } from '../services/workspaceService'
import { useToast } from '../components/ui/Toast'

export default function WorkspaceLogin({ onLogin }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [workspace, setWorkspace] = useState(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(true)

  useEffect(() => {
    // Detect workspace dari URL
    const workspaceId = getWorkspaceId()
    if (!workspaceId) {
      toast.error('Workspace tidak ditemukan')
      navigate('/setup')
      return
    }

    // Load workspace info
    getWorkspace(workspaceId).then(ws => {
      setWorkspace(ws)
      setWorkspaceLoading(false)
    }).catch(err => {
      toast.error('Error loading workspace: ' + err.message)
      setWorkspaceLoading(false)
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error('Email dan password harus diisi')
      return
    }

    setLoading(true)
    try {
      const workspaceId = getWorkspaceId()
      const user = await authenticateWorkspaceUser(workspaceId, email, password)

      if (!user) {
        toast.error('Email atau password salah')
        setLoading(false)
        return
      }

      // Save to localStorage
      localStorage.setItem('workspaceId', workspaceId)
      localStorage.setItem('nantara_user', JSON.stringify(user))

      // Callback
      onLogin(user)
      toast.success('Login berhasil!')
      navigate('/')
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
    setLoading(false)
  }

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Workspace Info */}
        {workspace && (
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg gradient-accent flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">
                {workspace.branding?.companyName?.[0] || 'W'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{workspace.branding?.companyName}</h1>
            <p className="text-slate-400 text-sm">Dashboard Login</p>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-2">Email</label>
              <input
                type="email"
                placeholder="owner@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '⏳ Login...' : '→ Masuk Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <p className="text-slate-400 text-sm">
              Belum punya akun?{' '}
              <button
                onClick={() => navigate('/setup')}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Setup workspace baru
              </button>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">🧪 Demo Credentials (untuk testing):</p>
          <p className="text-xs font-mono text-slate-300">Email: owner@test.com</p>
          <p className="text-xs font-mono text-slate-300">Password: password123</p>
        </div>
      </div>
    </div>
  )
}
