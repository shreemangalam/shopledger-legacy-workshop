const assert = require('node:assert/strict');
const test = require('node:test');
const inventory = require('../lib/inventory');

function makeProduct(stock = 4) {
  return { id: 11, name: 'Chilli Powder', stock, reserved: 3 };
}

test('buying exactly the sellable quantity is accepted', () => {
  const product = makeProduct();

  assert.equal(inventory.getSellableStock(product), 1);

  const result = inventory.check([product], [{ id: product.id, qty: 1 }]);

  assert.equal(result.ok, true);
});

test('buying two units when only one is sellable is rejected', () => {
  const product = makeProduct();

  const result = inventory.check([product], [{ id: product.id, qty: 2 }]);

  assert.equal(result.ok, false);
});

test('repeated lines above the sellable quantity are rejected without changing inventory', () => {
  const products = [makeProduct()];
  const productsBefore = structuredClone(products);
  const items = [{ id: 11, qty: 1 }, { id: 11, qty: 1 }];

  const result = inventory.check(products, items);

  assert.equal(result.ok, false);
  assert.deepEqual(products, productsBefore);
});

test('repeated lines can use the exact sellable quantity while preserving reservations', () => {
  const product = makeProduct(5);
  const products = [product];
  const items = [{ id: 11, qty: 1 }, { id: 11, qty: 1 }];

  assert.equal(inventory.check(products, items).ok, true);
  inventory.reserve(products, items);

  assert.equal(product.stock, 3);
  assert.equal(product.reserved, 3);
  assert.equal(inventory.getSellableStock(product), 0);
});

test('numeric and string IDs that resolve to the same product share its sellable stock', () => {
  const product = makeProduct();
  const products = [product];

  for (const stringId of ['11', '011']) {
    assert.equal(inventory.find(products, stringId), product);
    const items = [{ id: product.id, qty: 1 }, { id: stringId, qty: 1 }];

    assert.equal(inventory.check(products, items).ok, false);
  }
});

test('different products are validated against their own sellable stock', () => {
  const products = [
    makeProduct(),
    { id: 12, name: 'Sunflower Oil', stock: 5, reserved: 4 },
  ];
  const items = [{ id: 11, qty: 1 }, { id: 12, qty: 1 }];

  assert.equal(inventory.check(products, items).ok, true);
});
