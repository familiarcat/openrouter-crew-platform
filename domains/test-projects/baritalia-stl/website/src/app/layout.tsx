import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'BarItalia STL - Authentic Italian Cuisine',
  description: 'Experience authentic Italian dining at BarItalia STL in downtown St. Louis. Award-winning cuisine and exceptional service.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
