# Research: Multi-Tenancy Architecture & Technology Stack

## 1. Multi-Tenancy Analysis

Multi-tenancy is the core architectural pattern for SaaS applications where a single instance of the software serves multiple tenants (customers/organizations). The key challenge is to ensure data isolation and performance while maximizing resource utilization. We analyzed three primary approaches for our platform.

### 1.1 Approaches Comparison

| Feature | Approach 1: Shared Database, Shared Schema | Approach 2: Shared Database, Separate Schemas | Approach 3: Database per Tenant |
| :--- | :--- | :--- | :--- |
| **Data Isolation** | **Logical**: Relies on `tenant_id` column in every table. Application logic enforces isolation. | **Schema-Level**: Each tenant has their own schema (e.g., `tenant_a.users`, `tenant_b.users`) within the same DB. | **Physical**: Each tenant has a completely separate database instance/file. |
| **Cost Efficiency** | **High**: Single DB instance, lowest infrastructure cost. Efficient resource usage. | **Medium**: Single DB instance, but schema management overhead increases. | **Low**: High infrastructure cost. Separate resources for each tenant. |
| **Scalability** | **High**: deeply vertical scaling. Horizontal scaling requires sharding (complex). | **Medium**: Limits on number of schemas per DB instance (Postgres has soft limits). | **High**: Can easily move high-value tenants to dedicated servers. |
| **Development Complexity** | **Medium**: Developers must remember `tenant_id` filters in EVERY query. Higher risk of data leak flaws. | **High**: Migration scripts must run for every schema. DB connection pooling is complex. | **Medium**: managing connections to N databases is complex. DevOps heavy. |
| **Backup/Restore** | **Complex**: Hard to restore just one tenant's data. | **Medium**: Can dump/restore specific schemas. | **Easy**: Simply backup/restore the specific tenant's DB file. |
| **Onboarding** | **Fast**: Just insert a row in `tenants` table. | **Medium**: Must run `CREATE SCHEMA` and migration scripts. | **Slow**: Must provision new DB instance. |

### 1.2 Chosen Approach: Shared Database, Shared Schema

We have selected the **Shared Database, Shared Schema** approach for this project.

**Justification:**
1.  **Simplicity & Speed**: This is the most common pattern for modern B2B SaaS startups. It allows for rapid iteration and simple deployment. Tenant onboarding is instantaneous (a simple `INSERT` query).
2.  **Resource Efficiency**: Since our subscription plans include a "Free" tier, we expect many inactive or low-volume tenants. Allocating separate schemas or databases for them would be wasteful.
3.  **Technology Fit**: PostgreSQL handles large tables with proper indexing efficiently. By adding a B-Tree index on `tenant_id`, we can maintain high query performance even with millions of rows.
4.  **Middleware Control**: We can enforce isolation effectively using application-layer middleware (`authMiddleware`) that validates the JWT and injects the context, and ensuring all Controller queries include the `tenant_id` clause. While this requires strict code discipline, it drastically reduces operational complexity compared to managing thousands of schemas.

---

## 2. Technology Stack Justification

### 2.1 Backend: Node.js & Express
*   **Why**: Node.js is excellent for I/O-heavy applications like task management systems. Its non-blocking event loop handles multiple concurrent requests efficiently.
*   **Ecosystem**: The NPM ecosystem offers robust libraries for everything we need: `sequelize` for ORM, `jsonwebtoken` for auth, `bcrypt` for security.
*   **Alternatives**: Python/Django was considered but Node.js was chosen to share the language (JavaScript) with the frontend, enabling a unified codebase and potentially sharing types/validation logic.

### 2.2 Frontend: React & Vite
*   **Why**: React is the industry standard for building dynamic, interactive UIs. Its component-based architecture is perfect for our modular dashboard (Projects, Tasks, Users).
*   **Performance**: Vite was chosen over Create-React-App (CRA) because it uses native ES modules for blazing fast hot-reloading and build times. This significantly improves developer experience.
*   **Styling**: We use Tailwind CSS (inferred from codebase) or standard CSS for rapid, utility-first styling that is highly maintainable.

### 2.3 Database: PostgreSQL
*   **Why**: Postgres is the world's most advanced open-source relational database. It offers strict ACID compliance, which is critical for transaction usage (e.g., registering a tenant and admin user atomically).
*   **Features**: It supports `UUID` natively, simpler JSON handling if needed later, and robust indexing capabilities for our `tenant_id` columns.
*   **Alternatives**: MongoDB (NoSQL) was rejected because our data is highly relational (User -> Tenant -> Project -> Task). Enforcing these relations in code (NoSQL) is error-prone compared to Database-level Foreign Keys.

### 2.4 Authentication: JWT (JSON Web Tokens)
*   **Why**: Stateless authentication is ideal for scalable REST APIs. We don't need to store session data in Redis or the DB, reducing database lookups on every request.
*   **Mechanism**: The token contains the `tenantId` and `role` claims, allowing the backend to make authorization decisions immediately without querying the user table validation (though we do a quick check for account status).

### 2.5 Containerization: Docker & Docker Compose
*   **Why**: Ensures "it works on my machine" translates to production. It isolates our services and provides a predictable runtime environment.
*   **Orchestration**: `docker-compose` allows us to define the infrastructure (DB, API, Frontend) as code, making deployment a single command `docker-compose up -d`.

---

## 3. Security Considerations

Building a multi-tenant system requires a "Security First" mindset.

### 3.1 Data Isolation Strategy
Even though data lives in the same table, we treat it as if it's separate.
*   **Logic**: Every API endpoint (except public registration/login) **MUST** extract `tenantId` from the validated JWT.
*   **Enforcement**: We explicitly prohibit accepting `tenantId` from the Request Body for operations on existing data. The source of truth is always the Token.
*   **Fail-Safe**: If a user tries to access `/api/projects/:id` where the project belongs to another tenant, the backend query `where: { id: params.id, tenantId: user.tenantId }` will fail to find the record, returning 404/403, thus effectively "hiding" the existence of other tenants' data.

### 3.2 Authentication & Authorization (RBAC)
*   **3-Tier Roles**:
    *   `Super Admin`: System god-mode. Has `tenantId: null`. Can manage all tenants.
    *   `Tenant Admin`: scoped to one tenant. Can manage users/projects.
    *   `User`: scoped to one tenant. Can manage tasks.
*   **Implementation**: Middleware `authorize('super_admin')` checks the role claim in the JWT before the controller even executes.

### 3.3 Password Security
*   **Hashing**: We never store plain-text passwords. We use `bcrypt` (or `argon2`) with a salt round of at least 10.
*   **Process**: On login, we hash the input and compare it with the stored hash. This ensures even if the DB is compromised, passwords are not immediately readable.

### 3.4 API Security
*   **HTTPS**: In production, all traffic must be encrypted via TLS/SSL.
*   **CORS**: We strictly configure Cross-Origin Resource Sharing to allow requests only from our trusted Frontend Domain.
*   **Rate Limiting**: (Planned) To prevent abuse, we should limit requests from a single IP/Tenant.
*   **Input Validation**: We validate all incoming data to prevent SQL Injection (handled by Sequelize) and XSS attacks.

### 3.5 Audit Logging
*   **Traceability**: Critical actions (creating users, deleting projects) are written to an `audit_logs` table.
*   **Content**: Logs include `who` (User ID), `what` (Action), `when` (Timestamp), and `where` (IP Address, Tenant ID). This is crucial for debugging security incidents.
