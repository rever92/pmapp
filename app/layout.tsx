import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { MainNav } from "@/components/main-nav";
import { RoleProvider } from '@/components/providers/RoleProvider'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Project Management System',
  description: 'Manage consultants, projects, and workload efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RoleProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen bg-background">
              <MainNav />
              <main className="container mx-auto py-6">
                {children}
              </main>
            </div>
            <Toaster />
          </ThemeProvider>
        </RoleProvider>
      </body>
    </html>
  );
}