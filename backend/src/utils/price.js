/**
 * Preços no catálogo são guardados como texto ("R$ 129,00") pra exibição
 * direta no site. Pra somar valores com segurança (sem erro de ponto
 * flutuante), tudo que envolve cálculo passa por centavos (inteiros).
 */

function parseBRLToCents(str) {
  if (typeof str !== 'string') return null;
  const cleaned = str.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) return null;

  // "1.234,56" -> "1234.56" | "129,00" -> "129.00" | "129.00" -> "129.00"
  let normalized = cleaned;
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  const value = Number(normalized);
  if (Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

function formatCentsToBRL(cents) {
  const value = (cents / 100).toFixed(2).replace('.', ',');
  return 'R$ ' + value.replace(/(\d)(?=(\d{3})+,)/g, '$1.');
}

module.exports = { parseBRLToCents, formatCentsToBRL };
