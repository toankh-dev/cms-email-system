# System Architecture - CMS Email System

## Overview

CMS Email System is designed using **NestJS Microservices Architecture** combined with **Domain-Driven Design (DDD)** principles, enabling the system to be highly scalable, maintainable, and resilient. Each microservice is independently deployable and follows DDD patterns with clear bounded contexts.

## Architecture Style

**NestJS Microservices with Domain-Driven Design (DDD)**

### Key Characteristics:
- **Bounded Contexts**: Each microservice represents a distinct business domain
- **Event-Driven Communication**: Services communicate via events and messages
- **CQRS**: Command Query Responsibility Segregation for complex operations
- **Event Sourcing**: Track state changes as events (where applicable)
- **Polyglot Persistence**: Each service owns its data store
- **API Gateway**: Single entry point for clients

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  (Web App, Mobile App, Third-party Integrations)                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP/HTTPS
┌────────────────────────────▼────────────────────────────────────────┐
│                         API GATEWAY                                  │
│                    (NestJS Gateway Service)                          │
│  • Request routing & aggregation                                     │
│  • Authentication & Authorization                                    │
│  • Rate limiting & throttling                                        │
│  • Response transformation                                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │ gRPC / TCP / Redis / NATS
            ┌────────────────┼────────────────┐
            │                │                │
┌───────────▼──────┐  ┌──────▼──────┐  ┌────▼──────────┐
│  Auth Service    │  │Email Service│  │Contact Service│
│  (Microservice)  │  │(Microservice)│  │(Microservice) │
└───────────┬──────┘  └──────┬──────┘  └────┬──────────┘
            │                │                │
┌───────────▼──────┐  ┌──────▼──────┐  ┌────▼──────────┐
│Calendar Service  │  │Folder Service│ │Label Service  │
│  (Microservice)  │  │(Microservice)│  │(Microservice) │
└───────────┬──────┘  └──────┬──────┘  └────┬──────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    MESSAGE BUS / EVENT BUS                           │
│              (Redis Pub/Sub / NATS / RabbitMQ / Kafka)              │
│  • Inter-service communication                                       │
│  • Event publishing & subscription                                   │
│  • Async message processing                                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  PostgreSQL    │  │   MongoDB       │  │   Redis Cache   │
│  (Auth, User)  │  │(Email, Folder)  │  │ (Session/Cache) │
└────────────────┘  └─────────────────┘  └─────────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  Bull Queue    │  │   SMTP/IMAP     │  │    AWS S3       │
│ (Background)   │  │   Services      │  │  (Attachments)  │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Bounded Contexts & Microservices

### 1. **Auth Context** (Identity & Access Management)

**Microservice**: `auth-service`

**Responsibility**:
- User authentication & authorization
- Token management (JWT)
- Role-based access control (RBAC)
- Session management

**Domain Model**:
```typescript
// src/microservices/auth/domain/models/
User (Aggregate Root)
├── UserId (Value Object)
├── Email (Value Object)
├── Password (Value Object)
├── Roles (Value Object)
└── RefreshToken (Entity)
```

**DDD Layers**:
```
auth-service/
├── domain/
│   ├── models/               # Entities, Value Objects, Aggregates
│   │   ├── user.aggregate.ts
│   │   ├── email.vo.ts
│   │   ├── password.vo.ts
│   │   └── refresh-token.entity.ts
│   ├── repositories/         # Repository interfaces
│   │   └── user.repository.interface.ts
│   ├── services/             # Domain services
│   │   ├── authentication.service.ts
│   │   └── password-hasher.service.ts
│   └── events/               # Domain events
│       ├── user-created.event.ts
│       └── user-logged-in.event.ts
├── application/
│   ├── commands/             # CQRS Commands
│   │   ├── register-user.command.ts
│   │   ├── login-user.command.ts
│   │   └── handlers/
│   ├── queries/              # CQRS Queries
│   │   ├── get-user.query.ts
│   │   └── handlers/
│   └── dtos/
│       ├── register.dto.ts
│       └── login.dto.ts
├── infrastructure/
│   ├── repositories/         # Repository implementations
│   │   └── user.repository.ts
│   ├── persistence/          # Database entities
│   │   └── user.schema.ts
│   └── messaging/            # Event publishers
│       └── auth-event.publisher.ts
└── presentation/
    ├── auth.controller.ts
    └── auth-grpc.controller.ts
```

