# CodeQuest â€” Learning Platform for Classes 11â€“12

A beginner-friendly full-stack learning platform for students to explore programming languages, understand technology, take lessons and save personal progress.

## Technology stack
- **Frontend:** HTML, CSS, and vanilla JavaScript (no React or Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT tokens and bcrypt password hashing

## Project structure
```text
CodeQuest-MERN/
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ index.html
â”‚   â”œâ”€â”€ login.html
â”‚   â”œâ”€â”€ signup.html
â”‚   â”œâ”€â”€ dashboard.html
â”‚   â”œâ”€â”€ technology-map.html
â”‚   â”œâ”€â”€ lessons.html
â”‚   â”œâ”€â”€ careers.html
â”‚   â”œâ”€â”€ css/style.css
â”‚   â””â”€â”€ js/{api.js,auth.js,app.js}
â””â”€â”€ backend/
    â”œâ”€â”€ src/models/
    â”œâ”€â”€ src/routes/
    â”œâ”€â”€ src/middleware/
    â”œâ”€â”€ server.js
    â”œâ”€â”€ seed.js
    â””â”€â”€ .env.example
```

## Requirements
- Node.js 20 or newer recommended
- MongoDB Community Server running locally OR a MongoDB Atlas database
- VS Code
- **Live Server extension** in VS Code (to serve the plain HTML frontend)

## 1. Configure and start the backend
Open a PowerShell terminal in the project folder:

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Open `backend/.env` and set the values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/codequest
JWT_SECRET=replace_this_with_a_long_random_secret_before_running
CLIENT_ORIGIN=http://127.0.0.1:5500
```

Make sure MongoDB is running, then in the `backend` folder run:

```powershell
npm run seed
npm run dev
```

The API should be available at `http://localhost:5000`. Check `http://localhost:5000/api/health` for a health response.

If using MongoDB Atlas, replace `MONGODB_URI` with your own Atlas connection string. Never publish your database URI or JWT secret.

## 2. Start the HTML/CSS/JavaScript frontend
Open a **second** VS Code terminal in the project root and run:

```powershell
code .
```

In VS Code Explorer, open `frontend/index.html`, right-click it, and select **Open with Live Server**. The browser should open at `http://127.0.0.1:5500` (or the port shown by Live Server).

If Live Server uses a different port, update `CLIENT_ORIGIN` in `backend/.env` to the exact frontend origin, restart the backend, and update `API_BASE` in `frontend/js/api.js` only if your backend URL changes.

Do not double-click the HTML file to open it as `file://...`; use Live Server so browser requests to the API work correctly.

## Features
- Signup/login with password hashing and JWT authentication
- Language directory loaded from MongoDB, with search and category filter
- YouTube playlist links for every seeded language, loaded from MongoDB through `/api/playlists`
- Actual playlist embeds when a playlist record contains a YouTube playlist ID (`?list=...`); seeded links initially open YouTube search results so you can select a current full-course playlist
- Lessons loaded from MongoDB and lesson completion saved per signed-in student
- Student dashboard with individual lesson progress and quiz-attempt stats
- Technology and career exploration pages
- Responsive dark interface built with plain CSS
- Express APIs for language directory, lessons, quizzes and per-user progress

## Admin language creation
The backend includes an admin-only language creation endpoint. To promote a trusted account, register first and then update that user's `role` to `admin` in MongoDB using MongoDB Compass or `mongosh`. Do this only for an account you control.

## Production notes
This is a learning starter, not a production-hardened service. Before deployment, use HTTPS, a strong unique secret, strict CORS settings, input validation, account recovery and email verification, database backups, and age-appropriate privacy safeguards. Never execute arbitrary user-submitted code on the server.


## YouTube playlists
The seed script creates one playlist resource for every language currently listed in CodeQuest. By default, each opens a YouTube search for beginner-friendly complete-course playlists; this avoids hard-coding unverified or outdated playlist IDs. Once you choose a playlist, an admin can save its exact YouTube URL with `PUT /api/playlists/:languageSlug` using a JWT belonging to an account whose MongoDB `role` is `admin`. A URL containing `?list=PLAYLIST_ID` is embedded directly in the language card.

Example request body:
```json
{
  "title": "Python full course playlist",
  "description": "Start here and follow the lessons in order.",
  "playlistUrl": "https://www.youtube.com/playlist?list=YOUR_REAL_PLAYLIST_ID",
  "level": "Beginner",
  "active": true
}
```

The playlist API is public for reading (`GET /api/playlists` and `GET /api/playlists/:languageSlug`); editing requires authentication and the admin role. Replace `YOUR_REAL_PLAYLIST_ID` with an actual playlist ID copied from YouTube.
