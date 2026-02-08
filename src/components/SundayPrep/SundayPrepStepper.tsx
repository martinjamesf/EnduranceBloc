
import React from 'react'

export type SundayPrepStep = {
  id: string
  title: string
  description?: string
  optional?: boolean
}

type Props = {
  steps: SundayPrepStep[]
  currentStep: number
  onStepChange?: (nextIndex: number) => void
  onNext?: () => void | Promise<void>
  onPrevious?: () => void | Promise<void>
  disableNext?: boolean
  disablePrevious?: boolean
  className?: string
}

// Lightweight stepper for the 5-step Sunday Prep ritual.
// Handles progress UI and navigation but leaves validation to the parent.
export function SundayPrepStepper({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  disableNext,
  disablePrevious,
  className
}: Props) {
  const totalSteps = steps.length
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0

  const handlePrevious = async () => {
    if (disablePrevious || currentStep === 0) return
    if (onPrevious) {
      await onPrevious()
    } else if (onStepChange) {
      onStepChange(currentStep - 1)
    }
  }

  const handleNext = async () => {
    if (disableNext || currentStep >= totalSteps - 1) return
    if (onNext) {
      await onNext()
    } else if (onStepChange) {
      onStepChange(currentStep + 1)
    }
  }

  return (
    <div className={`w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4 md:p-5 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sunday Prep</p>
          <h2 className="text-lg font-semibold text-white">Step {currentStep + 1} of {totalSteps}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <span className="h-2 w-2 rounded-full bg-secondary/80" aria-hidden />
          {steps[currentStep]?.title}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-secondary to-primary"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>

      {/* Step indicators */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isComplete = index < currentStep

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange?.(index)}
              className={`group flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                isActive
                  ? 'border-secondary/80 bg-secondary/10'
                  : isComplete
                    ? 'border-secondary/40 bg-secondary/5 hover:border-secondary/60'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  isActive
                    ? 'border-secondary/90 bg-secondary/20 text-white'
                    : isComplete
                      ? 'border-secondary/60 bg-secondary/10 text-secondary'
                      : 'border-white/20 bg-white/5 text-slate-300'
                }`}
                aria-label={`Step ${index + 1} ${step.title}`}
              >
                {isComplete ? '✓' : index + 1}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {step.title}
                  {step.optional && <span className="ml-1 text-xs text-slate-400">(optional)</span>}
                </span>
                {step.description && (
                  <span className="text-xs text-slate-400">{step.description}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={disablePrevious || currentStep === 0}
          className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNext}
            disabled={disableNext || currentStep >= totalSteps - 1}
            className="px-5 py-2 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            {currentStep >= totalSteps - 1 ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