**API Endpoints**:
```typescript
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

**Technology Stack**:
- Transport: gRPC / TCP
- Database: PostgreSQL
- Cache: Redis (sessions)

**Events Published**:
- `UserRegistered`
- `UserLoggedIn`
- `UserLoggedOut`
- `PasswordChanged`

---

### 2. **Email Context** (Core Email Management)

**Microservice**: `email-service`

**Responsibility**:
- Email CRUD operations
- Send/Receive emails (SMTP/IMAP)
- Email threading
- Email search & filtering
- Spam detection

**Domain Model**:
```typescript
// src/microservices/email/domain/models/
Email (Aggregate Root)
├── EmailId (Value Object)
├── Subject (Value Object)
├── Body (Value Object)
├── Sender (Value Object)
├── Recipients (Value Object Collection)
├── Attachments (Entity Collection)
├── EmailThread (Entity)
└── EmailStatus (Value Object)
```

**DDD Layers**:
```
email-service/
├── domain/
│   ├── models/
│   │   ├── email.aggregate.ts
│   │   ├── email-thread.entity.ts
│   │   ├── attachment.entity.ts
│   │   ├── email-address.vo.ts
│   │   └── email-status.vo.ts
│   ├── repositories/
│   │   ├── email.repository.interface.ts
│   │   └── email-thread.repository.interface.ts
│   ├── services/
│   │   ├── email-sender.service.ts
│   │   ├── email-receiver.service.ts
│   │   ├── thread-detector.service.ts
│   │   └── spam-detector.service.ts
│   └── events/
│       ├── email-sent.event.ts
│       ├── email-received.event.ts
│       └── email-deleted.event.ts
├── application/
│   ├── commands/
│   │   ├── send-email.command.ts
│   │   ├── reply-email.command.ts
│   │   ├── delete-email.command.ts
│   │   └── handlers/
│   ├── queries/
│   │   ├── get-emails.query.ts
│   │   ├── search-emails.query.ts
│   │   └── handlers/
│   └── sagas/                # Process managers
│       └── email-send.saga.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── email.repository.ts
│   │   └── email-thread.repository.ts
│   ├── persistence/
│   │   └── email.schema.ts   # MongoDB schema
│   ├── mail/
│   │   ├── smtp.adapter.ts
│   │   └── imap.adapter.ts
│   └── processors/
│       ├── send-email.processor.ts
│       └── fetch-email.processor.ts
└── presentation/
    ├── email.controller.ts
    └── email-grpc.controller.ts
```

**API Endpoints**:
```typescript
GET    /api/emails                    # List emails
GET    /api/emails/:id                # Get email detail
POST   /api/emails/send               # Send email
POST   /api/emails/:id/reply          # Reply to email
POST   /api/emails/:id/forward        # Forward email
POST   /api/emails/drafts             # Save draft
PATCH  /api/emails/:id/read           # Mark as read
PATCH  /api/emails/:id/star           # Star email
DELETE /api/emails/:id                # Delete email
GET    /api/emails/search             # Search emails
```

**Technology Stack**:
- Transport: gRPC / TCP / Redis Pub/Sub
- Database: MongoDB (document-based for email content)
- Cache: Redis (email list, search results)
- Queue: Bull (send/receive jobs)

**Events Published**:
- `EmailSent`
- `EmailReceived`
- `EmailRead`
- `EmailDeleted`
- `EmailStarred`

**Events Subscribed**:
- `FolderCreated` (from Folder Service)
- `LabelAssigned` (from Label Service)

---

### 3. **Folder Context** (Email Organization)

**Microservice**: `folder-service`

**Responsibility**:
- Folder management (CRUD)
- System folders (Inbox, Sent, Drafts, Trash, Spam)
- Custom folder hierarchy
- Move emails between folders

**Domain Model**:
```typescript
Folder (Aggregate Root)
├── FolderId (Value Object)
├── Name (Value Object)
├── Type (Value Object - System/Custom)
├── ParentFolder (Reference)
└── EmailCount (Value Object)
```

**DDD Layers**:
```
folder-service/
├── domain/
│   ├── models/
│   │   ├── folder.aggregate.ts
│   │   ├── folder-type.vo.ts
│   │   └── folder-hierarchy.service.ts
│   ├── repositories/
│   │   └── folder.repository.interface.ts
│   └── events/
│       ├── folder-created.event.ts
│       └── email-moved.event.ts
├── application/
│   ├── commands/
│   │   ├── create-folder.command.ts
│   │   ├── move-email.command.ts
│   │   └── handlers/
│   └── queries/
│       ├── get-folders.query.ts
│       └── handlers/
├── infrastructure/
│   ├── repositories/
│   │   └── folder.repository.ts
│   └── persistence/
│       └── folder.schema.ts
└── presentation/
    └── folder.controller.ts
