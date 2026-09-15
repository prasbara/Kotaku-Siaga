'use client'

import React, { useState } from 'react'
import { Sparkles, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react'
import type { QuizQuestion } from '@/lib/data/education-resilience'

interface KnowledgeQuizProps {
  questions: QuizQuestion[]
  moduleTitle: string
}

export function KnowledgeQuiz({ questions, moduleTitle }: KnowledgeQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState<boolean>(false)

  const handleSelect = (questionId: string, optionIdx: number) => {
    if (showResults) return
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }))
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined)
  const score = questions.filter((q) => answers[q.id] === q.correctIndex).length

  const handleReset = () => {
    setAnswers({})
    setShowResults(false)
  }

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#007a5a] mb-1">
            <Sparkles className="w-4 h-4 text-[#007a5a]" />
            Uji Pemahaman Kesiapsiagaan Warga
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d]">
            Kuis Pemahaman: {moduleTitle}
          </h3>
          <p className="text-xs text-[#696969] mt-0.5">
            Pastikan Anda dan keluarga telah memahami konsep kunci mitigasi risiko lingkungan perkotaan.
          </p>
        </div>

        {showResults && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ebf7f3] border border-[#007a5a]/30 text-xs font-mono font-bold text-[#007a5a] self-start sm:self-auto">
            <Award className="w-4 h-4 text-[#007a5a]" />
            Skor: {score} / {questions.length} Benar
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const selectedOption = answers[q.id]
          const isCorrect = selectedOption === q.correctIndex

          return (
            <div key={q.id} className="p-4 sm:p-5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#4a154b] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <div className="font-bold text-sm sm:text-base text-[#1d1d1d]">
                  {q.question}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2 pt-1 pl-8">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selectedOption === optIdx
                  let optionStyle = 'bg-white border-[#e6e6e6] hover:bg-[#f4ede4]/40 text-[#1d1d1d]'

                  if (showResults) {
                    if (optIdx === q.correctIndex) {
                      optionStyle = 'bg-[#ebf7f3] border-[#007a5a] text-[#007a5a] font-bold'
                    } else if (isThisSelected) {
                      optionStyle = 'bg-[#fdf0ec] border-[#cc4117] text-[#cc4117]'
                    }
                  } else if (isThisSelected) {
                    optionStyle = 'bg-[#f9f0ff] border-[#4a154b] text-[#4a154b] font-bold shadow-xs'
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={showResults}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-3 ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {showResults && optIdx === q.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-[#007a5a] shrink-0" />
                      )}
                      {showResults && isThisSelected && optIdx !== q.correctIndex && (
                        <XCircle className="w-4 h-4 text-[#cc4117] shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Feedback and Scientific Explanation */}
              {showResults && (
                <div
                  className={`mt-3 ml-8 p-3 rounded-xl border text-xs leading-relaxed ${
                    isCorrect
                      ? 'bg-[#ebf7f3] border-[#007a5a]/40 text-[#007a5a]'
                      : 'bg-[#fef3c7] border-[#d97706]/40 text-[#b45309]'
                  }`}
                >
                  <span className="font-bold block mb-1">
                    {isCorrect ? '✓ Jawaban Anda Benar!' : '⚠️ Jawaban Kurang Tepat.'}
                  </span>
                  <p className="text-[#1d1d1d]">{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Submit / Reset Actions */}
      <div className="pt-2 flex items-center justify-between gap-4">
        {!showResults ? (
          <button
            type="button"
            disabled={!allAnswered}
            onClick={() => setShowResults(true)}
            className={`px-5 py-2.5 rounded-[90px] text-xs font-bold transition-all ${
              allAnswered
                ? 'bg-[#4a154b] hover:bg-[#611f69] text-white shadow-sm cursor-pointer'
                : 'bg-[#e6e6e6] text-[#999] cursor-not-allowed'
            }`}
          >
            {allAnswered ? 'Periksa Jawaban Saya' : `Jawab Semua Pertanyaan (${Object.keys(answers).length}/${questions.length})`}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[90px] bg-[#f4ede4] hover:bg-[#ebdccb] text-xs font-bold text-[#4a154b] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ulangi Kuis
          </button>
        )}
      </div>
    </div>
  )
}
