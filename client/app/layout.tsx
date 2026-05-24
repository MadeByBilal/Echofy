'use client'

import { Manrope } from 'next/font/google'

import { useEffect, type ReactNode } from 'react'
import useAuthStore from '@/store/authStore'
import usePresence from '@/hooks/usePresence'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { getMe } = useAuthStore()
  usePresence()

  useEffect(() => {
    getMe()
  }, [])

  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${manrope.variable} bg-background text-on-background antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  )
}