```

**API Endpoints**:
```typescript
GET    /api/folders           # List all folders
POST   /api/folders           # Create folder
PATCH  /api/folders/:id       # Update folder
DELETE /api/folders/:id       # Delete folder
POST   /api/folders/:id/move  # Move email to folder
```

**Technology Stack**:
- Transport: gRPC / TCP
- Database: PostgreSQL
- Cache: Redis (folder tree)

**Events Published**:
- `FolderCreated`
- `FolderDeleted`
- `EmailMovedToFolder`

---

### 4. **Contact Context** (Contact Management)

**Microservice**: `contact-service`

**Responsibility**:
- Contact CRUD operations
- Contact groups
- Import/Export contacts (CSV, vCard)
- Contact search

**Domain Model**:
```typescript
Contact (Aggregate Root)
├── ContactId (Value Object)
├── FullName (Value Object)
├── Email (Value Object)
├── Phone (Value Object)
├── Company (Value Object)
└── ContactGroups (Entity Collection)

ContactGroup (Aggregate Root)
├── GroupId (Value Object)
├── Name (Value Object)
└── Members (Contact References)
```

**DDD Layers**:
```
contact-service/
├── domain/
│   ├── models/
│   │   ├── contact.aggregate.ts
│   │   ├── contact-group.aggregate.ts
│   │   ├── email.vo.ts
│   │   └── phone.vo.ts
│   ├── repositories/
│   │   ├── contact.repository.interface.ts
│   │   └── contact-group.repository.interface.ts
│   └── services/
│       ├── csv-parser.service.ts
│       └── vcard-parser.service.ts
├── application/
│   ├── commands/
│   │   ├── create-contact.command.ts
│   │   ├── import-contacts.command.ts
│   │   └── handlers/
│   └── queries/
│       ├── get-contacts.query.ts
│       └── handlers/
├── infrastructure/
│   ├── repositories/
│   │   ├── contact.repository.ts
│   │   └── contact-group.repository.ts
│   └── persistence/
│       └── contact.schema.ts
└── presentation/
    └── contact.controller.ts
```

**Technology Stack**:
- Transport: gRPC / TCP
- Database: PostgreSQL
- Cache: Redis

**Events Published**:
- `ContactCreated`
- `ContactUpdated`
- `ContactsImported`

---

### 5. **Calendar Context** (Scheduling & Events)

**Microservice**: `calendar-service`

**Responsibility**:
- Event management (CRUD)
- Meeting invitations
- Event reminders & notifications
- Recurring events

**Domain Model**:
```typescript
Event (Aggregate Root)
├── EventId (Value Object)
├── Title (Value Object)
├── Description (Value Object)
├── TimeRange (Value Object)
├── Location (Value Object)
├── Organizer (Value Object)
├── Participants (Entity Collection)
├── Reminders (Entity Collection)
└── RecurrenceRule (Value Object)
```

**DDD Layers**:
```
calendar-service/
├── domain/
│   ├── models/
│   │   ├── event.aggregate.ts
│   │   ├── participant.entity.ts
│   │   ├── reminder.entity.ts
│   │   ├── time-range.vo.ts
│   │   └── recurrence-rule.vo.ts
│   ├── repositories/
│   │   └── event.repository.interface.ts
│   └── services/
│       ├── recurrence-calculator.service.ts
│       └── invitation-sender.service.ts
├── application/
│   ├── commands/
│   │   ├── create-event.command.ts
│   │   ├── respond-invitation.command.ts
│   │   └── handlers/
│   └── queries/
│       ├── get-events.query.ts
│       └── handlers/
├── infrastructure/
│   ├── repositories/
│   │   └── event.repository.ts
│   ├── persistence/
│   │   └── event.schema.ts
│   └── processors/
│       └── reminder.processor.ts
└── presentation/
    └── calendar.controller.ts
```

**Technology Stack**:
- Transport: gRPC / TCP
- Database: PostgreSQL
- Queue: Bull (reminders)

**Events Published**:
- `EventCreated`
- `InvitationSent`
- `InvitationAccepted`
- `ReminderTriggered`

---

### 6. **Label Context** (Email Tagging)

**Microservice**: `label-service`

**Responsibility**:
- Label management (CRUD)
- Assign/Remove labels to emails
- Color-coded labels

**Domain Model**:
```typescript
Label (Aggregate Root)
├── LabelId (Value Object)
├── Name (Value Object)
├── Color (Value Object)
└── EmailReferences (Value Object Collection)
```

**DDD Layers**:
```
label-service/
├── domain/
│   ├── models/
│   │   ├── label.aggregate.ts
│   │   ├── color.vo.ts
│   │   └── email-label.entity.ts
│   ├── repositories/
│   │   └── label.repository.interface.ts
│   └── events/
│       ├── label-created.event.ts
│       └── label-assigned.event.ts
├── application/
│   ├── commands/
│   │   ├── create-label.command.ts
│   │   ├── assign-label.command.ts
│   │   └── handlers/
│   └── queries/
│       └── get-labels.query.ts
├── infrastructure/
│   └── repositories/
│       └── label.repository.ts
└── presentation/
    └── label.controller.ts
