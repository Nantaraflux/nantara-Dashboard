# 🚀 Multi-Tenant Dashboard - Implementation Guide

## Overview

Dashboard ini sekarang support **Multi-Tenant Architecture** - 1 codebase untuk ribuan bisnis!

```
Sebelum:
1 client = Coding ulang + Deploy ulang = 😭

Sekarang:
1 client = Setup 5 menit + Deploy otomatis = 🚀
1000 clients = Passive income 💰
```

---

## 📋 Fitur Multi-Tenant

### ✅ Apa yang Sudah Diimplementasi:

| Fitur | Status | Keterangan |
|-------|--------|-----------|
| **Workspace Detection** | ✅ | Auto-detect dari subdomain/URL |
| **Workspace Setup** | ✅ | Onboarding flow untuk client baru |
| **Workspace Login** | ✅ | Login per-workspace |
| **Branding Customization** | ✅ | Logo, warna, nama perusahaan |
| **API Configuration** | ✅ | Each workspace punya API keys sendiri |
| **User Management** | ✅ | Isolated users per workspace |
| **Activity Logging** | ✅ | Audit trail per workspace |
| **Data Isolation** | ✅ | Data tidak tercampur antar workspace |
| **Scalability** | ✅ | Firebase auto-scale |

---

## 🔧 Setup Firebase

### Step 1: Create Firebase Project

1. Go ke https://console.firebase.google.com
2. Click **"Create Project"**
3. Fill: Project name → "Nantara Dashboard"
4. Select region, enable Google Analytics (optional)
5. Wait untuk project creation

### Step 2: Setup Firestore Database

1. Di Firebase Console, click **"Firestore Database"**
2. Click **"Create Database"**
3. Choose: **"Start in Production Mode"**
4. Select region (closest to your users)
5. Wait untuk setup selesai

### Step 3: Get Firebase Config

1. Di Firebase Console, click ⚙️ **"Project Settings"**
2. Scroll ke "Your apps" section
3. Click **"Web"** app (atau create jika belum ada)
4. Copy config dari `firebaseConfig`
5. Paste ke `.env` file:

```bash
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=nantara-dashboard.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nantara-dashboard
REACT_APP_FIREBASE_STORAGE_BUCKET=nantara-dashboard.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 4: Setup Firestore Security Rules

1. Di Firestore, go to **"Rules"** tab
2. Replace dengan rules ini:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Workspace rules
    match /workspaces/{workspaceId} {
      allow read, write: if request.auth != null && 
        request.auth.customClaims.workspaceId == workspaceId;
      
      // Users in workspace
      match /users/{userId} {
        allow read, write: if request.auth != null && 
          request.auth.customClaims.workspaceId == workspaceId;
      }
      
      // Activities in workspace
      match /activities/{activityId} {
        allow read, write: if request.auth != null && 
          request.auth.customClaims.workspaceId == workspaceId;
      }
    }
  }
}
```

3. Click **"Publish"**

---

## 📱 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

```bash
# 1. Push ke GitHub
git push origin main

# 2. Go to vercel.com
# Click "New Project" → Select repo

# 3. Environment Variables
# Add semua REACT_APP_FIREBASE_* variables

# 4. Deploy!
# Vercel auto-deploy setiap push
```

**Result:** `https://nantara-dashboard.vercel.app`

### Option 2: Netlify

```bash
# 1. Connect GitHub repo

# 2. Build settings:
# Command: npm run build
# Publish: build/

# 3. Add env variables

# 4. Deploy!
```

### Option 3: Custom Server (VPS)

