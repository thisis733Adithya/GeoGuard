import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Geo Guard | Tourist Safety Monitoring",
  description: "Smart tourist safety monitoring and incident response MVP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full text-[var(--text)] font-sans antialiased overflow-x-hidden selection:bg-[var(--brand)] selection:text-[var(--bg)]">
        <Script id="geo-guard-theme" strategy="beforeInteractive">
          {`
            try {
              var storedTheme = localStorage.getItem("geoGuardTheme");
              var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
              document.documentElement.dataset.theme = storedTheme || systemTheme;
            } catch (error) {
              document.documentElement.dataset.theme = "light";
            }
          `}
        </Script>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
