# 🚀 DevOps Academy — LMS

> This is your first real project. You will work on this codebase every single day of this course.
> Every topic you learn — Git, Linux, Docker, CI/CD, EC2 — you will apply directly on this project.

---

## 📌 What is this project?

This is a **Learning Management System (LMS)** — the same kind of tool used by platforms like Udemy, Coursera, and internal company portals.

It has:
- A **frontend** (what users see in the browser)
- A **backend** (the server that handles logic and data)
- A **database** (MongoDB Atlas — where all data is stored)

You did not build this from scratch. That is fine.
**Your job is to run it, manage it, deploy it, and improve it — just like a DevOps engineer at a real company.**

---

## 🏗️ Project Structure

```
devops-lms/
│
├── frontend/                  ← Everything the user sees in the browser
│   ├── index.html             ← The main HTML page
│   ├── css/
│   │   └── style.css          ← All the styling
│   └── js/
│       └── app.js             ← Frontend logic, talks to the backend API
│
├── backend/                   ← The server — runs on Node.js
│   ├── server.js              ← Starting point of the entire backend
│   ├── routes/                ← URL paths the server responds to
│   │   ├── auth.js            ← /api/auth/login and /api/auth/register
│   │   ├── users.js           ← /api/users (admin only)
│   │   ├── courses.js         ← /api/courses
│   │   ├── assignments.js     ← /api/assignments
│   │   ├── enrollments.js     ← /api/enrollments
│   │   ├── submissions.js     ← /api/submissions
│   │   └── announcements.js   ← /api/announcements
│   ├── models/                ← Shape of data stored in MongoDB
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Assignment.js
│   │   ├── Enrollment.js
│   │   ├── Submission.js
│   │   └── Announcement.js
│   └── middleware/
│       └── auth.js            ← Checks if a user is logged in (JWT)
│
├── .env.example               ← Template for your secret config values
├── .gitignore                 ← Tells Git which files to never track
├── package.json               ← List of all Node.js packages this app needs
└── README.md                  ← This file
```

---

## 🛠️ Tech Stack

| Part       | Technology            | Why                                            |
|------------|-----------------------|------------------------------------------------|
| Frontend   | HTML, CSS, JavaScript | Simple — no framework needed to understand it  |
| Backend    | Node.js + Express     | Most widely used backend stack in the industry |
| Database   | MongoDB Atlas         | Cloud-hosted — no local DB setup needed        |
| Auth       | JWT + bcryptjs        | Industry standard for login systems            |

---

## 💻 How to Run This Project Locally

Follow these steps in order.

---

### Step 1 — Get the code

**If your instructor gave you a pendrive:**
```bash
# Copy the devops-lms folder to your computer
# Open a terminal and navigate into it
cd devops-lms
```

**If your instructor shared a GitHub link:**
```bash
git clone https://github.com/INSTRUCTOR_USERNAME/devops-lms.git
cd devops-lms
```

---

### Step 2 — Check Node.js is installed

```bash
node -v
npm -v
```

Both should print a version number. If not, download Node.js from:
👉 https://nodejs.org  (choose the LTS version)

---

### Step 3 — Install project dependencies

```bash
npm install
```

This reads `package.json` and downloads everything the project needs.
It creates a `node_modules/` folder — never edit this folder manually.

---

### Step 4 — Create your environment file

```bash
# Mac / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env
```

Open `.env` in any text editor and fill in your values:

```
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/devops-lms
JWT_SECRET=write_any_long_random_string_here
PORT=5000
NODE_ENV=development
```

**How to get your MONGO_URI:**
1. Go to https://cloud.mongodb.com
2. Click your cluster → **Connect** → **Drivers**
3. Select **Node.js** as the driver
4. Copy the connection string shown
5. Replace `<username>` and `<password>` with your actual Atlas credentials
6. Paste it as `MONGO_URI` in your `.env`

> Also go to **Network Access** in Atlas and add `0.0.0.0/0` to allow connections from anywhere.

---

### Step 5 — Start the project

```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB Atlas
🚀 Server running on http://localhost:5000
```

Open your browser: **http://localhost:5000**

---

### Step 6 — Create your account

- Click **Register**
- Fill in your name, email, password
- Choose a role: Student, Instructor, or Admin
- Log in and explore

---

## ❓ Common Problems & Fixes

| Problem | Fix |
|---------|-----|
| `Cannot find module` error | Run `npm install` again |
| `MongoDB connection failed` | Check your `MONGO_URI` in `.env`. Check Atlas Network Access. |
| Port already in use | Change `PORT=5000` to `PORT=3000` in `.env` |
| `.env` file not found | Run `cp .env.example .env` then fill in values |
| Page loads but login fails | Make sure MongoDB Atlas is connected and `JWT_SECRET` is set |

---

## 🔒 Rules You Must Follow

**Never commit your `.env` file to GitHub.**
Your `.gitignore` already prevents this. The `.env` file has your database password — it must stay on your machine only.

**Always run `npm install` after getting fresh code.**
Whenever you pull new code from GitHub, run `npm install` to make sure all packages are up to date.

**Do not edit files inside `node_modules/`.**
If something breaks, just run `npm install` again.

---

## 📅 What You Will Do With This Project

This project grows with you throughout the course:

| Day | Topic                  | Task on this project                                      |
|-----|------------------------|-----------------------------------------------------------|
| 5   | Git basics             | git init, add, commit, log, status, diff — on this repo   |
| 6   | GitHub remote          | Push this project to your own GitHub account              |
| 7   | Branching              | Create branches, switch, merge                            |
| 8   | Collaboration          | Fork, raise Pull Requests, review a classmate's code      |
| 9   | Linux                  | Run this on Linux, manage files and permissions           |
| 10  | PM2                    | Keep the backend alive using PM2 process manager          |
| 11  | Environment config     | Understand .env, never hardcode secrets                   |
| 12  | Docker                 | Write a Dockerfile, containerize this app yourself        |
| 13  | CI/CD                  | Write a GitHub Actions pipeline for this project          |
| 14  | EC2 deployment         | Deploy this live on an AWS EC2 instance                   |

---

## 👤 Roles

| Role       | What they can do                                              |
|------------|---------------------------------------------------------------|
| admin      | Manage users, courses, announcements, view reports            |
| instructor | Create courses, create assignments, grade submissions         |
| student    | Enroll in courses, submit assignments, track progress         |

---

## 🔗 API Endpoints (You will test these in class)

| Method | Endpoint                    | What it does                    |
|--------|-----------------------------|---------------------------------|
| POST   | /api/auth/register          | Create a new account            |
| POST   | /api/auth/login             | Login, get a JWT token          |
| GET    | /api/courses                | List all published courses      |
| POST   | /api/courses                | Create a course (instructor)    |
| GET    | /api/assignments            | List all assignments            |
| POST   | /api/submissions            | Submit an assignment            |
| PUT    | /api/submissions/:id/grade  | Grade a submission (instructor) |
| GET    | /api/enrollments/my         | Get my enrolled courses         |

---

## 📄 License

MIT — free to use and learn from.

---

> You are not just a student using this LMS.
> You are the engineer keeping it alive.
