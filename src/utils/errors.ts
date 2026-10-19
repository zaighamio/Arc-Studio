export function parseOnchainError(error: unknown): string {
  const msg = (error as Error)?.message?.toLowerCase() ?? "";
  if (msg.includes("user rejected") || (error as { code?: number })?.code === 4001) {
    return "Transaction cancelled.";
  }
  if (msg.includes("insufficient funds") || msg.includes("exceeds balance")) {
    return "Insufficient balance. Add testnet USDC from the faucet and try again.";
  }
  if (msg.includes("reverted")) {
    const match = msg.match(/reason="([^"]+)"/);
    return match ? `Transaction failed: ${match[1]}` : "Transaction reverted. Check your wallet has testnet USDC for gas.";
  }
  if (msg.includes("network") || msg.includes("timeout")) {
    return "Network error. Check your connection and retry.";
  }
  return "Something went wrong. Please try again.";
}
