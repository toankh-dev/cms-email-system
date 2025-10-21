# Implementation Baseline - CMS Email System

**Document Type**: Version-Based Development Roadmap
**Current Version**: v0.1.0 (Planning Phase)
**Target Version**: v1.0.0 (Production Ready)
**Timeline**: 16 weeks

---

## Document Purpose

This document tracks the **version-based implementation roadmap** from initial setup to production deployment. Each version represents a milestone with specific deliverables.

---

## Version Roadmap

```
v0.1.0 → v0.2.0 → v0.3.0 → v0.4.0 → v0.5.0 → v1.0.0
Planning  Auth    Email   Advanced Features Production
```

---

## Version 0.1.0 - Project Foundation ✅

**Status**: Complete
**Duration**: Week 0
**Goal**: Setup project structure and documentation

### Deliverables
- [x] Project initialization with NestJS
- [x] Database schema design (20 tables)
- [x] Architecture documentation
- [x] API specifications
- [x] Deployment strategies
- [x] Development environment setup guide

### Technical Stack Confirmed
```yaml
Backend: NestJS v11 + TypeScript v5.7
Database: PostgreSQL 14+ with TypeORM
Cache: Redis 6+
Queue: Bull (Redis-based)
Email: nodemailer (SMTP) + node-imap (IMAP)
Auth: Passport.js + JWT
Storage: AWS S3 / Local
Testing: Jest + Supertest
```

### Database Schema
- 20 tables designed
- PostgreSQL advanced features: UUID, JSONB, tsvector, arrays, triggers
- Full migration scripts ready

### Next Version
→ **v0.2.0** (Authentication & User Management)

---

## Version 0.2.0 - Authentication System 🔄

**Status**: In Progress
**Duration**: Weeks 1-2
**Goal**: Complete authentication and user management

### Module Structure
```
src/modules/
├── auth/           # Authentication logic
│   ├── dto/
│   ├── strategies/
│   └── guards/
└── user/           # User management
    ├── entities/
    └── dto/
```

### Week 1: Core Authentication

**Day 1-2: Setup**
```bash
# Generate modules
nest g module modules/auth
nest g service modules/auth
nest g controller modules/auth
nest g module modules/user
nest g service modules/user
nest g controller modules/user
```

**Tasks**:
- [ ] Create auth module structure
- [ ] Setup JWT configuration
- [ ] Configure Passport strategies
- [ ] Create base entities

**Day 3-4: Database**
```bash
# Create migrations
pnpm migration:generate -- -n CreateUsersTable
pnpm migration:generate -- -n CreateRefreshTokensTable
pnpm migration:run
```

**Tables**:
- [ ] users
- [ ] refresh_tokens
- [ ] email_verification_tokens
- [ ] password_reset_tokens

**Day 5-7: Implementation**
- [ ] User entity with validations
- [ ] Register endpoint (POST /auth/register)
- [ ] Login endpoint (POST /auth/login)
- [ ] Refresh token endpoint (POST /auth/refresh)
- [ ] Password hashing (bcrypt)
- [ ] JWT token generation

### Week 2: Advanced Auth Features

**Tasks**:
- [ ] Email verification flow
- [ ] Forgot password flow
- [ ] Reset password flow
- [ ] JWT guards
- [ ] CurrentUser decorator
- [ ] User profile endpoints

### Acceptance Criteria
- [ ] User can register with email/password
- [ ] User receives verification email
- [ ] User can login and receive JWT tokens
- [ ] Access token expires in 15m
- [ ] Refresh token expires in 7d
- [ ] User can update profile
- [ ] Password reset flow working
- [ ] All endpoints documented in Swagger
- [ ] Unit tests >80% coverage
- [ ] E2E tests passing

### API Endpoints
```typescript
POST   /auth/register         # Register new user
POST   /auth/login            # Login
POST   /auth/refresh          # Refresh access token
POST   /auth/verify-email     # Verify email
POST   /auth/forgot-password  # Request reset
POST   /auth/reset-password   # Reset password
GET    /users/me              # Get current user
PATCH  /users/me              # Update profile
POST   /users/me/avatar       # Upload avatar
```

### Code Quality Checks
```bash
pnpm lint         # ESLint passing
pnpm format       # Prettier applied
pnpm test         # >80% coverage
pnpm test:e2e     # All E2E tests passing
pnpm build        # Production build successful
```

### Version Tag
```bash
git tag v0.2.0
git push origin v0.2.0
```

### Next Version
→ **v0.3.0** (Email Core Operations)

---

## Version 0.3.0 - Email Core System

**Status**: Planned
**Duration**: Weeks 3-4
**Goal**: Email send/receive with SMTP/IMAP

### Module Structure
```
src/modules/
├── email-account/  # SMTP/IMAP configuration
├── email/          # Email CRUD
├── folder/         # Folder management
└── mail/           # SMTP/IMAP services
    ├── smtp/
    └── imap/
```

