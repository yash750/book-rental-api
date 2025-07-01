## Library Management System
**Product Name:** Library Management System API
 **Owner:** Yashwardhan Singh
 **Version:** 1.0
 **Last Updated:** 2025-06-30

---

### 🧩 1. Objective
Build a RESTful API service for a Library Management System to manage books, users (members), borrowing, returning, reservations, and admin operations. The API should support standard CRUD operations and ensure data consistency, role-based access, and audit logging.

---

### 🎯 2. Goals
- Allow librarians to manage inventory (add/update/delete/search books).
- Allow users to register, login, browse, borrow, return, and reserve books.
- Track borrowing history, due dates, late fees.
- Enforce business rules: borrowing limits, reservation expiry, and book availability.
---

### 🚫 3. Out of Scope
- Frontend UI (Web or App)
- Payment gateway for fine payments
- Real-time notification system (e.g., SMS/email)
---

### 🧑‍💻 4. User Roles & Permissions
| Role | Permissions |
| ----- | ----- |
| Librarian | Full CRUD access to all resources, manage and view users, override restrictions, Manage books, approve reservations, mark returns/late fees |
| Member/User | Register/login, browse/search books, borrow, return, reserve, view history |
---

### 🧱 5. Core Entities
#### 1. **Book**
- `id` : UUID
- `title` , `author` , `isbn` , `genre` , `language` 
- `copiesTotal` , `copiesAvailable` 
- `publishedDate` , `description` , `coverImageUrl` 
#### 2. **User**
- `id` , `name` , `email` , `passwordHash` , `role` , `createdAt` 
- `borrowedBooksCount` , `outstandingFines` 
#### 3. **BorrowRecord**
- `id` , `userId` , `bookId` , `borrowedAt` , `dueAt` , `returnedAt` 
- `fineAmount` , `isReturned` , `isLate` 
#### 4. **Reservation**
- `id` , `userId` , `bookId` , `reservedAt` , `expiresAt` , `isFulfilled` 
---

### 🧪 6. Functional Requirements (API Endpoints)
#### 📚 Books
| Endpoint | Method | Description |
| ----- | ----- | ----- |
|  | GET | List/search all books |
|  | GET | Get book by ID |
|  | POST | Add a new book (admin/librarian) |
|  | PUT | Update book details |
|  | DELETE | Remove book from inventory |
#### 👤 Users
| Endpoint | Method | Description |
| ----- | ----- | ----- |
|  | POST | Register new user |
|  | POST | User login |
|  | POST | Logout session |
|  | GET | View profile & borrowing |
#### 📖 Borrowing
| Endpoint | Method | Description |
| ----- | ----- | ----- |
|  | POST | Borrow a book (if available) |
|  | POST | Return a book |
|  | GET | Borrowing history |
#### 📌 Reservations
| Endpoint | Method | Description |
| ----- | ----- | ----- |
|  | POST | Reserve a book |
|  | POST | Cancel reservation |
|  | GET | View all reservations |
---

### 🛑 7. Business Rules
- A user can borrow max **5 books** at a time.
- Book reservation expires in **3 days** if not picked.
- Borrowing period: **14 days**, after which late fine applies.
- Late fine: **₹5 per day**.
- Only books with `copiesAvailable > 0`  can be borrowed.
- Reserved books are blocked from being borrowed by others.
---

### 🧰 8. Tech Stack
| Component | Stack |
| ----- | ----- |
| Language | Node.js (Express) |
| Database | PostgreSQL / MongoDB |
| Auth | JWT + Bcrypt |
| ORM | Mongoose / Prisma |
| Rate Limiting | express-rate-limit |
| Documentation | Swagger / Postman |
---

### 📊 9. Metrics & Monitoring
- Total active users
- Most borrowed books
- Average late return time
- Total fines collected
- Book availability ratio
---

### ✅ 10. Non-Functional Requirements
- **Authentication**: JWT-based
- **Rate Limiting**: Prevent brute force
- **Logging**: Audit logs for borrowing, return, login
- **Security**: Input validation, role checks, HTTPS
- **Scalability**: Support up to 100K users/books
- **Uptime**: 99.9%
---

### 📅 11. Milestones
| Phase | Timeline |
| ----- | ----- |
| Design | One Day |
| Development | Days 2–3 |
| Testing | 1 Day |
| Deployment | 1 Day |
---

### 📝 12. Future Enhancements
- Payment integration for fines
- Mobile app integration
- Recommendation engine (based on genre/history)
- QR-based book scan for borrowing
