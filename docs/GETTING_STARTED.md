# Getting Started - CMS Email System

## Prerequisites

- Node.js >= 20.x
- pnpm >= 8.x
- Docker & Docker Compose
- Git

## Architecture Overview

This is a **NestJS Microservices Monorepo** with **Domain-Driven Design (DDD)** principles.

```
cms-email-system/
├── apps/                           # Microservices
│   ├── api-gateway/               # HTTP Entry point (Port 3000)
│   ├── auth-service/              # Authentication (Port 3001)
│   ├── email-service/             # Email management (Port 3002)
│   └── folder-service/            # Folder management (Port 3003)
├── libs/                           # Shared libraries
│   ├── common/                    # Common utilities, decorators, filters
│   ├── domain/                    # DDD base classes, value objects
│   └── infrastructure/            # Database, messaging, config
└── docs/                           # Documentation
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cms-email-system
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` if needed (default values should work for local development).

### 4. Start Infrastructure (Docker)

Start PostgreSQL, MongoDB, and Redis:

```bash
docker-compose up -d
```

Verify all services are running:

```bash
docker-compose ps
```

You should see:
- `cms-email-postgres` (Port 5432)
- `cms-email-mongodb` (Port 27017)
- `cms-email-redis` (Port 6379)
- `cms-email-pgadmin` (Port 5050) - Optional
- `cms-email-mongo-express` (Port 8081) - Optional

### 5. Database Management Tools (Optional)

**PgAdmin** (PostgreSQL):
- URL: http://localhost:5050
- Email: admin@cms-email.com
- Password: admin

**Mongo Express** (MongoDB):
- URL: http://localhost:8081
- Username: admin
- Password: admin123

### 6. Build All Services

```bash
pnpm run build:all
```

### 7. Start Services

**Option A: Start All Services Concurrently**

```bash
pnpm run start:all
```

This will start all microservices:
- API Gateway: http://localhost:3000/api
- Auth Service: http://localhost:3001/api/auth
- Email Service: http://localhost:3002/api/emails
- Folder Service: http://localhost:3003/api/folders

**Option B: Start Services Individually**

```bash
# Terminal 1
pnpm run start:api-gateway

# Terminal 2
pnpm run start:auth-service

# Terminal 3
pnpm run start:email-service

# Terminal 4
pnpm run start:folder-service
```

### 8. Verify Services are Running

Check health endpoints:

```bash
# API Gateway
curl http://localhost:3000/api/health

# Auth Service
curl http://localhost:3001/api/auth/health

# Email Service
curl http://localhost:3002/api/emails/health

# Folder Service
curl http://localhost:3003/api/folders/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "service": "API Gateway"
}
```

## Project Structure

### Apps (Microservices)

Each microservice follows DDD structure:

```
apps/auth-service/
├── src/
│   ├── domain/                 # Domain layer (business logic)
│   │   ├── models/            # Aggregates, Entities, Value Objects
│   │   ├── repositories/      # Repository interfaces
│   │   ├── services/          # Domain services
│   │   └── events/            # Domain events
│   ├── application/           # Application layer (use cases)
│   │   ├── commands/          # CQRS Commands
│   │   ├── queries/           # CQRS Queries
│   │   └── dtos/              # Data Transfer Objects
│   ├── infrastructure/        # Infrastructure layer (technical)
│   │   ├── repositories/      # Repository implementations
│   │   ├── persistence/       # Database entities/schemas
│   │   └── messaging/         # Event publishers
│   ├── presentation/          # Presentation layer (API)
│   │   └── controllers/       # HTTP/gRPC controllers
│   ├── app.module.ts
│   └── main.ts
└── tsconfig.app.json
```

### Libs (Shared Libraries)

**@app/common**:
- Decorators (e.g., `@CurrentUser`)
- Filters (Exception handling)
- Guards (Authorization)
- Interceptors (Logging, Transform)
- Pipes (Validation)

