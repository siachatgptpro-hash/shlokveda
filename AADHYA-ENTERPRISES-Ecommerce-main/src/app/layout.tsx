import type { Metadata } from 'next';
import './global.css';
import { Providers } from '@/components/shared/Providers';

export const metadata: Metadata = {
  title: 'Sholkveda | Product Catalogue',
  description: 'Browse Sholkveda products with pack sizes, printed MRPs and product images transcribed from the supplied brochure.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#FAF7F2] text-[#1F2937] selection:bg-[#1B4332] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