```

**Technology Stack**:
- Transport: gRPC / TCP
- Database: PostgreSQL
- Cache: Redis

**Events Published**:
- `LabelCreated`
- `LabelAssignedToEmail`
- `LabelRemovedFromEmail`

---

### 7. **Template Context** (Email Templates)

**Microservice**: `template-service`

**Responsibility**:
- Template management (CRUD)
- Template rendering with variables
- Template categories

**Domain Model**:
```typescript
Template (Aggregate Root)
├── TemplateId (Value Object)
├── Name (Value Object)
├── Subject (Value Object)
├── Body (Value Object)
├── Variables (Value Object Collection)
└── Category (Value Object)
```

**DDD Layers**:
```
template-service/
├── domain/
│   ├── models/
│   │   ├── template.aggregate.ts
│   │   └── template-variable.vo.ts
│   ├── repositories/
│   │   └── template.repository.interface.ts
│   └── services/
│       └── template-renderer.service.ts
├── application/
│   ├── commands/
│   │   ├── create-template.command.ts
│   │   └── handlers/
│   └── queries/
│       ├── get-templates.query.ts
│       └── handlers/
└── infrastructure/
    └── repositories/
        └── template.repository.ts
```

**Technology Stack**:
- Transport: gRPC / TCP
- Database: PostgreSQL

---

### 8. **Filter Context** (Email Rules & Automation)

**Microservice**: `filter-service`

**Responsibility**:
- Email filter/rule management
- Auto-categorization
- Auto-reply rules
- Spam detection

**Domain Model**:
```typescript
Filter (Aggregate Root)
├── FilterId (Value Object)
├── Name (Value Object)
├── Conditions (Value Object Collection)
├── Actions (Value Object Collection)
└── Priority (Value Object)
```

**DDD Layers**:
```
filter-service/
├── domain/
│   ├── models/
│   │   ├── filter.aggregate.ts
│   │   ├── filter-condition.vo.ts
│   │   ├── filter-action.vo.ts
│   │   └── spam-detector.service.ts
│   ├── repositories/
│   │   └── filter.repository.interface.ts
│   └── services/
│       └── filter-engine.service.ts
├── application/
│   ├── commands/
│   │   ├── create-filter.command.ts
│   │   └── apply-filters.command.ts
│   └── queries/
│       └── get-filters.query.ts
└── infrastructure/
    └── repositories/
        └── filter.repository.ts
```

**Technology Stack**:
- Transport: gRPC / TCP
- Database: PostgreSQL

**Events Subscribed**:
- `EmailReceived` (apply filters to new emails)

---

### 9. **Attachment Context** (File Management)

**Microservice**: `attachment-service`

**Responsibility**:
- File upload/download
- Virus scanning
- Storage management (S3)
- File preview generation

**Domain Model**:
```typescript
Attachment (Aggregate Root)
├── AttachmentId (Value Object)
├── FileName (Value Object)
├── FileSize (Value Object)
├── MimeType (Value Object)
├── StorageKey (Value Object)
└── VirusScanStatus (Value Object)
```

**DDD Layers**:
```
attachment-service/
├── domain/
│   ├── models/
│   │   ├── attachment.aggregate.ts
│   │   └── file-metadata.vo.ts
│   ├── repositories/
│   │   └── attachment.repository.interface.ts
│   └── services/
│       ├── virus-scanner.service.ts
│       └── storage.service.ts
├── application/
│   ├── commands/
│   │   ├── upload-file.command.ts
│   │   └── scan-file.command.ts
│   └── queries/
│       └── get-attachment.query.ts
└── infrastructure/
    ├── repositories/
    │   └── attachment.repository.ts
    └── storage/
        ├── local-storage.adapter.ts
        └── s3-storage.adapter.ts
```

**Technology Stack**:
- Transport: gRPC / TCP
- Database: PostgreSQL
- Storage: AWS S3 / Local
- Queue: Bull (virus scanning)

**Events Published**:
- `AttachmentUploaded`
- `VirusScanCompleted`

---

### 10. **Search Context** (Full-Text Search)

**Microservice**: `search-service`

**Responsibility**:
- Full-text search across emails
- Advanced filters
- Search query optimization
- Search index management

**Domain Model**:
```typescript
SearchQuery (Value Object)
├── Keywords (Value Object)
├── Filters (Value Object Collection)
├── SortBy (Value Object)
└── Pagination (Value Object)

SearchResult (Aggregate Root)
├── Results (Entity Collection)
├── Highlights (Value Object)
└── TotalCount (Value Object)
```

**DDD Layers**:
```
search-service/
├── domain/
│   ├── models/
│   │   ├── search-query.vo.ts
│   │   └── search-result.aggregate.ts
│   └── services/
│       └── search-engine.service.ts
├── application/
│   ├── queries/
│   │   └── search-emails.query.ts
│   └── handlers/
│       └── search-emails.handler.ts
└── infrastructure/
    └── search/
        ├── elasticsearch.adapter.ts
        └── postgres-fts.adapter.ts
