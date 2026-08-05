import { CheckCircle2, Circle, Loader2, MinusCircle, TriangleAlert, XCircle } from 'lucide-react'
import { DIAGNOSTIC_STEPS, type StageResult } from '../../types/oracle'

interface DiagnosticStepListProps {
  stages: StageResult[]
  running?: boolean
}

function toneFor(stageKey: string, stages: StageResult[], running?: boolean) {
  const found = stages.find((item) => item.stage === stageKey)
  if (!found) return running ? 'idle' : 'idle'
  return found.status
}

const TONE_STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  skipped: 'border-slate-200 bg-slate-50 text-slate-600',
  running: 'border-blue-200 bg-blue-50 text-blue-800',
  idle: 'border-slate-200 bg-slate-50 text-slate-500',
} as const

export function DiagnosticStepList({ stages, running }: DiagnosticStepListProps) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {DIAGNOSTIC_STEPS.map((step) => {
        const stage = stages.find((item) => item.stage === step.stage)
        const tone = stage ? stage.status : running ? 'idle' : 'idle'
        const Icon =
          tone === 'success'
            ? CheckCircle2
            : tone === 'warning'
              ? TriangleAlert
              : tone === 'error'
                ? XCircle
                : tone === 'running'
                  ? Loader2
                  : tone === 'skipped'
                    ? MinusCircle
                    : Circle

        return (
          <li
            key={step.stage}
            className={`rounded-xl border px-3 py-2.5 text-sm ${TONE_STYLES[toneFor(step.stage, stages, running)]}`}
          >
            <div className="flex items-start gap-2">
              <Icon
                size={16}
                className={`mt-0.5 shrink-0 ${tone === 'running' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-semibold">{step.label}</p>
                <p className="mt-0.5 text-xs opacity-90">{stage?.message || 'Não executado'}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
