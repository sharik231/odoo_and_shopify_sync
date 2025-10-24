// odoo-xmlrpc.js
const xmlrpc = require('xmlrpc');

const odooUrl = "https://nirvana-erp-14jul25-21993730.dev.odoo.com";
const db = "nirvana-erp-14jul25-21993730";
const username = "shopify.user@gmail.com";
const password = "0076fd6e76df37501c72aa61d41e8a74a7d5adfc";

// Create XML-RPC clients
const commonClient = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` });
const objectClient = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/object` });

// helper to use Promise style
function methodCall(client, method, params) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, val) => {
      if (err) return reject(err);
      resolve(val);
    });
  });
}

(async function main(){
  try {
    // authenticate -> returns uid
    const uid = await methodCall(commonClient, 'authenticate', [db, username, password, {}]);
    console.log('UID:', uid);

    // Example: read product.template (add your x_ fields here)
    const products = await methodCall(objectClient, 'execute_kw', [
      db, uid, password,
      'product.template', 'search_read',
      [[]], // domain: empty = all
      { fields: ['id','name','qty_available','list_price','default_code','x_image_set','x_material'], limit: 10, context: { lang: 'es_CO' } }
    ]);
    console.log('Products (template):', products);

    // If you need variant-level info (product.product)
    const variants = await methodCall(objectClient, 'execute_kw', [
      db, uid, password,
      'product.product', 'search_read',
      [[]],
      { fields: ['id','product_tmpl_id','name','default_code','qty_available','list_price'], limit: 10 }
    ]);
    console.log('Variants:', variants);

    // Example: create a sale.order (like your commented Python)
    const saleOrderId = await methodCall(objectClient, 'execute_kw', [
      db, uid, password,
      'sale.order', 'create',
      [{
        partner_id: 688,
        date_order: '2025-08-28',
        order_line: [
          [0, 0, { product_id: 25394, product_uom_qty: 1, price_unit: 4444.0 }],
          [0, 0, { product_id: 110, product_uom_qty: 1, price_unit: 2222.0 }]
        ]
      }]
    ]);
    console.log('Created sale.order id:', saleOrderId);

  } catch (err) {
    console.error('ERROR:', err);
  }
})();
