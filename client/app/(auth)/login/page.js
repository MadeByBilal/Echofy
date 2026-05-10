'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import Link from 'next/link'
import './login.css'
import Image from 'next/image'
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
    <div className="login-page">

      {/* LEFT SIDE - FORM */}
      <div className="login-left">
        <div className="login-box">

          <h1 className="login-title">Echofy</h1>
          <p className="login-subtitle">Login to your account</p>

          {error && <p className="error-msg">{error}</p>}

          <form className="login-form" onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

          </form>

          <p className="login-footer">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register">Register</Link>
          </p>

        </div>
      </div>

      {/* RIGHT SIDE - IMAGE */}
      <div className="login-right">
        <Image
          className="login-right-image"
          src=""
          alt="background"
        />
      </div>

    </div>
  )
}