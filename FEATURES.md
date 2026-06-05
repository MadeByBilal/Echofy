# Echofy Features — Complete Reference

## 1. Typing Indicator

**What it does**: Shows "typing..." below the friend's name when they're typing a message.

**Server** (`server/socket/socket.js`):
- Added `typing` event — receiver gets `{ senderId }`
- Added `stop_typing` event — receiver clears the indicator
- Events broadcast only to the specific chat partner via `onlineUsers`

**Client** (`client/app/chat/[userId]/page.js`):
- `handleTyping()` emits `typing` via socket on every keystroke
- Debounced: `stop_typing` fires after 1.5s of inactivity
- `onTyping` / `onStopTyping` socket listeners toggle `isTyping` state

**Client** (`client/components/chat/ChatWindow.jsx`):
- Header status changes to `"typing..."` (colored primary) when `isTyping` is true

---

## 2. Message Reactions

**What it does**: Tap the menu on any message → pick an emoji → it appears below the bubble. Tap same emoji again to toggle off.

**Server** (`server/models/Message.model.js`):
- Added `reactions` array: `[{ emoji: String, userId: ObjectId }]`

**Server** (`server/socket/socket.js`):
- `message_reaction` event — adds/removes emoji (toggle behavior)
- Broadcasts `reaction_updated` to both sender and receiver with updated list

**Client** (`client/components/chat/ChatBubble.jsx`):
- Context menu shows 6 quick reaction emojis (👍 ❤️ 😂 😮 😢 🙏)
- Existing reactions shown below bubble with count
- Tapping an existing reaction toggles it off
- Reactions grouped by emoji with user count

---

## 3. Message Edit & Delete

**What it does**: Long-press your own message → Edit (change text) or Delete (remove entirely).

**Server** (`server/models/Message.model.js`):
- Added `isEdited: Boolean`, `isDeleted: Boolean`

**Server** (`server/controllers/message.controller.js`):
- `PATCH /api/messages/edit` — updates text, sets `isEdited: true`
- `DELETE /api/messages/delete` — sets `isDeleted: true`, clears content
- Both emit socket events (`message_edited`, `message_deleted`) for real-time sync

**Client** (`client/components/chat/ChatBubble.jsx`):
- Context menu shows "Edit" and "Delete" (own messages only)
- Edit opens inline text input, saves via `PATCH /messages/edit`
- Shows "(edited)" badge on edited messages
- Delete prompts confirmation, then `DELETE /messages/delete`

---

## 4. Voice Messages

**What it does**: Record audio from the mic and send it as a playable voice message.

**Not yet implemented** — requires `MediaRecorder` API on client + `<audio>` player in ChatBubble.

**Plan**:
- Client: `MediaRecorder` captures audio chunks → creates `Blob` → uploads to `/messages/upload`
- Server: Cloudinary stores audio as `resource_type: "video"` (handles audio)
- Client: ChatBubble detects `fileType === "audio"` → shows play button + waveform → `<audio>` tag for playback
- Audio attachment button in ChatInput file picker (already added)

---

## 5. Message Search

**What it does**: Search across all your chats by keyword.

**Server** (`server/controllers/message.controller.js`):
- `GET /api/messages/search?q=<query>` — regex search on `text` field
- Filters: only your messages + non-deleted
- Populates sender name for display
- Returns last 50 matches sorted newest first

**Client** (`client/components/chat/ChatWindow.jsx`):
- Search icon in header toggles an inline search bar
- Sends query to `/messages/search` on input

**Full global search** (to be added): Search bar on the chat list page (`chat/page.js`) that searches all conversations.

---

## 6. Group Chats

**What it does**: Create groups with friends, send messages to the group, manage members.

### Models

**Server** (`server/models/Group.model.js`):
```js
{
  name, description, profilePic,
  createdBy: UserId,
  members: [{ user: UserId, role: "admin"|"member", joinedAt }],
  lastMessage: MessageId
}
```

**Server** (`server/models/Message.model.js`):
- Added `groupId` field — messages can target a user OR a group

### API Routes (`server/routes/group.routes.js`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups/create` | Create group with name + member list |
| GET | `/api/groups/my` | List my groups |
| GET | `/api/groups/:groupId` | Get group details |
| GET | `/api/groups/:groupId/messages` | Get group messages |
| POST | `/api/groups/:groupId/add` | Add member (admin only) |
| POST | `/api/groups/:groupId/remove` | Remove member (admin only) |
| PATCH | `/api/groups/:groupId/update` | Update name/description/photo |

### Controller (`server/controllers/group.controller.js`)
- `createGroup` — creator auto-added as admin, members as "member"
- `addMember` / `removeMember` — admin-only, checks membership
- `getGroupMessages` — fetches all non-deleted messages for the group

### Messaging
- `sendMessage` in message controller accepts `groupId` in addition to `receiverId`
- Messages delivered to all online group members via socket broadcast
- Group messages shown in ChatBubble with sender name

### Client (not yet implemented — needs UI):
- "New Group" button → friend picker → create group modal
- Group list in chat page alongside friends
- Group chat view with member header
- Member management (add/remove) in group info panel

---

## Code Architecture Summary

```
Server/
├── models/
│   ├── Message.model.js     ← reactions, isEdited, isDeleted, groupId
│   ├── Group.model.js       ← NEW: group chats
│   └── ...
├── controllers/
│   ├── message.controller.js ← edit, delete, search
│   └── group.controller.js   ← NEW: CRUD + members
├── routes/
│   ├── message.routes.js    ← added edit, delete, search
│   └── group.routes.js      ← NEW
└── socket/
    └── socket.js            ← typing, stop_typing, message_reaction, reaction_updated

Client/
├── components/chat/
│   ├── ChatInput.jsx        ← typing emission, file picker with categories
│   ├── ChatBubble.jsx       ← reactions, edit, delete, context menu
│   └── ChatWindow.jsx       ← typing indicator, search bar
└── app/chat/[userId]/
    └── page.js              ← all socket handlers, reaction/edit/delete/search logic
```
