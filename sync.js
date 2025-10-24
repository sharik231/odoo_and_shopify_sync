// sync.js
import { getOdooProductsBatch, saveLastSyncTime } from "./odoo.js";
import {
  createShopifyProduct,
  updateShopifyProduct,
  findShopifyProductBySKU,
  getShopifyLocations,
  updateShopifyInventory,
  setShopifyProductMetafield,
} from "./shopify.js";
import { metafieldMapping } from "./mapping.js";

async function syncProducts(products) {
  console.log("🔄 Starting product sync...");

  for (const product of products) {
    const sku = product.default_code || `ODOO-${product.id}`;

    // ✅ Truncate long title
    let title = product.name || "";
    if (title.length > 255) title = title.substring(0, 252) + "...";

    const images = product.image_1920 ? [{ attachment: product.image_1920 }] : [];

    const shopifyProductData = {
      product: {
        title,
        body_html: product.description_sale || "",
        variants: [
          {
            price: product.list_price || "0.00",
            sku,
            inventory_quantity: product.qty_available || 0,
            inventory_management: "shopify",
          },
        ],
        images,
      },
    };

    try {
      const existing = await findShopifyProductBySKU(sku);

      if (existing) {
        const updated = await updateShopifyProduct(existing.product.id, shopifyProductData);
        console.log(`♻️ Updated: ${updated.title} (SKU: ${sku}, ID: ${updated.id})`);
        await syncMetafields(updated.id, product);
      } else {
        const created = await createShopifyProduct(shopifyProductData);
        console.log(`✅ Created: ${created.title} (SKU: ${sku}, ID: ${created.id})`);
        await syncMetafields(created.id, product);
      }

      // ✅ Save timestamp after each successful product sync
      saveLastSyncTime(new Date().toISOString());

    } catch (err) {
      console.error(`❌ Failed syncing SKU ${sku}: ${err.message}`);
      continue;
    }
  }

  console.log("✨ Product sync complete");
}

async function syncMetafields(shopifyProductId, odooProduct) {
  for (const key in metafieldMapping) {
    const map = metafieldMapping[key];
    let value = odooProduct[map.odooField];
    if (!value) continue;

    try {
      if (map.type === "json") {
        if (typeof value === "string" && (value.trim().startsWith("[") || value.trim().startsWith("{"))) {
          try {
            value = JSON.parse(value.replace(/'/g, '"'));
          } catch {
            value = [value];
          }
        } else if (map.key === "product_details") {
          value = value.split("\n").map((l) => l.trim()).filter(Boolean);
        } else if (map.key === "image_set") {
          value = value.split(/[\n,]+/).map((url) => ({ href: url.trim() }));
        }
        value = JSON.stringify(value);
      }

      await setShopifyProductMetafield(shopifyProductId, map.namespace, map.key, value, map.type);
      console.log(`   ↳ Metafield synced: ${map.namespace}.${map.key}`);
    } catch (err) {
      console.error(`   ⚠️ Failed metafield ${map.namespace}.${map.key}: ${err.message}`);
    }
  }
}

async function syncInventory(products) {
  console.log("🔄 Starting inventory sync...");
  const locations = await getShopifyLocations();
  const locationId = locations[0].id;

  for (const product of products) {
    const sku = product.default_code || `ODOO-${product.id}`;
    const existing = await findShopifyProductBySKU(sku);

    if (existing) {
      await updateShopifyInventory(existing.variant.inventory_item_id, locationId, product.qty_available || 0);
      console.log(`📦 Inventory updated → ${product.name} (SKU: ${sku}) → ${product.qty_available || 0}`);
    }
  }

  console.log("✨ Inventory sync complete");
}

async function main() {
  try {
    console.log("🔄 Fetching products from Odoo...");
    const products = await getOdooProductsBatch();
    console.log(`📦 Total fetched products: ${products.length}`);

    await syncProducts(products);
    await syncInventory(products);

    saveLastSyncTime(new Date().toISOString());
    console.log("✅ Sync finished");
  } catch (err) {
    console.error("❌ Error during sync:", err.message);
  }
}

main();