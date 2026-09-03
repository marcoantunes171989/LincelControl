import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NumberStepper } from '../components/NumberStepper'

describe('NumberStepper', () => {
  it('incrementa e decrementa chamando onChange com o próximo valor', async () => {
    const onChange = vi.fn()
    render(<NumberStepper value="5" onChange={onChange} label="PDVs ativos" />)

    await userEvent.click(screen.getByRole('button', { name: /aumentar pdvs ativos/i }))
    expect(onChange).toHaveBeenCalledWith('6')

    await userEvent.click(screen.getByRole('button', { name: /diminuir pdvs ativos/i }))
    expect(onChange).toHaveBeenCalledWith('4')
  })

  it('respeita min e max, desabilitando o botão correspondente', () => {
    render(<NumberStepper value="31" onChange={vi.fn()} label="Dia de vencimento" min={1} max={31} />)
    expect(screen.getByRole('button', { name: /aumentar dia de vencimento/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /diminuir dia de vencimento/i })).toBeEnabled()
  })

  it('não decrementa abaixo do min', async () => {
    const onChange = vi.fn()
    render(<NumberStepper value="0" onChange={onChange} label="PDVs ativos" min={0} />)
    expect(screen.getByRole('button', { name: /diminuir pdvs ativos/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /diminuir pdvs ativos/i }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('trata valor inválido como zero antes de aplicar o delta', async () => {
    const onChange = vi.fn()
    render(<NumberStepper value="" onChange={onChange} label="PDVs ativos" min={0} />)
    await userEvent.click(screen.getByRole('button', { name: /aumentar pdvs ativos/i }))
    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('desabilita ambos os botões quando disabled=true', () => {
    render(<NumberStepper value="5" onChange={vi.fn()} label="PDVs ativos" disabled />)
    expect(screen.getByRole('button', { name: /aumentar pdvs ativos/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /diminuir pdvs ativos/i })).toBeDisabled()
  })
})
