import type { BarcodeProduct } from '@/services/openFoodFacts';

const ML_FACTORS: Record<string, number> = { ml: 1, cl: 10, dl: 100, l: 1000 };

function toMillilitres(value: unknown, unit: string | undefined): number | undefined {
  const number = Number(value);
  const factor = ML_FACTORS[unit?.trim().toLowerCase() ?? ''];
  if (!Number.isFinite(number) || number <= 0 || !factor) return undefined;
  return number * factor;
}

export function getBarcodeVolumeMl(product: BarcodeProduct): number | undefined {
  const structured = toMillilitres(product.quantityValue, product.quantityUnit);
  if (structured !== undefined) return structured;
  // Only a single, unambiguous package volume. Serving sizes and multipacks are not inferred.
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*(ml|cl|dl|l)\s*$/i.exec(product.quantity ?? '');
  return match ? toMillilitres(match[1].replace(',', '.'), match[2]) : undefined;
}

export function getBarcodeServingMl(product: BarcodeProduct): number | undefined {
  const text = product.servingSize?.trim() ?? '';
  const volume = /^(\d+(?:[.,]\d+)?)\s*(ml|cl|dl|l)$/i.exec(text) ?? /\((\d+(?:[.,]\d+)?)\s*(ml|cl|dl|l)\)\s*$/i.exec(text);
  return volume ? toMillilitres(volume[1].replace(',', '.'), volume[2]) : undefined;
}

export function getDefaultProductAmount(product: BarcodeProduct): number {
  if (product.fromCatalog) return product.quantityValue ?? 100;
  if (product.productType === 'drink') return getBarcodeVolumeMl(product) ?? getBarcodeServingMl(product) ?? 100;
  return 100;
}

export function getProductQuantityLabel(product: BarcodeProduct): string | undefined {
  if (product.quantity?.trim()) return product.quantity;
  const volume = getBarcodeVolumeMl(product);
  return volume === undefined ? undefined : `${volume} ml`;
}
