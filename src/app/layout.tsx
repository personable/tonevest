import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google'; // Import IBM Plex fonts
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

// Configure IBM Plex Sans for body text
const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Include necessary weights
});

// Configure IBM Plex Serif for headings
const ibmPlexSerif = IBM_Plex_Serif({
  variable: '--font-ibm-plex-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Include necessary weights
});

export const metadata: Metadata = {
  title: 'Pedal Identifier', // Update title
  description: 'Identify guitar pedals from photos using AI', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply font variables to the body */}
      <body className={`${ibmPlexSans.variable} ${ibmPlexSerif.variable} font-sans antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
