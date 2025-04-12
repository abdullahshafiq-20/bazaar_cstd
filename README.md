# BazaarCSTD - Inventory Tracking System

## Overview

BazaarCSTD is an evolving inventory tracking system designed to scale from a single kiryana store to thousands of retail locations. The system tracks product stock-in, sales, and manual removals while providing real-time stock visibility. This document details the design decisions, assumptions, API design, and evolution rationale across three major versions.

## Table of Contents

- [Design Decisions](#design-decisions)
- [Data Modeling](#data-modeling)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Security](#security)
- [Scalability](#scalability)
- [Assumptions](#assumptions)
- [API Design](#api-design)
- [Evolution Rationale (V1 → V3)](#evolution-rationale-v1-→-v3)
  - [Version 1: Single Store](#version-1-single-store)
  - [Version 2: Multi-Store (500+ Stores)](#version-2-multi-store-500-stores)
  - [Version 3: Scalable System (1000+ Stores)](#version-3-scalable-system-1000-stores)
- [Technical Architecture](#technical-architecture)
- [Database Schema Evolution](#database-schema-evolution)
- [Middleware Implementation](#middleware-implementation)
- [System Components](#system-components)
- [Trade-offs and Considerations](#trade-offs-and-considerations)

---

## Design Decisions

### Data Modeling

The core design decision for BazaarCSTD's data model is using an event-based approach to track inventory. Rather than storing mutable current quantities, we record all inventory movements as immutable events, calculating current stock levels by aggregating these events.

**Benefits of this approach:**

- Complete audit trail of all inventory changes  
- Ability to reconstruct inventory state at any point in time  
- Data integrity through immutable events  
- Support for complex reporting and analytics  

This event sourcing pattern is implemented through the `stock_movements` table, which records every inventory change with its type, quantity, and timestamp.

---

## Architecture

The system architecture evolves significantly across versions:

### V1: Monolithic Application

- Single Node.js/Express.js application  
- Direct PostgreSQL database connections  
- Synchronous processing model  

### V2: Enhanced Monolith

- Multi-store support with authentication  
- Role-based access control  
- Basic request throttling  

### V3: Distributed System

- Horizontally scalable stateless API nodes  
- Event-driven architecture with RabbitMQ  
- Redis caching and rate limiting  
- Read/write separation with connection pools  

---

## Technology Stack

### Backend Framework:

- Node.js with Express.js for RESTful API development  
- PostgreSQL for data storage  
- RabbitMQ for asynchronous message processing (V3)  
- Redis for caching and rate limiting (V3)  
- Docker for containerization (V3)  
- Nginx for load balancing (V3)  

### Key Libraries:

- bcrypt for password hashing  
- jsonwebtoken for JWT-based authentication  
- pg for PostgreSQL connectivity  
- amqplib for RabbitMQ integration  
- redis for caching implementation  

---

## Security

Security measures evolve across versions:

### V1:

- Basic input validation  
- SQL injection prevention with parameterized queries  

### V2:

- JWT-based authentication  
- Role-based access control  
- Password hashing with bcrypt  
- Basic rate limiting  

### V3:

- Enhanced rate limiting with Redis  
- Distributed token validation  
- Comprehensive audit logging  
- Encrypted connections  

---

## Scalability

Scalability strategies increase in sophistication:

### V1:

- Database connection pooling  
- Efficient queries for single-store operations  

### V2:

- Enhanced indexing for multi-store queries  
- Query optimization for filtering operations  

### V3:

- Horizontal scaling with stateless services  
- Caching for frequently accessed data  
- Asynchronous processing for non-critical operations  
- Read/write separation to optimize database access  
- Database partitioning for large tables  

---

## Assumptions

### Usage Patterns:

- Read operations (stock lookups) are more frequent than writes  
- Inventory management primarily occurs during business hours  
- Stock movements follow predictable patterns (e.g., bulk stock-in, gradual sales)  

### Technical Environment:

- Reliable network connectivity between system components  
- Support for Docker containerization  
- PostgreSQL capabilities for complex views and triggers  
- Sufficient hardware resources for the expected load  

### Business Rules:

- Products have unique SKUs across all stores  
- Stock cannot go negative (sales limited by available stock)  
- Stores operate independently but share product catalog  

### Scaling Requirements:

- V1: Single store with moderate transaction volume  
- V2: Up to 500 stores with shared product catalog  
- V3: 1000+ stores with high concurrency requirements  

### Security Requirements:

- Role-based access control is sufficient for authorization  
- JWT provides adequate security for authentication  
- Store managers should only access their assigned stores  

---

## API Design

The API follows RESTful principles with a consistent design pattern. All responses use a standard format:

### Core Endpoints

#### Product Management

- `GET /api/products` - Retrieve all products  
- `GET /api/products/:id` - Retrieve a specific product  
- `POST /api/products` - Add a new product  
- `PUT /api/products/:id` - Update a product  
- `DELETE /api/products/:id` - Delete a product  

#### Inventory Management

- `POST /api/stock/add` - Record stock-in movement  
- `POST /api/stock/sale` - Record sales movement  
- `POST /api/stock/remove` - Record manual removal  
- `GET /api/stock/current` - Get current inventory levels  
- `GET /api/stock/movements` - Get stock movement history  

#### Store Management (V2+)

- `GET /api/stores` - Retrieve all stores  
- `POST /api/stores` - Add a new store  
- `GET /api/stores/:id/inventory` - Get inventory for specific store  

#### Authentication (V2+)

- `POST /api/auth/register` - Register a new user  
- `POST /api/auth/login` - Authenticate and receive tokens  
- `GET /api/auth/profile` - Get authenticated user profile  

#### Inventory Events (V3)

- `GET /api/inventory/events` - Retrieve inventory events  
- `GET /api/inventory/alerts` - Retrieve inventory alerts  

---

## API Evolution

- **V1**: Basic CRUD operations for products and stock movements.  
- **V2**: Added authentication, store-specific endpoints, and filtering.  
- **V3**: Enhanced with caching headers, rate limit information, and asynchronous operation support.  

---

## Evolution Rationale (V1 → V3)

### Version 1: Single Store

**Focus Areas:**

- Core inventory tracking functionality  
- Product catalog management  
- Basic stock movement recording and reporting  

**Technical Implementation:**

- Simple monolithic application  
- Direct database queries  
- Real-time stock calculation via SQL view  
- No authentication or authorization  

**Key Design Patterns:**

- Repository pattern for data access  
- Event sourcing for inventory movements  
- MVC architecture for API endpoints  

**Limitations:**

- Limited to single-store operations  
- No user authentication or roles  
- Synchronous processing only  
- Limited scalability under high load  

---

### Version 2: Multi-Store (500+ Stores)

**Focus Areas:**

- Multi-store inventory tracking  
- User authentication and authorization  
- Store-specific operations  
- Enhanced reporting with filtering  

**Technical Implementation:**

- Enhanced monolithic application  
- JWT-based authentication  
- Role-based access control  
- Basic rate limiting  
- Store-specific database queries  

**Key Design Patterns:**

- Repository pattern with store context  
- Strategy pattern for authorization  
- Observer pattern for logging  
- Chain of responsibility for request handling  

**Enhancements from V1:**

- Added `stores` table for multi-store operations  
- Modified `stock_movements` to include `store_id`  
- Added `users` and `user_roles` tables  
- Implemented authentication middleware  
- Enhanced controllers to enforce store-specific access  

**Limitations:**

- Limited horizontal scalability  
- Direct database calculations without caching  
- Synchronous processing for all operations  

---

### Version 3: Scalable System (1000+ Stores)

**Focus Areas:**

- Horizontal scalability for thousands of stores  
- Near real-time inventory updates  
- High concurrency support  
- Comprehensive audit logging  

**Technical Implementation:**

- Distributed system with stateless services  
- Event-driven architecture with RabbitMQ  
- Redis caching and rate limiting  
- Read/write separation with connection pools  
- Docker containerization with Nginx load balancing  

**Key Design Patterns:**

- Event sourcing for inventory changes  
- CQRS for read/write separation  
- Publisher-subscriber for asynchronous processing  
- Circuit breaker for resilience  
- Cache-aside pattern for performance  

**Enhancements from V2:**

- Added RabbitMQ for asynchronous event processing  
- Implemented Redis caching for frequently accessed data  
- Added distributed rate limiting  
- Enhanced audit logging with database triggers  
- Implemented read/write separation  

**Technical Components Added:**

- Message producers and consumers for event handling  
- Connection pool management for database optimization  
- Cache management service  
- Health check endpoints for load balancing  
- Circuit breakers for failure handling  

---

## Technical Architecture

---

## Database Schema Evolution

### V1: Foundation

- `products` table for product catalog  
- `stock_movements` table for inventory changes  
- `current_inventory` view for real-time calculations  
- SQL triggers for timestamp management  

### V2: Multi-Store Extension

- `stores` table for store information  
- `users` table for authentication  
- `user_roles` table for authorization  
- Extended `stock_movements` with store reference  
- Enhanced indexing for multi-store queries  

### V3: Distributed System

- `inventory_events` table for event sourcing  
- `inventory_alerts` table for stock notifications  
- `audit_logs` table for system-wide auditing  
- Table partitioning for improved performance  
- Comprehensive database triggers for auditing  

---

## Middleware Implementation

### V1: Basic Middleware

- Error handling middleware  
- Request logging middleware  
- Express JSON parsing  

### V2: Enhanced Middleware

- JWT authentication middleware  
- Role-based authorization middleware  
- Request validation middleware  
- Basic rate limiting middleware  

### V3: Advanced Middleware

- Distributed rate limiting with Redis  
- Circuit breaker middleware  
- Caching middleware  
- Request context middleware  
- Health check middleware  

---

## System Components

### V1: Core Components

- Express.js application server  
- PostgreSQL database  
- Product and Stock controllers  
- Database service  

### V2: Enhanced Components

- Authentication service  
- Authorization service  
- Store management service  
- Enhanced reporting service  

### V3: Distributed Components

- Message producer service  
- Message consumer service  
- Cache management service  
- Inventory event handler service  
- Audit logging service  
- Health monitoring service  

---

## Trade-offs and Considerations

### Event Sourcing vs. State-Based Storage

**Trade-off:** Using event sourcing for inventory provides complete auditability but increases query complexity.  
**Consideration:** We chose event sourcing because the benefits of complete traceability and data integrity outweigh the performance cost, which can be mitigated through caching and optimized views.

### Monolithic vs. Distributed Architecture

**Trade-off:** Moving from a monolith to a distributed system increases scalability but adds complexity.  
**Consideration:** The V3 distributed architecture was necessary to handle thousands of stores with high concurrency, though it requires more sophisticated monitoring and deployment strategies.

### Synchronous vs. Asynchronous Processing

**Trade-off:** Asynchronous processing improves responsiveness but makes system state more complex.  
**Consideration:** V3 implements asynchronous processing for non-critical operations, balancing immediate consistency needs with system responsiveness.

### Database Design Decisions

**Trade-off:** Using PostgreSQL views for real-time calculations vs. materialized views or direct storage.  
**Consideration:** Standard views were chosen initially for strict consistency, but V3 adds caching for performance while maintaining eventual consistency.

### Security vs. Usability

**Trade-off:** Strict security measures can impact user experience and development speed.  
**Consideration:** The authentication system balances security needs with usability through JWT tokens with reasonable expiration times and refresh token capabilities.

---

This documentation provides a comprehensive overview of the BazaarCSTD inventory tracking system's design, assumptions, API structure, and evolution across three versions. The system demonstrates progressive enhancement from a single-store solution to a highly scalable, distributed platform capable of supporting thousands of stores with near real-time inventory tracking.
