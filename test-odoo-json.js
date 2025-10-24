import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const url = `${process.env.ODOO_URL}/jsonrpc`;

async function login() {
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "common",
      method: "login",
      args: [
        process.env.ODOO_DB,
        process.env.ODOO_USERNAME,
        process.env.ODOO_PASSWORD, // API key here
      ],
    },
    id: new Date().getTime(),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("🔑 Odoo UID:", data.result);
}

login().catch(console.error);
