# System Architecture - CMS Email System

## Overview

CMS Email System is designed using **Clean Architecture** combined with NestJS **Modular Pattern**, allowing the system to be easily scalable, maintainable, and testable.

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  (Web App, Mobile App, Third-party Integrations)                │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                 │
│                    (NGINX / AWS ALB / Traefik)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     NESTJS APPLICATION LAYER                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │  Auth       │  │   Email     │  │   Calendar   │            │
│  │  Module     │  │   Module    │  │   Module     │   ...      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘            │
│         │                 │                 │                     │
│  ┌──────▼─────────────────▼─────────────────▼───────┐           │
│  │           Common Layer (Guards, Pipes, etc)      │           │
│  └──────────────────────────────────────────────────┘           │
└────────────────────────┬───────────────────┬────────────────────┘
                         │                   │
        ┌────────────────▼─────┐    ┌───────▼────────┐
        │   PostgreSQL DB      │    │   Redis Cache   │
        │   (Primary Storage)  │    │   (Session/Q)   │
        └──────────────────────┘    └─────────────────┘
                                              │
                         ┌────────────────────▼──────────────┐
                         │   Bull Queue (Background Jobs)    │
                         │   - Send Email                     │
                         │   - Fetch Email (IMAP)            │
                         │   - Process Attachments           │
                         └────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ SMTP Server  │  │ IMAP Server  │  │  AWS S3      │           │
│  │ (Send Email) │  │ (Recv Email) │  │ (Attachments)│           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

## Module Structure

The system is divided into independent modules by functionality:

### 1. **Auth Module** (Authentication & Authorization)
```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── jwt-refresh.strategy.ts
│   └── local.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── refresh-token.dto.ts
└── interfaces/
    └── jwt-payload.interface.ts
```

**Features:**
- Register, login, logout
- JWT token generation & validation
- Refresh token rotation
- Role-based access control (RBAC)
- Password reset & email verification

### 2. **User Module**
```
src/modules/user/
├── user.module.ts
├── user.controller.ts
├── user.service.ts
├── entities/
│   └── user.entity.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── update-profile.dto.ts
└── repositories/
    └── user.repository.ts
```

**Features:**
- User information management
- Profile management
- Email signatures
- Settings & preferences
- Multi-account management

### 3. **Email Module** (Core)
```
src/modules/email/
├── email.module.ts
├── email.controller.ts
├── email.service.ts
├── entities/
│   ├── email.entity.ts
│   ├── email-recipient.entity.ts
│   └── email-thread.entity.ts
├── dto/
│   ├── create-email.dto.ts
│   ├── send-email.dto.ts
│   ├── search-email.dto.ts
│   └── email-filter.dto.ts
├── processors/
│   ├── send-email.processor.ts
│   └── fetch-email.processor.ts
└── repositories/
    └── email.repository.ts
```

**Features:**
- CRUD operations for emails
- Send email (single/bulk)
- Receive email (IMAP polling)
- Reply, forward, draft
- Email threading (conversation view)
- Mark as read/unread, star/unstar

### 4. **Folder Module**
```
src/modules/folder/
├── folder.module.ts
├── folder.controller.ts
├── folder.service.ts
├── entities/
│   └── folder.entity.ts
├── dto/
│   ├── create-folder.dto.ts
│   └── move-email.dto.ts
└── constants/
    └── default-folders.constant.ts
```

**Features:**
- System folders (Inbox, Sent, Drafts, Trash, Spam)
- Custom folders
- Folder hierarchy
- Move emails between folders

### 5. **Contact Module**
```
src/modules/contact/
├── contact.module.ts
├── contact.controller.ts
├── contact.service.ts
├── entities/
│   ├── contact.entity.ts
│   └── contact-group.entity.ts
├── dto/
│   ├── create-contact.dto.ts
│   ├── import-contacts.dto.ts
│   └── export-contacts.dto.ts
└── parsers/
    ├── csv-parser.service.ts
    └── vcard-parser.service.ts
```

