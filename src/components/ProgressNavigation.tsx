import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Step {
  id: string
  label: string
}

const STEPS: Step[] = [
  { id: 'loja', label: 'Loja' },
  { id: 'licenca', label: 'Licença e PDVs' },
  { id: 'modulos', label: 'Módulos e integrações' },
  { id: 'revisao', label: 'Revisão e SQL' },
]

interface ProgressNavigationProps {
  completedSteps: ReadonlySet<string>
}

export function ProgressNavigation({ completedSteps }: ProgressNavigationProps) {
  const [activeId, setActiveId] = useState<string>(STEPS[0].id)

  useEffect(() => {
    const sections = STEPS.map((step) => document.getElementById(step.id)).filter(
      (element): element is HTMLElement => Boolean(element),
    )
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [])

  const handleNavigate = (id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
    setActiveId(id)
  }

  return (
    <nav
      aria-label="Etapas do formulário"
      className="sticky top-0 z-30 w-full min-w-0 border-b border-slate-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto min-w-0 max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <ol className="scrollbar-none flex min-w-0 gap-1 overflow-x-auto py-2">
          {STEPS.map((step, index) => {
            const isActive = step.id === activeId
            const isDone = completedSteps.has(step.id)
            return (
              <li key={step.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavigate(step.id)}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    {isDone && !isActive ? <Check size={12} /> : index + 1}
                  </span>
                  {step.label}
                  {isDone && <span className="sr-only"> (concluído)</span>}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
