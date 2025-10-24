// odoo.js
import xmlrpc from "xmlrpc";
import dotenv from "dotenv";
import fs from "fs";
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
        console.log("🔑 Odoo UID:", uid);
        resolve(uid);
      }
    });
  });
}

// Helper: read last sync time from .lastsync.json
export function getLastSyncTime() {
  if (!fs.existsSync(".lastsync.json")) return null;
  const data = fs.readFileSync(".lastsync.json", "utf-8");
  return JSON.parse(data).lastSync || null;
}

// Helper: save last sync time
export function saveLastSyncTime(time) {
  fs.writeFileSync(".lastsync.json", JSON.stringify({ lastSync: time }));
}

// Fetch products in batches to avoid parse errors
export async function getOdooProductsBatch(batchSize = 500) {
  if (!uid) await connectOdoo();

  const lastSyncTime = getLastSyncTime();
  let offset = 0;
  let allProducts = [];
  let domain = [];

  if (lastSyncTime) {
    domain.push(['write_date', '>', lastSyncTime]);
  }

  while (true) {
    const products = await new Promise((resolve, reject) => {
      models.methodCall(
        "execute_kw",
        [
          odooDb,
          uid,
          odooPassword,
          "product.product",
          "search_read",
          [domain],
          {
            fields: [
              "id", "name", "default_code", "list_price", "description_sale", "qty_available", 
              "image_1920", "code", "ashley_item_name", "detailed_description", "image_set", 
              "product_details", "lst_price", "item_weight_lbs", "shade", "seat_count", 
              "number_of_drawers", "material", "lifestyle", "knockout", "large_image_url", 
              "item_code", "additional_dimensions", "friendly_dimensions", "dimension_sketch", 
              "ashley_status", "navigable_categories", "parts_drawings_url", "x_item_glb_url", 
              "assembly_instructions_url", "color_swatch", "item_room_image", "retail_type", 
              "color", "items_per_case", "x_item_assembly_you_tube_video_key1", 
              "x_item_assembly_you_tube_video_key2", "x_item_assembly_you_tube_video_key3"
            ],
            offset,
            limit: batchSize
          },
        ],
        (err, value) => {
          if (err) reject(err);
          else resolve(value);
        }
      );
    });

    if (!products.length) break;
    allProducts = allProducts.concat(products);
    offset += products.length;
    console.log(`🛒 Fetched ${allProducts.length} products so far...`);
  }

  return allProducts;
}
