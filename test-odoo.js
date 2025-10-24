import xmlrpc from "xmlrpc";
import dotenv from "dotenv";
dotenv.config();

const odooUrl = process.env.ODOO_URL;
const odooDb = process.env.ODOO_DB;
const odooUsername = process.env.ODOO_USERNAME;
const odooPassword = process.env.ODOO_PASSWORD;

const common = xmlrpc.createClient({ url: `${odooUrl}/xmlrpc/2/common` });

common.methodCall(
  "authenticate",
  [odooDb, odooUsername, odooPassword, {}],
  (err, uid) => {
    if (err) {
      console.error("❌ Connection error:", err);
    } else {
      console.log("🔑 Odoo UID:", uid);
    }
  }
);
