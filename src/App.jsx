import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Spinner from './components/ui/Spinner'
import { ToastProvider } from './components/ui/Toast'

const Overview = lazy(() => import('./pages/Overview'))
const Chat = lazy(() => import('./pages/Chat'))
const Orders = lazy(() => import('./pages/Orders'))
const Buyers = lazy(() => import('./pages/Buyers'))
const Pipeline = lazy(() => import('./pages/Pipeline'))
const Products = lazy(() => import('./pages/Products'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Followups = lazy(() => import('./pages/Followups'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
  return (
    <ToastProvider>
      <Layout>
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner /></div>}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/buyers" element={<Buyers />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/products" element={<Products />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/followups" element={<Followups />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </ToastProvider>
  )
}

export default App
