/** Mantém só dígitos (máx. 14). */
export function somenteDigitosCnpj(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 14);
}

/** Máscara progressiva: 12.345.678/0001-90 */
export function formatarCnpj(valor: string | null | undefined) {
  const d = somenteDigitosCnpj(String(valor ?? ""));

  if (d.length <= 2) {
    return d;
  }
  if (d.length <= 5) {
    return `${d.slice(0, 2)}.${d.slice(2)}`;
  }
  if (d.length <= 8) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  }
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }

  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}
