import type { ReactNode } from "react";
import "../styles/globals.css";
import Providers from "./providers";

export const metadata = {
  title: "동근해가 떴습니다",
  description: "동근이형 장가가자",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
