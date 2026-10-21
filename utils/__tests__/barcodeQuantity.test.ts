import { getBarcodeVolumeMl, getDefaultProductAmount, getProductQuantityLabel } from '../barcodeQuantity';

const drink = { barcode: '123', name: 'Drink', productType: 'drink' as const, nutrition: {} };

it('uses package volume and converts litres or cl to ml', () => {
  expect(getDefaultProductAmount({ ...drink, quantityValue: 250, quantityUnit: 'ml' })).toBe(250);
  expect(getDefaultProductAmount({ ...drink, quantity: '1,5 L' })).toBe(1500);
  expect(getDefaultProductAmount({ ...drink, quantity: '33 cl' })).toBe(330);
  expect(getProductQuantityLabel({ ...drink, quantityValue: 250, quantityUnit: 'ml' })).toBe('250 ml');
});

it('uses Tropicana serving volume when the package volume is missing', () => {
  expect(getDefaultProductAmount({ ...drink, servingSize: '12 OZA (355 ml)' })).toBe(355);
  expect(getDefaultProductAmount({ ...drink, quantityValue: 1000, quantityUnit: 'ml', servingSize: '12 OZA (355 ml)' })).toBe(1000);
  expect(getProductQuantityLabel({ ...drink, servingSize: '12 OZA (355 ml)' })).toBeUndefined();
});

it('does not mistake grams, multipacks or missing quantities for a drink volume', () => {
  expect(getBarcodeVolumeMl({ ...drink, quantity: '6 x 330 ml' })).toBeUndefined();
  expect(getDefaultProductAmount({ ...drink, quantityValue: 450, quantityUnit: 'g' })).toBe(100);
  expect(getDefaultProductAmount(drink)).toBe(100);
  expect(getDefaultProductAmount({ ...drink, fromCatalog: true, quantityValue: 150 })).toBe(150);
});