### Week 3: Email Accounts & Folders

**Tasks**:
- [ ] Email account entity (SMTP/IMAP configs)
- [ ] Email account CRUD endpoints
- [ ] Connection testing
- [ ] Credential encryption (AES-256)
- [ ] Folder entity with hierarchy
- [ ] System folder initialization (Inbox, Sent, etc.)
- [ ] Custom folder CRUD

**Database Tables**:
- [ ] email_accounts
- [ ] folders

### Week 4: Email Operations

**Tasks**:
- [ ] Email entity with full-text search
- [ ] SMTP service with nodemailer
- [ ] IMAP service with node-imap
- [ ] Email send (queued via Bull)
- [ ] Email list with pagination
- [ ] Email detail view
- [ ] Draft save/update
- [ ] Reply/forward functionality
- [ ] Move to folder
- [ ] Bulk operations

**Database Tables**:
- [ ] emails
- [ ] email_recipients

**Queue Jobs**:
- [ ] email-send-queue
- [ ] email-process-queue

### Acceptance Criteria
- [ ] User can add email accounts (SMTP/IMAP)
- [ ] Connection test validates credentials
- [ ] User can send emails (queued)
- [ ] Emails sent within 30 seconds
- [ ] User can view email list (paginated)
- [ ] User can read email details
- [ ] Draft auto-save working
- [ ] Reply/forward functional
- [ ] Folders working with move operation
- [ ] Bull dashboard accessible

### API Endpoints
```typescript
// Email Accounts
POST   /email-accounts
GET    /email-accounts
PATCH  /email-accounts/:id
DELETE /email-accounts/:id
POST   /email-accounts/:id/test

// Folders
GET    /folders
POST   /folders
PATCH  /folders/:id
DELETE /folders/:id

// Emails
GET    /emails?folderId=&page=&limit=
GET    /emails/:id
POST   /emails/send
POST   /emails/drafts
PUT    /emails/drafts/:id
POST   /emails/:id/reply
POST   /emails/:id/forward
PATCH  /emails/:id/read
PATCH  /emails/:id/star
PATCH  /emails/:id/move
DELETE /emails/:id
```

### Version Tag
```bash
git tag v0.3.0
```

### Next Version
→ **v0.4.0** (Contacts, Calendar, Labels)

---

## Version 0.4.0 - Communication Features

**Status**: Planned
**Duration**: Weeks 5-8
**Goal**: Contacts, calendar, labels, filters, templates

### Week 5-6: Contacts & Calendar

**Modules**:
- [ ] Contact management
- [ ] Contact groups
- [ ] CSV/vCard import/export
- [ ] Calendar events
- [ ] Recurring events (RRULE)
- [ ] Event invitations
- [ ] Event reminders

**Database Tables**:
- [ ] contacts
- [ ] contact_groups
- [ ] contact_group_members
- [ ] calendar_events
- [ ] event_attendees
- [ ] event_reminders

### Week 7-8: Labels, Filters & Templates

**Modules**:
- [ ] Label CRUD
- [ ] Email label assignment
- [ ] Email filter rules (JSONB conditions)
- [ ] Auto-apply filters
- [ ] Email templates
- [ ] Template variables

**Database Tables**:
- [ ] labels
- [ ] email_labels
- [ ] email_filters
- [ ] email_templates

### Acceptance Criteria
- [ ] Contact import from CSV working
- [ ] Contact export to vCard
- [ ] Calendar events with invitations
- [ ] Recurring events functional
- [ ] Email labels applied
- [ ] Filters auto-process incoming emails
- [ ] Templates render with variables

### Version Tag
```bash
git tag v0.4.0
```

### Next Version
→ **v0.5.0** (Advanced Features)

---

## Version 0.5.0 - Advanced Features

**Status**: Planned
**Duration**: Weeks 9-12
**Goal**: Attachments, search, background services

### Week 9-10: Attachments & Search

**Tasks**:
- [ ] File upload to S3
- [ ] Virus scanning (ClamAV)
- [ ] Thumbnail generation
- [ ] Full-text search (PostgreSQL tsvector)
- [ ] Advanced search filters
- [ ] Search suggestions

**Database Tables**:
- [ ] attachments

### Week 11-12: Background Services

**Services**:
- [ ] IMAP poller (24/7 running)
- [ ] SMTP sender with connection pool
- [ ] Email processor
- [ ] Scheduled jobs (EventBridge/cron)

### Acceptance Criteria
- [ ] Files upload to S3 successfully
- [ ] Virus scanning blocks malicious files
- [ ] Search returns results <100ms
- [ ] IMAP real-time sync working
- [ ] Emails send via connection pool
- [ ] Background jobs processing

### Version Tag
```bash
git tag v0.5.0
```

### Next Version
→ **v1.0.0** (Production Ready)

---

