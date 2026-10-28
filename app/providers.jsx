"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { darkTheme, RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const config = getDefaultConfig({
  appName: "The Itties · House of Joshi",
  // Injected browser wallets remain available without this key; WalletConnect
  // QR/mobile pairing needs a real project ID from cloud.reown.com.
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "00000000000000000000000000000000",
  chains: [base],
  ssr: true
});

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}><RainbowKitProvider theme={darkTheme({ accentColor: "#ff4d9d", accentColorForeground: "#190b18", borderRadius: "large", fontStack: "system", overlayBlur: "small" })}>{children}</RainbowKitProvider></QueryClientProvider></WagmiProvider>;
}
