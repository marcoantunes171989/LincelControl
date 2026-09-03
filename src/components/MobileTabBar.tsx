import { Database, WandSparkles } from 'lucide-react'

type AppView = 'generator' | 'oracle'

interface MobileTabBarProps {
  view: AppView
  onChange: (view: AppView) => void
}

const TABS: { id: AppView; label: string; icon: typeof WandSparkles }[] = [
  { id: 'generator', label: 'Gerador', icon: WandSparkles },
  { id: 'oracle', label: 'Oracle', icon: Database },
]

/**
 * Barra de navegação inferior fixa (< lg) — padrão de app nativo para trocar
 * entre as duas seções, substituindo os botões de navegação do topo no
 * desktop. Fica acima da MobileActionBar quando ela também está visível
 * (ver --mobile-tabbar-h em index.css).
 */
export function MobileTabBar({ view, onChange }: MobileTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      style={{ minHeight: 'var(--mobile-tabbar-h)' }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
        {TABS.map((tab) => {
          const isActive = tab.id === view
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-full transition ${
                  isActive ? 'bg-blue-50' : ''
                }`}
              >
                <Icon size={18} aria-hidden="true" />
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
