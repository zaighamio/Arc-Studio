/**
 * AgentCard — displays the registered agent's onchain identity
 * and the x402 payment endpoint instructions.
 */

import { useState } from "react";
import { useReadContract } from "wagmi";
import {
  Bot,
  Zap,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
} from "lucide-react";
import { buildAddressExplorerUrl } from "@/onchain-facts";

const ARC_TESTNET_ID = 5042002;
const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;

const identityAbi = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getAgentWallet",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

interface AgentCardProps {
  agentId: bigint;
  agentName: string;
  agentDescription: string;
  txHash: string;
  sellerAddress?: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded-lg transition-colors"
      style={{ color: "var(--subtle)" }}
      title="Copy"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function InfoRow({ label, value, mono, explorerUrl }: { label: string; value: string; mono?: boolean; explorerUrl?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <div className="flex items-center gap-1 min-w-0">
        <span
          className={`text-xs truncate max-w-[160px] ${mono ? "mono tabular-nums" : ""}`}
          style={{ color: "var(--ink-2)" }}
        >
          {value}
        </span>
        <CopyButton value={value} />
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--subtle)" }}>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function AgentCard({ agentId, agentName, agentDescription, txHash, sellerAddress }: AgentCardProps) {
  const [showPayInfo, setShowPayInfo] = useState(false);

  const { data: ownerAddress } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: "ownerOf",
    args: [agentId],
    chainId: ARC_TESTNET_ID,
  });

  const { data: walletAddress } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: "getAgentWallet",
    args: [agentId],
    chainId: ARC_TESTNET_ID,
  });

  const displayWallet = walletAddress && walletAddress !== "0x0000000000000000000000000000000000000000"
    ? walletAddress
    : ownerAddress ?? "—";

  const registryExplorerUrl = buildAddressExplorerUrl(ARC_TESTNET_ID, IDENTITY_REGISTRY);

  const curlExample = `curl -X POST http://localhost:3001/agent/summarize \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Summarize this text for me please"}'
# Returns HTTP 402 — use circle services pay or x402 client`;

  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-4"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Bot size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="display font-semibold text-base leading-tight truncate" style={{ color: "var(--ink)" }}>
              {agentName}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full shrink-0"
              style={{ background: "rgba(26,128,71,0.18)", color: "var(--success)" }}
            >
              Active
            </span>
          </div>
          {agentDescription && (
            <p className="text-xs mt-0.5 text-pretty" style={{ color: "var(--muted)" }}>
              {agentDescription}
            </p>
          )}
        </div>
      </div>

      {/* Identity rows */}
      <div>
        <InfoRow label="Agent ID" value={agentId.toString()} mono />
        <InfoRow
          label="Registry"
          value={`${IDENTITY_REGISTRY.slice(0, 10)}…${IDENTITY_REGISTRY.slice(-8)}`}
          mono
          explorerUrl={registryExplorerUrl}
        />
        {displayWallet !== "—" && (
          <InfoRow
            label="Wallet"
            value={`${(displayWallet as string).slice(0, 10)}…${(displayWallet as string).slice(-8)}`}
            mono
            explorerUrl={buildAddressExplorerUrl(ARC_TESTNET_ID, displayWallet)}
          />
        )}
        <InfoRow
          label="Tx hash"
          value={`${txHash.slice(0, 10)}…${txHash.slice(-8)}`}
          mono
        />
      </div>

      {/* x402 panel */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <button
          className="w-full flex items-center justify-between px-4 py-3 transition-colors"
          style={{ background: "var(--surface-muted)", color: "var(--ink)" }}
          onClick={() => setShowPayInfo((s) => !s)}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Zap size={14} style={{ color: "var(--accent)" }} />
            x402 Payment endpoints
          </div>
          {showPayInfo ? <ChevronUp size={15} style={{ color: "var(--subtle)" }} /> : <ChevronDown size={15} style={{ color: "var(--subtle)" }} />}
        </button>

        {showPayInfo && (
          <div className="px-4 pb-4 pt-3 flex flex-col gap-3">
            {sellerAddress && (
              <div className="flex items-start gap-2 text-xs" style={{ color: "var(--muted)" }}>
                <Globe size={12} className="mt-0.5 shrink-0" />
                <span>
                  Seller address: <span className="mono" style={{ color: "var(--ink-2)" }}>{sellerAddress}</span>
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {[
                { path: "/agent/summarize", price: "$0.01", method: "POST", desc: "Summarize text" },
                { path: "/agent/analyze", price: "$0.02", method: "POST", desc: "Analyze JSON data" },
              ].map((ep) => (
                <div
                  key={ep.path}
                  className="rounded-xl px-3 py-2 flex items-center justify-between gap-3"
                  style={{ background: "var(--surface-strong)", border: "1px solid var(--border)" }}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="mono text-xs" style={{ color: "var(--ink-2)" }}>{ep.method} {ep.path}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{ep.desc}</span>
                  </div>
                  <span
                    className="text-xs font-semibold shrink-0 tabular-nums"
                    style={{ color: "var(--accent-hover)" }}
                  >
                    {ep.price} USDC
                  </span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Try it — returns HTTP 402:</p>
              <pre
                className="rounded-xl px-3 py-2 text-[10px] overflow-x-auto mono whitespace-pre-wrap"
                style={{ background: "var(--surface-muted)", color: "var(--ink-2)" }}
              >
                {curlExample}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
