# CodeQuest — Learning Platform for Classes 11–12

A beginner-friendly full-stack learning platform for students to explore programming languages, understand technology, take lessons and save personal progress.

## Technology stack
- **Frontend:** HTML, CSS, and vanilla JavaScript (no React or Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT tokens and bcrypt password hashing

## Project structure
```text
CodeQuest-MERN/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── technology-map.html
│   ├── lessons.html
│   ├── careers.html
│   ├── css/style.css
│   └── js/{api.js,auth.js,app.js}
└── backend/
    ├── src/models/
    ├── src/routes/
    ├── src/middleware/
    ├── server.js
    ├── seed.js
    └── .env.example
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
JWT_SECRET=replace_with_a_long_random_secret
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
- Lessons loaded from MongoDB and lesson completion saved per signed-in student
- Student dashboard with individual lesson progress and quiz-attempt stats
- Technology and career exploration pages
- Responsive dark interface built with plain CSS
- Express APIs for language directory, lessons, quizzes and per-user progress

## Admin language creation
The backend includes an admin-only language creation endpoint. To promote a trusted account, register first and then update that user's `role` to `admin` in MongoDB using MongoDB Compass or `mongosh`. Do this only for an account you control.

## Production notes
This is a learning starter, not a production-hardened service. Before deployment, use HTTPS, a strong unique secret, strict CORS settings, input validation, account recovery and email verification, database backups, and age-appropriate privacy safeguards. Never execute arbitrary user-submitted code on the server.
