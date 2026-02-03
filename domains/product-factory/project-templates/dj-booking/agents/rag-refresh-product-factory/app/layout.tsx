import './globals.css';
import { Sidebar } from '../components/Sidebar';

export const metadata = {
  title: 'RAG Refresh Product Factory',
  description: 'Next.js-ready review pack + minimal RAG engine'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <Sidebar />
          <main className="main">
            <div className="container">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
