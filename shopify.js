// shopify.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const shopUrl = process.env.SHOPIFY_SHOP;
const token = process.env.SHOPIFY_ACCESS_TOKEN;

async function shopifyFetch(endpoint, options = {}) {
  const url = `https://${shopUrl}/admin/api/2025-01/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Shopify error: ${err}`);
  }
  return response.json();
}

export async function createShopifyProduct(productData) {
  const res = await shopifyFetch("products.json", {
    method: "POST",
    body: JSON.stringify(productData),
  });
  return res.product;
}

export async function updateShopifyProduct(productId, productData) {
  const res = await shopifyFetch(`products/${productId}.json`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });
  return res.product;
}

// ✅ Shopify REST pagination using since_id
export async function findShopifyProductBySKU(sku) {
  let since_id = 0;
  const limit = 250;

  while (true) {
    const res = await shopifyFetch(
      `products.json?fields=id,title,variants&limit=${limit}&since_id=${since_id}`
    );

    if (!res.products.length) break;

    for (const product of res.products) {
      const match = product.variants.find((v) => v.sku === sku);
      if (match) return { product, variant: match };
    }

    since_id = res.products[res.products.length - 1].id; // move cursor
    if (res.products.length < limit) break;
  }

  return null;
}

export async function getShopifyLocations() {
  const res = await shopifyFetch("locations.json");
  return res.locations;
}

export async function updateShopifyInventory(inventoryItemId, locationId, quantity) {
  const res = await shopifyFetch("inventory_levels/set.json", {
    method: "POST",
    body: JSON.stringify({
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: quantity,
    }),
  });
  return res.inventory_level;
}

export async function setShopifyProductMetafield(productId, namespace, key, value, type = "single_line_text_field") {
  const res = await shopifyFetch("metafields.json", {
    method: "POST",
    body: JSON.stringify({
      metafield: {
        namespace,
        key,
        type,
        value,
        owner_resource: "product",
        owner_id: productId,
      },
    }),
  });
  return res.metafield;
}

// shopify.js (add this at the end of file)
export { shopifyFetch };