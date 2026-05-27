# 🌱 FoodShare Connect — Spring Boot Backend

> REST API backend for the FoodShare Connect mini project (B.Tech VI Sem, CSE, Medicaps University).  
> Built with **Spring Boot 3.2**, **Spring Security 6** (JWT, role-based), **Spring Data JPA**, and **H2** (in-memory).

---

## 📁 Project Structure

```
src/main/java/com/foodshare/
├── FoodShareApplication.java          ← entry point
├── config/
│   ├── SecurityConfig.java            ← Spring Security + CORS + JWT filter chain
│   ├── DataSeeder.java                ← seeds demo users on startup
│   └── GlobalExceptionHandler.java    ← centralised error responses
├── security/
│   ├── JwtUtils.java                  ← token generation & validation
│   ├── JwtAuthFilter.java             ← OncePerRequestFilter
│   └── UserDetailsServiceImpl.java    ← loads user from DB
├── entity/
│   ├── User.java                      ← id, username, password, fullName, role
│   └── Donation.java                  ← full donation model + enums
├── repository/
│   ├── UserRepository.java
│   └── DonationRepository.java
├── dto/
│   ├── AuthDTOs.java                  ← LoginRequest / LoginResponse / RegisterRequest
│   ├── DonationDTOs.java              ← CreateRequest / DonationResponse
│   └── AdminStatsDTO.java             ← dashboard stats
├── service/
│   ├── AuthService.java
│   ├── DonationService.java
│   ├── AdminService.java
│   └── FreshnessService.java          ← mirrors JS calcFreshnessScore()
└── controller/
    ├── AuthController.java
    ├── DonationController.java
    └── AdminController.java
```

---

## 🚀 Running the App

**Prerequisites:** Java 17+, Maven 3.8+

```bash
cd foodshare-backend
mvn spring-boot:run
```

Server starts at **http://localhost:8080**  
H2 Console: **http://localhost:8080/h2-console** (JDBC URL: `jdbc:h2:mem:foodsharedb`)

---

## 👤 Demo Accounts (auto-seeded)

| Username   | Password      | Role      |
|------------|---------------|-----------|
| yash       | yash123       | DONOR     |
| yug        | yug123        | RECIPIENT |
| yatharth   | yatharth123   | ADMIN     |

---

## 🔐 Authentication Flow

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

**Step 1 — Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "yash",
  "password": "yash123"
}
```
**Response:**
```json
{
  "token": "eyJhbGci...",
  "username": "yash",
  "fullName": "Yash Veer Singh",
  "role": "donor"
}
```

**Step 2 — Use token in all subsequent requests:**
```
Authorization: Bearer eyJhbGci...
```

---

## 📡 API Reference

### Auth

| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | `/api/auth/login`     | ❌   | Login, receive JWT    |
| POST   | `/api/auth/register`  | ❌   | Register new user     |

#### Register body
```json
{
  "username": "newuser",
  "password": "secret123",
  "fullName": "New User",
  "role": "DONOR"
}
```
> `role` must be one of: `DONOR`, `RECIPIENT`, `ADMIN`

---

### Donations

| Method | Endpoint                    | Role           | Description                  |
|--------|-----------------------------|----------------|------------------------------|
| GET    | `/api/donations`            | Any auth       | Get all ACTIVE listings       |
| GET    | `/api/donations/{id}`       | Any auth       | Get single donation           |
| POST   | `/api/donations`            | DONOR          | Create new donation listing   |
| GET    | `/api/donations/mine`       | DONOR          | Get your own donations        |
| POST   | `/api/donations/{id}/claim` | RECIPIENT      | Claim a donation              |
| GET    | `/api/donations/claimed`    | RECIPIENT      | Get your claimed pickups      |

#### Create donation body (DONOR)
```json
{
  "foodName": "Dal Makhani",
  "category": "COOKED_MEALS",
  "quantity": 20,
  "storage": "REFRIGERATED",
  "address": "Vijay Nagar, Indore",
  "notes": "No allergens",
  "prepTime": "13:00",
  "pickupUntil": "18:00"
}
```

> **category** values: `COOKED_MEALS`, `BAKERY_ITEMS`, `VEGETABLES_FRUITS`, `DAIRY_PRODUCTS`, `PACKAGED_FOOD`  
> **storage** values: `ROOM_TEMPERATURE`, `REFRIGERATED`, `FROZEN`

#### Donation response shape
```json
{
  "id": 1,
  "foodName": "Dal Makhani",
  "category": "Cooked Meals",
  "quantity": 20,
  "storage": "REFRIGERATED",
  "address": "Vijay Nagar, Indore",
  "freshnessScore": 82,
  "riskLevel": "low",
  "riskLabel": "Low Risk",
  "riskHours": "~6–8 hours",
  "riskRecommendation": "Pickup within 4h",
  "status": "active",
  "donorUsername": "yash",
  "donorFullName": "Yash Veer Singh",
  "claimedByUsername": null,
  "createdAt": "2026-04-09T10:30:00",
  "claimedAt": null
}
```

---

### Admin

| Method | Endpoint               | Role  | Description              |
|--------|------------------------|-------|--------------------------|
| GET    | `/api/admin/dashboard` | ADMIN | Full platform stats       |

#### Dashboard response shape
```json
{
  "totalMeals": 150,
  "co2Saved": 39.0,
  "totalListings": 5,
  "completedListings": 2,
  "activeListings": 3,
  "users": [
    {
      "username": "yash",
      "fullName": "Yash Veer Singh",
      "role": "donor",
      "activityCount": 3,
      "activityLabel": "3 donations"
    }
  ],
  "allDonations": [ ... ]
}
```

---

## ⚙️ Configuration (`application.properties`)

| Property                       | Default                        | Notes                          |
|--------------------------------|--------------------------------|--------------------------------|
| `server.port`                  | `8080`                         |                                |
| `app.jwt.secret`               | *(change in prod!)*            | Min 32 chars                   |
| `app.jwt.expiration-ms`        | `86400000` (24h)               |                                |
| `app.cors.allowed-origins`     | `http://localhost:3000,...`    | Add your frontend origin       |
| `spring.h2.console.enabled`    | `true`                         | Disable in prod                |

### Switching to MySQL/PostgreSQL

1. Remove H2 dependency from `pom.xml`
2. Add `spring-boot-starter-data-jpa` driver (e.g. `mysql-connector-j`)
3. Update `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/foodshare
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

---

## 🔗 Connecting the Frontend

In `app.js`, replace hardcoded data operations with `fetch` calls:

```js
// Login
const res = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const { token, role, fullName } = await res.json();
localStorage.setItem('token', token);

// Authenticated request helper
const api = (path, options = {}) =>
  fetch(`http://localhost:8080${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      ...options.headers
    }
  }).then(r => r.json());

// Get active listings
const listings = await api('/api/donations');

// Submit donation
const donation = await api('/api/donations', {
  method: 'POST',
  body: JSON.stringify({ foodName, category, quantity, storage, address, notes })
});

// Claim
await api(`/api/donations/${id}/claim`, { method: 'POST' });
```

---

## 🛡️ Security Summary

- Passwords hashed with **BCrypt**
- Stateless JWT auth (24h expiry by default)
- Role-based access: `ROLE_DONOR`, `ROLE_RECIPIENT`, `ROLE_ADMIN`
- CSRF disabled (stateless API)
- CORS restricted to configured origins
- `@PreAuthorize` method-level guards on all sensitive endpoints
