# 📦 CMS Email System - Monorepo Structure

## ✅ Clean Monorepo Setup Complete

Folder `src/` cũ đã được xóa. Hệ thống bây giờ sử dụng **pure monorepo structure**.

---

## 📁 Current Structure

```
cms-email-system/
├── apps/                          # 🚀 MICROSERVICES
│   ├── api-gateway/              # HTTP Gateway (Port 3000)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.controller.ts
│   │   │   └── app.service.ts
│   │   └── tsconfig.app.json
│   │
│   ├── auth-service/             # Authentication (Port 3001)
│   │   ├── src/
│   │   │   ├── domain/          # DDD: Business logic
│   │   │   ├── application/     # DDD: Use cases
│   │   │   ├── infrastructure/  # DDD: Technical
│   │   │   ├── presentation/    # DDD: Controllers
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   └── tsconfig.app.json
│   │
│   ├── email-service/            # Email Management (Port 3002)
│   │   └── src/...              # Same DDD structure
│   │
│   └── folder-service/           # Folder Management (Port 3003)
│       └── src/...              # Same DDD structure
│
├── libs/                          # 📚 SHARED LIBRARIES
│   ├── common/                   # Common utilities
│   │   ├── src/
│   │   │   ├── decorators/      # @CurrentUser
│   │   │   ├── filters/         # Exception filters
│   │   │   ├── guards/          # Auth guards
│   │   │   ├── interceptors/    # Logging, Transform
│   │   │   ├── pipes/           # Validation
│   │   │   ├── utils/
│   │   │   ├── constants/
│   │   │   ├── interfaces/
│   │   │   └── index.ts
│   │   └── tsconfig.lib.json
│   │
│   ├── domain/                   # DDD Base Classes
│   │   ├── src/
│   │   │   ├── base/
│   │   │   │   ├── entity.base.ts
│   │   │   │   ├── aggregate-root.base.ts
│   │   │   │   └── value-object.base.ts
│   │   │   ├── events/
│   │   │   │   └── domain-event.base.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── email.vo.ts
│   │   │   │   └── uuid.vo.ts
│   │   │   └── index.ts
│   │   └── tsconfig.lib.json
│   │
│   └── infrastructure/           # Infrastructure
│       ├── src/
│       │   ├── config/
│       │   │   ├── configuration.ts
│       │   │   └── validation.schema.ts
│       │   ├── database/
│       │   │   ├── typeorm.config.ts
│       │   │   └── mongoose.config.ts
│       │   ├── messaging/
│       │   │   ├── event-bus.module.ts
│       │   │   └── event-bus.service.ts
│       │   └── index.ts
│       └── tsconfig.lib.json
│
├── docs/                          # 📖 DOCUMENTATION
│   ├── GETTING_STARTED.md        # ⭐ START HERE
│   ├── ARCHITECTURE.md
│   ├── AWS_HYBRID_ARCHITECTURE.md
│   ├── FEATURES.md
│   └── INFRASTRUCTURE_SETUP_COMPLETE.md
│
├── test/                          # 🧪 E2E TESTS
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── dist/                          # 🏗️ BUILD OUTPUT
│   ├── apps/
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── email-service/
│   │   └── folder-service/
│   └── libs/
│
├── .env                           # Environment variables
├── .env.example
├── docker-compose.yml             # 🐳 Infrastructure
├── nest-cli.json                  # NestJS monorepo config
├── package.json
├── tsconfig.json                  # TypeScript config
└── pnpm-lock.yaml

```

---

## 🎯 Import Paths

### Using Shared Libraries

```typescript
// In any microservice
import { CurrentUser, HttpExceptionFilter } from '@app/common';
import { Entity, AggregateRoot, Email, UUID } from '@app/domain';
import { EventBusService } from '@app/infrastructure';
```

### TypeScript Path Mapping

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@app/common": ["libs/common/src"],
      "@app/common/*": ["libs/common/src/*"],
      "@app/domain": ["libs/domain/src"],
      "@app/domain/*": ["libs/domain/src/*"],
      "@app/infrastructure": ["libs/infrastructure/src"],
      "@app/infrastructure/*": ["libs/infrastructure/src/*"]
    }
  }
}
```

---

## 🚀 Available Commands

### Build

```bash
# Build API Gateway (default)
pnpm run build

