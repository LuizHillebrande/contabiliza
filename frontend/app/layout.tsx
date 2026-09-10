import "./globals.css"

import Sidebar from "../components/Sidebar"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>

        <div className="container">

          <Sidebar />

          <div className="content-area">

            <Navbar />

            <main className="main-content">
              {children}
            </main>

            <Footer />

          </div>

        </div>

      </body>
    </html>
  )
}