## Version 1.0.0 - Production Release

**Status**: Planned
**Duration**: Weeks 13-16
**Goal**: Production deployment

### Week 13-14: Security & Testing

**Tasks**:
- [ ] Security audit
- [ ] Penetration testing
- [ ] Load testing (1000 concurrent users)
- [ ] Performance optimization
- [ ] Code coverage >85%
- [ ] All E2E tests passing

### Week 15-16: Deployment & Launch

**Tasks**:
- [ ] CI/CD pipeline setup
- [ ] Production environment setup
- [ ] Monitoring & logging
- [ ] Backup automation
- [ ] Documentation complete
- [ ] User onboarding guide

### Production Checklist
- [ ] All security scans passing
- [ ] Load test passed (1000+ users)
- [ ] API response time <200ms (p95)
- [ ] Database optimized
- [ ] Caching configured
- [ ] Rate limiting active
- [ ] SSL/TLS enabled
- [ ] Monitoring dashboards
- [ ] Backup strategy tested
- [ ] Disaster recovery plan
- [ ] User documentation
- [ ] API documentation (Swagger)

### Version Tag
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Development Workflow

### Daily Checklist
```bash
# Morning
git pull origin develop
docker-compose up -d
pnpm start:dev

# Before commit
pnpm lint:fix
pnpm format
pnpm test
pnpm build

# Commit
git add .
git commit -m "feat(module): description"
git push origin feature/branch
```

### Code Review Checklist
- [ ] TypeScript types defined (no `any`)
- [ ] ESLint passing
- [ ] Tests written (>80% coverage)
- [ ] API documented in Swagger
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Performance considered
- [ ] Security reviewed

### Testing Requirements
```bash
# Unit tests
pnpm test                    # >80% coverage required

# E2E tests
pnpm test:e2e               # All critical flows

# Load tests
pnpm test:load              # Before production
```

---

## Version Control Strategy

### Branch Structure
```
main          (production)
  └── develop (staging)
       ├── feature/auth-module
       ├── feature/email-core
       ├── feature/contacts
       └── bugfix/email-send
```

### Version Tagging
```bash
# Tag format: v{major}.{minor}.{patch}
v0.1.0  # Planning complete
v0.2.0  # Authentication done
v0.3.0  # Email core done
v0.4.0  # Communication features done
v0.5.0  # Advanced features done
v1.0.0  # Production release
```

### Release Notes Template
```markdown
## Version X.X.X - [Release Name]

### New Features
- Feature 1
- Feature 2

### Improvements
- Improvement 1

### Bug Fixes
- Fix 1

### Breaking Changes
- Change 1

### Database Migrations
- Migration files

### Deployment Notes
- Special instructions
```

---

## Metrics & KPIs

### Performance Targets
| Metric | Target | Current |
|--------|--------|---------|
| API Response (p95) | <200ms | TBD |
| Email Send Latency | <30s | TBD |
| Search Query Time | <100ms | TBD |
| Concurrent Users | 1000+ | TBD |
| Uptime | 99.9% | TBD |

### Code Quality Targets
| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | >80% | TBD |
| ESLint Issues | 0 | TBD |
| TypeScript Strict | Yes | TBD |
| Security Vulnerabilities | 0 Critical | TBD |

### Progress Tracking
```
Version 0.1.0: ████████████████████ 100% ✅
Version 0.2.0: ████░░░░░░░░░░░░░░░░  20% 🔄
Version 0.3.0: ░░░░░░░░░░░░░░░░░░░░   0% 📋
Version 0.4.0: ░░░░░░░░░░░░░░░░░░░░   0% 📋
Version 0.5.0: ░░░░░░░░░░░░░░░░░░░░   0% 📋
Version 1.0.0: ░░░░░░░░░░░░░░░░░░░░   0% 📋
```

---

## Dependencies & References

### Core Documentation
- [Database Schema](./DATABASE_SCHEMA.md) - PostgreSQL design
- [API Design](./API_DESIGN.md) - RESTful endpoints
- [Architecture](./ARCHITECTURE.md) - System design
- [AWS Deployment](./AWS_HYBRID_ARCHITECTURE.md) - Cloud architecture

### External Resources
- [NestJS Docs](https://docs.nestjs.com/)
- [TypeORM Docs](https://typeorm.io/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## Version History

| Version | Date | Description | Tag |
|---------|------|-------------|-----|
| 0.1.0 | 2025-10-21 | Project foundation | ✅ |
| 0.2.0 | TBD | Authentication | 🔄 |
| 0.3.0 | TBD | Email core | 📋 |
| 0.4.0 | TBD | Communication | 📋 |
| 0.5.0 | TBD | Advanced features | 📋 |
| 1.0.0 | TBD | Production | 📋 |

---

**Document Maintained By**: Development Team
**Last Updated**: 2025-10-21
**Next Review**: Weekly during active development
