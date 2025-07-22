# BookNest

BookNest is a RESTful API built with Node.js, Express, and MongoDB for managing a book store system. It supports user authentication, book management (CRUD), and has Swagger API documentation.

---

## API URL

**API deployed in Render URL:**
[https://booknest-api-vtsj.onrender.com](https://booknest-api-vtsj.onrender.com)

---

## Tech Stack

* **Node.js** – Backend runtime
* **Express.js** – Web framework
* **MongoDB + Mongoose** – Database and ORM
* **JWT** – JSON Web Token for authentication
* **Joi** – Schema validation
* **Swagger** – Interactive API docs
* **Testing** – Jest

---

## Getting Started

### Prerequisites

* Node.js 
* npm
* MongoDB

### Installation

```bash
git clone https://github.com/sribalajia2710/booknest-api.git
cd booknest-api
npm install
```

### Running Locally

```bash
npm run dev
```

Create a `.env` file and set your variables:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

---

## API Endpoints

### Auth

* `POST /api/auth/signup` – Register a new user
* `POST /api/auth/login` – Login and receive a JWT token

### Books

* `GET /api/books` – Get all books (auth required)
* `POST /api/books` – Add a new book (auth required)
* `PUT /api/books/:id` – Update a book (auth required)
* `DELETE /api/books/:id` – Delete a book (auth required & only admin can delete)

---

## API Docs

Visit:
**[https://booknest-api-vtsj.onrender.com/api-docs](https://booknest-api-vtsj.onrender.com/api-docs)**

