const assert = require('node:assert/strict');
const test = require('node:test');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('buying the last sellable unit deducts physical stock and preserves reservations', () => {
  const product = { id: 11, name: 'Chilli Powder', stock: 4, reserved: 3 };
  const products = [product];
  const items = [{ id: product.id, qty: 1 }];

  const result = inventory.check(products, items);

  assert.equal(result.ok, true, result.msg);
  inventory.reserve(products, items);

  assert.equal(product.stock, 3);
  assert.equal(product.reserved, 3);
  assert.equal(inventory.getSellableStock(product), 0);
});

test('cancelling a pending order restores both products and preserves reservations', () => {
  const order = {
    id: 1007,
    status: 'pending',
    paymentMode: 'cash',
    items: [{ id: 6, qty: 2 }, { id: 4, qty: 2 }],
  };
  const db = {
    products: [
      { id: 6, stock: 1, reserved: 0 },
      { id: 4, stock: 22, reserved: 4 },
    ],
    orders: [order],
  };

  const result = orders.cancel(db, order.id);

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual(db.products.map(product => product.reserved), [0, 4]);
  assert.deepEqual(db.products.map(product => product.stock), [3, 24],
    'cancellation restores two physical units per product');
});
