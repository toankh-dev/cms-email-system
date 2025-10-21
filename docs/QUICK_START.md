# Quick Start Guide - CMS Email System

## 🚀 Setup Development Environment (10 Minutes)

Fast setup guide to start coding immediately.

---

## Prerequisites

Before starting, ensure you have:

```bash
✅ Node.js 20.x or higher
✅ pnpm 8.x or higher
✅ Docker & Docker Compose (recommended)
✅ Git
✅ Code editor (VS Code recommended)
```

### Check Your Versions

```bash
node --version    # Should be v20.x or higher
pnpm --version    # Should be 8.x or higher
docker --version  # Should be 24.x or higher
```

### Install Missing Tools

**Node.js:**
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from https://nodejs.org/
```

**pnpm:**
```bash
npm install -g pnpm
```

**Docker:**
- Download from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd cms-email-system

# Install dependencies
pnpm install
```

**Expected output:**
```
Packages: +XXX
Progress: resolved XXX, reused XXX, downloaded 0
Done in Xs
```

---

## Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

**Edit `.env` file with your settings:**

```env
# Required - Change these!
DATABASE_PASSWORD=your_secure_password
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
EMAIL_ENCRYPTION_KEY=your-32-character-key-for-email

# Optional - Use Gmail for testing
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_app_password  # See note below
IMAP_USER=your.email@gmail.com
IMAP_PASSWORD=your_app_password

# AWS S3 (optional for development)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
```

### 📧 Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification (enable if not already)
3. App Passwords → Generate new app password
4. Copy the 16-character password to your `.env`

---

## Step 3: Start Database Services

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps
```

**Expected output:**
```
NAME                STATUS              PORTS
postgres            Up 10 seconds       0.0.0.0:5432->5432/tcp
redis               Up 10 seconds       0.0.0.0:6379->6379/tcp
```

### Option B: Local Installation

**PostgreSQL:**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql-15
sudo systemctl start postgresql

# Create database
createdb cms_email_system
```

**Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

---

## Step 4: Database Setup

```bash
# Run migrations to create tables
pnpm migration:run

# Optional: Seed sample data
pnpm seed:run
```

**Expected output:**
```
query: SELECT * FROM "migrations" "migrations"
query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
query: CREATE TABLE "users" (...)
Migration CreateUsersTable1700000001 has been executed successfully.
...
```

---

## Step 5: Start Development Server

```bash
# Start the application in development mode
pnpm start:dev
```

**Expected output:**
```
[Nest] 12345  - 10/21/2025, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 10/21/2025, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 10/21/2025, 10:00:00 AM     LOG [RoutesResolver] EmailController {/emails}:
[Nest] 12345  - 10/21/2025, 10:00:00 AM     LOG [RouterExplorer] Mapped {/emails, GET} route
[Nest] 12345  - 10/21/2025, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
Application is running on: http://localhost:3000
Swagger docs available at: http://localhost:3000/api/docs
```

---

## Step 6: Verify Installation

### Test API Health

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Access Swagger Documentation

Open your browser: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

You should see the interactive API documentation.

### Test Registration

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

## Step 7: Development Tools

### Access Bull Board (Queue Dashboard)

Open: [http://localhost:3000/admin/queues](http://localhost:3000/admin/queues)

Monitor background jobs and email queues.

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "rangav.vscode-thunder-client",
    "cweijan.vscode-postgresql-client2"
  ]
}
```

Install all:
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension rangav.vscode-thunder-client
code --install-extension cweijan.vscode-postgresql-client2
```

---

## Common Commands

### Development

```bash
# Start dev server (hot reload)
pnpm start:dev

# Start in debug mode
pnpm start:debug

# Build for production
pnpm build

# Start production build
pnpm start:prod
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run e2e tests
pnpm test:e2e

# Generate coverage report
pnpm test:cov
```

### Database

```bash
# Generate new migration
pnpm migration:generate -- -n MigrationName

# Run pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show

# Run seeders
pnpm seed:run
```

### Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm type-check
```

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart postgres

# Rebuild images
docker-compose build
```

---

## Troubleshooting

### Issue: "Cannot connect to PostgreSQL"

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection
psql -h localhost -U postgres -d cms_email_system
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in .env
APP_PORT=3001
```

### Issue: "Migration failed"

**Solution:**
```bash
# Drop database and recreate
docker-compose down -v
docker-compose up -d postgres
pnpm migration:run
```

### Issue: "Redis connection failed"

**Solution:**
```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
redis-cli ping  # Should return PONG

# Restart Redis
docker-compose restart redis
```

### Issue: "pnpm install fails"

**Solution:**
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and lock file
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install
```

---

## Next Steps

### Start Implementation

Follow version-based roadmap: **[Implementation Baseline](./IMPLEMENTATION_BASELINE.md)**

**Current Version**: v0.2.0 - Authentication System

```bash
# Week 1: Core Auth
nest g module modules/auth
nest g service modules/auth
nest g controller modules/auth

# Follow daily tasks in Implementation Baseline
```

### Documentation

- **[Implementation Baseline](./IMPLEMENTATION_BASELINE.md)** - Version-based roadmap ⭐
- [Database Schema](./DATABASE_SCHEMA.md) - PostgreSQL tables
- [API Design](./API_DESIGN.md) - REST endpoints
- [Architecture](./ARCHITECTURE.md) - System design

---

## Development Workflow

### Daily Routine

```bash
# 1. Pull latest changes
git pull origin develop

# 2. Start services
docker-compose up -d

# 3. Start dev server
pnpm start:dev

# 4. Make changes and test
pnpm test:watch

# 5. Commit and push
git add .
git commit -m "feat: your feature"
git push
```

### Before Committing

```bash
# Run all checks
pnpm lint:fix
pnpm format
pnpm test
pnpm build
```

### Creating a Feature

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Develop with tests
pnpm test:watch

# 3. Ensure quality
pnpm lint:fix
pnpm test:cov  # Ensure >80% coverage

# 4. Commit
git commit -m "feat: add my feature"

# 5. Push and create PR
git push origin feature/my-feature
```

---

## Additional Resources

### API Testing

**Postman Collection:**
- Import `postman/CMS-Email-System.postman_collection.json`
- Contains all API endpoints with examples

**Thunder Client (VS Code):**
- Collection available in `.vscode/thunder-client/`

### Database GUI

**pgAdmin:**
```bash
# Access via Docker
docker run -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@admin.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  dpage/pgadmin4
```

**DBeaver:**
- Download from [https://dbeaver.io/](https://dbeaver.io/)
- Connect to localhost:5432

### Debugging

**VS Code Debug Configuration:**

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["start:debug"],
  "console": "integratedTerminal",
  "restart": true,
  "protocol": "inspector",
  "port": 9229,
  "autoAttachChildProcesses": true
}
```

---

## Getting Help

### Documentation

- 📚 [Full Documentation](./README.md)
- 🐛 [Issue Tracker](https://github.com/your-org/cms-email-system/issues)
- 💬 [Discussions](https://github.com/your-org/cms-email-system/discussions)

### Community

- Slack: #cms-email-dev
- Email: dev-team@yourdomain.com

### Reporting Issues

```bash
# Include in your bug report:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment (OS, Node version, etc.)
5. Logs/screenshots
```

---

## Checklist

Before you start developing, ensure:

- [x] ✅ Node.js 20+ installed
- [x] ✅ pnpm installed
- [x] ✅ Docker running
- [x] ✅ Repository cloned
- [x] ✅ Dependencies installed
- [x] ✅ Environment configured
- [x] ✅ Database services running
- [x] ✅ Migrations executed
- [x] ✅ Dev server started
- [x] ✅ API accessible
- [x] ✅ Tests passing

---

**You're all set! Happy coding! 🚀**

Start with the [Implementation Baseline](./IMPLEMENTATION_BASELINE.md) for your first tasks.
