Absolutely! I can help you convert your draft into a polished **GitHub-ready README** for your Inventory Management System backend. Here's a clean version with proper formatting and GitHub markdown enhancements:

---

# Inventory Management System (FIFO) - Real-Time Ingestion & Live Dashboard

A full-stack inventory management system implementing **FIFO (First-In-First-Out)** costing method with real-time data ingestion through Apache Kafka and live dashboard capabilities.

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Kafka Topic   │───▶│  Backend API    │───▶│   PostgreSQL    │
│ inventory-events│    │  (Express.js)   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                       │                       
        │                       ▼                       
┌─────────────────┐    ┌─────────────────┐              
│ Kafka Producer  │    │ Frontend React  │              
│   (Simulator)   │    │   Dashboard     │              
└─────────────────┘    └─────────────────┘              
```

---

## 🚀 Tech Stack

* **Backend:** Node.js with Express.js
* **Database:** PostgreSQL 15
* **Message Queue:** Apache Kafka with Zookeeper
* **Frontend:** React (coming next)
* **Authentication:** JWT
* **Containerization:** Docker Compose

---

## 📋 Features

### ✅ Completed (Backend)

* FIFO Costing Logic: Accurate first-in-first-out inventory costing
* Kafka Integration: Real-time event processing for purchases and sales
* PostgreSQL Schema: Optimized database design for inventory tracking
* RESTful APIs: Complete CRUD operations with authentication
* Transaction History: Detailed ledger of all inventory movements
* Batch Tracking: Individual batch monitoring for precise FIFO calculations
* Docker Compose: Easy development environment setup

### 🔄 FIFO Logic Implementation

The system implements FIFO costing through the following process:

1. **Purchase Events:** Create new inventory batches with timestamp and unit cost
2. **Sale Events:** Consume oldest inventory batches first, calculating exact cost
3. **Batch Management:** Track remaining quantities in each batch
4. **Cost Calculation:** Weighted average and exact FIFO cost per sale

---

## 🛠️ Setup Instructions

### Prerequisites

* Docker and Docker Compose
* Node.js 16+
* Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd inventory-management-system

# Start PostgreSQL and Kafka services
docker-compose up -d

# Wait for services to be ready (30-60 seconds)
docker-compose logs -f kafka postgres
```

### 2. Backend Setup

```bash
cd backend
npm install

# Start the backend server
npm run dev
```

The backend will:

* Connect to PostgreSQL database
* Initialize Kafka topics
* Start consuming messages from `inventory-events` topic
* Run on `http://localhost:3001`

---

### 3. Test the System

#### Using the Kafka Producer Script

```bash
# Navigate to backend directory
cd backend

# Send a purchase event
node scripts/producer.js purchase PRD001 100 50.0

# Send a sale event
node scripts/producer.js sale PRD001 25

# Run full simulation with multiple events
node scripts/producer.js simulate
```

#### Using the API Endpoints

```bash
# Login to get JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Send events via API (replace <TOKEN> with JWT token)
curl -X POST http://localhost:3001/api/kafka/send \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"product_id": "PRD001", "event_type": "purchase", "quantity": 100, "unit_price": 50.0}'

# Get inventory status
curl -X GET http://localhost:3001/api/inventory \
  -H "Authorization: Bearer <TOKEN>"

# Get transaction history
curl -X GET http://localhost:3001/api/transactions \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔄 Kafka Event Format

### Purchase Event

```json
{
  "product_id": "PRD001",
  "event_type": "purchase",
  "quantity": 100,
  "unit_price": 50.0,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Sale Event

```json
{
  "product_id": "PRD001", 
  "event_type": "sale",
  "quantity": 25,
  "timestamp": "2025-01-15T11:00:00Z"
}
```

---

## 🔗 API Endpoints

### Authentication

* `POST /api/auth/login` - User login

### Inventory

* `GET /api/inventory` - Get all products inventory status
* `GET /api/inventory/:productId` - Get specific product inventory
* `GET /api/inventory/:productId/batches` - Get product batches (FIFO queue)

### Transactions

* `GET /api/transactions` - Get transaction history with pagination

### Kafka

* `POST /api/kafka/send` - Send inventory event to Kafka
* `POST /api/kafka/simulate` - Send multiple test events
* `GET /api/kafka/status` - Get Kafka consumer status

---

## 🧪 Testing Scenarios

### FIFO Example

1. **Purchase Batch 1:** 100 units at \$50/unit
2. **Purchase Batch 2:** 80 units at \$55/unit
3. **Sale:** 120 units

**Expected FIFO Result:**

* 100 units from Batch 1 at \$50 = \$5,000
* 20 units from Batch 2 at \$55 = \$1,100
* **Total Cost:** \$6,100
* **Average Unit Cost:** \$50.83

---

## 🐳 Docker Services

* **PostgreSQL:** `localhost:5432`
* **Kafka:** `localhost:9092`
* **Zookeeper:** `localhost:2181`
* **Kafka UI:** `http://localhost:8080`

---

## 🔧 Environment Variables

Create `.env` in `backend/`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres  
DB_PASSWORD=password123

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=inventory-consumer-group
KAFKA_TOPIC=inventory-events

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## 🔍 Monitoring

* **Kafka UI:** `http://localhost:8080`
* Monitor topic messages, partitions, and consumer lag

---

## 🤝 Default Login Credentials

* **Username:** `admin`
* **Password:** `admin123`

---

## 📚 Notes

* Topics are auto-created on startup
* FIFO calculations occur in database transactions
* Timestamps are stored in UTC
* Kafka consumer handles events asynchronously
* PostgreSQL indices optimize query performance

---

**Author:** Aekansh Singh
**Version:** 1.0.0
**License:** MIT

---

If you want, I can also **add a separate "Frontend" section** to this README so that when you deploy the React dashboard, you can include instructions for connecting both frontend and backend.

Do you want me to do that?
