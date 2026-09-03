import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActionBar } from '../components/ActionBar'
import { ApplyOracleConfirmationModal } from '../components/oracle/ApplyOracleConfirmationModal'
import type { LicenseUpdatePreviewResponse } from '../types/oracle'

type ActionBarProps = Parameters<typeof ActionBar>[0]

function renderActionBar(overrides: Partial<ActionBarProps> = {}) {
  const props: ActionBarProps = {
    disabled: false,
    onCopy: vi.fn(),
    onRequestDownload: vi.fn(),
    onRestoreExample: vi.fn(),
    onRequestClear: vi.fn(),
    onApply: vi.fn(),
    applyDisabled: false,
    applyBusy: false,
    oracleConnected: true,
    onConfigureOracle: vi.fn(),
    ...overrides,
  }
  render(<ActionBar {...props} />)
  return props
}

describe('ActionBar — botão Aplicar', () => {
  it('fica desabilitado quando o formulário é inválido', () => {
    renderActionBar({ applyDisabled: true })
    expect(screen.getByRole('button', { name: /^aplicar$/i })).toBeDisabled()
  })

  it('fica desabilitado e orienta a conectar quando o Oracle está desconectado', () => {
    renderActionBar({ applyDisabled: true, oracleConnected: false })
    expect(screen.getByRole('button', { name: /^aplicar$/i })).toBeDisabled()
    expect(screen.getByText(/conecte ao oracle antes de aplicar/i)).toBeInTheDocument()
  })

  it('fica habilitado e dispara onApply quando Oracle conectado e formulário válido', async () => {
    const props = renderActionBar({ applyDisabled: false, oracleConnected: true })
    const button = screen.getByRole('button', { name: /^aplicar$/i })
    expect(button).toBeEnabled()
    await userEvent.click(button)
    expect(props.onApply).toHaveBeenCalledTimes(1)
  })

  it('botão "Configurar Oracle" navega para a integração', async () => {
    const props = renderActionBar({ oracleConnected: false, applyDisabled: true })
    await userEvent.click(screen.getByRole('button', { name: /configurar oracle/i }))
    expect(props.onConfigureOracle).toHaveBeenCalledTimes(1)
  })
})

const PREVIEW: LicenseUpdatePreviewResponse = {
  ok: true,
  previewToken: 'token.signature',
  store: { codLoja: 1, cnpj: '02274225000161', descricao: 'Loja Teste' },
  database: { alias: 'ORCL', host: '192.168.0.238', port: 1521, serviceName: 'orcl.intersoul', username: 'INTERSOLID' },
  changedFields: [{ field: 'NUM_LICENCA', oldValue: 1, newValue: 9090 }],
  changedCount: 1,
  message: '1 campo(s) serão alterados.',
}

describe('ApplyOracleConfirmationModal', () => {
  it('mostra os campos alterados e exige clique explícito para confirmar', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ApplyOracleConfirmationModal open preview={PREVIEW} busy={false} onCancel={onCancel} onConfirm={onConfirm} />,
    )

    expect(screen.getByText(/1 campo\(s\) serão alterados/i)).toBeInTheDocument()
    expect(screen.getByText('NUM_LICENCA')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /aplicar atualização/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('cancelar não confirma a atualização', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ApplyOracleConfirmationModal open preview={PREVIEW} busy={false} onCancel={onCancel} onConfirm={onConfirm} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /^cancelar$/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('desabilita a confirmação quando não há alterações', () => {
    render(
      <ApplyOracleConfirmationModal
        open
        preview={{ ...PREVIEW, changedCount: 0, changedFields: [], message: 'Nenhuma alteração necessária.' }}
        busy={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /aplicar atualização/i })).toBeDisabled()
  })

  it('não renderiza quando fechado', () => {
    render(<ApplyOracleConfirmationModal open={false} preview={PREVIEW} busy={false} onCancel={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.queryByText(/atualização da base oracle/i)).not.toBeInTheDocument()
  })
})
