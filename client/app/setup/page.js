'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axiosInstance from '../lib/axios'
import Image from 'next/image'
import './setup.css'

export default function SetupPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    bio: ''
  })
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatar(file)
    setPreview(URL.createObjectURL(file))  // show preview instantly
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // if user picked an image, upload to cloudinary first
      let profilePicUrl = ''

      if (avatar) {
        const imageData = new FormData()
        imageData.append('image', avatar)
        const uploadRes = await axiosInstance.post('/users/upload', imageData)
        profilePicUrl = uploadRes.data.url
      }

      // update profile
      await axiosInstance.patch('/users/setup', {
        name: formData.name,
        bio: formData.bio,
        profilePic: profilePicUrl
      })

      router.push('/chat')

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="setup-page">
      <div className="setup-box">

        <h1 className="setup-title">Setup Profile</h1>
        <p className="setup-subtitle">Let people know who you are</p>

        {error && <p className="error-msg">{error}</p>}

        {/* AVATAR */}
        <div className="avatar-upload">
          {preview ? (
            <Image src={preview} alt="avatar" className="avatar-preview" />
          ) : (
            <div
              className="avatar-placeholder"
              onClick={() => fileInputRef.current.click()}
            >
              + Photo
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            className="avatar-file-input"
            ref={fileInputRef}
            onChange={handleAvatarChange}
          />

          <button
            className="avatar-upload-btn"
            onClick={() => fileInputRef.current.click()}
          >
            Choose Photo
          </button>
        </div>

        <form className="setup-form" onSubmit={handleSubmit}>

          <div className="form-field">
            <label className="form-label">Display Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Bio</label>
            <textarea
              name="bio"
              placeholder="Tell something about yourself..."
              value={formData.bio}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="setup-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>

        </form>

        <button
          className="skip-btn"
          onClick={() => router.push('/chat')}
        >
          Skip for now
        </button>

      </div>
    </div>
  )
}