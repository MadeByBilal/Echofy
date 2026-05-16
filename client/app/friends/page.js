'use client'

import { useState } from 'react'
import axiosInstance from '../../lib/axiosInstance'
import Image from 'next/image'
import './friends.css'

export default function FriendsPage() {
  const [phone, setPhone] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requestSent, setRequestSent] = useState(false)

  const handleSearch = async () => {
    if (!phone) return
    setIsSearching(true)
    setError('')
    setSuccess('')
    setSearchResult(null)
    setRequestSent(false)

    try {
      const res = await axiosInstance.get(`/users/search?phone=${phone}`)
      setSearchResult(res.data.user)
    } catch (err) {
      setError(err.response?.data?.message || 'User not found')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendRequest = async () => {
    if (!searchResult) return
    setIsSending(true)
    setError('')

    try {
      await axiosInstance.post('/friends/request', { to: searchResult._id })
      setSuccess('Friend request sent!')
      setRequestSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="friends-page">
      <div className="friends-container">

        <h1 className="friends-title">Find Friends</h1>

        {/* SEARCH */}
        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="Search by phone number..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        {/* SEARCH RESULT */}
        {searchResult && (
          <>
            <p className="section-title">Search Result</p>
            <div className="user-card">
              <div className="user-info">
                <div className="user-avatar">
                  {searchResult.profilePic ? (
                    <Image src={searchResult.profilePic} alt="avatar" />
                  ) : (
                    searchResult.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="user-name">
                    {searchResult.name || searchResult.username}
                  </p>
                  <p className="user-phone">{searchResult.phone}</p>
                </div>
              </div>

              <button
                className={`add-friend-btn ${requestSent ? 'sent' : ''}`}
                onClick={handleSendRequest}
                disabled={isSending || requestSent}
              >
                {requestSent ? 'Request Sent' : isSending ? 'Sending...' : 'Add Friend'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}