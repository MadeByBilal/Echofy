'use client'




import { Inter } from 'next/font/google'

import { useEffect } from 'react'
import useAuthStore from '@/store/authStore'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  const { getMe } = useAuthStore()

  useEffect(() => {
    getMe()
  }, [])

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}