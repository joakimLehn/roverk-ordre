import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roverk Ordre",
  description: "Internt ordre-dashboard for Roverk",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Roverk Ordre", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#DE7214",
  // Appen legges på hjemskjermen og brukes stående; utsnittet skal gå
  // helt ut i kantene så bunnlinja kan hvile mot skjermkanten.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
