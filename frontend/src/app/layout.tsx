import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "SANITEX",
  description: "Smart Hygiene and Sanitation Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Nav />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
