import './globals.css'

export const metadata = {
  title: 'Product Zoek Machine',
  description: 'Zoek producten met tekst en voice search powered by AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
      </body>
    </html>
  )
}