// customers_shopify_to_odoo.js
import xmlrpc from "xmlrpc";
import dotenv from "dotenv";
import fs from "fs";
import { shopifyFetch } from "./shopify.js";

dotenv.config();

const USE_LAST_SYNC = true; // toggle true/false as needed

const odooUrl = process.env.ODOO_URL;
const odooDb = process.env.ODOO_DB;
const odooUsername = process.env.ODOO_USERNAME;
const odooPassword = process.env.ODOO_PASSWORD;

let uid;

const common = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` });
const models = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/object` });

function sanitizeEmail(email) {
  if (!email || typeof email !== "string") return null;
  const clean = email.replace(",", ".").trim().toLowerCase();
  if (!clean.includes("@") || clean.startsWith("@") || clean.endsWith("@")) return null;
  return clean;
}

function sanitizePhone(phone) {
  if (!phone || phone === false || phone === "false" || phone === 0) return null;
  let clean = String(phone).trim();
  clean = clean.replace(/[,;]/g, " ");
  clean = clean.replace(/[-]{2,}/g, "-");
  clean = clean.replace(/\s*-\s*/g, "-");
  clean = clean.replace(/(?!^\+)[^\d]/g, "");
  if (clean.startsWith("00")) clean = "+" + clean.slice(2);
  if (!clean.startsWith("+") && clean.length >= 8) clean = clean;
  if (clean.replace(/\D/g, "").length < 7) return null;
  return clean;
}

function getLastSyncTimes() {
  if (!fs.existsSync(".lastsync_customers.json")) return { shopify: null };
  return JSON.parse(fs.readFileSync(".lastsync_customers.json", "utf-8"));
}

function saveLastSyncTimes(times) {
  fs.writeFileSync(".lastsync_customers.json", JSON.stringify(times, null, 2));
}

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

export async function syncCustomersShopifyToOdoo() {
  if (!uid) await connectOdoo();

  const { shopify: lastShopifySync } = getLastSyncTimes();
  console.log("🔄 Fetching Shopify customers...");

  const shopifyData = await shopifyFetch(`/customers.json?limit=250`);
  const shopifyCustomers = shopifyData.customers || [];

  const updatedCustomers =
    USE_LAST_SYNC && lastShopifySync
      ? shopifyCustomers.filter((c) => new Date(c.updated_at) > new Date(lastShopifySync))
      : shopifyCustomers;

  console.log(`📦 Processing ${updatedCustomers.length} customers from Shopify`);

  for (const c of updatedCustomers) {
    const email = sanitizeEmail(c.email);
    const phone = sanitizePhone(c.phone);
    if (!email) continue;

    const odooPayload = {
      name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
      email,
      phone,
      customer_rank: 1,
    };

    try {
      const existing = await new Promise((resolve, reject) => {
        models.methodCall(
          "execute_kw",
          [odooDb, uid, odooPassword, "res.partner", "search_read", [[["email", "=", email]]], { fields: ["id"] }],
          (err, value) => (err ? reject(err) : resolve(value))
        );
      });

      if (existing.length > 0) {
        await new Promise((resolve, reject) => {
          models.methodCall(
            "execute_kw",
            [odooDb, uid, odooPassword, "res.partner", "write", [[existing[0].id], odooPayload]],
            (err, value) => (err ? reject(err) : resolve(value))
          );
        });
        console.log(`🟢 Updated Odoo customer: ${email}`);
      } else {
        await new Promise((resolve, reject) => {
          models.methodCall(
            "execute_kw",
            [odooDb, uid, odooPassword, "res.partner", "create", [odooPayload]],
            (err, value) => (err ? reject(err) : resolve(value))
          );
        });
        console.log(`🟢 Created Odoo customer: ${email}`);
      }
    } catch (err) {
      console.error(`❌ Error syncing ${email}:`, err.message);
    }
  }

  if (USE_LAST_SYNC) {
    saveLastSyncTimes({ ...getLastSyncTimes(), shopify: new Date().toISOString() });
  }

  console.log("✅ Shopify → Odoo customer sync complete");
}

(async () => {
  console.log("⏳ Starting Shopify → Odoo Customer Sync...");
  await syncCustomersShopifyToOdoo();
  console.log("✅ Finished Shopify → Odoo Sync");
})();