**@app/domain**:
- Base classes: `Entity`, `AggregateRoot`, `ValueObject`
- Domain events: `DomainEvent`
- Common value objects: `Email`, `UUID`

**@app/infrastructure**:
- Configuration management
- Database configurations (TypeORM, Mongoose)
- Event Bus (in-memory, will be replaced with Redis Pub/Sub)
- Messaging infrastructure

## Development Workflow

### Adding a New Microservice

1. Create app directory:
```bash
nest g app contact-service
```

2. Follow DDD structure:
```
apps/contact-service/
├── src/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   ├── presentation/
│   ├── app.module.ts
│   └── main.ts
└── tsconfig.app.json
```

3. Update `nest-cli.json` to include the new service.

### Creating Domain Models

Example: User Aggregate

```typescript
// apps/auth-service/src/domain/models/user.aggregate.ts
import { AggregateRoot } from '@app/domain';
import { Email, UUID } from '@app/domain';
import { UserCreatedEvent } from '../events/user-created.event';

export class User extends AggregateRoot<string> {
  private email: Email;
  private passwordHash: string;
  private isActive: boolean;

  private constructor(id: string, email: Email, passwordHash: string) {
    super(id);
    this.email = email;
    this.passwordHash = passwordHash;
    this.isActive = true;
  }

  static create(email: string, passwordHash: string): User {
    const id = UUID.create().value;
    const emailVO = Email.create(email);
    const user = new User(id, emailVO, passwordHash);

    // Publish domain event
    user.apply(new UserCreatedEvent(id, email));

    return user;
  }

  getEmail(): string {
    return this.email.value;
  }

  deactivate(): void {
    this.isActive = false;
    this.touch();
  }
}
```

### Publishing Domain Events

```typescript
// In your service/command handler
const user = User.create(email, hashedPassword);

// Save to repository
await this.userRepository.save(user);

// Publish events
await this.eventBus.publishAll(user.domainEvents);
user.clearEvents();
```

### Subscribing to Domain Events

```typescript
// In another service
@Injectable()
export class UserEventHandler implements OnModuleInit {
  constructor(private readonly eventBus: EventBusService) {}

  onModuleInit() {
    this.eventBus.subscribe('UserCreated', this.handleUserCreated.bind(this));
  }

  async handleUserCreated(event: DomainEvent) {
    console.log('User created:', event.getData());
    // Create default folders for the user
  }
}
```

## Testing

### Unit Tests

```bash
pnpm test
```

### E2E Tests

```bash
pnpm test:e2e
```

### Coverage

```bash
pnpm test:cov
```

## Common Issues & Solutions

### Port Already in Use

If you see "Port 3000 is already in use":

```bash
# Find and kill the process
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Docker Services Not Starting

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Restart
docker-compose up -d
```

### Database Connection Error

1. Verify Docker services are running:
```bash
docker-compose ps
```

2. Check environment variables in `.env`

3. Test database connection:
```bash
# PostgreSQL
docker exec -it cms-email-postgres psql -U postgres -d cms_email

# MongoDB
docker exec -it cms-email-mongodb mongosh -u admin -p admin123
```

## Next Steps

1. ✅ Infrastructure is ready
2. 🚧 Implement Auth Service with JWT authentication
3. 🚧 Implement Email Service with SMTP/IMAP
4. 🚧 Add remaining microservices
5. 🚧 Setup inter-service communication (gRPC)
6. 🚧 Implement CQRS with event sourcing
7. 🚧 Add API documentation (Swagger)
8. 🚧 Deploy to AWS/Docker

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Mongoose Documentation](https://mongoosejs.com)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)

## Support

For questions or issues, please check:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [AWS_HYBRID_ARCHITECTURE.md](./AWS_HYBRID_ARCHITECTURE.md) - AWS deployment
- [FEATURES.md](./FEATURES.md) - Feature specifications