```bash
# Build
npm run build

# Upload `build/` folder ke server
# Setup web server (Nginx):

server {
    listen 80;
    server_name nantara.com *.nantara.com;
    
    location / {
        root /var/www/nantara/build;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🎯 Workspace Detection

Dashboard support 3 cara workspace detection:

### 1. Subdomain (Recommended)

```
pt-xyz.nantara.com      → workspace_pt-xyz
pt-abc.nantara.com      → workspace_pt-abc
mycompany.nantara.com   → workspace_mycompany
```

**Setup di DNS:**
```
*.nantara.com  → A  → Your server IP
```

### 2. URL Path

```
nantara.com/workspace/client-123
→ Detect: client-123
```

**Usage:** 
```javascript
const workspaceId = window.location.pathname.match(/\/workspace\/([a-zA-Z0-9_]+)/)[1]
```

### 3. localStorage (After Login)

```javascript
localStorage.setItem('workspaceId', 'workspace_123')
// User bisa akses dari mana saja
```

---

## 📊 Database Structure

### Firestore Collection Structure:

```
workspaces/
├── workspace_pt-xyz/
│   ├── name: "PT XYZ"
│   ├── ownerEmail: "owner@pt-xyz.com"
│   ├── branding: {
│   │   companyName: "PT XYZ",
│   │   primaryColor: "#0F6E56",
│   │   secondaryColor: "#8B5CF6",
│   │   logo: "url-to-logo"
│   ├── apiConfig: {
│   │   airtableBaseId: "app123...",
│   │   airtableApiKey: "pat456...",
│   │   groqKey: "gsk789...",
│   │   n8nSendWa: "https://..."
│   ├── stats: {
│   │   totalUsers: 5,
│   │   activeUsers: 3,
│   │   lastActivity: timestamp
│   │
│   └── users/ (subcollection)
│       ├── user_123/
│       │   ├── name: "John"
│       │   ├── email: "john@pt-xyz.com"
│       │   ├── role: "Owner"
│       │   ├── status: "active"
│       │
│       └── user_456/
│           ├── name: "Jane"
│           ├── email: "jane@pt-xyz.com"
│           ├── role: "Admin"
│
│   └── activities/ (subcollection)
│       ├── activity_789/
│       │   ├── action: "API_CONFIG_CHANGED"
│       │   ├── description: "Updated airtableKey"
│       │   ├── userId: "user_123"
│       │   ├── timestamp: timestamp

├── workspace_pt-abc/
│   ├── name: "PT ABC"
│   └── ... (same structure)
```

---

## 🔐 Security Best Practices

### 1. API Key Encryption (Production)

```javascript
// Encrypt sebelum save ke Firebase
import CryptoJS from 'crypto-js'

const encryptApiKey = (key, secretKey) => {
  return CryptoJS.AES.encrypt(key, secretKey).toString()
}

const decryptApiKey = (encrypted, secretKey) => {
  return CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8)
}
```

### 2. Data Isolation

**Always filter by workspaceId:**

```javascript
// ❌ WRONG
const orders = await fetchTable('Orders')

// ✅ CORRECT
const orders = await fetchTable('Orders')
  .filter(order => order.workspaceId === currentWorkspace)
```

### 3. Role-Based Access Control

```
Owner:   Full access (create workspace, manage users, edit settings)
Admin:   Manage orders, buyers, products (no user/settings)
Manager: View & manage orders, pipeline, analytics
User:    Chat, orders, follow-ups
Viewer:  View-only (overview, analytics)
```

---

## 💰 Business Model

### Pricing Structure:

```
Basic Plan      - $49/month
├── 1 workspace
├── 5 users
├── Airtable integration
└── Email support

Pro Plan        - $149/month
├── 3 workspaces
├── 20 users
├── Airtable + Custom APIs
└── Priority support

Enterprise      - Custom
├── Unlimited workspaces
├── Unlimited users
├── White-label (custom domain)
└── Dedicated support + SLA
```

### Revenue Calculation:

```
100 clients × $49/month = $4,900/month = $58,800/year
100 clients × $149/month = $14,900/month = $178,800/year

1000 clients (Enterprise avg) = $50k+/month 🤑
```

---

## 🚀 Client Onboarding Flow

### Step 1: Sign Up
Client go ke `https://nantara.com/setup`

### Step 2: Workspace Setup
```
1. Fill form: Business name, email, password
2. Choose colors & customize branding
3. Connect API keys (Airtable, Groq, N8N)
4. DONE! Dashboard live
```

### Step 3: Team Management
Owner bisa:
- Add/remove users
- Assign roles
- View activity logs
- Manage API configs

---

## 📝 Next Steps

### Phase 1 (Immediate):
- [ ] Setup Firebase project
- [ ] Update .env dengan Firebase credentials
- [ ] Test `/setup` flow locally
- [ ] Deploy ke Vercel/Netlify

### Phase 2 (1-2 weeks):
- [ ] Setup payment system (Stripe)
- [ ] Create landing page
- [ ] Marketing website
- [ ] Admin dashboard untuk manage clients

### Phase 3 (2-4 weeks):
- [ ] API key encryption
- [ ] Webhook system untuk client events
- [ ] Custom domain support
- [ ] Advanced analytics

---

## 🔍 Testing Checklist

### Test Workspace Creation:
- [ ] Go ke `/setup`
- [ ] Fill form → workspace created di Firebase
- [ ] Check Firebase Firestore untuk workspace
- [ ] Verify user created

### Test Workspace Login:
- [ ] Go ke `/workspace-login`
- [ ] Login dengan credentials yang baru
- [ ] Check localStorage untuk workspaceId
- [ ] Verify redirect ke dashboard

### Test Multi-Tenant Isolation:
- [ ] Create workspace A (company "PT XYZ")
- [ ] Create workspace B (company "PT ABC")
- [ ] Login ke workspace A
- [ ] Verify hanya data PT XYZ yang terlihat
- [ ] Login ke workspace B
- [ ] Verify hanya data PT ABC yang terlihat

### Test Branding:
- [ ] Edit branding di workspace A (color: blue)
- [ ] Edit branding di workspace B (color: red)
- [ ] Verify masing-masing workspace show correct color

---

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [React Firebase Setup](https://firebase.google.com/docs/web/setup)
- [Vercel Deployment](https://vercel.com/docs)

---

## 🆘 Troubleshooting

### Firebase Config not loading
```javascript
// Debug: Check .env
console.log(process.env.REACT_APP_FIREBASE_PROJECT_ID)

// Should print your project ID
```

### Workspace not detected
```javascript
// Debug: Check workspace detection
console.log('Workspace ID:', getWorkspaceId())
console.log('Hostname:', window.location.hostname)
console.log('Pathname:', window.location.pathname)
```

### Firestore permission denied
```
Check security rules are updated correctly
Verify user.workspaceId matches document path
Check browser DevTools network tab untuk error details
```

---

**Happy scaling! 🚀** Ready untuk 1000+ clients!
