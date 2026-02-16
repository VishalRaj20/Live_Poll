# LivePoll – Real-Time Polling App

LivePoll is a simple real-time polling web application built using **Next.js**, **Supabase**, and **Tailwind CSS**.  
It allows users to create polls, share them via a link, and see results update live as people vote.

![LivePoll Demo](https://github.com/VishalRaj20/Live_Poll/blob/3771bd1a7904905613d440b376c98995f7dcd9de/public/Screenshot%202026-02-17%20013523.png)

## Features

- Create a poll with a question and multiple options
- Share a link so others can join and vote
- Real-time result updates using Supabase Realtime
- Results displayed using progress bars and charts
- Data is persisted in PostgreSQL (Supabase)
- Responsive UI built with shadcn/ui and Tailwind CSS

---

## Fairness / Anti-Abuse

The app includes two mechanisms to reduce repeat or abusive voting.

### 1. Device-based voting (Anonymous polls)

- When a user opens the app, a unique `device_id` is generated and stored in `localStorage`.
- This `device_id` is sent with every vote request.
- In the database, there is a unique constraint on `(poll_id, device_id)` in the `votes` table.
- This means the same browser/device cannot vote more than once on the same poll.

**Prevents:**
- Repeated voting from the same browser
- Spamming the vote button or refreshing the page to vote again

**Limitations:**
- A user can bypass this by clearing browser data, using incognito mode, or switching devices/browsers.

---

### 2. Strict Mode (Authenticated voting)

- When creating a poll, the creator can enable **Require Login (Strict Mode)**.
- In this mode, only logged-in users can vote.
- The backend verifies the Supabase Auth session before accepting a vote.
- The `votes` table stores the `user_id` and has a unique constraint on `(poll_id, user_id)`.

**Prevents:**
- Voting multiple times from different devices
- Incognito/private window abuse
- Enforces one vote per account per poll

**Limitations:**
- A user could still create multiple accounts.

---

## Edge Cases Handled

- Poll not found (shows a proper error state)
- Validation: at least 2 non-empty options required to create a poll
- Duplicate voting is blocked by database constraints
- Concurrent voting is handled safely using database constraints and server-side checks
- Page refresh does not lose data (all data is persisted in Supabase)
- Vote changing is handled using an UPSERT strategy (user can change their vote while still keeping 1 vote per user/device)

---

## Known Limitations / Future Improvements

- Anonymous polls rely on `device_id`, which can be bypassed by clearing browser storage
- No IP-based rate limiting yet (could be added later with middleware or Redis)
- No CAPTCHA for anonymous polls
- No poll expiration or closing feature yet

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend & DB:** Supabase (PostgreSQL, Realtime, Auth)
- **Charts & Animations:** Recharts, Framer Motion

---

## Setup & Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/VishalRaj20/Live_Poll.git
   cd Live_Poll
   ```
   
2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the application**:
    ```bash
    npm run dev
    ```
