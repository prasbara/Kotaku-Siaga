'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  'Bagaimana sistem menghitung skor prioritas?',
  'Apa sumber data cuaca dan rob yang digunakan?',
  'Bagaimana mitigasi luapan di Genuk & Tanjung Emas?',
]

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'SISTEM CIVIC COPILOT AKTIF (Civic Radar Disaster Intelligence).\n\nSaya memproses telemetri hidrometeorologi BMKG, status CCTV PantauSemar, serta laporan kebencanaan warga khusus wilayah Kota Semarang.',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim()
    if (!messageText || isLoading) return

    const userMessage: Message = { role: 'user', content: messageText }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message || 'Data interpretasi belum dapat dimuat.',
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Gagal menghubungi model analitik. Pastikan koneksi atau parameter lingkungan telah terpasang.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Analytical Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] max-h-[calc(100dvh-5.5rem)] bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/40 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30 bg-surface-container shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                  Civic AI Copilot
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                </span>
                <span className="text-[10px] text-secondary font-mono block">
                  Civic Radar Disaster Intelligence • Kota Semarang
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors"
              aria-label="Tutup panel analitik"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages stream */}
          <div className="p-4 space-y-3.5 flex-1 min-h-0 max-h-[min(380px,50dvh)] overflow-y-auto text-xs leading-relaxed">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'p-3 rounded-lg text-xs',
                  msg.role === 'assistant'
                    ? 'border border-outline-variant/30 bg-surface-container text-on-surface'
                    : 'border border-primary/30 bg-primary/10 text-primary ml-auto max-w-[85%]'
                )}
              >
                <div className="text-[9px] font-mono uppercase text-on-surface-variant mb-1 flex items-center justify-between">
                  <span>{msg.role === 'assistant' ? '🤖 Telemetry Intelligence' : '👤 Pertanyaan Warga'}</span>
                  {msg.role === 'assistant' && (
                    <span className="text-[9px] text-secondary font-bold">openrouter/free</span>
                  )}
                </div>
                <div className="whitespace-pre-line font-body leading-relaxed">
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <div className="mt-2 pt-2 border-t border-outline-variant/20 text-[9px] font-mono text-on-surface-variant/80 uppercase flex items-center justify-between">
                    <span>Basis: BMKG · PantauSemar · EOC</span>
                    <span className="text-secondary font-semibold">OpenRouter AI</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="p-3 border border-outline-variant/30 rounded-lg bg-surface-container text-xs text-primary font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span>Menganalisis matriks wilayah & simulasi pompa...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick inquiries */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 border-t border-outline-variant/20 pt-2 bg-surface-container-lowest/50">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1.5 font-semibold">
                Kueri Analitik Cepat:
              </span>
              <div className="space-y-1">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-[11px] p-2 rounded border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors truncate flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input field */}
          <div className="p-3 border-t border-outline-variant/30 bg-surface-container flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ketik pertanyaan analitik atau mitigasi..."
              className="flex-1 h-9 px-3 rounded bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary font-body"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="h-9 px-3.5 rounded bg-primary text-on-primary text-xs font-semibold uppercase hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 h-10 px-4 rounded-lg bg-surface-container-high border border-primary/40 text-primary text-xs font-mono font-bold uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-all shadow-lg flex items-center gap-2 group"
        aria-label="Toggle AI Copilot"
      >
        <div className="relative">
          <Bot className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
        </div>
        <span>{isOpen ? 'Tutup Copilot' : 'AI Copilot'}</span>
      </button>
    </>
  )
}
