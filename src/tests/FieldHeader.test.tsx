import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FieldHeader } from '../components/FieldHeader'

describe('FieldHeader', () => {
  it('renderiza o label vinculado ao input e o badge do campo físico', () => {
    render(<FieldHeader htmlFor="num-dia-vencto" label="Dia de vencimento do boleto" fieldCode="NUM_DIA_VENCTO" />)
    const label = screen.getByText('Dia de vencimento do boleto')
    expect(label.tagName).toBe('LABEL')
    expect(label).toHaveAttribute('for', 'num-dia-vencto')
    expect(screen.getByText('NUM_DIA_VENCTO')).toBeInTheDocument()
  })

  it('marca campos obrigatórios com asterisco decorativo', () => {
    const { rerender } = render(<FieldHeader htmlFor="x" label="Campo" fieldCode="X" required />)
    expect(screen.getByText('*')).toBeInTheDocument()

    rerender(<FieldHeader htmlFor="x" label="Campo" fieldCode="X" />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})
