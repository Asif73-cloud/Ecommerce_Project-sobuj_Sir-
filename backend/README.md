# Kenova Backend - .NET 8 + XAMPP MySQL

## Requirements
- Windows
- .NET 8 SDK
- XAMPP (Apache is optional; MySQL is required)

## 1. Start MySQL
Open XAMPP -> Start MySQL.

## 2. Create database
Open phpMyAdmin and import `kenova.sql`, or run:
```sql
CREATE DATABASE kenova;
```

## 3. Run API
Open CMD in this folder:
```bat
dotnet restore
dotnet run
```

The API will normally be available at:
- http://localhost:5000
- Swagger: http://localhost:5000/swagger

If your terminal shows another HTTP port, use that port and update `Frontend/api.js`.

## 4. Frontend connection
Your frontend already contains `api.js` with:
```js
const API_BASE = "http://localhost:5000/api";
```
Keep this only if the backend runs on port 5000.

For pages using the API, load:
```html
<script src="api.js"></script>
```
before the page-specific JavaScript.

## Main endpoints
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/forgot`
- GET `/api/products`
- GET `/api/products/{id}`
- GET `/api/profile` (JWT)
- PUT `/api/profile` (JWT)
- PUT `/api/profile/password` (JWT)
- GET/POST `/api/profile/addresses` (JWT)
- DELETE `/api/profile/addresses/{id}` (JWT)
- GET `/api/orders/my` (JWT)
- POST `/api/orders` (JWT)
- POST `/api/sellers`
- POST `/api/support`
- POST `/api/send-app-link`

## Important
This project uses BCrypt password hashing and JWT. Change the JWT key in `appsettings.json` before production use.
