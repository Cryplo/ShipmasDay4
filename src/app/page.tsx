'use client'

import { useState, useCallback } from 'react'
import { analyzeMeal, type MealAnalysis } from './actions/analyze-meal'

type CardState = 'empty' | 'loading' | 'result'

export default function Home() {
  const [state, setState] = useState<CardState>('empty')
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleImageUpload = useCallback(async (file: File) => {
    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setState('loading')

    try {
      // Convert to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
      })
      reader.readAsDataURL(file)
      const base64 = await base64Promise

      // Analyze
      const result = await analyzeMeal(base64)
      setAnalysis(result)
      setState('result')
    } catch (error) {
      console.error('Error:', error)
      setState('empty')
      setPreviewUrl(null)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  const reset = useCallback(() => {
    setState('empty')
    setAnalysis(null)
    setPreviewUrl(null)
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-neutral-800">
            Protein Check
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Drop a meal photo. Get a protein reality check.
          </p>
        </header>

        {/* The Card */}
        <div
          className={`
            bg-white border-2 border-neutral-200
            transition-colors duration-200
            ${state === 'empty' ? 'hover:border-neutral-300' : ''}
          `}
        >
          {state === 'empty' && (
            <EmptyCard
              onDrop={handleDrop}
              onFileInput={handleFileInput}
            />
          )}

          {state === 'loading' && (
            <LoadingCard previewUrl={previewUrl} />
          )}

          {state === 'result' && analysis && (
            <ResultCard
              analysis={analysis}
              previewUrl={previewUrl}
              onReset={reset}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center">
          <p className="text-xs text-neutral-400">
            Estimates only. Not medical advice.
          </p>
        </footer>
      </div>
    </main>
  )
}

function EmptyCard({
  onDrop,
  onFileInput
}: {
  onDrop: (e: React.DragEvent) => void
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <label
      className={`
        block cursor-pointer p-8
        ${isDragging ? 'bg-neutral-50' : ''}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { setIsDragging(false); onDrop(e) }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={onFileInput}
        className="hidden"
      />

      <div className="text-center">
        {/* Upload icon */}
        <div className="mb-4 flex justify-center">
          <svg
            className="w-12 h-12 text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <p className="text-sm text-neutral-500 mb-1">
          Drop a meal photo here
        </p>
        <p className="text-xs text-neutral-400">
          or click to browse
        </p>
      </div>

      {/* Unknown values display */}
      <div className="mt-8 pt-6 border-t border-neutral-100">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-neutral-200">?g</p>
            <p className="text-xs text-neutral-400 mt-1">protein</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-neutral-200">? cal</p>
            <p className="text-xs text-neutral-400 mt-1">calories</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-neutral-200">Verdict: waiting for photo</p>
        </div>
      </div>
    </label>
  )
}

function LoadingCard({ previewUrl }: { previewUrl: string | null }) {
  return (
    <div className="p-6">
      {previewUrl && (
        <div className="mb-6 aspect-video relative overflow-hidden bg-neutral-100">
          <img
            src={previewUrl}
            alt="Meal"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="flex items-center gap-2 text-neutral-600">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm font-medium">Checking protein...</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="h-4 bg-neutral-100 animate-pulse w-3/4" />
        <div className="h-4 bg-neutral-100 animate-pulse w-1/2" />
        <div className="h-4 bg-neutral-100 animate-pulse w-2/3" />
      </div>
    </div>
  )
}

function ResultCard({
  analysis,
  previewUrl,
  onReset
}: {
  analysis: MealAnalysis
  previewUrl: string | null
  onReset: () => void
}) {
  const verdictColor = {
    'adequate': 'text-emerald-700 bg-emerald-50 border-emerald-200',
    'low-muscle': 'text-amber-700 bg-amber-50 border-amber-200',
    'low-satiety': 'text-rose-700 bg-rose-50 border-rose-200',
  }[analysis.verdict]

  return (
    <div className="p-6">
      {/* Image preview */}
      {previewUrl && (
        <div className="mb-6 aspect-video overflow-hidden bg-neutral-100">
          <img
            src={previewUrl}
            alt="Meal"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Food description */}
      <p className="text-sm text-neutral-600 mb-4">
        {analysis.foodDescription}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-neutral-50 border border-neutral-100 text-center">
          <p className="text-3xl font-bold text-neutral-800">
            {analysis.protein}g
          </p>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">
            Protein
          </p>
        </div>
        <div className="p-4 bg-neutral-50 border border-neutral-100 text-center">
          <p className="text-3xl font-bold text-neutral-800">
            {analysis.calorieMin}-{analysis.calorieMax}
          </p>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">
            Calories
          </p>
        </div>
      </div>

      {/* Verdict */}
      <div className={`p-3 border mb-4 ${verdictColor}`}>
        <p className="text-sm font-medium">
          {analysis.verdictText}
        </p>
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-neutral-50 border border-neutral-100">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">
          Suggestion
        </p>
        <p className="text-sm text-neutral-700">
          {analysis.recommendation}
        </p>
      </div>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="
          mt-6 w-full py-3 px-4
          text-sm font-medium text-neutral-600
          border-2 border-neutral-200
          hover:border-neutral-300 hover:text-neutral-700
          transition-colors duration-150
        "
      >
        Check another meal
      </button>
    </div>
  )
}
