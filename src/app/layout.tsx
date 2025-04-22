// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/navbar';
import AuthProvider from '@/components/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ファンコミュニティプラットフォーム',
  description: '配信者のファンが交流できる大規模コミュニティプラットフォーム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen bg-background">
              <Navbar />
              <main className="flex justify-center">
                <div className="w-full max-w-3xl px-4 py-6">
                  {children}
                </div>
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}