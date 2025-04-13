# Note

The V1 and V2 versions of BazaarCSTD, along with their respective frontend and backend implementations, have already been deployed with client-side integration using React. Each version includes a dedicated frontend interface for interacting with the respective API endpoints.

> 🗃️ **All versions have their databases pre-populated with random demo data** for immediate testing and validation of system features.

---

### V1 - Single Store Deployment

The V1 version is designed for a single-store use case and does **not include authentication**. You may perform the following operations directly:
- Product creation, deletion, and updates
- Stock sale, addition, and manual removal
- View overall inventory dashboard

This version simulates the simplest inventory tracking workflow without user roles.

#### V1 Links:
- **Frontend**: [V1 Frontend](https://bazaar-cstd-frontedn-v1.vercel.app/)
- **Backend API**: [V1 Backend API](https://bazaar-backend-v1.vercel.app/)
- **Swagger API Docs**: [V1 Swagger API Documentation](https://res.cloudinary.com/dkb1rdtmv/image/upload/v1744489469/V1-API-CLOSED_ihpkvf.pdf)

---

### V2 - Multi-Store Deployment with Authentication

Authentication has been implemented in V2, and role-based access is enforced. Below are sample credentials for login:

#### Admin Credentials:
- **Username**: `admin`
- **Password**: `admin`

#### Manager Credentials:
- **Username**: `manager1`
- **Password**: `manager1Password`

You may also use usernames such as `manager2`, `manager3`, etc., with passwords in the format: `managerXPassword`.

#### Role-Based Capabilities:
- **Admin**
  - Add, delete, and update products (central product catalog)
  - Assign and remove store assignments for managers
  - View full access dashboards, including inventory, audit logs, and alerts
  - Create new managers (via client-side interface)
- **Store Manager**
  - Assigned to one or more stores
  - Manage store dashboard including stock operations (additions, sales, alerts)
  - Cannot log in without store assignment
  - View shop-specific audit logs, stock levels, revenue, and other details

> Note: The frontend UI in V2 is intentionally minimal, as the primary focus was on backend infrastructure and functionality.

#### V2 Links:
- **Frontend**: [V2 Frontend](https://bazaar-cstd-frontend-v2.vercel.app/)
- **Backend API**: [V2 Backend API](https://bazaar-cstd-backend-v2.vercel.app/)
- **Swagger API Docs**: [V2 Swagger API Documentation](https://res.cloudinary.com/dkb1rdtmv/image/upload/v1744489469/V2-API-CLOSED_azdxjl.pdf)

---

### V3 - Enterprise Version (Local Only)

The V3 version has been implemented **locally only** due to the infrastructure costs associated with deploying enterprise-grade features, such as:
- Dedicated read/write databases
- Message queues
- Distributed caching

Though deployment and frontend integration were not part of the challenge scope, it is important to note that real scalability and performance evaluation can only be accurately performed in a deployed environment.

#### V3 Links:
- **Swagger API Docs (Extended)**: [V3 Swagger API Documentation (Extended)](https://res.cloudinary.com/dkb1rdtmv/image/upload/v1744489471/V3-API-OPEN_lj4teh.pdf)
- **Swagger API Docs (Closed)**: [V3 Swagger API Documentation (Closed)](https://res.cloudinary.com/dkb1rdtmv/image/upload/v1744489469/V3-API-ClOSED_tpxmvy.pdf)

---

### Codebase and Repository

All codebase development was done using **Visual Studio Code (VS Code)**. The complete project is version-controlled via Git and hosted on GitHub. Please refer to the GitHub repository for source code, keeping in mind the branch structure:

- **`main` branch**: Corresponds to **V1** — the simplest version with a monolithic structure.
- **`v2` branch**: Contains **V2** — the multi-store platform with authentication.
- **`v3` branch**: Contains **V3** — the distributed, enterprise-scale architecture.

> The repository is already attached for review. Please follow the respective branches to inspect the corresponding version implementation.

---

### API Documentation

API endpoint documentation for each version is already hosted and well-organized. You may follow the respective links to explore and test the APIs in detail.

---

# BazaarCSTD Technical Evolution: From Single Store to Enterprise Scale

## Executive Summary

This document summarizes the technical evolution of BazaarCSTD, an inventory tracking system that transformed from a single-store solution to an enterprise-grade platform supporting 1000+ stores. The system evolved through three major versions, each addressing specific scalability challenges while enhancing functionality and performance.

## System Evolution Overview

### V1: Single-Store Solution
- **Architecture**: Monolithic Node.js/Express.js with PostgreSQL
- **Core Feature**: Event-sourced inventory tracking for complete audit trail
- **Target Scale**: Single Kiryana store operations

### V2: Multi-Store Platform (500+ Stores)
- **Architecture**: Enhanced monolith with multi-tenant data model
- **Key Additions**: Authentication, authorization, and store-specific operations
- **Target Scale**: Network of 500+ stores with role-based access

### V3: Distributed Enterprise System (1000+ Stores)
- **Architecture**: Horizontally scaled microservices with event-driven design
- **Advanced Features**: Caching, message queuing, and read/write separation
- **Target Scale**: Enterprise deployment for 1000+ stores with high concurrency

## Technical Architecture Details

### Version 1: Foundation

#### Core Architecture
- Monolithic Node.js/Express.js backend
- PostgreSQL database with direct connection
- RESTful API endpoints for inventory operations

#### Key Technical Components
- **Event-Sourced Database Design**
  - Products table for catalog information
  - Stock movements table tracking all inventory changes
  - Real-time calculated inventory view through SQL aggregation
- **Controller Structure**
  - Product controller: CRUD operations for product catalog
  - Stock controller: Manages inventory movements with validation

#### Request Flow
- Client request → Express middleware → Controller → Database → Response

#### Technical Implementation
- SQL transactions for data integrity
- Server-side input validation
- Standardized error responses
- PostgreSQL views for inventory calculations

#### Limitations
- Single-store scope
- No authentication/authorization
- Limited performance optimization
- Basic concurrency handling

### Version 2: Multi-Store Expansion

#### Architecture Evolution
- Maintained monolithic structure with expanded data model
- Added JWT-based authentication system
- Implemented role-based access control
- Added basic request throttling

#### Key Technical Components
- **Extended Database Schema**
  - Stores table for multi-tenant operations
  - Users and roles tables for authentication
  - Store-specific stock movement tracking
- **Authentication System**
  - Secure password storage with bcrypt
  - JWT token generation with expiration
  - Refresh token mechanism
- **Authorization Framework**
  - Role hierarchy: ADMIN > STORE_MANAGER > STAFF
  - Permission checking middleware
  - Store-specific access controls

#### Multi-Store Features
- Store-scoped inventory operations
- Cross-store inventory comparison
- Enhanced reporting with store filtering

#### Technical Implementation
- Store context for data isolation
- Authentication middleware pipeline
- Indexed queries for store-specific lookups
- Extended error handling

#### Limitations
- Limited horizontal scaling
- No caching mechanisms
- Potential concurrency bottlenecks
- Single point of failure

### Version 3: Enterprise Transformation

#### Architecture Transformation
- Horizontally scaled application nodes
- Event-driven architecture with message broker
- Read/write database separation
- Redis caching layer
- Comprehensive audit system

#### Key Technical Components
- **Horizontal Scaling Infrastructure**
  - Nginx load balancer for request distribution
  - Docker containerization
  - Health monitoring
  - Optimized connection pooling
- **Event-Driven Architecture**
  - RabbitMQ message broker with topic exchanges
  - Producer-consumer pattern for inventory events
  - Dead letter queues for failed messages
- **Database Optimization**
  - Dedicated read/write connection pools
  - Strategic indexing and table partitioning
  - Transaction support for complex operations
- **Caching Implementation**
  - Redis for product and inventory caching
  - Distributed rate limiting
  - Cache invalidation strategies
- **Audit Logging System**
  - Database triggers for change tracking
  - Comprehensive metadata capture
  - Indexed audit trail

#### Technical Implementation Details
- Asynchronous event processing for inventory changes
- Redis-based distributed rate limiting
- Multi-layered caching strategy
- Time-based database partitioning

## Technical Evolution Analysis

### Database Evolution
- **V1**: Event-sourced single-store schema
- **V2**: Multi-tenant schema with authentication
- **V3**: Partitioned, indexed, and audited distributed database

### API Design Evolution
- **V1**: Basic RESTful endpoints
- **V2**: Authenticated store-specific endpoints
- **V3**: Cached, rate-limited API with asynchronous operations

### Business Logic Evolution
- **V1**: Synchronous inventory operations
- **V2**: Role-based, store-specific operations
- **V3**: Event-driven, decoupled processing

### Infrastructure Evolution
- **V1**: Single application instance
- **V2**: Enhanced monolith with authentication
- **V3**: Distributed system with message broker and caching

## Key Design Decisions and Trade-offs

### Event Sourcing for Inventory
- **Benefits**: Complete audit trail, point-in-time reconstruction, simplified concurrency
- **Trade-offs**: Higher storage requirements, complex queries, increased processing

### Asynchronous Processing
- **Benefits**: Improved responsiveness, system resilience, independent scaling
- **Trade-offs**: Increased complexity, eventual consistency, debugging challenges

### Read/Write Separation
- **Benefits**: Optimized database usage, read replica support, better read performance
- **Trade-offs**: Potential consistency issues, complex connection management

### Caching Strategy
- **Benefits**: Reduced database load, improved response times, distributed rate limiting
- **Trade-offs**: Cache invalidation complexity, additional infrastructure, stale data risk

## Conclusion

The BazaarCSTD system evolution demonstrates a methodical approach to scaling an inventory system from a single store to an enterprise platform supporting thousands of locations. Each version built upon the previous foundation while addressing its limitations:
- **V1** established core inventory tracking with event sourcing
- **V2** enabled multi-store operations with proper security controls
- **V3** delivered a scalable, distributed architecture with modern design patterns

This progressive evolution ensured business continuity while enabling the system to meet increasing demands for performance, reliability, and scale.
