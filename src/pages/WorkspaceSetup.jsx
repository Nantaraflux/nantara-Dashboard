import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorkspace, updateBranding, updateApiConfig } from '../services/workspaceService'
import { useToast } from '../components/ui/Toast'
import Modal from '../components/ui/Modal'

export default function WorkspaceSetup() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(1) // 1: Info, 2: Branding, 3: API
  const [loading, setLoading] = useState(false)

  // Step 1: Workspace Info
  const [workspaceName, setWorkspaceName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  // Step 2: Branding
  const [branding, setBranding] = useState({
    companyName: '',
    primaryColor: '#0F6E56',
    secondaryColor: '#8B5CF6',
  })

  // Step 3: API Config
  const [apiConfig, setApiConfig] = useState({
    airtableBaseId: '',
    airtableApiKey: '',
    groqKey: '',
    n8nSendWa: '',
    n8nFollowup: '',
  })

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null)

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || !ownerEmail.trim() || !ownerPassword.trim()) {
      toast.error('Semua field harus diisi!')
      return
    }

    setLoading(true)
    try {
      const workspace = await createWorkspace(workspaceName, ownerEmail)
      setCurrentWorkspaceId(workspace.id)
      localStorage.setItem('workspaceId', workspace.id)
      localStorage.setItem('nantara_user', JSON.stringify({
        name: 'Owner',
        email: ownerEmail,
        role: 'Owner',
        workspaceId: workspace.id,
      }))
      toast.success('Workspace berhasil dibuat!')
      setStep(2)
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
    setLoading(false)
  }

  const handleUpdateBranding = async () => {
    if (!branding.companyName.trim()) {
      toast.error('Nama perusahaan harus diisi!')
      return
    }

    setLoading(true)
    try {
      await updateBranding(currentWorkspaceId, branding)
      toast.success('Branding berhasil disimpan!')
      setStep(3)
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
    setLoading(false)
  }

  const handleUpdateApiConfig = async () => {
    if (!apiConfig.airtableBaseId.trim() || !apiConfig.airtableApiKey.trim()) {
      toast.error('Airtable Base ID dan API Key harus diisi!')
      return
    }

    setLoading(true)
    try {
      await updateApiConfig(currentWorkspaceId, apiConfig)
      toast.success('API Configuration berhasil disimpan!')
      navigate('/')
      window.location.reload()
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Nantara Dashboard</h1>
          <p className="text-slate-400">Selamat datang! Mari setup workspace Anda</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${
              s <= step ? 'bg-blue-500' : 'bg-slate-700'
            }`} />
          ))}
        </div>

        {/* Step 1: Workspace Info */}
        {step === 1 && (
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Informasi Workspace</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-200 block mb-2">Nama Bisnis/Perusahaan</label>
                <input
                  type="text"
                  placeholder="PT XYZ Indonesia"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 block mb-2">Email Owner</label>
                <input
                  type="email"
                  placeholder="owner@company.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 block mb-2">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleCreateWorkspace}
                disabled={loading}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? '⏳ Membuat...' : '→ Lanjut ke Branding'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Branding */}
        {step === 2 && (
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Sesuaikan Branding</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-200 block mb-2">Nama Perusahaan (untuk display)</label>
                <input
                  type="text"
                  placeholder={workspaceName}
                  value={branding.companyName}
                  onChange={(e) => setBranding({...branding, companyName: e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 block mb-2">Warna Utama</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                    className="w-16 h-12 rounded-lg cursor-pointer border border-slate-600"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                    placeholder="#0F6E56"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-200 block mb-2">Warna Sekunder</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                    className="w-16 h-12 rounded-lg cursor-pointer border border-slate-600"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                    placeholder="#8B5CF6"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleUpdateBranding}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? '⏳ Menyimpan...' : '→ Lanjut ke API'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: API Configuration */}
        {step === 3 && (
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Koneksikan API Anda</h2>
            <p className="text-slate-400 text-sm mb-6">Setup API keys untuk integrasi dengan Airtable, Groq, dan N8N</p>

            <div className="space-y-4">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Airtable</h3>
                <input
                  type="text"
                  placeholder="Base ID (app...)"
                  value={apiConfig.airtableBaseId}
                  onChange={(e) => setApiConfig({...apiConfig, airtableBaseId: e.target.value})}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-500 mb-2"
                />
                <input
                  type="password"
                  placeholder="API Key (pat...)"
                  value={apiConfig.airtableApiKey}
                  onChange={(e) => setApiConfig({...apiConfig, airtableApiKey: e.target.value})}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Groq API</h3>
                <input
                  type="password"
                  placeholder="API Key (gsk_...)"
                  value={apiConfig.groqKey}
                  onChange={(e) => setApiConfig({...apiConfig, groqKey: e.target.value})}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">N8N Webhooks</h3>
                <input
                  type="text"
                  placeholder="Send WhatsApp Webhook"
                  value={apiConfig.n8nSendWa}
                  onChange={(e) => setApiConfig({...apiConfig, n8nSendWa: e.target.value})}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-500 mb-2"
                />
                <input
                  type="text"
                  placeholder="Follow-up Webhook"
                  value={apiConfig.n8nFollowup}
                  onChange={(e) => setApiConfig({...apiConfig, n8nFollowup: e.target.value})}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <p className="text-xs text-slate-400 mt-4">
                💡 Tip: Bisa skip API keys sekarang dan setup nanti di Settings
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleUpdateApiConfig}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? '⏳ Setup...' : '✓ Selesai & Masuk Dashboard'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
