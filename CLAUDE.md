# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Echofy is a real-time chat application built with Next.js (client) and Node.js/Express (server). The app features user authentication, friend management, and real-time messaging with Socket.IO.

## Architecture

### Client (Next.js 14+)
- **Framework**: Next.js 16.2.4 with React 19.2.4
- **State Management**: Zustand for global state (auth, chat)
- **Real-time Communication**: Socket.IO client
- **Styling**: Tailwind CSS v4
- **Authentication**: Token-based with cookies
- **Base URL**: Client runs on `http://localhost:3001`

### Server (Node.js/Express)
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO server
- **Authentication**: JWT tokens stored in cookies
- **Port**: 5000 (configurable via PORT env var)

### Database Schema
- **User**: username, password, name, bio, profilePic, phone, isOnline, lastSeen
- **Message**: senderId, receiverId, text, replyTo, status (sent/delivered/seen), timestamps
- **FriendRequest**: Friend relationship management

### Real-time Features
- User online/offline status tracking
- Message delivery status updates (sent → delivered → seen)
- Push notifications for undelivered messages when user comes online

## Development Commands

### Client
```bash
cd client
npm install
npm run dev          # Start development server (localhost:3001)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

### Server
```bash
cd server
npm install
npm run dev          # Start with nodemon (localhost:5000)
npm run start       # Start production server
```

### Database Setup
1. Start MongoDB: `mongod` or use Docker
2. Create `.env` file in server directory with:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/echofy
   JWT_SECRET=hackMe!
   ```

## Key Components

### Authentication Flow
- Login/Register via `/api/auth` endpoints
- JWT tokens stored in httpOnly cookies
- Protected routes with `protect` middleware
- Zustand store manages auth state and socket connections

### Socket Events
- `user_online`: User comes online, triggers message delivery
- `messages_seen`: Marks messages as read
- `messages_delivered`: Notifies senders when messages are delivered
- `online_users`: Broadcasts online user list

### Routing Structure
- Client: `/login`, `/register`, `/friends`, `/chat/[userId]`
- Server: `/api/auth`, `/api/users`, `/api/friends`, `/api/messages`

## Important Notes

- Client and server communicate via CORS (port 3001 ↔ 5000)
- Socket.IO auto-connects after login
- Messages have status tracking: sent → delivered → seen
- Online status is maintained in server memory (`onlineUsers` object)
- No persistent session storage - user state resets on server restart