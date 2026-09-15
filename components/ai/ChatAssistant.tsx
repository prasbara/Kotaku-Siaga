'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, Sparkles, ShieldCheck } from 'lucide-react'
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
        'Halo! Saya Civic Copilot KotaKu Siaga.\n\nSaya memproses telemetri hidrometeorologi BMKG, status CCTV PantauSemar, serta laporan kebencanaan terverifikasi warga Kota Semarang.',
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
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-20 right-4 sm:right-6 z-[80] w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] max-h-[calc(100dvh-7rem)] bg-white border border-[#e6e6e6] rounded-[20px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header in Deep Aubergine */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#4a154b] text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  Civic AI Copilot
                  <span className="w-2 h-2 rounded-full bg-[#007a5a] ring-2 ring-white/30 animate-pulse"></span>
                </span>
                <span className="text-[11px] text-[#d9bdde] font-mono block">
                  KotaKu Siaga • Semarang Intelligence
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-[#d9bdde] hover:text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Tutup panel analitik"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Guardrail Disclaimer Banner */}
          <div className="px-4 py-2 bg-[#f4ede4] border-b border-[#e6e6e6] text-[11px] text-[#696969] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4a154b] shrink-0" />
            <span>Konteks terbatas pada kebencanaan & hidrologi Semarang</span>
          </div>

          {/* Messages stream */}
          <div className="p-4 space-y-3.5 flex-1 min-h-0 max-h-[min(380px,50dvh)] overflow-y-auto text-xs leading-relaxed bg-[#fdfbf9]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'p-3.5 rounded-[16px] text-xs shadow-sm',
                  msg.role === 'assistant'
                    ? 'bg-[#f9f0ff] border border-[#e6e6e6] text-[#1d1d1d] rounded-bl-sm mr-auto max-w-[90%]'
                    : 'bg-[#4a154b] text-white rounded-br-sm ml-auto max-w-[85%]'
                )}
              >
                <div
                  className={cn(
                    'text-[10px] font-mono uppercase mb-1.5 flex items-center justify-between',
                    msg.role === 'assistant' ? 'text-[#696969]' : 'text-[#d9bdde]'
                  )}
                >
                  <span>{msg.role === 'assistant' ? '🤖 Telemetry Intelligence' : '👤 Warga'}</span>
                  {msg.role === 'assistant' && (
                    <span className="text-[9px] text-[#4a154b] font-bold">OpenRouter/Free</span>
                  )}
                </div>
                <div className="whitespace-pre-line font-body leading-relaxed">
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-[#e6e6e6] text-[9px] font-mono text-[#696969] uppercase flex items-center justify-between">
                    <span>Basis: BMKG · PantauSemar · EOC</span>
                    <span className="text-[#007a5a] font-semibold">ISO 37120</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="p-3.5 border border-[#e6e6e6] rounded-[16px] bg-[#f9f0ff] text-xs text-[#4a154b] font-mono flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#4a154b] animate-ping"></span>
                <span>Menganalisis matriks wilayah & simulasi pompa...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick inquiries */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 border-t border-[#e6e6e6] bg-[#f4ede4]/40">
              <span className="text-[10px] font-mono uppercase text-[#696969] block mb-2 font-bold tracking-wider">
                Kueri Analitik Cepat:
              </span>
              <div className="flex flex-col gap-1.5">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs p-2.5 rounded-[90px] border border-[#e6e6e6] bg-white hover:bg-[#f9f0ff] hover:border-[#4a154b]/30 text-[#1d1d1d] transition-all truncate flex items-center gap-2 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#4a154b] shrink-0" />
                    <span className="truncate font-medium">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input field */}
          <div className="p-3 border-t border-[#e6e6e6] bg-white flex gap-2 items-center">
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
              placeholder="Tanyakan mitigasi atau status wilayah..."
              className="flex-1 h-11 px-4 rounded-[90px] bg-[#fcfaf7] border border-[#e6e6e6] text-xs text-[#1d1d1d] placeholder:text-[#696969] focus:outline-none focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b] font-body"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="h-11 px-5 rounded-[90px] bg-[#4a154b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#611f69] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Pill — Secondary Action, Stacked Cleanly Above SOS */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-20 right-4 sm:right-6 z-40 min-h-[42px] sm:min-h-[46px] px-3.5 sm:px-4.5 py-2 sm:py-2.5 rounded-full bg-[#4a154b] text-white text-[11px] sm:text-xs font-bold tracking-wide uppercase hover:bg-[#611f69] active:scale-95 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group cursor-pointer border border-white/20 select-none"
        aria-label="Toggle Civic AI Copilot"
        title="Buka Asisten Kecerdasan Buatan Civic AI Copilot"
      >
        <div className="relative">
          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#007a5a] ring-2 ring-[#4a154b] animate-pulse"></span>
        </div>
        <span className="whitespace-nowrap">{isOpen ? 'Tutup Copilot' : 'Civic AI Copilot'}</span>
      </button>

    </>
  )
}
