// customers.js
import xmlrpc from "xmlrpc";
import dotenv from "dotenv";
import fs from "fs";
import { shopifyFetch } from "./shopify.js";

dotenv.config();

const odooUrl = process.env.ODOO_URL;
const odooDb = process.env.ODOO_DB;
const odooUsername = process.env.ODOO_USERNAME;
const odooPassword = process.env.ODOO_PASSWORD;

let uid;

// XML-RPC clients
const common = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` });
const models = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/object` });

/* ---------------------- HELPERS ---------------------- */
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

// Read & save last sync timestamps
function getLastSyncTimes() {
  if (!fs.existsSync(".lastsync_customers.json")) return { odoo: null, shopify: null };
  return JSON.parse(fs.readFileSync(".lastsync_customers.json", "utf-8"));
}

function saveLastSyncTimes(times) {
  fs.writeFileSync(".lastsync_customers.json", JSON.stringify(times, null, 2));
}

/* ---------------------- ODOO AUTH ---------------------- */
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

/* ---------------------- ODOO → SHOPIFY ---------------------- */
export async function syncCustomersOdooToShopify() {
  if (!uid) await connectOdoo();

  const { odoo: lastOdooSync } = getLastSyncTimes();
  const domain = [["customer_rank", ">", 0]];
  if (lastOdooSync) domain.push(["write_date", ">", lastOdooSync]);

  console.log("🔄 Fetching Odoo customers...");
  const customers = await new Promise((resolve, reject) => {
    models.methodCall(
      "execute_kw",
      [
        odooDb,
        uid,
        odooPassword,
        "res.partner",
        "search_read",
        [domain],
        {
          fields: ["id", "name", "email", "phone", "street", "city", "zip", "country_id", "write_date"],
          limit: 500,
        },
      ],
      (err, value) => (err ? reject(err) : resolve(value))
    );
  });

  console.log(`📦 Found ${customers.length} updated customers in Odoo`);

  for (const customer of customers) {
    const email = sanitizeEmail(customer.email);
    const phone = sanitizePhone(customer.phone);
    if (!email) continue;

    try {
      const existing = await shopifyFetch(`/customers/search.json?query=email:${email}`);
      const payload = {
        customer: {
          first_name: customer.name || "",
          email,
          phone,
        },
      };

      if (existing.customers?.length > 0) {
        const shopifyCustomer = existing.customers[0];
        await shopifyFetch(`/customers/${shopifyCustomer.id}.json`, {
          method: "PUT",
          body: JSON.stringify({ ...payload, customer: { ...payload.customer, id: shopifyCustomer.id } }),
        });
        console.log(`🟢 Updated Shopify customer: ${email}`);
      } else {
        await shopifyFetch(`/customers.json`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        console.log(`🟢 Created Shopify customer: ${email}`);
      }
    } catch (err) {
      console.error(`❌ Error syncing ${email}:`, err.message);
    }
  }

  // Save new sync time
  saveLastSyncTimes({ ...getLastSyncTimes(), odoo: new Date().toISOString() });
  console.log("✅ Odoo → Shopify customer sync complete");
}

/* ---------------------- RUN SCRIPT ---------------------- */
(async () => {
  console.log("⏳ Starting Customer Sync...");
  await syncCustomersOdooToShopify();
  console.log("✅ Customer Sync Finished");
})();
