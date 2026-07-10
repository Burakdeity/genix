import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import Script from "next/script";

import { GoogleAuthProvider } from "@/components/auth/google-auth-provider";
import { StoreHydration } from "@/components/providers/store-hydration";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ORWIX_META } from "@/content/orwix-content";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: ORWIX_META.title,
  description: ORWIX_META.description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Orwix",
  },
  icons: {
    icon: "/brand/orwix-icon.svg",
    apple: "/brand/orwix-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#eff6ff",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${spaceGrotesk.variable} ${geistMono.variable} h-full`}
      data-orwix-bg="ocean"
      suppressHydrationWarning
    >
      <head>
        <Script id="orwix-theme-init" strategy="beforeInteractive">
          {`(function(){try{var r=document.documentElement;var k=['orwix-theme','genix-theme'];var dark=false;for(var i=0;i<k.length;i++){var s=localStorage.getItem(k[i]);if(!s)continue;var p=JSON.parse(s);if(p&&p.state&&p.state.theme){dark=p.state.theme==='dark';break;}}if(dark){r.classList.add('dark');r.style.colorScheme='dark';}else{r.classList.remove('dark');r.style.colorScheme='light';}var preset='ocean';var bg=localStorage.getItem('orwix-background');if(bg){var b=JSON.parse(bg);if(b&&b.state&&b.state.preset){preset=b.state.preset;if(preset==='midnight')preset='violet';}}r.setAttribute('data-orwix-bg',preset);}catch(e){r.classList.remove('dark');r.style.colorScheme='light';r.setAttribute('data-orwix-bg','ocean');}})();`}
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
