import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-heading" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Your personal command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider>
          <Sidebar />
          <main className="ml-60 min-h-screen p-6">
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
