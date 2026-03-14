# MyIEC ERP - Database Seeding & Login Guide

## 🎉 Status: COMPLETE ✅

Database has been successfully seeded with test data and login functionality is verified.

---

## 🔐 Login Credentials

### Admin Account
- **Email:** admin@iec.ac.in
- **Password:** Admin@123
- **Role:** Administrator
- **Dashboard:** admin-dashboard.html

### Faculty Accounts (10 total)
- **Email:** faculty1@iec.ac.in to faculty10@iec.ac.in
- **Password:** Faculty@123 (same for all)
- **Role:** Faculty/Teacher
- **Dashboard:** faculty-dashboard.html
- **Departments:** CSE (1-6), ECE (7-10)

### Student Accounts (10 total)
- **Email:** student1@iec.ac.in to student10@iec.ac.in
- **Password:** Student@123 (same for all)
- **Role:** Student
- **Dashboard:** student-dashboard.html
- **Branches:** CSE and ECE (mixed)
- **Semester:** 3
- **Batch:** 2021

---

## 📊 Database Collections Seeded

### Collections with Data:
1. **Users** ✅
   - 1 Admin
   - 10 Faculty Members
   - 10 Students
   
2. **Subjects** ✅
   - 4 CSE Subjects (Data Structures, Database Systems, OS, Networks)
   - 2 ECE Subjects (Signals & Systems, Digital Electronics)

3. **Attendance** ✅
   - 45+ days of attendance records
   - Each student-subject-date combination
   - Status: Present/Absent

4. **Fees** ✅
   - Tuition Fee Records
   - Exam Fee Records
   - Various payment statuses

---

## 🔧 How to Verify in MongoDB Compass

### Step 1: Open MongoDB Compass
```
mongodb+srv://manish_db:Manish%402005@cluster0.zvxbuig.mongodb.net/Todo-App
```

### Step 2: Navigate to Collections
Look for these databases/collections:
- Database: `Todo-App` (or configured in .env)
- Collections:
  - `users` - Contains all user accounts
  - `subjects` - Courses/Subjects
  - `attendances` - Attendance records
  - `fees` - Fee records

### Step 3: View Users Collection
Click on `users` and you should see 21 documents:
- 1 Admin
- 10 Faculty
- 10 Students

Sample admin record structure:
```json
{
  "_id": "ObjectId",
  "email": "admin@iec.ac.in",
  "password": "[hashed with bcrypt]",
  "role": "admin",
  "name": "IEC Administrator",
  "isActive": true,
  "createdAt": "2026-03-14...",
  "updatedAt": "2026-03-14..."
}
```

---

## 🚀 Starting the Server

### Command:
```bash
cd server
node index.js
```

### Expected Output:
```
MyIEC ERP server running on port 5000 (development)
MongoDB connected: localhost
MyIEC Smart ERP: Seed skipped (users exist). Set SEED_FORCE=true to reseed.
```

### Access Application:
- **Frontend:** http://localhost:5500 (or check your port)
- **API Health Check:** http://localhost:5000/api/health

---

## 🔄 Reseeding Database (If Needed)

If you need to clear and reseed the database with fresh test data:

```bash
cd server
node seed-fresh.js
```

This will:
1. Clear all existing data
2. Create 1 Admin + 10 Faculty + 10 Students
3. Create subjects and relationships
4. Generate 45+ days of attendance records
5. Create fee records for all students

---

## 🧪 Testing Login

Run the login test script:
```bash
cd server
node test-login.js
```

Expected Results:
- ✅ Admin login - Successful
- ✅ Faculty login - Successful  
- ✅ Student login - Successful
- ✅ Invalid credentials - Rejected (401)

---

## 📝 API Endpoints

### Authentication
- **POST** `/api/auth/login` - Login with email/password
- **POST** `/api/auth/logout` - Logout
- **GET** `/api/auth/me` - Get current user

### Request Format:
```json
{
  "email": "admin@iec.ac.in",
  "password": "Admin@123"
}
```

### Response Format:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "dashboardUrl": "admin-dashboard.html",
    "user": {
      "id": "...",
      "name": "IEC Administrator",
      "email": "admin@iec.ac.in",
      "role": "admin"
    }
  }
}
```

---

## ⚠️ Important Notes

1. **Passwords:** All test passwords are hashed with bcrypt - never visible in database
2. **JWT Tokens:** Expire after 7 days (configurable in .env)
3. **Data Isolation:** Each user sees data relevant to their role
4. **Audit Logs:** Login attempts are logged for security

---

## 🐛 Troubleshooting

### Cannot connect to MongoDB?
- Check MongoDB URI in `.env` file
- Verify MongoDB Atlas credentials are correct
- Ensure network access is allowed in MongoDB Atlas

### Login fails despite correct credentials?
- Check user `isActive` flag is `true` in MongoDB Compass
- Verify password matches credentials listed above
- Check browser console for error messages

### Port 5000 already in use?
- Change PORT in `.env` file
- Or kill the existing process and restart

### Seed script errors?
- Delete all collections manually in MongoDB Compass
- Run `node seed-fresh.js` again

---

## 📞 Support

For issues with the ERP system, check:
1. Server console output for errors
2. MongoDB Compass for data integrity
3. Browser console (F12) for client-side errors
4. Network tab for API response details

**Happy coding!** 🚀
