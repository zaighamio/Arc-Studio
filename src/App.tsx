import { useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { Bot, Zap } from "lucide-react";
import AgentRegistration from "@/components/AgentRegistration";
import AgentCard from "@/components/AgentCard";

export default function App() {
  const { address } = useAccount();
  const [registered, setRegistered] = useState<{
    agentId: bigint;
    txHash: string;
    name: string;
    description: string;
  } | null>(null);

  // Seller address from env — set VITE_AGENT_SELLER_ADDRESS in .env after connecting wallet
  const sellerAddress = import.meta.env.VITE_AGENT_SELLER_ADDRESS as string | undefined;

  function handleRegistered(agentId: bigint, txHash: string, name: string, description: string) {
    setRegistered({ agentId, txHash, name, description });
  }

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg-gradient)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
        style={{
          background: "var(--surface)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <Bot size={16} color="#fff" />
          </div>
          <span className="display font-semibold text-sm" style={{ color: "var(--ink)" }}>
            Agent Identity
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="hidden sm:flex items-center gap-1 text-xs px-3 py-1 rounded-full"
            style={{ background: "var(--surface-muted)", color: "var(--muted)", border: "1px solid var(--border)" }}
          >
            <Zap size={11} />
            Arc Testnet
          </span>
          <ConnectKitButton />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Hero */}
        <div className="flex flex-col gap-1">
          <h1
            className="display font-semibold text-2xl leading-tight text-balance"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Register your onchain agent
          </h1>
          <p className="text-sm text-pretty" style={{ color: "var(--muted)" }}>
            Mint an ERC-8004 identity on Arc Testnet and expose paid x402 endpoints via Circle Gateway Nanopayments.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-2">
          {[
            { n: "1", label: "Connect wallet", done: !!address },
            { n: "2", label: "Register identity", done: !!registered },
            { n: "3", label: "Accept x402 payments", done: false },
          ].map((step) => (
            <div
              key={step.n}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: step.done ? "rgba(26,128,71,0.10)" : "var(--surface)",
                border: `1px solid ${step.done ? "rgba(26,128,71,0.30)" : "var(--border)"}`,
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{
                  background: step.done ? "var(--success)" : "var(--surface-muted)",
                  color: step.done ? "#fff" : "var(--muted)",
                }}
              >
                {step.done ? "✓" : step.n}
              </div>
              <span className="text-sm font-medium" style={{ color: step.done ? "var(--success)" : "var(--ink-2)" }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Registration form card */}
        {!registered && (
          <div
            className="rounded-3xl p-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              backdropFilter: "blur(12px)",
            }}
          >
            <AgentRegistration
              onRegistered={handleRegistered}
            />
          </div>
        )}

        {/* Agent card shown after registration */}
        {registered && (
          <AgentCard
            agentId={registered.agentId}
            agentName={registered.name || "My Agent"}
            agentDescription={registered.description}
            txHash={registered.txHash}
            sellerAddress={sellerAddress}
          />
        )}

        {/* x402 server info */}
        <div
          className="rounded-3xl p-5 flex flex-col gap-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              x402 payment server
            </span>
          </div>
          <p className="text-xs text-pretty" style={{ color: "var(--muted)" }}>
            A local Express server runs alongside this app with Circle Gateway Nanopayments middleware. Any agent with a Circle wallet can pay-per-call to your endpoints.
          </p>
          <div className="flex flex-col gap-1">
            {[
              { label: "Health", path: "/api/health", badge: "GET" },
              { label: "Summarize", path: "/api/agent/summarize", badge: "POST · $0.01" },
              { label: "Analyze", path: "/api/agent/analyze", badge: "POST · $0.02" },
            ].map((ep) => (
              <div
                key={ep.path}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}
              >
                <span className="mono text-xs" style={{ color: "var(--ink-2)" }}>{ep.path}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--surface)", color: "var(--muted)" }}
                >
                  {ep.badge}
                </span>
              </div>
            ))}
          </div>
          {!sellerAddress && (
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(186,43,76,0.10)", color: "var(--danger)" }}>
              Set <span className="mono">VITE_AGENT_SELLER_ADDRESS</span> in <span className="mono">.env</span> to receive payments.
            </p>
          )}
        </div>

        <p className="text-xs text-center pb-4" style={{ color: "var(--subtle)" }}>
          Arc Testnet only — ERC-8004 identity registry at{" "}
          <a
            href="https://explorer.testnet.arc.io/address/0x8004A818BFB912233c491871b3d84c89A494BD9e"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity mono"
          >
            0x8004…BD9e
          </a>
        </p>
      </main>
    </div>
  );
}
