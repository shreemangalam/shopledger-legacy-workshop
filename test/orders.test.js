const assert = require('node:assert/strict');
const test = require('node:test');
const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

function makePendingOrderDb() {
  return {
    products: [
      { id: 6, stock: 4, reserved: 1 },
      { id: 4, stock: 22, reserved: 4 },
    ],
    orders: [
      {
        id: 1007,
        status: 'pending',
        paymentMode: 'cash',
        items: [{ id: 6, qty: 2 }, { id: 4, qty: 2 }],
      },
    ],
  };
}

test('cancelling a pending order marks it cancelled and returns its items to stock', () => {
  const db = makePendingOrderDb();
  const [order] = db.orders;

  const result = orders.cancel(db, order.id);

  assert.equal(result.ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual(db.products, [
    { id: 6, stock: 6, reserved: 1 },
    { id: 4, stock: 24, reserved: 4 },
  ]);
});

test('cancelling an order a second time is rejected without changing inventory', () => {
  const db = makePendingOrderDb();
  const [order] = db.orders;
  assert.equal(orders.cancel(db, order.id).ok, true);
  const productsBeforeRetry = structuredClone(db.products);

  const result = orders.cancel(db, order.id);

  assert.equal(result.ok, false);
  assert.match(result.error, /already cancelled/);
  assert.deepEqual(db.products, productsBeforeRetry);
});

test('cancelling a Khata order restores stock and reverses the debit exactly once', () => {
  const db = makePendingOrderDb();
  const [order] = db.orders;
  const customer = { id: 4, openingBalance: 100, totalBilled: 80, totalSettled: 30 };
  db.customers = [customer];
  order.customerId = customer.id;
  order.paymentMode = 'khata';
  order.total = 60;
  const restoredProducts = [
    { id: 6, stock: 6, reserved: 1 },
    { id: 4, stock: 24, reserved: 4 },
  ];

  assert.equal(ledger.chargeOrderToKhata(db, customer.id, order.total).ok, true);
  assert.equal(customer.balance, 210);

  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.equal(order.status, 'cancelled');
  assert.deepEqual(db.products, restoredProducts);
  assert.equal(customer.totalBilled, 80);
  assert.equal(customer.balance, 150);

  const retry = orders.cancel(db, order.id);

  assert.equal(retry.ok, false);
  assert.match(retry.error, /already cancelled/);
  assert.deepEqual(db.products, restoredProducts);
  assert.equal(customer.totalBilled, 80);
  assert.equal(customer.balance, 150);
});
