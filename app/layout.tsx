import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import PasscodeGateWrapper from '@/components/PasscodeGateWrapper';

export const metadata: Metadata = {
  title: 'Walmart Enterprise Platform',
  description: 'Unified portfolio intelligence — L1 through L3',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PasscodeGateWrapper>
          <Nav />
          <main style={{ paddingTop: 48 }}>{children}</main>
        </PasscodeGateWrapper>
      </body>
    </html>
  );
}
