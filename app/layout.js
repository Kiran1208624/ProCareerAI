import './globals.css'
import { Providers } from './providers'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Veyra AI — Your AI Career Operating System',
  description: 'Build resumes, manage jobs, prepare interviews, connect Gmail & Calendar, and let AI guide your career.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#050505] text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
