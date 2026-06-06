'use client'

import { Manrope } from 'next/font/google'

import { GoogleAnalytics } from '@next/third-parties/google'
import { useEffect, type ReactNode } from 'react'
import useAuthStore from '@/store/authStore'
import usePresence from '@/hooks/usePresence'
import useNotifications from '@/hooks/useNotifications'
import NotificationToast from '@/components/ui/NotificationToast'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { getMe } = useAuthStore()
  usePresence()
  useNotifications()

  useEffect(() => {
    getMe()
  }, [])

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
        <NotificationToast />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  )
}
