import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FastMenu',
  description: 'Sistema de pedidos para comidas rápidas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
