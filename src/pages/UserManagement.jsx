import React, { useState, useMemo } from 'react'
import { useToast } from '../components/ui/Toast'
import { getUsers, addUser, updateUser, deleteUser, getActivityLog, ROLES } from '../utils/userManagement'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { format, parseISO } from 'date-fns'

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState(getUsers())
  const [activityLog, setActivityLog] = useState(getActivityLog(50))
  const [selected, setSelected] = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'User' })
  const toast = useToast()

  // Only Owner can access this page
  const isOwner = currentUser?.role === 'Owner'

  if (!isOwner) {
    return (
      <div className="bg-bg-surface border border-border rounded-lg p-8 text-center max-w-2xl">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" className="mx-auto mb-4 opacity-60">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2 className="text-xl font-semibold text-txt-primary mb-2">⛔ Access Denied</h2>
        <p className="text-txt-secondary">Hanya Owner yang bisa manage users dan membuat akun baru.</p>
        <p className="text-txt-tertiary text-[12px] mt-3">Role kamu: <strong>{currentUser?.role}</strong></p>
      </div>
    )
  }

  const handleAddUser = () => {
    if (!newUser.name.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    if (!newUser.email.trim()) {
      toast.error('Email tidak boleh kosong')
      return
    }
    if (!newUser.password.trim()) {
      toast.error('Password tidak boleh kosong')
      return
    }
    if (users.some(u => u.email === newUser.email)) {
      toast.error('Email sudah terdaftar')
      return
    }

    addUser(newUser)
    setUsers(getUsers())
    setNewUser({ name: '', email: '', password: '', role: 'User' })
    setShowAddUser(false)
    toast.success('User berhasil dibuat')
  }

  const handleDeleteUser = (userId) => {
    if (userId === currentUser.id) {
      toast.error('Tidak bisa menghapus user sendiri')
      return
    }
    if (window.confirm('Yakin hapus user ini?')) {
      deleteUser(userId)
      setUsers(getUsers())
      setSelected(null)
      toast.success('User berhasil dihapus')
    }
  }

  const handleUpdateRole = (userId, newRole) => {
    if (userId === currentUser.id) {
      toast.error('Tidak bisa ubah role sendiri')
      return
    }
    updateUser(userId, { role: newRole })
    setUsers(getUsers())
    if (selected?.id === userId) {
      setSelected(prev => ({ ...prev, role: newRole }))
    }
    toast.success('Role berhasil diubah')
  }

  const handleToggleStatus = (userId) => {
    if (userId === currentUser.id) {
      toast.error('Tidak bisa deactivate diri sendiri')
      return
    }
    const user = users.find(u => u.id === userId)
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    updateUser(userId, { status: newStatus })
    setUsers(getUsers())
    if (selected?.id === userId) {
      setSelected(prev => ({ ...prev, status: newStatus }))
    }
    toast.success(`User ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`)
  }

  const fmtDate = (d) => {
    if (!d) return '—'
    try { return format(parseISO(d), 'dd MMM yyyy HH:mm') } catch { return d }
  }

  const columns = [
    { key: 'name', label: 'Nama', render: (v) => <span className="font-medium">{v}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v) => <Badge>{v}</Badge> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'active' ? 'success' : 'default'}>{v}</Badge> },
    { key: 'lastLogin', label: 'Last Login', render: (v) => fmtDate(v) },
  ]

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: users.length, color: 'from-blue-500 to-blue-600' },
          { label: 'Active', value: users.filter(u => u.status === 'active').length, color: 'from-green-500 to-green-600' },
          { label: 'Admins', value: users.filter(u => ['Owner', 'Admin'].includes(u.role)).length, color: 'from-purple-500 to-purple-600' },
          { label: 'Last 24h Logins', value: users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 86400000)).length, color: 'from-orange-500 to-orange-600' },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 text-white`}>
            <div className="text-[12px] font-semibold opacity-90">{stat.label}</div>
            <div className="text-[28px] font-bold mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddUser(true)}
          className="px-4 py-2 bg-accent-primary text-white text-[13px] font-medium rounded-lg hover:bg-accent-secondary transition-colors"
        >
          + Tambah User
        </button>
        <button
          onClick={() => { setActivityLog(getActivityLog(100)); setShowActivityLog(true) }}
          className="px-4 py-2 bg-bg-elevated border border-border text-txt-secondary text-[13px] font-medium rounded-lg hover:text-txt-primary transition-colors"
        >
          📋 Activity Log
        </button>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        onRowClick={setSelected}
        emptyMessage="Belum ada users"
      />

      {/* User Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} width="max-w-md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase">Email</div>
                <div className="text-[13px] text-txt-primary font-medium">{selected.email}</div>
              </div>
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase">Status</div>
                <Badge variant={selected.status === 'active' ? 'success' : 'default'}>{selected.status}</Badge>
              </div>
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase">Role</div>
                <select
                  value={selected.role}
                  onChange={(e) => handleUpdateRole(selected.id, e.target.value)}
                  disabled={selected.id === currentUser.id}
                  className="mt-1 w-full px-2 py-1.5 bg-bg-elevated border border-border rounded text-[13px] text-txt-primary outline-none"
                >
                  {Object.keys(ROLES).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[11px] text-txt-tertiary uppercase">Dibuat</div>
                <div className="text-[13px] text-txt-primary">{fmtDate(selected.createdAt)}</div>
              </div>
            </div>

            <div className="bg-bg-elevated rounded p-3">
              <div className="text-[12px] text-txt-secondary mb-1">📍 Role Permissions:</div>
              <ul className="text-[12px] text-txt-tertiary space-y-1">
                {ROLES[selected.role]?.map(perm => (
                  <li key={perm}>• {perm}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              <button
                onClick={() => handleToggleStatus(selected.id)}
                disabled={selected.id === currentUser.id}
                className="flex-1 px-3 py-2 bg-bg-elevated border border-border text-[13px] font-medium rounded hover:bg-bg-hover disabled:opacity-50 transition-colors"
              >
                {selected.status === 'active' ? '🔒 Deactivate' : '🔓 Activate'}
              </button>
              <button
                onClick={() => handleDeleteUser(selected.id)}
                disabled={selected.id === currentUser.id}
                className="flex-1 px-3 py-2 bg-red-500/15 text-red-500 text-[13px] font-medium rounded hover:bg-red-500/25 disabled:opacity-50 transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Tambah User Baru" width="max-w-md">
        <div className="space-y-3">
          {[
            { key: 'name', label: 'Nama Lengkap', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'password', label: 'Password', type: 'password' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-[12px] font-semibold text-txt-secondary block mb-1">{field.label}</label>
              <input
                type={field.type}
                value={newUser[field.key]}
                onChange={(e) => setNewUser(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.label}
                className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary outline-none focus:border-accent-primary"
              />
            </div>
          ))}
          <div>
            <label className="text-[12px] font-semibold text-txt-secondary block mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary outline-none"
            >
              {Object.keys(ROLES).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddUser}
            className="w-full px-3 py-2.5 bg-accent-primary text-white text-[13px] font-medium rounded-md hover:bg-accent-secondary transition-colors"
          >
            ✓ Buat User
          </button>
        </div>
      </Modal>

      {/* Activity Log Modal */}
      <Modal open={showActivityLog} onClose={() => setShowActivityLog(false)} title="Activity Log" width="max-w-2xl">
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {activityLog.length === 0 ? (
            <div className="text-center text-txt-tertiary text-[13px] py-4">Tidak ada activity</div>
          ) : activityLog.map(log => (
            <div key={log.id} className="bg-bg-elevated rounded p-3 text-[13px]">
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-txt-primary">{log.action}</span>
                <span className="text-[11px] text-txt-tertiary">{fmtDate(log.timestamp)}</span>
              </div>
              <div className="text-txt-secondary">{log.description}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
