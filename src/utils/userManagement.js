// User management utility functions
const USERS_KEY = 'nantara_users'
const ACTIVITY_LOG_KEY = 'nantara_activity_log'

const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@nantara.com',
    password: 'admin123',
    role: 'Owner',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: null,
  },
]

export const initializeUsers = () => {
  const existing = localStorage.getItem(USERS_KEY)
  if (!existing) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS))
  }
}

export const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY)
  return users ? JSON.parse(users) : DEFAULT_USERS
}

export const addUser = (userData) => {
  const users = getUsers()
  const newUser = {
    id: Math.max(...users.map(u => u.id), 0) + 1,
    ...userData,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: null,
  }
  users.push(newUser)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  logActivity('USER_CREATED', `Created user: ${userData.email}`)
  return newUser
}

export const updateUser = (userId, updates) => {
  const users = getUsers()
  const user = users.find(u => u.id === userId)
  if (user) {
    Object.assign(user, updates)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    logActivity('USER_UPDATED', `Updated user: ${user.email}`)
    return user
  }
  return null
}

export const deleteUser = (userId) => {
  const users = getUsers()
  const user = users.find(u => u.id === userId)
  if (user) {
    const filtered = users.filter(u => u.id !== userId)
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered))
    logActivity('USER_DELETED', `Deleted user: ${user.email}`)
    return true
  }
  return false
}

export const authenticateUser = (email, password) => {
  const users = getUsers()
  const user = users.find(u => u.email === email && u.password === password && u.status === 'active')
  if (user) {
    const updatedUser = { ...user, lastLogin: new Date().toISOString() }
    updateUser(user.id, { lastLogin: new Date().toISOString() })
    logActivity('USER_LOGIN', `${user.email} logged in`)
    return updatedUser
  }
  return null
}

export const logActivity = (action, description, userId = null) => {
  const logs = localStorage.getItem(ACTIVITY_LOG_KEY)
  const activity = {
    id: Date.now(),
    action,
    description,
    userId,
    timestamp: new Date().toISOString(),
  }
  const allLogs = logs ? JSON.parse(logs) : []
  allLogs.push(activity)
  // Keep only last 1000 logs
  if (allLogs.length > 1000) allLogs.shift()
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(allLogs))
}

export const getActivityLog = (limit = 100) => {
  const logs = localStorage.getItem(ACTIVITY_LOG_KEY)
  const allLogs = logs ? JSON.parse(logs) : []
  return allLogs.slice(-limit).reverse()
}

export const ROLES = {
  Owner: ['all'],
  Admin: ['orders', 'buyers', 'chat', 'products', 'pipeline', 'analytics', 'followups', 'overview'],
  Manager: ['orders', 'buyers', 'pipeline', 'analytics', 'overview'],
  User: ['chat', 'orders', 'followups', 'overview'],
  Viewer: ['overview', 'analytics'],
}

export const canAccessPage = (role, page) => {
  if (role === 'Owner') return true
  return ROLES[role]?.includes(page) || false
}
