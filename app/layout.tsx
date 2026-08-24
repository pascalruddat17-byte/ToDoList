import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pulse Tasks',
  description: 'Eine schnelle, mobile To-do-App mit Fokusliste und lokaler Speicherung.',
  manifest: '/manifest.json',
  applicationName: 'Pulse Tasks',
  appleWebApp: {
    capable: true,
    title: 'Pulse Tasks',
    statusBarStyle: 'black-translucent',
  },
  themeColor: '#f5f4ee',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
