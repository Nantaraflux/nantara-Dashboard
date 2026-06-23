# Nantara Dashboard

Professional B2B operations platform. Enterprise-grade CRM, order management, WhatsApp integration, and AI-powered analytics.

## Setup (5 steps)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- **Airtable**: Base ID and API key from airtable.com/account
- **Groq**: API key from console.groq.com
- **N8N**: Webhook URLs from your N8N instance
- **WhatsApp**: Default sender number in 628xxx format

### 3. Set up Airtable

Create tables in your Airtable base matching these names exactly:
- `Orders` — order_id, buyer_id, date, items, total, profit, status, payment_status, channel, notes
- `Buyers` — buyer_id, name, phone, company, pipeline_stage, churn_risk, total_orders, total_spend, tags, notes
- `Products` — product_id, name, sku, cost, price, margin_pct, stock_qty, category, active
- `Chats` — chat_id, buyer_id, type, sender, message, timestamp, intent, resolved
- `Pipeline` — deal_id, buyer_id, stage, probability, expected_value, days_in_stage, next_action
- `Followups` — followup_id, buyer_id, type, message_template, scheduled_date, status, result, created_by

### 4. Run locally

```bash
npm start
```

Opens at http://localhost:3000

### 5. Deploy to Vercel

```bash
npx vercel
```

Set environment variables in Vercel dashboard under Settings → Environment Variables.

## Tech Stack

- React 18 + React Router v6
- Tailwind CSS (custom enterprise color system)
- Chart.js 4 (via react-chartjs-2)
- @hello-pangea/dnd (Kanban drag-drop)
- Airtable REST API
- Groq LLM API (AI insights)
- N8N webhooks (WhatsApp automation)

## Pages

| Page | Description |
|------|------------|
| Overview | Command center with metrics, charts, AI insights |
| Chat | WhatsApp inbox with 3-column layout |
| Orders | Order management with detail modal, invoice printing |
| Buyers | CRM database with profile modals, stage management |
| Pipeline | Kanban board with drag-drop stage transitions |
| Products | Product database with inline editing |
| Analytics | Deep analytics with multiple chart types, AI reports |
| Follow-ups | Automation queue with bulk actions |
| Settings | Configuration, connection testing, data export |
