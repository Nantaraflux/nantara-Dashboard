import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRealtime } from '../hooks/useRealtime'
import { useAirtable } from '../hooks/useAirtable'
import { createRecord } from '../config/airtable'
import { sendWhatsApp } from '../config/n8n'
import { useToast } from '../components/ui/Toast'
import Badge from '../components/ui/Badge'

export default function Chat() {
  const { data: chats, loading: loadingChats } = useRealtime('Chats', 10000)
  const { data: buyers } = useAirtable('Buyers', {}, 60000)
  const [selectedBuyer, setSelectedBuyer] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const threadRef = useRef(null)
  const toast = useToast()

  const buyerMap = useMemo(() => {
    const map = {}
    buyers.forEach(b => { map[b.buyer_id || b.id] = b })
    return map
  }, [buyers])

  const conversations = useMemo(() => {
    const grouped = {}
    chats.forEach(c => {
      const bid = c.buyer_id || 'unknown'
      if (!grouped[bid]) grouped[bid] = { buyerId: bid, messages: [], lastMessage: null, unread: 0 }
      grouped[bid].messages.push(c)
      if (!grouped[bid].lastMessage || new Date(c.timestamp) > new Date(grouped[bid].lastMessage.timestamp)) {
        grouped[bid].lastMessage = c
      }
      if (!c.resolved && c.type === 'inbound') grouped[bid].unread++
    })

    let list = Object.values(grouped)
      .sort((a, b) => new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0))

    if (filter === 'unresolved') list = list.filter(c => c.unread > 0)
    if (filter === 'owner') list = list.filter(c => c.messages.some(m => m.sender === 'owner'))
    if (filter === 'customer') list = list.filter(c => c.messages.some(m => m.sender === 'customer'))

    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c => {
        const buyer = buyerMap[c.buyerId]
        return buyer?.name?.toLowerCase().includes(s) || c.buyerId.toLowerCase().includes(s)
      })
    }

    return list
  }, [chats, filter, search, buyerMap])

  const activeConvo = conversations.find(c => c.buyerId === selectedBuyer)
  const activeBuyer = buyerMap[selectedBuyer]
  const sortedMessages = activeConvo?.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) || []

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [sortedMessages.length])

  const handleSend = async () => {
    if (!reply.trim() || !activeBuyer) return
    setSending(true)
    try {
      await createRecord('Chats', {
        buyer_id: selectedBuyer,
        type: 'outbound',
        sender: 'owner',
        message: reply,
        timestamp: new Date().toISOString(),
        resolved: false,
      })

      if (activeBuyer.phone) {
        try {
          await sendWhatsApp(activeBuyer.phone, reply)
        } catch {}
      }

      setReply('')
      toast.success('Message sent')
    } catch (err) {
      toast.error('Failed to send: ' + err.message)
    }
    setSending(false)
  }

  const fmtTime = (ts) => {
    if (!ts) return ''
    try {
      const d = new Date(ts)
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  const initials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-0 border border-border rounded-md overflow-hidden">
      {/* Left: Conversation list */}
      <div className="w-[260px] flex-shrink-0 bg-bg-surface border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-elevated border border-border rounded-md px-3 py-1.5 text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent-primary"
          />
          <div className="flex gap-1 mt-2">
            {['all', 'unresolved', 'owner', 'customer'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[11px] rounded capitalize ${filter === f ? 'bg-accent-primary text-white' : 'text-txt-tertiary hover:text-txt-secondary'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-3 py-3 border-b border-border animate-pulse">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-elevated" />
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-bg-elevated rounded mb-2" />
                    <div className="h-3 w-full bg-bg-elevated rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-txt-tertiary text-[13px]">No conversations</div>
          ) : conversations.map(c => {
            const buyer = buyerMap[c.buyerId]
            return (
              <button
                key={c.buyerId}
                onClick={() => setSelectedBuyer(c.buyerId)}
                className={`w-full text-left px-3 py-3 border-b border-border flex gap-3 transition-colors ${selectedBuyer === c.buyerId ? 'bg-bg-elevated' : 'hover:bg-bg-elevated/50'}`}
              >
                <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-secondary text-[11px] font-semibold">{initials(buyer?.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-txt-primary font-medium truncate">{buyer?.name || c.buyerId}</span>
                    <span className="text-[10px] text-txt-tertiary ml-2">{fmtTime(c.lastMessage?.timestamp)}</span>
                  </div>
                  <div className="text-[12px] text-txt-tertiary truncate">{c.lastMessage?.message || ''}</div>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center text-[10px] text-white font-semibold flex-shrink-0 mt-1">
                    {c.unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Center: Thread */}
      <div className="flex-1 flex flex-col bg-bg-primary">
        {!selectedBuyer ? (
          <div className="flex-1 flex items-center justify-center text-txt-tertiary text-[13px]">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border bg-bg-surface flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <span className="text-accent-secondary text-[11px] font-semibold">{initials(activeBuyer?.name)}</span>
              </div>
              <div>
                <div className="text-[13px] text-txt-primary font-medium">{activeBuyer?.name || selectedBuyer}</div>
                <div className="text-[11px] text-txt-tertiary">{activeBuyer?.phone || ''}</div>
              </div>
            </div>
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {sortedMessages.map(msg => {
                const isCustomer = msg.sender === 'customer'
                const isAi = msg.sender === 'ai'
                return (
                  <div key={msg.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-md ${
                      isCustomer ? 'bg-bg-elevated' : isAi ? 'bg-accent-primary/20' : 'bg-bg-surface border border-border'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-txt-tertiary uppercase">{msg.sender}</span>
                        {msg.intent && <Badge>{msg.intent}</Badge>}
                      </div>
                      <div className="text-[13px] text-txt-primary whitespace-pre-wrap">{msg.message}</div>
                      <div className="text-[10px] text-txt-tertiary mt-1">{fmtTime(msg.timestamp)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="p-3 border-t border-border bg-bg-surface">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-bg-elevated border border-border rounded-md px-3 py-2 text-[13px] text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent-primary"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  className="px-4 py-2 bg-accent-primary text-white text-[13px] font-medium rounded-md hover:bg-accent-secondary transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: Customer info */}
      <div className="w-[280px] flex-shrink-0 bg-bg-surface border-l border-border overflow-y-auto hidden xl:block">
        {activeBuyer ? (
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent-primary/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-accent-secondary text-lg font-semibold">{initials(activeBuyer.name)}</span>
              </div>
              <div className="text-[14px] text-txt-primary font-semibold">{activeBuyer.name}</div>
              <div className="text-[12px] text-txt-secondary">{activeBuyer.company || ''}</div>
              <div className="text-[12px] text-txt-tertiary">{activeBuyer.phone || ''}</div>
              {activeBuyer.pipeline_stage && <Badge>{activeBuyer.pipeline_stage}</Badge>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-txt-tertiary">Total Orders</span>
                <span className="text-txt-primary font-medium">{activeBuyer.total_orders || 0}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-txt-tertiary">Total Spend</span>
                <span className="text-txt-primary font-medium">Rp {(activeBuyer.total_spend || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-txt-tertiary">Avg Order Value</span>
                <span className="text-txt-primary font-medium">Rp {(activeBuyer.avg_order_value || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`https://wa.me/${activeBuyer.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center px-3 py-2 bg-success/15 text-success text-[12px] font-medium rounded-md hover:bg-success/25 transition-colors"
              >
                Send WhatsApp
              </a>
              <button className="w-full px-3 py-2 bg-bg-elevated border border-border text-txt-secondary text-[12px] font-medium rounded-md hover:text-txt-primary transition-colors">
                Create Order
              </button>
              <button className="w-full px-3 py-2 bg-bg-elevated border border-border text-txt-secondary text-[12px] font-medium rounded-md hover:text-txt-primary transition-colors">
                Schedule Follow-up
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-txt-tertiary text-[13px]">Select a conversation to view customer info</div>
        )}
      </div>
    </div>
  )
}
