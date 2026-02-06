import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";

const publicDir = path.join(__dirname, "public");
const runtimeDir = path.join(__dirname, "runtime");

const defaultAllowList = ["example.com", "wikipedia.org", "devmicro.app"];
const allowedDomains = (process.env.ASX_ALLOWED_DOMAINS || "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const allowList = allowedDomains.length > 0 ? allowedDomains : defaultAllowList;

app.use(cors());
app.use(express.static(publicDir));
app.use("/runtime", express.static(runtimeDir));

app.get("/status", (req, res) => {
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || "unknown";
  const dnsHost = process.env.ASX_DNS_HOST || hostHeader;
  res.json({
    status: "ok",
    staticServer: "active",
    dnsHost,
    origin: req.protocol + "://" + hostHeader,
    uptime: process.uptime(),
    allowList,
  });
});

app.get("/asx-proxy", async (req, res) => {
  const target = req.query.url;
  if (!target || typeof target !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!allowList.some((domain) => parsed.hostname.includes(domain))) {
    return res.status(403).json({ error: "Domain not allowed" });
  }

  try {
    const upstream = await fetch(parsed.toString());
    const body = await upstream.text();
    res.set("content-type", upstream.headers.get("content-type") || "text/html");
    return res.send(body);
  } catch (error) {
    return res.status(502).json({ error: "Upstream fetch failed" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`ASX Holo static server active at http://${HOST}:${PORT}`);
});
