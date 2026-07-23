import { AlertTriangle, CheckCircle2, FileCode2, Maximize2, Minimize2, X } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SqlToolbar } from './SqlToolbar'

interface SqlPreviewProps {
  sql: string
  isValid: boolean
  totalModules: number
  activeModules: number
  inactiveModules: number
  fileName: string
  onCopy: () => void
}

const KEYWORD_LINE = /^(UPDATE\s+TAB_LOJA|SET|WHERE)$/
const SET_FIELD_LINE = /^(\s*)(TAB_LOJA\.[A-Za-z_][A-Za-z0-9_]*)(\s*)(=)(\s*)('[^']*')(,)?(\s*--\s*.*)?$/
const WHERE_LINE = /^(\s*)(TAB_LOJA\.COD_LOJA)(\s*)(=)(\s*)(\d+)(;)$/

function highlightLine(line: string): ReactNode {
  if (line.trim() === '') return ' '

  if (/^--/.test(line.trim())) {
    return <span className="text-slate-500 italic">{line}</span>
  }

  if (KEYWORD_LINE.test(line.trim())) {
    return <span className="font-semibold text-sky-400">{line}</span>
  }

  const fieldMatch = line.match(SET_FIELD_LINE)
  if (fieldMatch) {
    const [, indent, field, sp1, eq, sp2, value, comma, comment] = fieldMatch
    return (
      <>
        {indent}
        <span className="text-violet-300">{field}</span>
        {sp1}
        <span className="text-slate-500">{eq}</span>
        {sp2}
        <span className="text-emerald-300">{value}</span>
        {comma && <span className="text-slate-500">{comma}</span>}
        {comment && <span className="text-slate-500 italic">{comment}</span>}
      </>
    )
  }

  const whereMatch = line.match(WHERE_LINE)
  if (whereMatch) {
    const [, indent, field, sp1, eq, sp2, value, semi] = whereMatch
    return (
      <>
        {indent}
        <span className="text-violet-300">{field}</span>
        {sp1}
        <span className="text-slate-500">{eq}</span>
        {sp2}
        <span className="text-orange-300">{value}</span>
        <span className="text-slate-500">{semi}</span>
      </>
    )
  }

  return line
}

interface CodeBlockProps {
  lines: string[]
  maxHeightClassName: string
}

function CodeBlock({ lines, maxHeightClassName }: CodeBlockProps) {
  return (
    <div className={`overflow-x-auto overflow-y-auto ${maxHeightClassName}`}>
      <pre className="min-w-full py-3 font-mono text-[13px] leading-6 text-slate-200 sm:text-sm">
        <code>
          {lines.map((line, index) => (
            <div key={index} className="flex">
              <span className="w-10 shrink-0 select-none border-r border-slate-800/70 pr-3 text-right text-[11px] text-slate-600">
                {index + 1}
              </span>
              <span className="flex-1 whitespace-pre pl-3">{highlightLine(line)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}

export function SqlPreview({
  sql,
  isValid,
  totalModules,
  activeModules,
  inactiveModules,
  fileName,
  onCopy,
}: SqlPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const lines = sql.split('\n')

  useEffect(() => {
    if (!isFullscreen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="sql-preview-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="sql-preview-heading" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <FileCode2 size={18} className="text-blue-600" aria-hidden="true" />
          Pré-visualização do script
        </h2>
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          aria-label="Visualizar script em tela cheia"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <Maximize2 size={14} aria-hidden="true" />
          Tela cheia
        </button>
      </div>

      <div aria-live="polite">
        {isValid ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
            Script válido — pronto para copiar ou baixar
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            Corrija os campos destacados
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Processados</p>
          <p className="text-lg font-semibold tabular-nums text-slate-900">{totalModules}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Ativos</p>
          <p className="text-lg font-semibold tabular-nums text-blue-700">{activeModules}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Inativos</p>
          <p className="text-lg font-semibold tabular-nums text-slate-600">{inactiveModules}</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117] shadow-inner">
        <SqlToolbar fileName={fileName} onCopy={onCopy} copyDisabled={!isValid} />
        <CodeBlock lines={lines} maxHeightClassName="max-h-[50vh] lg:max-h-[55vh]" />
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/70 px-4 py-1.5 text-[11px] text-slate-500">
          <span>SQL · UPDATE TAB_LOJA</span>
          <span>{lines.length} linhas</span>
        </div>
      </div>

      {isFullscreen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 p-3 sm:p-6">
            <div className="flex items-center justify-between gap-2 pb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <FileCode2 size={18} aria-hidden="true" />
                Pré-visualização do script — tela cheia
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="Fechar tela cheia"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                <Minimize2 size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Sair da tela cheia</span>
                <X size={14} className="sm:hidden" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1117] shadow-inner">
              <SqlToolbar fileName={fileName} onCopy={onCopy} copyDisabled={!isValid} />
              <CodeBlock lines={lines} maxHeightClassName="max-h-[calc(100vh-9rem)]" />
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
