// shopifyToOdooSync.js
import dotenv from "dotenv";
import {
  shopifyFetch,
} from "./shopify.js";
import { updateOdooProduct } from "./shopifyToOdooUpdate.js";
import { metafieldMapping } from "./mapping.js";
import { getLastSyncTime, saveLastSyncTime } from "./odoo.js";

dotenv.config();

// 🔹 Fetch Shopify products updated since last sync
async function getShopifyProductsUpdatedSince(lastSyncTime) {
  const params = lastSyncTime
    ? `?updated_at_min=${encodeURIComponent(lastSyncTime)}`
    : "";
  const res = await shopifyFetch(`products.json${params}&limit=250&fields=id,title,body_html,variants,metafields`);
  return res.products || [];
}

// 🔹 Fetch product metafields
async function fetchProductMetafields(productId) {
  const res = await shopifyFetch(`products/${productId}/metafields.json`);
  return res.metafields || [];
}

// 🔹 Fetch inventory levels for a specific variant
async function fetchInventoryLevel(inventoryItemId) {
  const locationsRes = await shopifyFetch("locations.json");
  const locationId = locationsRes.locations?.[0]?.id;

  if (!locationId) {
    console.warn("⚠️ No Shopify location found!");
    return null;
  }

  const res = await shopifyFetch(
    `inventory_levels.json?inventory_item_ids=${inventoryItemId}&location_ids=${locationId}`
  );
  const levels = res.inventory_levels || [];
  if (levels.length > 0) {
    console.log(`📦 Found inventory ${levels[0].available} at location ${locationId}`);
    return levels[0].available;
  } else {
    console.warn(`⚠️ No inventory level found for item ${inventoryItemId} at location ${locationId}`);
    return null;
  }
}


async function shopifyToOdooSync() {
  console.log("🔄 Starting Shopify → Odoo sync...");
  const lastSync = await getLastSyncTime();

  const products = await getShopifyProductsUpdatedSince(lastSync);
  console.log(`📦 Found ${products.length} updated Shopify products`);

  for (const product of products) {
    try {
      const metafields = await fetchProductMetafields(product.id);

      const odooData = {};

      // ✅ Map Shopify metafields back to Odoo
      metafields.forEach((m) => {
        for (const key in metafieldMapping) {
          const map = metafieldMapping[key];
          if (m.namespace === map.namespace && m.key === map.key) {
            let val = m.value;
            if (map.type === "json") {
              try {
                val = JSON.parse(val);
              } catch {
                val = val;
              }
            }
            odooData[map.odooField] = val;
            if (map.odooField === "qty_available") {
              console.log(`⚠️ Metafield overwriting qty_available from ${odooData.qty_available} → ${val}`);
            }

          }
        }
      });
      console.log(`📦 Found inventory out off condition1 ${odooData.qty_available}`);
      

      // Map Shopify fields to Odoo fields
      odooData.name = product.title;
      odooData.description_sale = product.body_html;
      const variant = product.variants[0];
      if (variant) {
        odooData.list_price = variant.price;
        odooData.default_code = variant.sku;
        // odooData.qty_available = variant.inventory_quantity;

        // ✅ Fetch live inventory from Shopify
        const inventoryQty = await fetchInventoryLevel(variant.inventory_item_id);
        console.log(`📦 Found inventory return ${inventoryQty}`);
        /*if (inventoryQty !== null) {
          odooData.qty_available = inventoryQty;
        } else if (variant.inventory_quantity !== undefined) {
          odooData.qty_available = variant.inventory_quantity;
        }*/

        if (inventoryQty !== null) {
          odooData.qty_available = inventoryQty;
          console.log(`📦 Found inventory in if condition ${odooData.qty_available}`);
        } else {
          odooData.qty_available = variant.inventory_quantity;
          console.log(`📦 Found inventory in else condition ${odooData.qty_available}`);
        }
      }
      console.log(`📦 Found inventory out off condition ${odooData.qty_available}`);
      

      // ✅ Push back to Odoo
      await updateOdooProduct(odooData);
      console.log(`📦 Found inventory out off condition2 ${odooData.qty_available}`);
      console.log(
        `✅ Synced back to Odoo: ${product.title} (SKU: ${variant?.sku || "no SKU"}, Qty: ${odooData.qty_available || 0})`
      );

      // Save timestamp after each successful product sync
      await saveLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error(`❌ Failed to sync product ${product.title}: ${err.message}`);
    }
  }

  console.log("✨ Shopify → Odoo sync complete");
}

shopifyToOdooSync();
