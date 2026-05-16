'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await login(formData)
      router.push('/chat')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        
        <h1 className="text-white text-2xl font-bold mb-6 text-center">
          Login to Echofy
        </h1>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg outline-none"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p className="text-gray-400 text-sm text-center mt-4">
  Don&apos;t have an account?{' '}
  <Link href="/register" className="text-blue-400 hover:underline">
    Register
  </Link>
</p>

      </div>
    </div>
  )
}