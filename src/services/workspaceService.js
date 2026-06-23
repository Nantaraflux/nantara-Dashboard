import { db } from '../config/firebase'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore'

// ============ WORKSPACE FUNCTIONS ============

// Buat workspace baru (saat user sign up)
export const createWorkspace = async (workspaceName, ownerEmail) => {
  try {
    const workspaceId = `workspace_${Date.now()}`

    const workspaceData = {
      id: workspaceId,
      name: workspaceName,
      ownerEmail,
      createdAt: Timestamp.now(),
      status: 'active',

      // Branding (bisa di-customize)
      branding: {
        companyName: workspaceName,
        primaryColor: '#0F6E56',
        secondaryColor: '#8B5CF6',
        logo: null,
        favicon: null,
      },

      // API Configuration (di-encrypt di production)
      apiConfig: {
        airtableBaseId: '',
        airtableApiKey: '',
        groqKey: '',
        n8nSendWa: '',
        n8nFollowup: '',
      },

      // Workspace stats
      stats: {
        totalUsers: 1,
        activeUsers: 1,
        lastActivity: Timestamp.now(),
      },
    }

    await setDoc(doc(db, 'workspaces', workspaceId), workspaceData)

    // Create owner user
    await addUser(workspaceId, {
      name: 'Owner',
      email: ownerEmail,
      password: 'changeme123',
      role: 'Owner',
    })

    return workspaceData
  } catch (error) {
    console.error('Error creating workspace:', error)
    throw error
  }
}

// Get workspace config
export const getWorkspace = async (workspaceId) => {
  try {
    const docRef = doc(db, 'workspaces', workspaceId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    }
    return null
  } catch (error) {
    console.error('Error getting workspace:', error)
    throw error
  }
}

// Update workspace config
export const updateWorkspace = async (workspaceId, updates) => {
  try {
    const docRef = doc(db, 'workspaces', workspaceId)

    // Update lastActivity
    updates.stats = {
      ...updates.stats,
      lastActivity: Timestamp.now(),
    }

    await updateDoc(docRef, updates)
    return await getWorkspace(workspaceId)
  } catch (error) {
    console.error('Error updating workspace:', error)
    throw error
  }
}

// Update branding
export const updateBranding = async (workspaceId, branding) => {
  return updateWorkspace(workspaceId, {
    branding: {
      ...branding,
    },
  })
}

// Update API config
export const updateApiConfig = async (workspaceId, apiConfig) => {
  return updateWorkspace(workspaceId, {
    apiConfig: {
      ...apiConfig,
    },
  })
}

// ============ USER FUNCTIONS (per workspace) ============

// Add user ke workspace
export const addUser = async (workspaceId, userData) => {
  try {
    const usersRef = collection(db, 'workspaces', workspaceId, 'users')

    const newUser = {
      id: `user_${Date.now()}`,
      ...userData,
      createdAt: Timestamp.now(),
      lastLogin: null,
      status: 'active',
    }

    await addDoc(usersRef, newUser)
    return newUser
  } catch (error) {
    console.error('Error adding user:', error)
    throw error
  }
}

// Get semua user di workspace
export const getWorkspaceUsers = async (workspaceId) => {
  try {
    const usersRef = collection(db, 'workspaces', workspaceId, 'users')
    const snapshot = await getDocs(usersRef)

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      docId: doc.id,
    }))
  } catch (error) {
    console.error('Error getting users:', error)
    throw error
  }
}

// Authenticate user (login)
export const authenticateWorkspaceUser = async (workspaceId, email, password) => {
  try {
    const usersRef = collection(db, 'workspaces', workspaceId, 'users')
    const q = query(usersRef, where('email', '==', email))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

    const userDoc = snapshot.docs[0]
    const user = userDoc.data()

    // Simple password check (di production: hash password!)
    if (user.password === password && user.status === 'active') {
      return {
        ...user,
        docId: userDoc.id,
        workspaceId,
      }
    }

    return null
  } catch (error) {
    console.error('Error authenticating user:', error)
    throw error
  }
}

// ============ WORKSPACE DETECTION ============

// Detect workspace dari URL atau localStorage
export const getWorkspaceId = () => {
  // 1. Check dari localStorage (setelah login)
  const savedWorkspaceId = localStorage.getItem('workspaceId')
  if (savedWorkspaceId) return savedWorkspaceId

  // 2. Check dari subdomain
  // Misal: pt-xyz.nantara.com → pt-xyz
  const subdomain = window.location.hostname.split('.')[0]
  if (subdomain !== 'localhost' && subdomain !== 'www') {
    return `workspace_${subdomain}`
  }

  // 3. Check dari URL path
  // Misal: nantara.com/workspace/123
  const pathMatch = window.location.pathname.match(/\/workspace\/([a-zA-Z0-9_]+)/)
  if (pathMatch) return pathMatch[1]

  return null
}

// ============ ACTIVITY LOGGING (per workspace) ============

export const logWorkspaceActivity = async (workspaceId, action, description, userId = null) => {
  try {
    const activitiesRef = collection(db, 'workspaces', workspaceId, 'activities')

    await addDoc(activitiesRef, {
      action,
      description,
      userId,
      timestamp: Timestamp.now(),
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// Get activity log
export const getWorkspaceActivityLog = async (workspaceId, limit = 100) => {
  try {
    const activitiesRef = collection(db, 'workspaces', workspaceId, 'activities')
    const snapshot = await getDocs(activitiesRef)

    return snapshot.docs
      .map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.(),
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting activity log:', error)
    return []
  }
}
