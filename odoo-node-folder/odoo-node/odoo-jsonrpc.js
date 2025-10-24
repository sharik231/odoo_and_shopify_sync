// odoo-jsonrpc.js
const axios = require('axios');

const odooUrl = "https://nirvana-erp-14jul25-21993730.dev.odoo.com";
const db = "nirvana-erp-14jul25-21993730";
const username = "shopify.user@gmail.com";
const password = "0076fd6e76df37501c72aa61d41e8a74a7d5adfc"; // API key

let rqId = 1;
async function rpcCall(service, method, args) {
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: { service, method, args },
    id: rqId++
  };
  const res = await axios.post(odooUrl, payload, { timeout: 20000 });
  if (res.data.error) throw res.data.error;
  return res.data.result;
}

(async function main(){
  try {
    // login -> returns uid
    const uid = await rpcCall('common', 'login', [db, username, password]);
    console.log('UID:', uid);

    // product.template search_read (include custom fields x_*)
    const products = await rpcCall('object', 'execute_kw', [
      db, uid, password,
      'product.template', 'search_read',
      [[]],
      { fields: ['id','name','qty_available','list_price','default_code','x_image_set','x_material'], limit: 10, context: { lang: 'es_CO' } }
    ]);
    console.log('Products (template):', products);

    // create sale.order
    const saleOrderId = await rpcCall('object', 'execute_kw', [
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
    console.error('ERROR:', err.response?.data || err.message || err);
  }
})();
