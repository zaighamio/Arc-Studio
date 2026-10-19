# Agent Identity — Arc

> Built with Arc Studio — ERC-8004 onchain agent identity + x402 Circle Gateway Nanopayments

---

## What This App Does

Lets a wallet owner register an onchain AI agent identity (ERC-8004) on Arc Testnet and expose paid API endpoints via Circle Gateway Nanopayments (x402). The Express payment server runs alongside the Vite frontend; Vite proxies `/api/*` to it.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS (Arc Dark)
- Web3: wagmi v2, viem v2, ConnectKit
- Chain: Arc Testnet (Chain ID: 5042002)
- Token: USDC (6 decimals, 0x3600000000000000000000000000000000000000)
- Payments: @circle-fin/x402-batching (v3.x) + Circle Gateway Nanopayments
- Backend: Express + @circle-fin/x402-batching/server (port 3001)
- Toasts: Sonner
- Fonts: Space Grotesk (display) + DM Sans (body) + JetBrains Mono (code)

## Key Files

- `src/App.tsx` — thin composition root
- `src/components/AgentRegistration.tsx` — ERC-8004 register() flow
- `src/components/AgentCard.tsx` — live identity read + x402 info panel
- `src/utils/errors.ts` — onchain error parser
- `server/index.ts` — Express payment server with x402 Gateway middleware

## ERC-8004 Registry Addresses (Arc Testnet)

- IdentityRegistry:   0x8004A818BFB912233c491871b3d84c89A494BD9e
- ReputationRegistry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
- ValidationRegistry: 0x8004Cb1BF31DAf7788923b405b754f57acEB4272

## Environment

```
VITE_AGENT_SELLER_ADDRESS=0x<your-EVM-address>   # receives x402 USDC payments
```

## To Run

```bash
bun install
bun run dev          # Vite frontend on :5173
bun run server       # Express payment server on :3001 (separate terminal)
```

The Vite proxy forwards /api/* → http://localhost:3001 so the browser can test endpoints.
