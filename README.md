# 🎓 IEC Smart ERP

A **Full-Stack ERP (Enterprise Resource Planning) System** built for educational institutions to manage students, faculty, attendance, exams, fees, notices, and library services in a unified platform.

Developed as a **Major Project** for IEC College of Engineering & Technology.

🌐 **Live Demo:** https://myiec.in

---

# 🚀 Features

### 👨‍🎓 Student Portal

* Student dashboard
* Attendance tracking
* Fee details & payments
* Exam schedules & marks
* Notices & announcements
* Library services
* Personal timetable

### 👨‍🏫 Faculty Portal

* Faculty dashboard
* Mark student attendance
* Upload marks
* Manage class notices
* View timetable

### 👨‍💼 Admin Portal

* Manage students & faculty
* Fee management
* Attendance analytics
* Exam & timetable management
* System settings
* Reports & analytics

### 🔐 Authentication

* Secure **JWT-based login**
* Role-based access control
* Separate dashboards for:

  * Students
  * Faculty
  * Admin

---

# 🧠 AI Assistant

The system includes an **AI-powered assistant** to help users with:

* Academic queries
* System navigation
* ERP guidance

Powered by **OpenAI API**.

---

# 🏗 System Architecture

```
    Frontend
        │
        ▼
Node.js + Express Backend
        │
        ▼
MongoDB Database
        │
        ▼
Cloud Deployment (Render)
```

---

# 🛠 Tech Stack

### Frontend

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose ODM

### Security

* JWT Authentication
* Helmet.js
* Rate Limiting
* CORS Protection

### Cloud Deployment

* Render (Backend hosting)
* Hostinger (Domain & DNS)

---

# ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/manishverma0507/IEC-Smart-ERP.git
```

### 2️⃣ Navigate to project

```bash
cd IEC-Smart-ERP
```

### 3️⃣ Install dependencies

```bash
npm install
```

### 4️⃣ Create `.env` file

```
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
```

### 5️⃣ Run the server

```bash
npm start
```

The app will run at:

```
http://localhost:5000
```

---

# 🌐 Deployment

The application is deployed using:

* **Render** → Node.js hosting
* **Hostinger** → Custom domain
* **MongoDB Atlas** → Cloud database

Live URL:

```
https://myiec.in
```

---

# 🔒 Security Features

* Password hashing with **bcrypt**
* Secure JWT authentication
* Rate limiting to prevent abuse
* Helmet for HTTP security headers
* Environment variable protection

---

# 📊 Modules Included

✔ Authentication
✔ Student Management
✔ Faculty Management
✔ Attendance System
✔ Fee Management
✔ Exam Management
✔ Timetable System
✔ Notice Board
✔ Library System
✔ AI Assistant

---

# 👨‍💻 Author

**Manish Verma**

Major Project – IEC College of Engineering & Technology

GitHub:
https://github.com/manishverma0507

---

# 📜 License

This project is licensed under the **MIT License**.

---

# ⭐ If you like this project

Please consider giving it a **star ⭐ on GitHub**.
