# Development Guide - CMS Email System

## Table of Contents

1. [Setup Environment](#setup-environment)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Database Management](#database-management)
8. [Git Workflow](#git-workflow)
9. [CI/CD](#cicd)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Setup Environment

### 1. Prerequisites

Install the following tools:

```bash
# Node.js (>= 18.x)
node --version

# pnpm (>= 8.x)
npm install -g pnpm
pnpm --version
```

### 2. Setup Database (Option 1: Docker)

Use Docker Compose to setup PostgreSQL and Redis:

**docker-compose.yml:**
```yaml

services:
  postgres:
    image: postgres:15-alpine
    container_name: cms-email-postgres
    environment:
      POSTGRES_DB: cms_email_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: cms-email-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 3. Environment Variables

Configure `.env`:

```env
# Application
NODE_ENV=development
APP_PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=cms_email_system
DATABASE_SYNC=false
DATABASE_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_REFRESH_EXPIRES_IN=7d

# SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# IMAP (Gmail example)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
MAX_FILE_SIZE=26214400

# AWS S3 (optional)
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Bull Queue
QUEUE_PREFIX=cms-email
QUEUE_REDIS_HOST=localhost
QUEUE_REDIS_PORT=6379

# Logging
LOG_LEVEL=debug
```

### 4. Run Migrations

```bash
# Generate initial migration
pnpm run migration:generate --name InitialSchema

# Run migrations
pnpm run migration:run

# Check migration status
pnpm run migration:show
```

### 5. Seed Database (Optional)

```bash
pnpm run seed
```

### 6. Start Development Server

```bash
# Start in watch mode
pnpm run start:dev

# Start in debug mode
pnpm run start:debug
```

Server will run at `http://localhost:3000`

Swagger API docs: `http://localhost:3000/api/docs`

---

## Project Structure

```
cms-email-system/
├── src/
│   ├── modules/                 # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   ├── guards/
│   │   │   ├── dto/
│   │   │   └── interfaces/
│   │   ├── user/
│   │   ├── email/
│   │   ├── folder/
│   │   ├── contact/
│   │   ├── calendar/
│   │   ├── label/
│   │   ├── filter/
│   │   ├── template/
│   │   ├── attachment/
│   │   └── search/
│   │
│   ├── common/                  # Shared code
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── middlewares/
│   │   │   ├── logger.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── constants/
│   │   │   └── error-codes.constant.ts
│   │   └── utils/
│   │       ├── date.util.ts
│   │       ├── crypto.util.ts
│   │       └── email.util.ts
│   │
│   ├── config/                  # Configuration
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   ├── mail.config.ts
│   │   └── storage.config.ts
│   │
│   ├── database/                # Database files
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── data-source.ts
│   │
│   ├── mail/                    # Email services
│   │   ├── smtp/
│   │   │   ├── smtp.service.ts
│   │   │   └── smtp.config.ts
│   │   ├── imap/
│   │   │   ├── imap.service.ts
│   │   │   └── imap-poller.service.ts
│   │   └── parsers/
│   │       ├── mime-parser.service.ts
│   │       └── html-parser.service.ts
│   │
│   ├── queue/                   # Bull queue
│   │   ├── queue.module.ts
│   │   ├── processors/
│   │   │   ├── email-send.processor.ts
│   │   │   ├── email-fetch.processor.ts
│   │   │   └── attachment-scan.processor.ts
│   │   └── jobs/
│   │
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Entry point
│
├── test/                        # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_DESIGN.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEVELOPMENT.md
│   └── FEATURES.md
│
├── docker/                      # Docker files
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── docker-compose.yml
│
├── scripts/                     # Utility scripts
│   ├── seed.ts
│   └── cleanup.ts
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## Coding Standards

### 1. TypeScript

**Use strict typing:**
**Use interfaces/types:**

### 2. Naming Conventions

```typescript
// Classes: PascalCase
class UserService {}

// Methods/Functions: camelCase
function getUserById() {}

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 26214400;

// Interfaces: PascalCase with "I" prefix (optional)
interface IUser {}

// Types: PascalCase
type UserRole = 'admin' | 'user';

// Enums: PascalCase
enum EmailStatus {
  Draft = 'draft',
  Sent = 'sent',
}
```

### 3. File Naming

```
user.entity.ts
user.service.ts
user.controller.ts
user.service.spec.ts
create-user.dto.ts
user.repository.ts
jwt-auth.guard.ts
```

### 4. Documentation

Use Swagger decorators:

```typescript
@ApiTags('users')
@Controller('users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

---

## Testing

### 1. Unit Tests

```bash
# Run all unit tests
pnpm run test

# Run with coverage
pnpm run test:cov

# Run in watch mode
pnpm run test:watch

# Run specific file
pnpm run test user.service.spec.ts
```

### 2. E2E Tests

```bash
# Run e2e tests
pnpm run test:e2e
```

### 3. Integration Tests

Test modules working together with real database (or test database).

---

## Debugging

### 1. VSCode Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "start:debug"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 2. Logging

---

## Database Management

### 1. Migrations

```bash
# Create migration
pnpm run migration:create --name AddPhoneToUser

# Generate migration from entities
pnpm run migration:generate --name UpdateUserTable

# Run migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert

# Show migration status
pnpm run migration:show
```

### 2. Seeds

```bash
# Run seeds
pnpm run seed
```

---

## CI/CD

### GitHub Actions Example

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: cms_email_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm run lint

      - name: Run tests
        run: pnpm run test:cov
        env:
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          REDIS_HOST: localhost

      - name: Run e2e tests
        run: pnpm run test:e2e

      - name: Build
        run: pnpm run build
```

---

## Deployment

### 1. Docker Build

```bash
# Build production image
docker build -t cms-email-system:latest -f docker/Dockerfile .

# Run container
docker run -p 3000:3000 --env-file .env cms-email-system:latest
```

### 2. Docker Compose (Production)

```yaml
version: '3.8'

services:
  app:
    image: cms-email-system:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 3. Environment-specific configs

```bash
# .env.development
# .env.staging
# .env.production
```

---

## Troubleshooting

### Common Issues

**1. Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

**2. Database connection failed:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres
```

**3. Migration failed:**
```bash
# Revert migration
pnpm run migration:revert

# Drop database and recreate
pnpm run db:drop
pnpm run db:create
pnpm run migration:run
```

**4. Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

**5. Test failures:**
```bash
# Clear Jest cache
pnpm run test --clearCache

# Run specific test file
pnpm run test -- user.service.spec.ts
```

---

## Useful Commands

```bash
# Development
pnpm run start:dev       # Start in watch mode
pnpm run start:debug     # Start in debug mode

# Build
pnpm run build           # Build for production
pnpm run build:watch     # Build in watch mode

# Testing
pnpm run test            # Run unit tests
pnpm run test:watch      # Run tests in watch mode
pnpm run test:cov        # Run tests with coverage
pnpm run test:e2e        # Run e2e tests

# Linting & Formatting
pnpm run lint            # Run ESLint
pnpm run lint:fix        # Fix linting issues
pnpm run format          # Format code with Prettier

# Database
pnpm run migration:create
pnpm run migration:generate
pnpm run migration:run
pnpm run migration:revert
pnpm run seed

# Docker
docker-compose up -d     # Start containers
docker-compose down      # Stop containers
docker-compose logs -f   # View logs
```

---

**Document version**: 1.1
**Last updated**: 2025-10-13
