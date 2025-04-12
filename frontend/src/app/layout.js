import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import localFont from "next/font/local";
import Script from "next/script";

import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import ConditionalHeader from "./components/ConditionalHeader";

import { DebugButton } from "@/components/DebugButton";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Social Media App",
  description: "A social media application with features like Facebook",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster
          toastOptions={{
            // Default styles
            style: {
              borderRadius: "8px",
              background: "#333",
              color: "#fff",
            },
            // Default duration
            duration: 3000,
            // Success toast style
            success: {
              duration: 3000,
              style: {
                background: "green",
                color: "white",
              },
            },
            // Error toast style
            error: {
              duration: 4000,
              style: {
                background: "#FF4B4B",
                color: "white",
              },
            },
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ConditionalHeader />
            {children}
            <DebugButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
