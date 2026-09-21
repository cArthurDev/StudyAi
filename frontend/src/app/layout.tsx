import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata: Metadata = {
  title: 'StudyMind AI — Plataforma de Estudos com IA Local',
  description: 'Estude com Inteligência Artificial 100% local com Ollama (qwen3:8b e qwen3-embedding:0.6b). Resumos, flashcards, questões, simulados e modo prova de emergência.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.setItem('studymind-theme', 'light');
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                const a11y = localStorage.getItem('studymind-a11y');
                if (a11y === 'colorblind' || a11y === 'high-contrast' || a11y === 'monochrome') {
                  document.documentElement.setAttribute('data-a11y', a11y);
                }
                if (localStorage.getItem('studymind-text') === 'large') {
                  document.documentElement.setAttribute('data-text', 'large');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#0a0d12] text-slate-100 min-h-screen antialiased selection:bg-teal-500/30 selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
