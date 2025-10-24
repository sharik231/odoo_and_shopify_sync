// shopifyToOdooUpdate.js
import xmlrpc from "xmlrpc";
import dotenv from "dotenv";

dotenv.config();

const odooUrl = process.env.ODOO_URL;
const odooDb = process.env.ODOO_DB;
const odooUsername = process.env.ODOO_USERNAME;
const odooPassword = process.env.ODOO_PASSWORD;

let uid;
const common = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` });
const models = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/object` });

async function connectOdoo() {
  return new Promise((resolve, reject) => {
    common.methodCall("authenticate", [odooDb, odooUsername, odooPassword, {}], (err, result) => {
      if (err) reject(err);
      else {
        uid = result;
        console.log("🔑 Connected to Odoo:", uid);
        resolve(uid);
      }
    });
  });
}

export async function updateOdooProduct(productData) {
  if (!uid) await connectOdoo();

  const sku = productData.default_code || null;
  if (!sku) {
    console.log("⚠️ Skipping product with no SKU");
    return;
  }

  return new Promise((resolve, reject) => {
    models.methodCall(
      "execute_kw",
      [
        odooDb,
        uid,
        odooPassword,
        "product.product",
        "search_read",
        [[["default_code", "=", sku]]],
        { fields: ["id", "product_tmpl_id"], limit: 1 },
      ],
      async (err, result) => {
        if (err) return reject(err);

        if (result.length) {
          const productId = result[0].id;
          const tmplId = result[0].product_tmpl_id?.[0];

          // Separate qty_available from the rest of the product data
          const { qty_available, ...otherData } = productData;

          // Update product fields normally
          if (Object.keys(otherData).length) {
            await new Promise((resolveWrite, rejectWrite) => {
              models.methodCall(
                "execute_kw",
                [
                  odooDb,
                  uid,
                  odooPassword,
                  "product.product",
                  "write",
                  [[productId], otherData],
                ],
                (err2, value) => {
                  if (err2) rejectWrite(err2);
                  else resolveWrite(value);
                }
              );
            });
          }

          // ✅ Update stock correctly
          if (qty_available !== undefined && qty_available !== null) {
            await new Promise((resolveQty, rejectQty) => {
              models.methodCall(
                "execute_kw",
                [
                  odooDb,
                  uid,
                  odooPassword,
                  "stock.change.product.qty",
                  "create",
                  [
                    {
                      product_id: productId,
                      product_tmpl_id: tmplId,
                      new_quantity: qty_available,
                    },
                  ],
                ],
                (err3, changeId) => {
                  if (err3) return rejectQty(err3);
                  models.methodCall(
                    "execute_kw",
                    [
                      odooDb,
                      uid,
                      odooPassword,
                      "stock.change.product.qty",
                      "change_product_qty",
                      [[changeId]],
                    ],
                    (err4, value) => {
                      if (err4) rejectQty(err4);
                      else {
                        console.log(`✅ Updated Odoo stock: ${sku} → ${qty_available}`);
                        resolveQty(value);
                      }
                    }
                  );
                }
              );
            });
          }

          resolve(true);
        } else {
          // Product not found → create new
          models.methodCall(
            "execute_kw",
            [
              odooDb,
              uid,
              odooPassword,
              "product.product",
              "create",
              [productData],
            ],
            (err2, value) => {
              if (err2) reject(err2);
              else {
                console.log(`🆕 Created new Odoo product: ${productData.name}`);
                resolve(value);
              }
            }
          );
        }
      }
    );
  });
}