**Features:**
- Add, edit, delete contacts
- Contact groups
- Import/Export (CSV, vCard)
- Search contacts

### 6. **Calendar Module**
```
src/modules/calendar/
├── calendar.module.ts
├── calendar.controller.ts
├── calendar.service.ts
├── entities/
│   ├── event.entity.ts
│   ├── event-participant.entity.ts
│   └── event-reminder.entity.ts
├── dto/
│   ├── create-event.dto.ts
│   └── update-event.dto.ts
└── processors/
    └── reminder.processor.ts
```

**Features:**
- Create events, meetings
- Event invitations
- Reminders & notifications
- Calendar views (day/week/month)
- Recurring events

### 7. **Label Module**
```
src/modules/label/
├── label.module.ts
├── label.controller.ts
├── label.service.ts
├── entities/
│   └── label.entity.ts
└── dto/
    ├── create-label.dto.ts
    └── assign-label.dto.ts
```

**Features:**
- Create custom labels with colors
- Assign multiple labels to emails
- Filter emails by label

### 8. **Filter Module** (Email Rules)
```
src/modules/filter/
├── filter.module.ts
├── filter.controller.ts
├── filter.service.ts
├── entities/
│   ├── filter.entity.ts
│   └── filter-action.entity.ts
├── dto/
│   └── create-filter.dto.ts
└── processors/
    └── filter-processor.service.ts
```

**Features:**
- Auto-categorize emails
- Auto-reply rules
- Forward rules
- Spam detection

### 9. **Template Module**
```
src/modules/template/
├── template.module.ts
├── template.controller.ts
├── template.service.ts
├── entities/
│   └── template.entity.ts
├── dto/
│   └── create-template.dto.ts
└── engines/
    └── template-engine.service.ts
```

**Features:**
- Create custom templates
- Variables & placeholders
- Template categories
- Quick insert

### 10. **Attachment Module**
```
src/modules/attachment/
├── attachment.module.ts
├── attachment.controller.ts
├── attachment.service.ts
├── entities/
│   └── attachment.entity.ts
├── dto/
│   └── upload-file.dto.ts
└── storage/
    ├── local-storage.service.ts
    └── s3-storage.service.ts
```

**Features:**
- Upload multiple files
- Virus scanning
- File preview
- Storage (local/S3)

### 11. **Search Module**
```
src/modules/search/
├── search.module.ts
├── search.controller.ts
├── search.service.ts
├── dto/
│   └── search-query.dto.ts
└── indexers/
    └── email-indexer.service.ts
```

**Features:**
- Full-text search
- Advanced filters
- Search in attachments
- Save search queries

## Common Layer

```
src/common/
├── decorators/
│   ├── current-user.decorator.ts
│   ├── roles.decorator.ts
│   └── public.decorator.ts
├── filters/
│   ├── http-exception.filter.ts
│   └── all-exceptions.filter.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── interceptors/
│   ├── logging.interceptor.ts
│   ├── transform.interceptor.ts
│   └── timeout.interceptor.ts
├── pipes/
│   └── validation.pipe.ts
├── middlewares/
│   ├── logger.middleware.ts
│   └── rate-limit.middleware.ts
└── utils/
    ├── date.util.ts
    ├── crypto.util.ts
    └── email.util.ts
```

## Mail Services Layer

```
src/mail/
├── smtp/
│   ├── smtp.module.ts
│   ├── smtp.service.ts
│   └── smtp.config.ts
├── imap/
│   ├── imap.module.ts
│   ├── imap.service.ts
│   ├── imap.config.ts
│   └── imap-poller.service.ts
└── parsers/
    ├── mime-parser.service.ts
    └── html-parser.service.ts
```

**SMTP Service:**
- Send email via SMTP protocol
- Support TLS/SSL
- Email formatting (HTML, plain text)
- Attachment handling