```

**Technology Stack**:
- Transport: gRPC / TCP
- Search Engine: ElasticSearch / PostgreSQL FTS
- Cache: Redis

**Events Subscribed**:
- `EmailCreated` (index email)
- `EmailUpdated` (re-index)
- `EmailDeleted` (remove from index)

---

## API Gateway Service

**Responsibility**:
- Single entry point for all client requests
- Request routing to appropriate microservices
- Response aggregation
- Authentication & Authorization
- Rate limiting & throttling
- API documentation (Swagger)

**Structure**:
```
api-gateway/
├── src/
│   ├── auth/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── aggregators/
│   │   ├── email-list.aggregator.ts    # Aggregate from multiple services
│   │   └── user-profile.aggregator.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── email.controller.ts
│   │   ├── contact.controller.ts
│   │   └── ...
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   └── timeout.interceptor.ts
│   └── filters/
│       └── rpc-exception.filter.ts
└── main.ts
```

**Communication Pattern**:
```typescript
// Example: Get emails with folder and label info
@Get('emails')
async getEmails(@Query() query: GetEmailsDto) {
  // 1. Call Email Service (get emails)
  const emails = await this.emailService.getEmails(query);

  // 2. Call Folder Service (get folder names)
  const folderIds = [...new Set(emails.map(e => e.folderId))];
  const folders = await this.folderService.getFoldersByIds(folderIds);

  // 3. Call Label Service (get labels)
  const emailIds = emails.map(e => e.id);
  const labels = await this.labelService.getLabelsByEmailIds(emailIds);

  // 4. Aggregate and return
  return emails.map(email => ({
    ...email,
    folder: folders.find(f => f.id === email.folderId),
    labels: labels.filter(l => l.emailId === email.id)
  }));
}
```

---

## Inter-Service Communication

### Communication Patterns

#### 1. **Synchronous (Request-Response)**
**Use**: When immediate response is needed

**Transport**: gRPC / TCP

**Example**:
```typescript
// API Gateway → Auth Service (validate token)
const user = await this.authService.validateToken(token);

// API Gateway → Email Service (get email)
const email = await this.emailService.getEmailById(emailId);
```

#### 2. **Asynchronous (Event-Driven)**
**Use**: When fire-and-forget or eventual consistency is acceptable

**Transport**: Redis Pub/Sub / NATS / RabbitMQ

**Example**:
```typescript
// Email Service publishes event
this.eventBus.publish('EmailSent', {
  emailId,
  userId,
  to,
  subject,
  sentAt: new Date()
});

// Multiple services can subscribe
// - Folder Service: Update sent folder count
// - Search Service: Index email
// - Notification Service: Send notification
```

#### 3. **Message Queue (Background Jobs)**
**Use**: For long-running or scheduled tasks

**Transport**: Bull Queue (Redis-backed)

**Example**:
```typescript
// Add job to send email queue
await this.emailQueue.add('send-email', {
  emailId,
  to,
  subject,
  body
});

// Worker processes job
@Process('send-email')
async handleSendEmail(job: Job) {
  const { emailId, to, subject, body } = job.data;
  await this.smtpService.send({ to, subject, body });
}
```

### Event Bus Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Event Bus (Redis Pub/Sub)              │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    PUBLISH              SUBSCRIBE           SUBSCRIBE
        │                    │                    │
┌───────▼────────┐  ┌────────▼───────┐  ┌────────▼────────┐
│ Email Service  │  │ Folder Service │  │ Search Service  │
│                │  │                │  │                 │
│ Publishes:     │  │ Subscribes to: │  │ Subscribes to:  │
│ • EmailSent    │  │ • EmailSent    │  │ • EmailSent     │
│ • EmailRead    │  │ • EmailDeleted │  │ • EmailUpdated  │
│ • EmailDeleted │  │                │  │ • EmailDeleted  │
└────────────────┘  └────────────────┘  └─────────────────┘
```

**Event Format** (Cloud Events Standard):
```typescript
interface DomainEvent {
  id: string;                  // Event ID (UUID)
  type: string;                // Event type (EmailSent)
  source: string;              // Source service (email-service)
  timestamp: Date;             // Event timestamp
  dataVersion: string;         // Schema version (1.0)
  data: Record<string, any>;   // Event payload
  correlationId?: string;      // For tracing
  causationId?: string;        // Previous event ID
}
```

