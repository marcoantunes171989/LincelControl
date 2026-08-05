/**
 * Normaliza o caminho do Oracle Client informado no navegador.
 * Aceita pasta ou caminho apontando para OCI.DLL / libclntsh.so.
 */
export function normalizeOracleClientDir(input: string): string {
  let value = input.trim().replace(/[/\\]+$/, '')
  if (!value) return ''

  const base = value.split(/[/\\]/).pop()?.toLowerCase() ?? ''
  if (base === 'oci.dll' || base === 'oci.d' || base === 'libclntsh.so' || /^libclntsh\.so/i.test(base)) {
    value = value.replace(/[/\\][^/\\]+$/, '')
  }

  return value
}
