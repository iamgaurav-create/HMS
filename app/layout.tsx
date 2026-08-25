import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-app-sans",
});

export const metadata: Metadata = {
  title: "Gaurav Hospital",
  description: "Hospital management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-full bg-background text-foreground antialiased`}>
        <ClerkProvider>
          <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={5000}
          />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
