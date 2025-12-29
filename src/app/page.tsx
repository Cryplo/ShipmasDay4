'use client'

import { useState, useCallback, useEffect } from 'react'
import { analyzeMeal, type MealAnalysis } from './actions/analyze-meal'

type CardState = 'empty' | 'loading' | 'result'

interface SavedMeal {
  id: string
  analysis: MealAnalysis
  imageUrl: string
  savedAt: number
}

const STORAGE_KEY = 'bulk-lab-saved-meals'

function getSavedMeals(): SavedMeal[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveMealToStorage(meal: SavedMeal): void {
  const meals = getSavedMeals()
  meals.unshift(meal)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals))
}

function deleteMealFromStorage(id: string): void {
  const meals = getSavedMeals().filter(m => m.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meals))
}

export default function Home() {
  const [state, setState] = useState<CardState>('empty')
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([])
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    setSavedMeals(getSavedMeals())
  }, [])

  const handleImageUpload = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setState('loading')

    try {
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
      })
      reader.readAsDataURL(file)
      const base64 = await base64Promise

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
    setIsSaved(false)
  }, [])

  const handleSaveMeal = useCallback(() => {
    if (!analysis || !previewUrl || isSaved) return
    
    const newMeal: SavedMeal = {
      id: Date.now().toString(),
      analysis,
      imageUrl: previewUrl,
      savedAt: Date.now()
    }
    
    saveMealToStorage(newMeal)
    setSavedMeals(getSavedMeals())
    setIsSaved(true)
    
    // Reset card after a brief delay to show "Saved" state
    setTimeout(() => {
      setState('empty')
      setAnalysis(null)
      setPreviewUrl(null)
      setIsSaved(false)
    }, 600)
  }, [analysis, previewUrl, isSaved])

  const handleDeleteMeal = useCallback((id: string) => {
    deleteMealFromStorage(id)
    setSavedMeals(getSavedMeals())
  }, [])

  return (
    <>
      {/* Sidebar toggle */}
      <button
        onClick={() => setIsFlyoutOpen(true)}
        className="
          fixed top-4 left-4 z-40
          w-9 h-9 flex items-center justify-center
          bg-white border border-bulk-200 rounded-notion
          hover:bg-bulk-150 transition-colors duration-150
        "
        title="View saved meals"
      >
        <svg className="w-4 h-4 text-bulk-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {savedMeals.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-accent-blue text-white text-[10px] font-medium flex items-center justify-center rounded-full">
            {savedMeals.length}
          </span>
        )}
      </button>

      {/* Flyout sidebar */}
      <MealHistoryFlyout
        isOpen={isFlyoutOpen}
        onClose={() => setIsFlyoutOpen(false)}
        meals={savedMeals}
        onDelete={handleDeleteMeal}
      />

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <header className="mb-10 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <h1 className="text-2xl font-semibold text-bulk-700 tracking-tight">
                Bulk Lab
              </h1>
            </div>
            <p className="text-bulk-500 text-[15px]">
              Instant protein analysis powered by AI
            </p>
          </header>

          {/* Main Card */}
          <div className="animate-slide-up">
            <div className="bg-white border border-bulk-200 rounded-notion-lg overflow-hidden">
              {state === 'empty' && (
                <EmptyCard onDrop={handleDrop} onFileInput={handleFileInput} />
              )}
              {state === 'loading' && (
                <LoadingCard previewUrl={previewUrl} />
              )}
              {state === 'result' && analysis && (
                <ResultCard
                  analysis={analysis}
                  previewUrl={previewUrl}
                  onReset={reset}
                  onSave={handleSaveMeal}
                  isSaved={isSaved}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center animate-fade-in">
            <p className="text-bulk-400 text-xs">
              Estimates only. Not medical or dietary advice.
            </p>
          </footer>
        </div>
      </main>
    </>
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
        block cursor-pointer p-8 transition-colors duration-150
        ${isDragging ? 'bg-accent-blue-light' : 'hover:bg-bulk-100'}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { setIsDragging(false); onDrop(e) }}
    >
      <input type="file" accept="image/*" onChange={onFileInput} className="hidden" />

      <div className="text-center py-6">
        {/* Upload icon */}
        <div className={`
          mx-auto mb-5 w-14 h-14 rounded-notion-lg flex items-center justify-center
          transition-colors duration-150
          ${isDragging ? 'bg-accent-blue text-white' : 'bg-bulk-150 text-bulk-400'}
        `}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <p className="text-bulk-700 font-medium text-[15px] mb-1">
          Drop a meal photo here
        </p>
        <p className="text-bulk-400 text-sm">
          or click to browse
        </p>
      </div>

      {/* Placeholder stats */}
      <div className="mt-6 pt-6 border-t border-bulk-200">
        <div className="grid grid-cols-2 gap-4">
          <StatBox label="Protein" value="--" unit="g" muted />
          <StatBox label="Calories" value="--" unit="" muted />
        </div>
      </div>
    </label>
  )
}