**IMAP Service:**
- Fetch emails from IMAP server
- Real-time polling (or IDLE command)
- Email synchronization
- Mark emails as read/unread

## Queue System (Bull)

```
src/queue/
├── queue.module.ts
├── processors/
│   ├── email-send.processor.ts
│   ├── email-fetch.processor.ts
│   ├── attachment-scan.processor.ts
│   └── reminder.processor.ts
└── jobs/
    ├── send-email.job.ts
    └── fetch-email.job.ts
```

**Jobs:**
1. **Send Email Job**: Send emails asynchronously
2. **Fetch Email Job**: Fetch emails from IMAP server periodically
3. **Attachment Scan Job**: Virus scanning for attachments
4. **Reminder Job**: Send calendar reminders

## Configuration Layer

```
src/config/
├── app.config.ts          # App configuration
├── database.config.ts     # Database configuration
├── redis.config.ts        # Redis configuration
├── jwt.config.ts          # JWT configuration
├── mail.config.ts         # SMTP/IMAP configuration
└── storage.config.ts      # File storage configuration
```

## Database Layer

```
src/database/
├── migrations/            # TypeORM migrations
│   ├── 1234567890-CreateUserTable.ts
│   ├── 1234567891-CreateEmailTable.ts
│   └── ...
├── seeds/                 # Database seeds
│   ├── user.seed.ts
│   └── folder.seed.ts
└── data-source.ts        # TypeORM data source
```

## Email Processing Flow

### 1. **Send Email Flow**

```
User Request
    │
    ▼
Email Controller (POST /emails/send)
    │
    ▼
Email Service (validate & prepare)
    │
    ▼
Bull Queue (add send-email job)
    │
    ▼
Send Email Processor
    │
    ├──▶ SMTP Service (send via SMTP)
    │        │
    │        ▼
    │    External SMTP Server
    │
    ▼
Save to Database (folder: Sent)
    │
    ▼
Return success response
```

### 2. **Receive Email Flow**

```
IMAP Poller Service (runs every 30s)
    │
    ▼
Connect to IMAP Server
    │
    ▼
Fetch new emails (UNSEEN)
    │
    ▼
Parse MIME content
    │
    ├──▶ Extract headers
    ├──▶ Extract body (HTML/text)
    ├──▶ Extract attachments
    │
    ▼
Apply Email Filters
    │
    ├──▶ Spam detection
    ├──▶ Auto-categorize
    ├──▶ Auto-reply
    │
    ▼
Save to Database (folder: Inbox)
    │
    ▼
Notify user (WebSocket/Push)
```

## Authentication Flow

### 1. **Login Flow**

```
POST /auth/login
    │
    ▼
Validate credentials
    │
    ▼
Generate tokens
    ├──▶ Access Token (JWT, expires 1d)
    ├──▶ Refresh Token (expires 7d)
    │
    ▼
Save refresh token to Redis
    │
    ▼
Return tokens to client
```

### 2. **Request with JWT**

```
Client Request (with Bearer token)
    │
    ▼
JWT Guard
    │
    ├──▶ Validate token signature
    ├──▶ Check expiration
    ├──▶ Extract user info
    │
    ▼
Roles Guard (optional)
    │
    ├──▶ Check user roles
    │
    ▼
Controller handler
```

### 3. **Refresh Token Flow**

```
POST /auth/refresh
    │
    ▼
Validate refresh token
    │
    ▼
Check token in Redis
    │
    ▼
Generate new tokens
    │
    ├──▶ New Access Token
    ├──▶ New Refresh Token (rotation)
    │
    ▼
Invalidate old refresh token
    │
    ▼
Return new tokens
```

## Caching Strategy (Redis)

