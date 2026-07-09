import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { GoogleAuthProvider } from "@/components/auth/google-auth-provider";
import { StoreHydration } from "@/components/providers/store-hydration";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Genix",
  description: "Genix AI sohbet uygulaması",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Genix",
  },
  icons: {
    icon: "/brand/genix-icon.svg",
    apple: "/brand/genix-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f7f6fb",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <Script id="genix-theme-init" strategy="beforeInteractive">
          {`(function(){try{var s=localStorage.getItem('genix-theme');if(!s)return;var p=JSON.parse(s);if(p&&p.state&&p.state.theme==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`}
        </Script>
      </head>
      <body className="app-bg flex min-h-full flex-col">
        <StoreHydration>
          <GoogleAuthProvider>{children}</GoogleAuthProvider>
        </StoreHydration>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
