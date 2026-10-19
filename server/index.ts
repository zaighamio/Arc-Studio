/**
 * Agent payment server — x402 Gateway Nanopayments via @circle-fin/x402-batching.
 *
 * Exposes two paid endpoints that other agents (or browsers) can call:
 *   POST /agent/summarize  — paid text summarization ($0.01)
 *   POST /agent/analyze    — paid data analysis ($0.02)
 *
 * Each endpoint returns HTTP 402 until the caller provides a valid x402 payment
 * header authorised through Circle Gateway Nanopayments.
 */

import express from "express";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";

const app = express();
app.use(express.json());

const sellerAddress = process.env.VITE_AGENT_SELLER_ADDRESS;
if (!sellerAddress) {
  console.warn(
    "[agent-server] VITE_AGENT_SELLER_ADDRESS is not set — payments will fail. " +
      "Connect your wallet, paste your EVM address into .env, and restart the server.",
  );
}

const gateway = createGatewayMiddleware({
  sellerAddress: (sellerAddress ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
});

// Health check — no payment required
app.get("/health", (_req, res) => {
  res.json({ status: "ok", sellerConfigured: !!sellerAddress });
});

// Paid endpoint 1: summarize
app.post("/agent/summarize", gateway.require("$0.01"), (req, res) => {
  const { text = "" } = req.body as { text?: string };
  if (!text) {
    res.status(400).json({ error: "Missing 'text' field in request body." });
    return;
  }
  // Demo implementation — replace with real LLM call in production
  const words = text.split(/\s+/).filter(Boolean);
  const summary =
    words.length <= 20
      ? text
      : words.slice(0, 20).join(" ") + "… [truncated for demo]";
  res.json({ summary, wordCount: words.length, model: "demo-v1" });
});

// Paid endpoint 2: analyze
app.post("/agent/analyze", gateway.require("$0.02"), (req, res) => {
  const { data } = req.body as { data?: unknown };
  if (!data) {
    res.status(400).json({ error: "Missing 'data' field in request body." });
    return;
  }
  // Demo implementation — replace with real analysis in production
  const keys = typeof data === "object" && data !== null ? Object.keys(data) : [];
  res.json({
    fields: keys,
    count: keys.length,
    sample: JSON.stringify(data).slice(0, 120),
    insight: "Demo analysis complete.",
  });
});

const PORT = process.env.AGENT_SERVER_PORT ? parseInt(process.env.AGENT_SERVER_PORT) : 3001;
app.listen(PORT, () => {
  console.log(`[agent-server] listening on http://localhost:${PORT}`);
  console.log(`[agent-server] seller: ${sellerAddress ?? "(not configured)"}`);
});
