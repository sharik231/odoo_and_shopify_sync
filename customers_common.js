// customers_common.js
import xmlrpc from "xmlrpc";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export const odooUrl = process.env.ODOO_URL;
export const odooDb = process.env.ODOO_DB;
export const odooUsername = process.env.ODOO_USERNAME;
export const odooPassword = process.env.ODOO_PASSWORD;

export let uid;

// XML-RPC clients
export const common = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` });
export const models = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/object` });

/* ---------------------- HELPERS ---------------------- */
export function sanitizeEmail(email) {
  if (!email || typeof email !== "string") return null;
  const clean = email.replace(",", ".").trim().toLowerCase();
  if (!clean.includes("@") || clean.startsWith("@") || clean.endsWith("@")) return null;
  return clean;
}

export function sanitizePhone(phone) {
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

/* ---------------------- SYNC TIME ---------------------- */
export function getLastSyncTimes() {
  if (!fs.existsSync(".lastsync_customers.json")) return { odoo: null, shopify: null };
  return JSON.parse(fs.readFileSync(".lastsync_customers.json", "utf-8"));
}

export function saveLastSyncTimes(times) {
  fs.writeFileSync(".lastsync_customers.json", JSON.stringify(times, null, 2));
}

/* ---------------------- ODOO AUTH ---------------------- */
export async function connectOdoo() {
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