**Example Event**:
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  type: "EmailSent",
  source: "email-service",
  timestamp: "2025-01-15T10:30:00Z",
  dataVersion: "1.0",
  data: {
    emailId: "email-123",
    userId: "user-456",
    to: ["john@example.com"],
    subject: "Hello",
    sentAt: "2025-01-15T10:30:00Z"
  },
  correlationId: "req-789",
  causationId: "event-012"
}
```

---

## CQRS Pattern

**Command Query Responsibility Segregation**

### Commands (Write Operations)

```typescript
// Send Email Command
export class SendEmailCommand {
  constructor(
    public readonly userId: string,
    public readonly to: string[],
    public readonly subject: string,
    public readonly body: string,
    public readonly attachments?: string[]
  ) {}
}

// Handler
@CommandHandler(SendEmailCommand)
export class SendEmailHandler implements ICommandHandler<SendEmailCommand> {
  async execute(command: SendEmailCommand): Promise<void> {
    // 1. Create email aggregate
    const email = Email.create({
      userId: command.userId,
      to: EmailAddress.fromStrings(command.to),
      subject: Subject.create(command.subject),
      body: Body.create(command.body)
    });

    // 2. Save to repository
    await this.emailRepository.save(email);

    // 3. Publish event
    this.eventBus.publish(new EmailSentEvent(email.id, email.userId));

    // 4. Add to send queue
    await this.emailQueue.add('send', { emailId: email.id });
  }
}
```

### Queries (Read Operations)

```typescript
// Get Emails Query
export class GetEmailsQuery {
  constructor(
    public readonly userId: string,
    public readonly folderId: string,
    public readonly page: number,
    public readonly limit: number
  ) {}
}

