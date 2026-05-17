"use client";

import { useState, useEffect } from "react";
import axiosInstance from "../../lib/axiosInstance";
import Image from "next/image";
import "./friends.css";

export default function FriendsPage() {
  const [phone, setPhone] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  async function fetchIncomingRequests() {
    try {
      const res = await axiosInstance.get("/friends/requests");
      setIncomingRequests(res.data.requests);
    } catch (err) {
      console.log("Error fetching requests:", err);
    }
  }

  // load incoming requests on page load
  useEffect(() => {
    fetchIncomingRequests();
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axiosInstance.get("/friends");
      setFriends(res.data.friends);
    } catch (err) {
      console.log("Error fetching friends:", err);
    }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await axiosInstance.patch("/friends/respond", { requestId, action });
      setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
      setSuccess(action === "accepted" ? "Friend added!" : "Request rejected");
      if (action === "accepted") fetchFriends(); // refresh friends list
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleSearch = async () => {
    if (!phone) return;
    setIsSearching(true);
    setError("");
    setSuccess("");
    setSearchResult(null);
    setRequestSent(false);

    try {
      const res = await axiosInstance.get(`/users/search?phone=${phone}`);
      setSearchResult(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "User not found");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setIsSending(true);
    setError("");

    try {
      await axiosInstance.post("/friends/request", { to: searchResult._id });
      setSuccess("Friend request sent!");
      setRequestSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-container">
        <h1 className="friends-title">Friends</h1>

        {/* SEARCH */}
        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="Search by phone number..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
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
                className={`add-friend-btn ${requestSent ? "sent" : ""}`}
                onClick={handleSendRequest}
                disabled={isSending || requestSent}
              >
                {requestSent
                  ? "Request Sent"
                  : isSending
                    ? "Sending..."
                    : "Add Friend"}
              </button>
            </div>
          </>
        )}

        {/* INCOMING REQUESTS */}
        {incomingRequests.length > 0 && (
          <>
            <p className="section-title">
              Friend Requests ({incomingRequests.length})
            </p>
            {incomingRequests.map((request) => (
              <div key={request._id} className="user-card">
                <div className="user-info">
                  <div className="user-avatar">
                    {request.from.profilePic ? (
                      <Image src={request.from.profilePic} alt="avatar" />
                    ) : (
                      request.from.username[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="user-name">
                      {request.from.name || request.from.username}
                    </p>
                    <p className="user-phone">{request.from.phone}</p>
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleRespond(request._id, "accepted")}
                  >
                    Accept
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleRespond(request._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      {/* FRIENDS LIST */}
      {friends.length > 0 && (
        <>
          <p className="section-title">My Friends ({friends.length})</p>
          {friends.map((friend) => (
            <div key={friend._id} className="user-card">
              <div className="user-info">
                <div className="user-avatar">
                  {friend.profilePic ? (
                    <Image src={friend.profilePic} alt="avatar" />
                  ) : (
                    friend.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="user-name">{friend.name || friend.username}</p>
                  <div className="user-status">
                    <span
                      className={`status-dot ${friend.isOnline ? "online" : "offline"}`}
                    ></span>
                    <span className="status-text">
                      {friend.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="message-btn"
                onClick={() => (window.location.href = `/chat/${friend._id}`)}
              >
                Message
              </button>
            </div>
          ))}
        </>
      )}

      {friends.length === 0 &&
        incomingRequests.length === 0 &&
        !searchResult && (
          <p className="empty-msg">
            No friends yet. Search by phone to add friends.
          </p>
        )}
    </div>
  );
}
