import React, { Suspense, lazy, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SignIn from './pages/Login'
import SignOut from './pages/SignOut'
import Spinner from './components/ui/Spinner'
import { ToastProvider } from './components/ui/Toast'
import { initializeUsers, canAccessPage } from './utils/userManagement'

const Overview = lazy(() => import('./pages/Overview'))
const Chat = lazy(() => import('./pages/Chat'))
const Orders = lazy(() => import('./pages/Orders'))
const Buyers = lazy(() => import('./pages/Buyers'))
const Pipeline = lazy(() => import('./pages/Pipeline'))
const Products = lazy(() => import('./pages/Products'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Followups = lazy(() => import('./pages/Followups'))
const Settings = lazy(() => import('./pages/Settings'))
const UserManagement = lazy(() => import('./pages/UserManagement'))

function ProtectedRoute({ children, isAuthenticated, currentUser, requiredPage }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredPage && !canAccessPage(currentUser?.role, requiredPage)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-txt-primary mb-2">Access Denied</h2>
          <p className="text-txt-secondary">Your role ({currentUser?.role}) tidak memiliki akses ke halaman ini</p>
        </div>
      </div>
    )
  }

  return children
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeUsers()
    const savedUser = localStorage.getItem('nantara_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (err) {
        localStorage.removeItem('nantara_user')
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('nantara_user')
    setUser(null)
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Spinner size={48} />
      </div>
    )
  }

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<SignIn onLogin={handleLogin} />} />
        <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
        <Route path="/signout" element={<SignOut onLogout={handleLogout} />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user}>
              <Layout onLogout={() => { handleLogout(); window.location.href = '/signout' }} currentUser={user}>
                <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner /></div>}>
                  <Routes>
                    <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="overview"><Overview /></ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="chat"><Chat /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="orders"><Orders /></ProtectedRoute>} />
                    <Route path="/buyers" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="buyers"><Buyers /></ProtectedRoute>} />
                    <Route path="/pipeline" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="pipeline"><Pipeline /></ProtectedRoute>} />
                    <Route path="/products" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="products"><Products /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="analytics"><Analytics /></ProtectedRoute>} />
                    <Route path="/followups" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="followups"><Followups /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="settings"><Settings currentUser={user} /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute isAuthenticated={isAuthenticated} currentUser={user} requiredPage="users"><UserManagement currentUser={user} /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  )
}

export default App
