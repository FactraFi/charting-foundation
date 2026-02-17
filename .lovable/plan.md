

## Real Conversation History with Backend Integration

### Overview

Replace the hardcoded mock chat history with real persisted conversations stored in the database. Each user gets their own conversation threads that persist across sessions.

### Database Changes

**1. Create `conversations` table**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| user_id | uuid | Not nullable |
| title | text | Default `'New Conversation'` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

RLS: users can SELECT, INSERT, UPDATE, DELETE their own conversations only.

**2. Create `chat_messages` table**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| conversation_id | uuid | Foreign key to `conversations.id` ON DELETE CASCADE |
| role | text | `'user'` or `'assistant'` |
| content | text | Message content |
| created_at | timestamptz | Default `now()` |

RLS: users can SELECT and INSERT messages where the parent conversation belongs to them.

### Frontend Changes

**File: `src/hooks/use-conversations.ts`** (new)

A custom hook providing:
- `conversations`: list of user's conversations ordered by `updated_at` desc
- `activeConversation`: currently selected conversation ID
- `messages`: messages for the active conversation
- `createConversation()`: creates a new conversation and selects it
- `selectConversation(id)`: loads messages for a conversation
- `deleteConversation(id)`: removes a conversation
- Auto-generates a title from the first user message (truncated to ~40 chars)

**File: `src/components/AIView.tsx`**

- Remove hardcoded `chatHistory` array and `activeChat` state
- Import and use the `useConversations` hook
- Sidebar renders real conversations from the database with relative timestamps (using `date-fns` `formatDistanceToNow`)
- The "+" button calls `createConversation()`
- Clicking a conversation loads its messages
- On sending a message: save user message to DB, stream AI response, save assistant message to DB, update conversation `updated_at` and title (if first message)
- Add a delete button (trash icon) on conversation items for cleanup
- Show empty state when no conversations exist

### How It Works

1. User opens AI tab -- hook fetches their conversations from DB
2. If no conversations exist, auto-create one with the welcome message
3. User sends a message -- it's saved to `chat_messages`, then streamed to AI, and the response is also saved
4. Conversation title is auto-generated from the first user message
5. Switching conversations loads that conversation's messages from DB
6. The "+" button creates a fresh conversation

### Technical Details

- Uses `useAuth()` to get the current user ID for all queries
- Messages are saved immediately (user message before streaming, assistant message after streaming completes)
- Conversation `updated_at` is bumped on each new message so the sidebar sorts correctly
- Preview text in sidebar shows the last message content, truncated
- No edge function changes needed -- all persistence uses the Supabase client directly

