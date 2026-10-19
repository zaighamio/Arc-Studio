/**
 * AgentRegistration — ERC-8004 identity registration on Arc Testnet.
 *
 * Lets the connected wallet register a new agent identity by:
 *   1. Composing an ERC-8004 registration JSON (in-memory data URI)
 *   2. Calling IIdentityRegistry.register(agentURI) on Arc Testnet
 *   3. Parsing the Registered event to read back the minted agentId
 */

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { parseEventLogs } from "viem";
import { Bot, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { buildTxExplorerUrl } from "@/onchain-facts";
import { parseOnchainError } from "@/utils/errors";

const ARC_TESTNET_ID = 5042002;

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;

const identityAbi = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "event",
    name: "Registered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentURI", type: "string", indexed: false },
      { name: "owner", type: "address", indexed: true },
    ],
  },
] as const;

interface RegistrationForm {
  name: string;
  description: string;
  serviceEndpoint: string;
}

interface AgentRegistrationProps {
  onRegistered: (agentId: bigint, txHash: string, name: string, description: string) => void;
}

function buildRegistrationJson(
  form: RegistrationForm,
  ownerAddress: string,
): string {
  const doc = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: form.name,
    description: form.description,
    services: form.serviceEndpoint
      ? [
          {
            name: "API",
            endpoint: form.serviceEndpoint,
            version: "1.0.0",
          },
        ]
      : [],
    x402Support: true,
    active: true,
    registrations: [
      {
        agentId: 0, // placeholder — updated after mint
        agentRegistry: `eip155:5042002:${IDENTITY_REGISTRY}`,
      },
    ],
    supportedTrust: ["reputation"],
    owner: ownerAddress,
  };
  return JSON.stringify(doc, null, 2);
}

export default function AgentRegistration({ onRegistered }: AgentRegistrationProps) {
  const { address, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [form, setForm] = useState<RegistrationForm>({
    name: "",
    description: "",
    serviceEndpoint: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<bigint | null>(null);

  const {
    writeContract,
    data: txHash,
    isPending: isWalletPending,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  const isWrongChain = !!address && chainId !== ARC_TESTNET_ID;

  // Parse agentId from receipt once confirmed
  if (isSuccess && receipt && agentId === null) {
    try {
      const [ev] = parseEventLogs({
        abi: identityAbi,
        eventName: "Registered",
        logs: receipt.logs,
      });
      if (ev) {
        const id = ev.args.agentId;
        setAgentId(id);
        onRegistered(id, txHash!, form.name, form.description);
      }
    } catch {
      // event not found — treat as success with unknown id
    }
  }

  function handleChange(field: keyof RegistrationForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  function handleRegister() {
    if (!address) return;
    if (!form.name.trim()) {
      setError("Agent name is required.");
      return;
    }
    setError(null);
    setAgentId(null);
    resetWrite();

    const json = buildRegistrationJson(form, address);
    // Use a data URI so no external hosting is required for the demo.
    // In production, upload the JSON to IPFS and pass the ipfs:// URI.
    const agentURI = "data:application/json;base64," + btoa(json);

    writeContract(
      {
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        functionName: "register",
        args: [agentURI],
        chainId: ARC_TESTNET_ID,
      },
      {
        onError(err) {
          setError(parseOnchainError(err));
        },
      },
    );
  }

  const busy = isWalletPending || isConfirming;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <Bot size={18} className="text-[var(--accent)]" />
        <span className="text-sm font-semibold tracking-wide uppercase" style={{ letterSpacing: "0.08em", color: "var(--muted)" }}>
          ERC-8004 Identity
        </span>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            Agent name <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="text"
            placeholder="My Research Agent"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            disabled={busy || isSuccess}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: "var(--surface-muted)",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            Description
          </label>
          <textarea
            placeholder="Summarizes onchain data for a fee"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            disabled={busy || isSuccess}
            rows={2}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
            style={{
              background: "var(--surface-muted)",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            Service endpoint <span className="text-xs" style={{ color: "var(--subtle)" }}>(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://your-agent.example.com/api"
            value={form.serviceEndpoint}
            onChange={(e) => handleChange("serviceEndpoint", e.target.value)}
            disabled={busy || isSuccess}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: "var(--surface-muted)",
              color: "var(--ink)",
              border: "1px solid var(--border)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(186,43,76,0.12)", color: "var(--danger)" }}
        >
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Success */}
      {isSuccess && agentId !== null && (
        <div
          className="flex flex-col gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(26,128,71,0.12)", color: "var(--success)" }}
        >
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle size={15} />
            Registered as agent #{agentId.toString()}
          </div>
          {txHash && (
            <a
              href={buildTxExplorerUrl(ARC_TESTNET_ID, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
            >
              View on explorer <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      {/* CTA */}
      {!address ? (
        <p className="text-sm text-center py-2" style={{ color: "var(--muted)" }}>
          Connect your wallet to register
        </p>
      ) : isWrongChain ? (
        <button
          onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
          disabled={isSwitching}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95"
          style={{
            background: "var(--accent)",
            color: "#fff",
            opacity: isSwitching ? 0.6 : 1,
          }}
        >
          {isSwitching ? "Switching…" : "Switch to Arc Testnet"}
        </button>
      ) : isSuccess ? (
        <button
          onClick={() => {
            setForm({ name: "", description: "", serviceEndpoint: "" });
            setAgentId(null);
            setError(null);
            resetWrite();
          }}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95"
          style={{ background: "var(--surface-muted)", color: "var(--ink)" }}
        >
          Register another agent
        </button>
      ) : (
        <button
          onClick={handleRegister}
          disabled={busy}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: busy ? "var(--surface-muted)" : "var(--accent)",
            color: busy ? "var(--muted)" : "#fff",
            cursor: busy ? "default" : "pointer",
          }}
        >
          {isWalletPending ? (
            <><Loader2 size={15} className="animate-spin" /> Confirm in wallet…</>
          ) : isConfirming ? (
            <><Loader2 size={15} className="animate-spin" /> Registering…</>
          ) : (
            "Register agent"
          )}
        </button>
      )}
    </div>
  );
}
