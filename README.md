# LivePoll - Real-time Instant Polling Application

LivePoll is a modern, real-time polling application built with **Next.js 15**, **Supabase**, and **Tailwind CSS**. It allows users to create polls instantly, share them via a link, and watch results update live as votes come in.

![LivePoll Demo](/opengraph-image.png)

## 🛡️ Fairness / Anti-Abuse Mechanisms

To ensure the integrity of poll results, LivePoll implements two distinct mechanisms to prevent repeat or abusive voting.

### Mechanism 1: Device ID Fingerprinting (Anonymous Polling)
For public polls where ease of access is prioritized, we use a browser-based fingerprinting method.

*   **How it works**: When a user visits a poll, a unique `UUID` is generated and stored in their browser's `localStorage`. When a vote is submitted, this `device_id` is sent to the API.
*   **Enforcement**: The database (`votes` table) has a unique constraint on `(poll_id, device_id)`. The API checks if a vote with this `device_id` already exists for the given poll.
*   **Threats Prevented**:
    *   Prevents users from spamming the "Vote" button.
    *   Prevents casual re-voting by refreshing the page or navigating away and back.
*   **Known Limitations**: This is a "soft" security measure. Sophisticated users can bypass this by clearing their browser cache, using Incognito mode, or using a different browser.

### Mechanism 2: Strict Mode (Authenticated Voting)
For polls requiring higher security and integrity, creators can enable **"Strict Mode"**.

*   **How it works**: When creating a poll, the "Require Login" option can be toggled. This restricts voting to authenticated users only.
*   **Enforcement**:
    *   **Frontend**: The UI blocks the vote action and prompts the user to log in.
    *   **Backend**: The API validates the user's Supabase Auth session token. The database records the encrypted `user_id` alongside the vote. A unique constraint on `(poll_id, user_id)` ensures one person cannot vote multiple times, even if they switch devices.
*   **Threats Prevented**:
    *   Prevents "Device Hopping" (voting from phone, then laptop, then tablet).
    *   Prevents Incognito/Private window abuse.
    *   Ensures 1 Person = 1 Vote (assuming 1 account per person).
*   **Edge Cases Handled**:
    *   **Concurrent Voting**: Logic handles race conditions where a user might try to vote from two devices simultaneously.
    *   **Session Expiry**: Gracefully handles expired tokens by redirecting to login.

### Edge Cases & General Handling
*   **Vote Changing**: Instead of blocking a user who tries to vote again, we implemented an **UPSERT** (Update or Insert) strategy. If a user changes their mind, they can switch their vote. The system decrements their old option and increments the new one, maintaining the "1 Vote per User" rule while improving UX.
*   **Database Constraints**: We rely on PostgreSQL level `UNIQUE` constraints as the final source of truth, ensuring that even if the API logic fails, the database remains consistent.

### Future Improvements
*   **IP Rate Limiting**: Implementing IP-based limiting (via Redis or Middleware) would add another layer of protection against bot nets.
*   **CAPTCHA**: Adding a CAPTCHA (e.g., Turnstile) for anonymous polls would significantly reduce automated bot spam.

---

## 🚀 Key Features

*   **Real-time Updates**: Powered by **Supabase Realtime**, results update instantly across all connected clients without refreshing.
*   **Beautiful Visualizations**:
    *   Dynamic Progress Bars (Framer Motion)
    *   Interactive Bar & Pie Charts (Recharts)
*   **Premium UI/UX**:
    *   Glassmorphism design system
    *   Mesh gradient backgrounds
    *   Smooth layout animations
    *   Responsive Grid Layouts
*   **Dashboard**: Users can track polls they've created and voted on.
*   **Smart Sharing**: One-click link copying and easy sharing.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, Shadcn/UI
*   **Backend**: Supabase (PostgreSQL, Auth, Realtime)
*   **Animations**: Framer Motion
*   **Charts**: Recharts
*   **Icons**: Lucide React

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/live-poll.git
    cd live-poll
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**:
    Run the SQL scripts located in `supabase/schema.sql` in your Supabase SQL Editor to set up the tables and policies.

5.  **Run the application**:
    ```bash
    npm run dev
    ```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