### Cache Keys Structure:
```
user:{userId}                    # User info
user:{userId}:folders            # User's folders list
user:{userId}:labels             # User's labels
email:{emailId}                  # Email content
folder:{folderId}:emails         # Emails in folder (paginated)
search:{userId}:{hash}           # Search results
session:{sessionId}              # User session
```

### Cache TTL:
- User info: 1 hour
- Folder list: 30 minutes
- Email content: 15 minutes
- Search results: 5 minutes
- Session: 7 days

### Cache Invalidation:
- On email create/update/delete → invalidate folder cache
- On user update → invalidate user cache
- On label create/update → invalidate label cache

## Security Architecture

### 1. **Authentication**
- JWT access token (short-lived: 1 day)
- Refresh token (long-lived: 7 days, stored in Redis)
- Token rotation on refresh
- Secure HTTP-only cookies (optional)

### 2. **Authorization**
- Role-based access control (RBAC)
- Resource ownership validation
- Rate limiting per user/IP

### 3. **Data Protection**
- Password hashing (bcrypt, salt rounds: 10)
- Email content encryption (optional)
- HTTPS/TLS for all connections
- Input validation & sanitization

### 4. **Security Headers**
- Helmet middleware
- CORS configuration
- CSP (Content Security Policy)
- XSS protection

## Scalability Considerations

### 1. **Horizontal Scaling**
- Stateless API design
- Session storage in Redis (shared across instances)
- Load balancer for distributing requests

### 2. **Database Optimization**
- Indexes on frequently queried fields
- Connection pooling
- Read replicas for heavy read operations
- Partitioning large tables (emails by date)

### 3. **Caching**
- Redis for hot data
- CDN for static assets
- HTTP caching headers

### 4. **Async Processing**
- Bull queue for long-running tasks
- Multiple queue workers
- Job priorities & delays

### 5. **Monitoring & Logging**
- Application logs (Winston/Pino)
- Performance monitoring (Prometheus)
- Error tracking (Sentry)
- Health checks endpoint

## Deployment Architecture

### Development
```
Docker Compose:
  - NestJS app (port 3000)
  - PostgreSQL (port 5432)
  - Redis (port 6379)
  - Bull Board (port 3001)
```

### Production
```
┌─────────────────┐
│   CloudFlare    │ (CDN, DDoS protection)
└────────┬────────┘
         │
┌────────▼────────┐
│   Load Balancer │ (AWS ALB / NGINX)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ App1 │  │ App2 │  (NestJS instances)
└───┬──┘  └──┬───┘
    │        │
    └────┬───┘
         │
    ┌────┴─────┐
    │          │
┌───▼────┐ ┌──▼─────┐
│ Postgres│ │ Redis  │
│ (RDS)   │ │(Elastic│
│         │ │ Cache) │
└─────────┘ └────────┘
```

## Technology Decisions

| Component | Technology | Reason |
|-----------|-----------|--------|
| Framework | NestJS | Modular, TypeScript, Enterprise-ready |
| Database | PostgreSQL | ACID, Relational data, Full-text search |
| Cache | Redis | Fast, Pub/Sub, Session storage |
| Queue | Bull | Redis-based, Reliable, Dashboard |
| ORM | TypeORM | Migrations, Relations, TypeScript |
| Auth | Passport + JWT | Standard, Flexible, Secure |
| Validation | class-validator | Decorators, Type-safe |
| Mail | Nodemailer + node-imap | Mature, Well-maintained |
| File Upload | Multer | Standard for Express/NestJS |
| Testing | Jest | Built-in with NestJS |

## Implementation Phases

1. **Phase 1**: Implement Auth & User modules
2. **Phase 2**: Implement Email core functionality (CRUD, Send, Receive)
3. **Phase 3**: Implement Folder, Label, Search modules
4. **Phase 4**: Implement Contact, Calendar modules
5. **Phase 5**: Implement Filter, Template modules
6. **Phase 6**: Optimize, add monitoring, deploy

---

**Document version**: 1.1
**Last updated**: 2025-10-13