# Build all microservices
pnpm run build:all

# Build specific service
nest build auth-service
nest build email-service
nest build folder-service
```

### Development

```bash
# Start all services concurrently
pnpm run start:all

# Start individual services
pnpm run start:api-gateway
pnpm run start:auth-service
pnpm run start:email-service
pnpm run start:folder-service
```

### Code Quality

```bash
# Format code
pnpm run format

# Lint code
pnpm run lint

# Run tests
pnpm test

# Test coverage
pnpm test:cov
```

---

## 📊 Services Overview

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| **API Gateway** | 3000 | - | HTTP entry point, routing |
| **Auth Service** | 3001 | PostgreSQL | User authentication, JWT |
| **Email Service** | 3002 | MongoDB | Email CRUD, SMTP/IMAP |
| **Folder Service** | 3003 | PostgreSQL | Folder management |

---

## 🔧 Configuration

### Environment Variables

```bash
# .env
NODE_ENV=development

# Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
EMAIL_SERVICE_PORT=3002
FOLDER_SERVICE_PORT=3003

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=cms_email

# MongoDB
MONGODB_URI=mongodb://admin:admin123@localhost:27017/cms_email?authSource=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

### Docker Services

```bash
# Start infrastructure
docker-compose up -d

# Services:
- PostgreSQL: localhost:5432
- MongoDB: localhost:27017
- Redis: localhost:6379
- PgAdmin: localhost:5050
- Mongo Express: localhost:8081
```

---

## 🏗️ Adding New Microservice

### 1. Generate Service

```bash
nest g app new-service
```

### 2. Create DDD Structure

```bash
mkdir -p apps/new-service/src/{domain,application,infrastructure,presentation}
```

### 3. Update nest-cli.json

```json
{
  "projects": {
    "new-service": {
      "type": "application",
      "root": "apps/new-service",
      "entryFile": "main",
      "sourceRoot": "apps/new-service/src",
      "compilerOptions": {
        "tsConfigPath": "apps/new-service/tsconfig.app.json"
      }
    }
  }
}
```

### 4. Add Scripts to package.json

```json
{
  "scripts": {
    "start:new-service": "nest start new-service --watch"
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```bash
# Test domain logic
apps/auth-service/src/domain/**/*.spec.ts

# Test application layer
apps/auth-service/src/application/**/*.spec.ts
```

### Integration Tests

```bash
# Test infrastructure
apps/auth-service/src/infrastructure/**/*.spec.ts
```

### E2E Tests

```bash
# Test API endpoints
test/auth.e2e-spec.ts
```

---

## 📦 Build Output

After running `pnpm run build:all`:

```
dist/
├── apps/
│   ├── api-gateway/
│   │   └── main.js
│   ├── auth-service/
│   │   └── main.js
│   ├── email-service/
│   │   └── main.js
│   └── folder-service/
│       └── main.js
└── libs/
    ├── common/
    ├── domain/
    └── infrastructure/
```

---

## ✅ What Changed from src/ to apps/

### Before (Modular Monolith)

```
src/
├── modules/
│   ├── auth/
│   ├── email/
│   └── folder/
├── common/
└── main.ts
```

### After (Microservices Monorepo)

```
apps/
├── api-gateway/     # Independent app
├── auth-service/    # Independent app
├── email-service/   # Independent app
└── folder-service/  # Independent app

libs/
├── common/          # Shared across all apps
├── domain/          # Shared across all apps
└── infrastructure/  # Shared across all apps
```

### Benefits

✅ **Clear Separation**: Each service is independent
✅ **Scalable**: Easy to deploy services separately
✅ **Maintainable**: Each team can own a service
✅ **Reusable**: Shared libraries prevent duplication
✅ **Type-Safe**: TypeScript paths for imports

---

## 🎯 Next Steps

1. ✅ Monorepo structure complete
2. 🚧 Implement Auth Service with DDD
3. 🚧 Add inter-service communication (gRPC)
4. 🚧 Implement remaining services
5. 🚧 Add API documentation (Swagger)
6. 🚧 Deploy to AWS

See [GETTING_STARTED.md](docs/GETTING_STARTED.md) for implementation guide.

---

**Last Updated**: 2025-01-21
**Status**: ✅ Monorepo Structure Complete
**Build**: ✅ All services build successfully
