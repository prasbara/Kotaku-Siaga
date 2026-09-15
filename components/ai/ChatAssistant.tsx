'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  X,
  Send,
  Bot,
  Sparkles,
  ShieldCheck,
  MapPin,
  FileText,
  PhoneCall,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageAction {
  label: string
  href: string
  type: 'MAP' | 'REPORT' | 'SOS' | 'CCTV' | 'INFO'
}

interface MessageSource {
  name: string
  status: 'AVAILABLE' | 'UNAVAILABLE'
  timestampWib: string
  detail: string
}

interface ContextMeta {
  district?: string | null
  district_slug?: string | null
  zone?: string
  timestamp_wib?: string
  flood_status?: string
  verified_reports_count?: number
  max_flood_depth_cm?: number | null
  rainfall_mm_h?: number | null
  risk_score?: number
  risk_level?: string
  confidence_grade?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  actions?: MessageAction[]
  sources?: MessageSource[]
  meta?: ContextMeta
}

const QUICK_QUESTIONS = [
  'Apakah di Genuk sedang banjir?',
  'Bagaimana kondisi cuaca & hujan di Semarang sekarang?',
  'Berapa skor risiko di Semarang Utara?',
  'Apakah CCTV di Kaligawe aktif?',
]

const QUICK_LOCATION_CHIPS = [
  { label: 'Genuk', query: 'Apakah di Genuk sedang banjir?' },
  { label: 'Kaligawe', query: 'Bagaimana kondisi di Kaligawe saat ini?' },
  { label: 'Tanjung Emas', query: 'Apakah di Tanjung Emas ada banjir rob?' },
  { label: 'Tembalang', query: 'Bagaimana status risiko di Tembalang?' },
  { label: 'Cuaca Sekarang', query: 'Bagaimana kondisi curah hujan di Semarang sekarang?' },
]

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Halo! Saya Civic AI Copilot 2.0 KotaKu Siaga.\n\nSaya memproses data telemetri multi-sumber secara real-time: curah hujan BMKG/Open-Meteo, 70 CCTV PantauSemar, laporan warga terverifikasi, serta indeks risiko D-RISK (ISO 37120) Kota Semarang.\n\nSilakan tanyakan kondisi titik tertentu atau kesiapsiagaan lingkungan.',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isLoading])

  const toggleSources = (idx: number) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

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
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Data interpretasi situasi belum dapat dimuat.',
        actions: data.actions || [],
        sources: data.sources || [],
        meta: data.context_meta || undefined,
      }

      setMessages((prev) => [...prev, newAssistantMessage])
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
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-20 right-4 sm:right-6 z-[80] w-[calc(100vw-2rem)] sm:w-[440px] max-w-[440px] max-h-[calc(100dvh-6.5rem)] bg-white border border-[#e6e6e6] rounded-[22px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 font-sans">
          {/* Header in Deep Aubergine */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#4a154b] text-white shrink-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  Civic AI Copilot 2.0
                  <span className="w-2 h-2 rounded-full bg-[#007a5a] ring-2 ring-white/30 animate-pulse"></span>
                </span>
                <span className="text-[11px] text-[#d9bdde] font-mono block">
                  KotaKu Siaga • Grounded Intelligence
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-[#d9bdde] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Tutup panel analitik"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Telemetry Status Bar */}
          <div className="px-4 py-2 bg-[#f4ede4] border-b border-[#e6e6e6] text-[11px] text-[#4a154b] flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#007a5a] shrink-0" />
              <span>Multi-Source Live Fusion</span>
            </div>
            <span className="text-[10px] text-[#696969]">ISO 37120 Verified</span>
          </div>

          {/* Quick Location Chips (Horizontal scrollable) */}
          <div className="px-3 py-2 bg-[#faf7f4] border-b border-[#e6e6e6] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-mono font-bold text-[#696969] shrink-0 uppercase mr-1">
              Pintas:
            </span>
            {QUICK_LOCATION_CHIPS.map((chip, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => sendMessage(chip.query)}
                className="px-2.5 py-1 rounded-full bg-white border border-[#e6e6e6] hover:border-[#4a154b] hover:bg-[#f9f0ff] text-[11px] text-[#1d1d1d] font-medium whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="p-4 space-y-4 flex-1 min-h-0 max-h-[min(400px,52dvh)] overflow-y-auto text-xs leading-relaxed bg-[#fdfbf9]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'p-3.5 rounded-[18px] text-xs shadow-xs transition-all',
                  msg.role === 'assistant'
                    ? 'bg-[#f9f0ff] border border-[#ecd9f2] text-[#1d1d1d] rounded-bl-sm mr-auto max-w-[92%]'
                    : 'bg-[#4a154b] text-white rounded-br-sm ml-auto max-w-[85%]'
                )}
              >
                {/* Header tag */}
                <div
                  className={cn(
                    'text-[10px] font-mono uppercase mb-2 flex items-center justify-between pb-1.5 border-b',
                    msg.role === 'assistant'
                      ? 'text-[#696969] border-[#ecd9f2]'
                      : 'text-[#d9bdde] border-white/15'
                  )}
                >
                  <span className="font-bold flex items-center gap-1">
                    {msg.role === 'assistant' ? (
                      <>
                        <Bot className="w-3 h-3 text-[#4a154b]" />
                        <span>Civic Intelligence</span>
                      </>
                    ) : (
                      <span>Warga Kota</span>
                    )}
                  </span>
                  {msg.role === 'assistant' && (
                    <span className="text-[9px] text-[#007a5a] font-bold bg-[#ebf7f3] px-1.5 py-0.5 rounded border border-[#007a5a]/20">
                      LIVE GROUNDED
                    </span>
                  )}
                </div>

                {/* Message Content */}
                <div className="whitespace-pre-line leading-relaxed font-sans">
                  {msg.content}
                </div>

                {/* Interactive Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#ecd9f2] flex flex-wrap gap-1.5">
                    {msg.actions.map((act, aIdx) => (
                      <Link
                        key={aIdx}
                        href={act.href}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-2xs',
                          act.type === 'SOS'
                            ? 'bg-[#cc4117] hover:bg-[#b03713] text-white'
                            : act.type === 'REPORT'
                            ? 'bg-[#4a154b] hover:bg-[#611f69] text-white'
                            : 'bg-white hover:bg-[#f4ede4] text-[#4a154b] border border-[#ecd9f2]'
                        )}
                      >
                        {act.type === 'MAP' && <MapPin className="w-3.5 h-3.5 shrink-0" />}
                        {act.type === 'REPORT' && <FileText className="w-3.5 h-3.5 shrink-0" />}
                        {act.type === 'SOS' && <PhoneCall className="w-3.5 h-3.5 shrink-0" />}
                        {act.type === 'CCTV' && <Video className="w-3.5 h-3.5 shrink-0" />}
                        <span>{act.label}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Source Transparency Dropdown Pill */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[#ecd9f2]">
                    <button
                      type="button"
                      onClick={() => toggleSources(i)}
                      className="w-full flex items-center justify-between text-[10px] font-mono text-[#696969] hover:text-[#4a154b] transition-colors cursor-pointer py-0.5"
                    >
                      <span className="font-bold flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#4a154b]" />
                        Sumber Data Terintegrasi ({msg.sources.length})
                      </span>
                      {expandedSources[i] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {expandedSources[i] && (
                      <div className="mt-2 space-y-1.5 bg-white p-2.5 rounded-xl border border-[#ecd9f2] text-[10px] font-mono">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-start justify-between gap-2 pb-1 border-b border-[#f0f0f0] last:border-none last:pb-0"
                          >
                            <div>
                              <span className="font-bold text-[#1d1d1d] block">
                                {src.name}
                              </span>
                              <span className="text-[#696969] text-[9px] block">
                                {src.detail}
                              </span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ebf7f3] text-[#007a5a] font-bold shrink-0">
                              {src.timestampWib}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="p-3.5 border border-[#ecd9f2] rounded-[18px] bg-[#f9f0ff] text-xs text-[#4a154b] font-mono flex items-center gap-2.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#4a154b] animate-ping"></span>
                <span>Mengambil telemetri aktual & memverifikasi fakta...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Inquiries (Shown on fresh conversation) */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 border-t border-[#e6e6e6] bg-[#f4ede4]/40">
              <span className="text-[10px] font-mono uppercase text-[#696969] block mb-2 font-bold tracking-wider">
                Pertanyaan Situasional:
              </span>
              <div className="flex flex-col gap-1.5">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs p-2.5 rounded-xl border border-[#e6e6e6] bg-white hover:bg-[#f9f0ff] hover:border-[#4a154b]/30 text-[#1d1d1d] transition-all truncate flex items-center gap-2 shadow-2xs cursor-pointer"
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
              placeholder="Tanyakan kondisi wilayah, cuaca, atau genangan..."
              className="flex-1 h-11 px-4 rounded-xl bg-[#fcfaf7] border border-[#e6e6e6] text-xs text-[#1d1d1d] placeholder:text-[#696969] focus:outline-none focus:border-[#4a154b] focus:ring-1 focus:ring-[#4a154b] font-sans"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="h-11 px-5 rounded-xl bg-[#4a154b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#611f69] disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Pill — Stacked cleanly above bottom nav / SOS */}
      <button
        type="button"
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
