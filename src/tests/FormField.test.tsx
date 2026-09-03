import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormField } from '../components/FormField'

describe('FormField — grid/flex overflow', () => {
  it('mantém min-w-0 no item do grid e no input para não vazar da célula (regressão da colisão Licença/PDVs)', () => {
    const { container } = render(
      <FormField
        id="num-dia-vencto"
        label="Dia de vencimento do boleto"
        dbField="NUM_DIA_VENCTO"
        value="10"
        onChange={vi.fn()}
        stepper
        min={1}
        max={31}
      />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toMatch(/\bmin-w-0\b/)

    const input = screen.getByLabelText('Dia de vencimento do boleto') as HTMLInputElement
    expect(input.className).toMatch(/\bmin-w-0\b/)
  })

  it('renderiza o stepper reutilizável quando stepper=true', () => {
    render(
      <FormField
        id="num-pdv"
        label="PDVs ativos"
        dbField="NUM_PDV"
        value="3"
        onChange={vi.fn()}
        stepper
        min={0}
      />,
    )
    expect(screen.getByRole('button', { name: /aumentar pdvs ativos/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /diminuir pdvs ativos/i })).toBeInTheDocument()
  })

  it('mantém a mensagem de erro associada via aria-describedby e role=alert', () => {
    render(
      <FormField
        id="num-dia-vencto"
        label="Dia de vencimento do boleto"
        dbField="NUM_DIA_VENCTO"
        value=""
        onChange={vi.fn()}
        error="Dia de vencimento do boleto é obrigatório."
      />,
    )
    const input = screen.getByLabelText(/dia de vencimento do boleto/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'num-dia-vencto-error')
    expect(screen.getByRole('alert')).toHaveTextContent('Dia de vencimento do boleto é obrigatório.')
  })
})