// Handler
@QueryHandler(GetEmailsQuery)
export class GetEmailsHandler implements IQueryHandler<GetEmailsQuery> {
  async execute(query: GetEmailsQuery): Promise<EmailListDto[]> {
    // 1. Check cache first
    const cacheKey = `emails:${query.userId}:${query.folderId}:${query.page}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // 2. Query database (optimized read model)
    const emails = await this.emailRepository.findByFolder(
      query.folderId,
      query.page,
      query.limit
    );

    // 3. Cache result
    await this.cache.set(cacheKey, emails, 300); // 5 minutes

    return emails;
  }
}
```

**Benefits of CQRS**:
- Separate write and read models (optimize each independently)
- Scale reads and writes independently
- Complex queries don't impact write performance
- Easier to implement caching for reads

---

## Database Strategy

### Polyglot Persistence

Each microservice owns its database, choosing the best fit for its domain:

| Service | Database | Reason |
|---------|----------|--------|
| Auth | PostgreSQL | ACID, relational (users, roles) |
| Email | MongoDB | Document-based, flexible schema for email content |
| Folder | PostgreSQL | Relational, hierarchical data |
| Contact | PostgreSQL | Relational, structured data |
| Calendar | PostgreSQL | Complex queries, relational (events, participants) |
| Label | PostgreSQL | Many-to-many relationships |
| Template | PostgreSQL | Structured data |
| Filter | PostgreSQL | Complex conditions & rules |
| Attachment | PostgreSQL | Metadata only (files in S3) |
| Search | ElasticSearch | Full-text search, ranking |

### Data Consistency Patterns

#### 1. **Eventual Consistency** (Most services)
```typescript
// Email Service: Save email
await this.emailRepository.save(email);

// Publish event (async)
this.eventBus.publish(new EmailSentEvent(email.id));

// Folder Service: Update count (eventually)
@EventPattern('EmailSent')
async handleEmailSent(event: EmailSentEvent) {
  await this.folderRepository.incrementCount(event.folderId);
}
```

#### 2. **Saga Pattern** (Distributed Transactions)
```typescript
// Send Email Saga
export class SendEmailSaga {
  @Saga()
  sendEmail = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(SendEmailCommand),
      mergeMap((event) => {
        return [
          // Step 1: Validate user quota
          new ValidateQuotaCommand(event.userId),
          // Step 2: Save draft
          new SaveDraftCommand(event),
          // Step 3: Send via SMTP
          new SendViaSMTPCommand(event),
          // Step 4: Move to Sent folder
          new MoveToSentFolderCommand(event),
        ];
      })
    );
  };
}
```

#### 3. **Compensating Transactions**
```typescript
// If sending fails, rollback
@EventPattern('EmailSendFailed')
async handleSendFailed(event: EmailSendFailedEvent) {
  // Compensate: Delete from database
  await this.emailRepository.delete(event.emailId);

  // Compensate: Restore draft
  await this.draftRepository.restore(event.emailId);

  // Notify user
  this.eventBus.publish(new EmailSendFailedNotification(event.userId));
}
```

---

## Caching Strategy

### Multi-Level Caching

```
┌─────────────┐
│   Client    │ (Browser cache)
└──────┬──────┘
       │ Cache-Control: max-age=300
┌──────▼──────┐
│ API Gateway │ (In-memory cache - LRU)
└──────┬──────┘
       │ Cache frequently accessed data
┌──────▼──────┐
│   Redis     │ (Distributed cache)
└──────┬──────┘
       │ Cache miss
┌──────▼──────┐
│  Database   │
└─────────────┘
```

### Cache Keys Structure

```typescript
// User cache
user:{userId}                          // TTL: 1 hour
user:{userId}:settings                 // TTL: 1 hour

// Folder cache
folders:{userId}                       // TTL: 30 minutes
folder:{folderId}                      // TTL: 15 minutes

// Email cache
emails:{userId}:{folderId}:page:{n}   // TTL: 5 minutes
email:{emailId}                        // TTL: 15 minutes

// Search cache
search:{userId}:{queryHash}            // TTL: 5 minutes

// Session cache
session:{userId}:{tokenId}             // TTL: 7 days
```

### Cache Invalidation

**Event-based Invalidation**:
```typescript
@EventPattern('EmailDeleted')
async handleEmailDeleted(event: EmailDeletedEvent) {
  // Invalidate email cache
  await this.cache.del(`email:${event.emailId}`);

  // Invalidate folder email list cache
  await this.cache.delPattern(`emails:${event.userId}:${event.folderId}:*`);

  // Invalidate search cache
  await this.cache.delPattern(`search:${event.userId}:*`);
}
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /auth/login
     ▼
┌──────────────┐
│ API Gateway  │
└────┬─────────┘
     │ gRPC
     ▼
┌──────────────┐
│ Auth Service │
│              │
│ 1. Validate  │
│ 2. Generate  │
│    - Access Token (JWT, 1 day)
│    - Refresh Token (7 days)
│ 3. Store in Redis
│ 4. Return tokens
└──────────────┘
```

### Authorization (RBAC)

**Roles**:
- `USER`: Basic user
- `ADMIN`: Administrator
- `PREMIUM`: Premium user (higher quotas)

**Permissions** (example):
```typescript
enum Permission {
  EMAIL_READ = 'email:read',
  EMAIL_WRITE = 'email:write',
  EMAIL_DELETE = 'email:delete',
  FOLDER_CREATE = 'folder:create',
  CONTACT_EXPORT = 'contact:export',
  // ...
}

// Guard
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.EMAIL_WRITE)
@Post('emails/send')
async sendEmail() { }
```

### Service-to-Service Authentication

**mTLS (Mutual TLS)**:
```typescript
// Each service has its own certificate
const credentials = grpc.credentials.createSsl(
  rootCert,
  privateKey,
  certChain
);

// Service validates other services' certificates
```

**API Keys** (Alternative):
```typescript
// Each service has API key for internal calls
@UseGuards(ServiceApiKeyGuard)
@MessagePattern('get-user')
async getUser(data: GetUserDto) {
  // Only callable by other services with valid API key
}
```

---

## Monitoring & Observability

### Distributed Tracing (Jaeger / Zipkin)

```
Request ID: req-123

API Gateway [100ms]
  ├─ Auth Service [20ms]
  │   └─ Redis [5ms]
  ├─ Email Service [50ms]
  │   ├─ MongoDB [30ms]
  │   └─ Redis [5ms]
  └─ Folder Service [30ms]
      └─ PostgreSQL [20ms]

Total: 100ms
```

**Implementation**:
```typescript
import { Span, Tracer } from '@nestjs/microservices';

@Injectable()
export class EmailService {
  @Span('email-service.send')
  async sendEmail(data: SendEmailDto) {
    // Automatically traced
  }
}
```

### Health Checks

**Each service exposes**:
```typescript
@Get('health')
@HealthCheck()
async check() {
  return this.health.check([
    () => this.db.pingCheck('database'),
    () => this.redis.pingCheck('cache'),
    () => this.disk.checkStorage('storage', { threshold: 0.9 }),
  ]);
}
```

**API Gateway aggregates**:
```
GET /health
{
  "status": "ok",
  "services": {
    "auth-service": "ok",
    "email-service": "ok",
    "folder-service": "ok",
    ...
  }
}
```

### Metrics (Prometheus)

**Custom Metrics**:
```typescript
@Injectable()
export class EmailService {
  private readonly emailsSentCounter = new Counter({
    name: 'emails_sent_total',
    help: 'Total number of emails sent'
  });

  private readonly emailSendDuration = new Histogram({
    name: 'email_send_duration_seconds',
    help: 'Email send duration in seconds'
  });

  async sendEmail(data: SendEmailDto) {
    const timer = this.emailSendDuration.startTimer();

    await this.smtpService.send(data);

    this.emailsSentCounter.inc();
    timer();
  }
}
```

### Logging (Structured)

```typescript
this.logger.log({
  message: 'Email sent successfully',
  userId: userId,
  emailId: emailId,
  to: to,
  timestamp: new Date(),
  correlationId: request.correlationId
});
```

**Log Aggregation**: ELK Stack / CloudWatch / Datadog

---

## Deployment Architecture

### Containerization (Docker)

**Each microservice has its Dockerfile**:
```dockerfile
# email-service/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

CMD ["node", "dist/main.js"]
```

### Orchestration (Kubernetes)

```yaml
# email-service/k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: email-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: email-service
  template:
    metadata:
      labels:
        app: email-service
    spec:
      containers:
      - name: email-service
        image: cms-email/email-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: email-db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: email-service
spec:
  selector:
    app: email-service
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
  type: ClusterIP
```

### Service Mesh (Istio - Optional)

**Benefits**:
- Service discovery
- Load balancing
- Retry & circuit breaking
- mTLS between services
- Observability (automatic tracing)

---

## Scalability Considerations

### Horizontal Scaling

**Stateless Services** (can scale infinitely):
- API Gateway: 2-10 instances
- Auth Service: 2-5 instances
- Email Service: 5-20 instances
- All other services: 2-10 instances

**Stateful Services** (need coordination):
- Redis: Master-replica setup
- PostgreSQL: Read replicas
- MongoDB: Replica set / Sharded cluster

### Auto-Scaling (Kubernetes HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: email-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: email-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

**PostgreSQL**:
- Connection pooling (PgBouncer)
- Read replicas for queries
- Partitioning large tables (emails by date)

**MongoDB**:
- Sharding by userId (horizontal partitioning)
- Indexes on frequently queried fields

**Redis**:
- Redis Cluster (multiple master nodes)
- Redis Sentinel (automatic failover)

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| **Framework** | NestJS 11.x |
| **Language** | TypeScript 5.x |
| **API Gateway** | NestJS HTTP Server |
| **Microservices Transport** | gRPC, TCP, Redis Pub/Sub |
| **Message Queue** | Bull (Redis-backed) |
| **Databases** | PostgreSQL 15, MongoDB 7 |
| **Cache** | Redis 7 |
| **Search** | ElasticSearch 8 / PostgreSQL FTS |
| **Storage** | AWS S3 / MinIO |
| **Container** | Docker |
| **Orchestration** | Kubernetes |
| **Service Mesh** | Istio (optional) |
| **Monitoring** | Prometheus + Grafana |
| **Logging** | ELK Stack / Loki |
| **Tracing** | Jaeger / Zipkin |
| **Testing** | Jest, Supertest |

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- ✅ Setup monorepo structure
- ✅ Create API Gateway
- ✅ Implement Auth Service with DDD
- ✅ Setup Redis & PostgreSQL
- ✅ Implement event bus

### Phase 2: Core Services (Weeks 3-4)
- 🔄 Email Service (CRUD, send/receive)
- 🔄 Folder Service
- 🔄 Setup MongoDB for emails
- 🔄 Implement SMTP/IMAP

### Phase 3: Supporting Services (Weeks 5-6)
- ⏳ Contact Service
- ⏳ Label Service
- ⏳ Template Service

### Phase 4: Advanced Features (Weeks 7-8)
- ⏳ Calendar Service
- ⏳ Filter Service
- ⏳ Attachment Service
- ⏳ Search Service

### Phase 5: Optimization & Production (Weeks 9-10)
- ⏳ Performance optimization
- ⏳ Caching implementation
- ⏳ Monitoring & alerting
- ⏳ Load testing
- ⏳ Production deployment

---

## Benefits of This Architecture

### ✅ Scalability
- Each service scales independently
- Horizontal scaling without limits
- Database per service (no bottleneck)

### ✅ Maintainability
- Clear bounded contexts (DDD)
- Single responsibility per service
- Easy to understand and modify

### ✅ Resilience
- Service isolation (failure doesn't cascade)
- Circuit breakers & retries
- Eventual consistency (tolerates temporary failures)

### ✅ Technology Flexibility
- Choose best database per service
- Update/replace services independently
- Experiment with new technologies safely

### ✅ Team Scalability
- Teams can work on different services independently
- Clear ownership boundaries
- Parallel development

---

## Trade-offs & Challenges

### ⚠️ Complexity
- More moving parts than monolith
- Distributed system debugging is harder
- Requires DevOps expertise

### ⚠️ Data Consistency
- Eventual consistency (not immediate)
- Need to handle distributed transactions (Sagas)
- Duplicate data across services

### ⚠️ Network Latency
- Inter-service calls add overhead
- Need to optimize communication patterns
- Caching becomes critical

### ⚠️ Testing
- Integration testing is complex
- Need to mock multiple services
- End-to-end testing requires all services running

### ⚠️ Operational Overhead
- More services to deploy & monitor
- More databases to manage
- More infrastructure costs

---

**Document version**: 2.0 (Microservices + DDD)
**Last updated**: 2025-01-21
**Architecture**: NestJS Microservices with Domain-Driven Design
