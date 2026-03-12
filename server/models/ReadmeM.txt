# 🗄 Database Models — MeetSync Backend

> MongoDB Atlas + Mongoose | 4 Models | Everything stored here permanently

---

## How the Models Connect (Big Picture First)

```
User
 └── joins → Conversation (exactly 2 users per chat)
               └── has → Messages (text or appointment)
                           └── links to → Appointment (date, time, status)
```

That's it. Everything in MeetSync flows through these 4 models.

---

## 1. 👤 User Model

> One document per registered person.

| Field | Type | Required | What it stores |
|---|---|---|---|
| `_id` | ObjectId | Auto | Unique ID (MongoDB auto-creates) |
| `name`| String | ✅ | Display name e.g. "shryas" |
| `username` | String | ✅ | Unique handle e.g. "shreyas123" |
| `email` | String | ✅ | For login only, never shown to others |
| `password` | String | ✅ | Hashed — never stored as plain text |
| `profile_picture` | String | ❌ | URL of profile image |
| `bio` | String | ❌ | Short description, max 200 characters |
| `createdAt` | Date | Auto | When account was created |

**Important rules:**
- `username` and `email` are both unique — no duplicates allowed
- `username` is always saved lowercase — so "Ahmed123" and "ahmed123" are the same
- Password is hashed with bcrypt before saving — raw password never touches the database

---

## 2. 💬 Conversation Model

> One document per chat thread between 2 users.

| Field | Type | Required | What it stores |
|---|---|---|---|
| `_id` | ObjectId | Auto | Unique conversation ID |
| `participants` | [ObjectId] | ✅ | Exactly 2 User IDs |
| `last_message_at` | Date | Auto | Time of most recent message |
| `created_at` | Date | Auto | When chat was created |

**Important rules:**
- `participants` must always have exactly 2 users — schema validation blocks anything else
- Indexed on `participants` so finding "do these 2 users already have a chat?" is fast
- Before creating a new conversation, the route checks if one already exists between those 2 users

**Why a separate Conversation model?**
Without it, finding all your chats would mean scanning every single message in the database. The Conversation model acts as a container — fast to query, easy to sort.

---

## 3. 📨 Message Model

> One document per message sent inside a chat.

| Field | Type | Required | What it stores |
|---|---|---|---|
| `_id` | ObjectId | Auto | Unique message ID |
| `conversation_id` | ObjectId | ✅ | Which chat this message belongs to |
| `sender_id` | ObjectId | ✅ | Who sent it |
| `message_type` | String | ✅ | Either `"text"` or `"appointment"` |
| `message_text` | String | ❌ | The actual text content |
| `appointment_id` | ObjectId | ❌ | Filled only when type is `"appointment"` |
| `createdAt` | Date | Auto | When message was sent |

**How the 2 message types work:**

```
Normal message
  message_type : "text"
  message_text : "Hey are you free tomorrow?"
  appointment_id: null

Appointment message
  message_type : "appointment"
  message_text : ""
  appointment_id: 64f3a2b → points to Appointment document
```

When frontend sees `message_type === "appointment"` it renders an appointment card with Accept / Reject buttons instead of a text bubble.

**Why no receiver_id field?**
The receiver is already known from the `participants` array in the Conversation. Storing it again in every message would be duplicate data.

---

## 4. 📅 Appointment Model

> One document per appointment offer created inside a chat.

| Field | Type | Required | What it stores |
|---|---|---|---|
| `_id` | ObjectId | Auto | Unique appointment ID (your appointment_id) |
| `conversation_id` | ObjectId | ✅ | Which chat it was created in |
| `host_id` | ObjectId | ✅ | Who created the appointment offer |
| `client_id` | ObjectId | ✅ | Who received the offer |
| `date` | String | ✅ | e.g. `"2024-12-25"` |
| `time` | String | ✅ | e.g. `"05:30 PM"` |
| `note` | String | ❌ | Extra instructions, max 500 characters |
| `status` | String | Auto | `"pending"` / `"accepted"` / `"rejected"` |
| `reminder_sent` | Boolean | Auto | Starts false, flips to true after reminder fires |
| `created_at` | Date | Auto | When appointment was created |

**Status flow — how it moves:**

```
Host creates appointment
        ↓
  status: "pending"
  (Accept / Reject buttons appear in chat)
        ↓
     Client decides
      ↙         ↘
"accepted"    "rejected"
      ↓
reminder_sent: false
      ↓
Cron job runs every hour
Is appointment within 24 hours?
      ↓
reminder_sent: true
Show reminder on dashboard
```

**Why `reminder_sent` boolean?**
Without it, the cron job would send a reminder every single hour until the appointment passes. Once it flips to `true`, the cron job skips it forever.

---

## 🔗 Full Relationship Map

```
User ──────────────────────────────────────────┐
 │                                             │
 │ participates in                             │
 ▼                                             │
Conversation ──────────────────────────────┐   │
 │                                         │   │
 │ contains                                │   │
 ▼                                         │   │
Message ────────────────────────────────┐  │   │
 │                                      │  │   │
 │ if type=appointment, links to        │  │   │
 ▼                                      │  │   │
Appointment ◄───────────────────────────┘  │   │
 │ conversation_id ──────────────────────►│   │
 │ host_id ───────────────────────────────────►│
 │ client_id ─────────────────────────────────►│
```

---

## ✅ Quick Reference — All Fields at a Glance

| Field | User | Conversation | Message | Appointment |
|---|---|---|---|---|
| `_id` (auto) | ✅ | ✅ | ✅ | ✅ |
| `name` | ✅ | | | |
| `username` | ✅ | | | |
| `email` | ✅ | | | |
| `password` | ✅ | | | |
| `profile_picture` | ✅ | | | |
| `bio` | ✅ | | | |
| `participants` | | ✅ | | |
| `last_message_at` | | ✅ | | |
| `conversation_id` | | | ✅ | ✅ |
| `sender_id` | | | ✅ | |
| `message_type` | | | ✅ | |
| `message_text` | | | ✅ | |
| `appointment_id` | | | ✅ | |
| `host_id` | | | | ✅ |
| `client_id` | | | | ✅ |
| `date` | | | | ✅ |
| `time` | | | | ✅ |
| `note` | | | | ✅ |
| `status` | | | | ✅ |
| `reminder_sent` | | | | ✅ |
| `created_at` (auto) | ✅ | ✅ | ✅ | ✅ |