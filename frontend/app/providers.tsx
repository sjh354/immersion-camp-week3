"use client";

import type { ReactNode } from "react";
import { AppStateProvider } from "@/store/appState";

export default function Providers({ children }: { children: ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
