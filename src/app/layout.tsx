// src/app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"
import Providers from "./components/Providers";
import Navbar from "@/app/components/Navbar"

export const metadata: Metadata = {
  title: "Berry",
  description: "Berry enrichment platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="
  font-[Marble]
  antialiased
  min-h-screen
  bg-[#707070]
  bg-[radial-gradient(circle_at_center,_rgba(255,182,222,0.18)_0%,_rgba(112,112,112,1)_75%)]
">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
