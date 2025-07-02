const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.json());

const SECRET = process.env.SECRET || "default_secret";
const WEBHOOK_URL = process.env.WEBHOOK_URL || "";

function hmac(data, key) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

app.post("/verify", async (req, res) => {
  const { playerId, amount, reason, authToken } = req.body;
  const expectedToken = hmac(playerId + reason, SECRET);

  if (authToken !== expectedToken) {
    await sendWebhook(`🚫 HACK ATTEMPT from ${playerId}`);
    return res.status(403).json({ success: false });
  }

  await sendWebhook(`✅ ${playerId} earned ${amount} Pizza Slices for: **${reason}**`);
  return res.json({ success: true });
});

async function sendWebhook(msg) {
  await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg })
  });
}

app.listen(5000, () => {
  console.log("🟢 Pizza Verifier running at http://localhost:5000");
});