function LoadingCard({ previewUrl }: { previewUrl: string | null }) {
  return (
    <div className="p-6">
      {previewUrl && (
        <div className="mb-6 aspect-[4/3] relative overflow-hidden bg-bulk-100 rounded-notion-lg">
          <img src={previewUrl} alt="Meal" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 text-bulk-600">
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 border-2 border-bulk-200 rounded-full" />
                <div className="absolute inset-0 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="text-sm font-medium">Analyzing meal...</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="h-4 bg-bulk-150 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-bulk-150 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-bulk-150 rounded animate-pulse w-2/3" />
      </div>
    </div>
  )
}

function ResultCard({
  analysis,
  previewUrl,
  onReset,
  onSave,
  isSaved
}: {
  analysis: MealAnalysis
  previewUrl: string | null
  onReset: () => void
  onSave: () => void
  isSaved: boolean
}) {
  const verdictStyles = {
    'adequate': {
      bg: 'bg-accent-green-light',
      text: 'text-accent-green',
      border: 'border-accent-green/20',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    'low-muscle': {
      bg: 'bg-accent-orange-light',
      text: 'text-accent-orange',
      border: 'border-accent-orange/20',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    'low-satiety': {
      bg: 'bg-accent-red-light',
      text: 'text-accent-red',
      border: 'border-accent-red/20',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  }[analysis.verdict]

  return (
    <div className="p-6 animate-fade-in">
      {/* Image preview */}
      {previewUrl && (
        <div className="mb-6 aspect-[4/3] overflow-hidden bg-bulk-100 rounded-notion-lg">
          <img src={previewUrl} alt="Meal" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Food description */}
      <p className="text-bulk-600 text-[15px] leading-relaxed mb-5">
        {analysis.foodDescription}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox label="Protein" value={analysis.protein.toString()} unit="g" />
        <StatBox label="Calories" value={`${analysis.calorieMin}-${analysis.calorieMax}`} unit="" />
      </div>

      {/* Verdict */}
      <div className={`p-4 rounded-notion-lg border ${verdictStyles.bg} ${verdictStyles.border} mb-5`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${verdictStyles.text}`}>
            {verdictStyles.icon}
          </div>
          <div>
            <p className={`text-sm font-medium ${verdictStyles.text}`}>
              {analysis.verdictText}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="p-4 bg-bulk-100 rounded-notion-lg border border-bulk-200 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3.5 h-3.5 text-bulk-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs font-medium text-bulk-500 uppercase tracking-wider">
            Suggestion
          </span>
        </div>
        <p className="text-sm text-bulk-600 leading-relaxed">
          {analysis.recommendation}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={isSaved}
          className={`
            flex-1 py-2.5 px-4 rounded-notion text-sm font-medium
            transition-all duration-150
            ${isSaved 
              ? 'bg-accent-green-light text-accent-green cursor-default' 
              : 'bg-bulk-700 text-white hover:bg-bulk-800 active:scale-[0.98]'}
          `}
        >
          {isSaved ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          ) : 'Save Meal'}
        </button>
        <button
          onClick={onReset}
          className="
            flex-1 py-2.5 px-4 rounded-notion text-sm font-medium
            text-bulk-600 bg-bulk-100 border border-bulk-200
            hover:bg-bulk-150 hover:border-bulk-300
            transition-all duration-150 active:scale-[0.98]
          "
        >
          New Analysis
        </button>
      </div>
    </div>
  )
}

function StatBox({ 
  label, 
  value, 
  unit, 
  muted = false 
}: { 
  label: string
  value: string
  unit: string
  muted?: boolean 
}) {
  return (
    <div className={`p-4 rounded-notion-lg border ${muted ? 'bg-bulk-100 border-bulk-200' : 'bg-bulk-100 border-bulk-200'}`}>
      <div className="text-center">
        <p className={`text-2xl font-semibold tracking-tight ${muted ? 'text-bulk-300' : 'text-bulk-700'}`}>
          {value}<span className="text-lg font-medium">{unit}</span>
        </p>
        <p className="text-xs font-medium text-bulk-400 uppercase tracking-wider mt-1">
          {label}
        </p>
      </div>
    </div>
  )
}

function MealHistoryFlyout({
  isOpen,
  onClose,
  meals,
  onDelete
}: {
  isOpen: boolean
  onClose: () => void
  meals: SavedMeal[]
  onDelete: (id: string) => void
}) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const verdictStyles = (verdict: string) => ({
    'adequate': 'bg-accent-green-light text-accent-green',
    'low-muscle': 'bg-accent-orange-light text-accent-orange',
    'low-satiety': 'bg-accent-red-light text-accent-red',
  }[verdict] || 'bg-bulk-100 text-bulk-500')

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40 transition-opacity duration-200
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Flyout panel */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50
          bg-white border-r border-bulk-200
          transform transition-transform duration-250 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-14 px-4 border-b border-bulk-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-bulk-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-sm font-semibold text-bulk-700">
              Saved Meals
            </h2>
            {meals.length > 0 && (
              <span className="text-xs text-bulk-400 font-medium">
                ({meals.length})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-notion text-bulk-400 hover:bg-bulk-100 hover:text-bulk-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Meal list */}
        <div className="overflow-y-auto h-[calc(100%-56px)]">
          {meals.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-bulk-100 rounded-notion-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-bulk-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-sm font-medium text-bulk-600 mb-1">
                No saved meals yet
              </p>
              <p className="text-xs text-bulk-400">
                Analyze a meal and save it to track your protein intake
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {meals.map((meal, index) => (
                <div
                  key={meal.id}
                  className="group p-3 bg-white border border-bulk-200 rounded-notion-lg hover:bg-bulk-100 transition-all duration-150 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Image thumbnail */}
                  <div className="aspect-[16/10] overflow-hidden bg-bulk-100 rounded-notion mb-3">
                    <img
                      src={meal.imageUrl}
                      alt={meal.analysis.foodDescription}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Food description */}
                  <p className="text-sm font-medium text-bulk-700 mb-2 line-clamp-2 leading-snug">
                    {meal.analysis.foodDescription}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-bulk-700">
                      {meal.analysis.protein}g
                    </span>
                    <span className="text-bulk-300">|</span>
                    <span className="text-xs text-bulk-500">
                      {meal.analysis.calorieMin}-{meal.analysis.calorieMax} cal
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-notion uppercase tracking-wide ${verdictStyles(meal.analysis.verdict)}`}>
                      {meal.analysis.verdict.replace('-', ' ')}
                    </span>
                    <span className="text-[10px] text-bulk-400">
                      {formatDate(meal.savedAt)}
                    </span>
                  </div>

                  {/* Delete button - shows on hover */}
                  <button
                    onClick={() => onDelete(meal.id)}
                    className="
                      mt-3 w-full py-1.5 px-3 rounded-notion
                      text-xs font-medium text-bulk-500
                      bg-bulk-100 border border-transparent
                      hover:bg-accent-red-light hover:text-accent-red hover:border-accent-red/20
                      transition-colors duration-150
                    "
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
