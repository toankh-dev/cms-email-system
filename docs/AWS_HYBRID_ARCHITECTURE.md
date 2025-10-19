# AWS Hybrid Architecture - CMS Email System

## Tổng quan

CMS Email System sử dụng **Hybrid Architecture** kết hợp giữa **AWS Lambda** (serverless functions) và **ECS Fargate** (container orchestration) để tận dụng ưu điểm của cả hai:

- **Lambda**: Xử lý API requests (stateless, bursty traffic, auto-scaling)
- **Fargate**: Xử lý long-running processes (IMAP polling, SMTP sending)

Architecture này tối ưu về **cost**, **performance**, và **scalability** cho email system.

---

## Kiến trúc tổng thể (High-Level)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USERS / CLIENTS                              │
│              (Web App, Mobile App, Desktop App)                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                      AWS CloudFront (CDN)                            │
│  • Global edge locations (400+)                                      │
│  • Cache static assets & API responses                               │
│  • DDoS protection (AWS Shield)                                      │
│  • SSL/TLS termination                                               │
│  • Custom domain (mail.yourdomain.com)                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    AWS API Gateway (REST API)                        │
│  • Authentication (Custom Lambda authorizer)                         │
│  • Rate limiting (10,000 req/sec per account)                       │
│  • Request/Response transformation                                   │
│  • CORS configuration                                                │
│  • Request validation                                                │
│  • Usage plans & API keys                                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
┌───────────▼──────────┐          ┌──────────▼──────────┐
│   AWS Lambda         │          │   ECS Fargate       │
│   (API Handlers)     │          │   (Background Jobs) │
│                      │          │                     │
│ • Auth APIs          │          │ • IMAP Poller       │
│ • Email CRUD         │          │ • SMTP Sender       │
│ • User Management    │          │ • WebSocket Server  │
│ • Folder/Label       │          │   (future)          │
│ • Contact/Calendar   │          │                     │
│ • Search             │          │ Always-on services  │
│ • Template/Filter    │          │ Auto-scaling        │
│                      │          │                     │
│ On-demand execution  │          │                     │
│ Auto-scaling 0-1000+ │          │                     │
└───────────┬──────────┘          └──────────┬──────────┘
            │                                 │
            └────────────┬────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐  ┌───▼────────┐  ┌───▼────────────┐
│  RDS Proxy     │  │ElastiCache │  │  Amazon SQS    │
│(Conn Pooling)  │  │Redis       │  │  (Queues)      │
│                │  │            │  │                │
│Max 1000 conn   │  │Session     │  │• Email send    │
│Auto-scaling    │  │Cache       │  │• Email process │
│$22/month       │  │Hot data    │  │• Attachments   │
└───────┬────────┘  └────────────┘  └────────────────┘
        │
┌───────▼──────────────────────────────────────────────┐
│         Aurora Serverless v2 (PostgreSQL)            │
│  • Auto-scaling: 0.5 - 16 ACU                        │
│  • Multi-AZ deployment                               │
│  • Automated backups (point-in-time recovery)        │
│  • Read replicas (optional)                          │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│            EXTERNAL SERVICES & STORAGE               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Amazon S3 (Object Storage)                         │
│  • Email attachments                                │
│  • User avatars                                     │
│  • Email backups                                    │
│  • Static assets                                    │
│  Lifecycle rules: Archive after 90 days             │
│                                                      │
│  Amazon SES (Simple Email Service)                  │
│  • Send emails (SMTP alternative)                   │
│  • Bounce/complaint handling                        │
│  • Email analytics                                  │
│                                                      │
│  Amazon EventBridge                                 │
│  • Scheduled tasks (cron jobs)                      │
│  • Event routing                                    │
│  • Calendar reminders                               │
│                                                      │
│  Amazon SNS (Notifications)                         │
│  • Email notifications                              │
│  • Push notifications                               │
│  • SMS (future)                                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## AWS Services Mapping

### Traditional Architecture → AWS Services

| Traditional Component | AWS Service | Purpose |
|----------------------|-------------|---------|
| NestJS API Server (EC2) | **Lambda Functions** | Handle API requests |
| Background Workers | **ECS Fargate** | IMAP polling, SMTP sending |
| PostgreSQL (RDS) | **Aurora Serverless v2** | Primary database |
| Redis (ElastiCache) | **ElastiCache Redis** | Session & cache |
| Bull Queue | **SQS + Lambda** | Message queue |
| NGINX Load Balancer | **API Gateway + CloudFront** | Load balancing & CDN |
| File Storage | **S3** | Object storage |
| SMTP Server | **Amazon SES** | Email sending |
| Cron Jobs | **EventBridge** | Scheduled tasks |
| Monitoring | **CloudWatch + X-Ray** | Logs & tracing |

---

## Lambda Functions Breakdown

### 1. Auth Lambda (`auth-handler`)

**Purpose:** Authentication & authorization

**Runtime:** Node.js 20.x
**Memory:** 512 MB
**Timeout:** 30 seconds
**Concurrency:** 100 (reserved)

**Endpoints:**
```typescript
POST /auth/register       // Register new user
POST /auth/login          // Login with email/password
POST /auth/refresh        // Refresh access token
POST /auth/logout         // Logout & revoke tokens
POST /auth/verify-email   // Verify email with token
POST /auth/forgot-password // Request password reset
POST /auth/reset-password  // Reset password with token
```

**Environment Variables:**
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL`
- `REDIS_URL`

**Cold Start:** ~500ms
**Warm Execution:** ~20ms

---

### 2. Email Lambda (`email-handler`)

**Purpose:** Email CRUD operations & sending

**Runtime:** Node.js 20.x
**Memory:** 1024 MB (cần nhiều cho email parsing)
**Timeout:** 60 seconds
**Concurrency:** 500

**Endpoints:**
```typescript
GET    /emails              // List emails (paginated)
GET    /emails/:id          // Get email detail
POST   /emails/send         // Send email
POST   /emails/:id/reply    // Reply to email
POST   /emails/:id/forward  // Forward email
POST   /emails/drafts       // Save draft
PUT    /emails/drafts/:id   // Update draft
DELETE /emails/:id          // Delete (move to trash)
PATCH  /emails/:id/read     // Mark as read
PATCH  /emails/:id/star     // Star email
PATCH  /emails/:id/move     // Move to folder
POST   /emails/bulk         // Bulk actions
GET    /emails/search       // Search emails
```

**Environment Variables:**
- `DATABASE_URL`
- `REDIS_URL`
- `S3_BUCKET_NAME`
- `SES_REGION`
- `SQS_SEND_QUEUE_URL`

**Cold Start:** ~600ms
**Warm Execution:** ~30ms

---

### 3. User Lambda (`user-handler`)

**Purpose:** User profile & settings management

**Runtime:** Node.js 20.x
**Memory:** 256 MB
**Timeout:** 30 seconds
**Concurrency:** 100

**Endpoints:**
```typescript
GET    /users/me           // Get current user
PATCH  /users/me           // Update profile
PUT    /users/me/signature // Update email signature
PUT    /users/me/settings  // Update settings
POST   /users/me/change-password // Change password
POST   /users/me/avatar    // Upload avatar
```

---

### 4. Folder Lambda (`folder-handler`)

**Purpose:** Folder management

**Runtime:** Node.js 20.x
**Memory:** 256 MB
**Timeout:** 30 seconds

**Endpoints:**
```typescript
GET    /folders           // List all folders
POST   /folders           // Create folder
PATCH  /folders/:id       // Update folder
DELETE /folders/:id       // Delete folder
```

---

### 5. Contact Lambda (`contact-handler`)

**Purpose:** Contact management

**Runtime:** Node.js 20.x
**Memory:** 512 MB
**Timeout:** 30 seconds

**Endpoints:**
```typescript
GET    /contacts          // List contacts
GET    /contacts/:id      // Get contact detail
POST   /contacts          // Create contact
PATCH  /contacts/:id      // Update contact
DELETE /contacts/:id      // Delete contact
POST   /contacts/import   // Import from CSV/vCard
GET    /contacts/export   // Export to CSV/vCard
```

---

### 6. Calendar Lambda (`calendar-handler`)

**Purpose:** Calendar & events management

**Runtime:** Node.js 20.x
**Memory:** 512 MB
**Timeout:** 30 seconds

**Endpoints:**
```typescript
GET    /calendar/events              // List events
POST   /calendar/events              // Create event
PATCH  /calendar/events/:id          // Update event
DELETE /calendar/events/:id          // Delete event
POST   /calendar/events/:id/respond  // Accept/Decline invitation
```

---

### 7. Label Lambda (`label-handler`)

**Purpose:** Labels & tags management

**Runtime:** Node.js 20.x
**Memory:** 256 MB
**Timeout:** 30 seconds

**Endpoints:**
```typescript
GET    /labels                    // List labels
POST   /labels                    // Create label
PATCH  /labels/:id                // Update label
DELETE /labels/:id                // Delete label
POST   /emails/:id/labels         // Assign labels to email
DELETE /emails/:id/labels/:labelId // Remove label from email
```

---

### 8. Template Lambda (`template-handler`)

**Purpose:** Email templates management

**Runtime:** Node.js 20.x
**Memory:** 256 MB
**Timeout:** 30 seconds

**Endpoints:**
```typescript
GET    /templates           // List templates
POST   /templates           // Create template
PATCH  /templates/:id       // Update template
DELETE /templates/:id       // Delete template
POST   /templates/:id/use   // Use template (render with variables)
```

---

### 9. Filter Lambda (`filter-handler`)

**Purpose:** Email filters & rules management

**Runtime:** Node.js 20.x
**Memory:** 256 MB
**Timeout:** 30 seconds

**Endpoints:**
```typescript
GET    /filters        // List filters
POST   /filters        // Create filter
PATCH  /filters/:id    // Update filter
DELETE /filters/:id    // Delete filter
```

---

### 10. Attachment Lambda (`attachment-handler`)

**Purpose:** File upload & download

**Runtime:** Node.js 20.x
**Memory:** 1024 MB (cần nhiều cho file processing)
**Timeout:** 60 seconds

**Endpoints:**
```typescript
POST   /attachments/upload        // Upload file to S3
GET    /attachments/:id/download  // Download file from S3
DELETE /attachments/:id            // Delete file
```

---

### 11. Search Lambda (`search-handler`)

**Purpose:** Advanced email search

**Runtime:** Node.js 20.x
**Memory:** 512 MB
**Timeout:** 30 seconds

**Endpoints:**
```typescript
GET /search?q=...&filters=... // Advanced search with filters
```

---

## ECS Fargate Services

### 1. IMAP Poller Service

**Purpose:** Fetch emails từ IMAP server (Gmail, Outlook, v.v.)

**Configuration:**
```yaml
Task Definition:
  CPU: 0.25 vCPU (256)
  Memory: 512 MB
  Container Image: cms-email-imap-poller:latest

Service:
  Desired Count: 2 (high availability)
  Min Healthy Percent: 50
  Max Percent: 200

Auto Scaling:
  Target: CPU 70%
  Min: 2 tasks
  Max: 10 tasks

Networking:
  VPC: Private subnet
  Security Group: Outbound IMAP (993), SMTP (587)
```

**Environment Variables:**
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SQS_PROCESS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
IMAP_POLL_INTERVAL=30000  # 30 seconds
AWS_REGION=us-east-1
```

**Implementation Logic:**
```typescript
// imap-poller.service.ts
export class ImapPollerService {
  async start() {
    // Lấy tất cả email accounts từ database
    const accounts = await this.getActiveEmailAccounts();

    for (const account of accounts) {
      // Tạo IMAP connection cho mỗi account
      const imap = await this.connectIMAP(account);

      // Sử dụng IDLE command để real-time updates
      imap.on('mail', async (numNewMsgs) => {
        console.log(`New emails: ${numNewMsgs}`);

        // Fetch new emails (UNSEEN)
        const emails = await imap.fetch('1:*', {
          bodies: '',
          struct: true
        });

        // Send to SQS for processing
        for (const email of emails) {
          await this.sqs.sendMessage({
            QueueUrl: process.env.SQS_PROCESS_QUEUE_URL,
            MessageBody: JSON.stringify({
              accountId: account.id,
              email: email
            })
          });
        }
      });

      // Keep connection alive
      setInterval(() => {
        imap.noop(); // NOOP command
      }, 60000); // Every 60 seconds
    }
  }
}
```

**Why Fargate, not Lambda?**
- IMAP cần persistent connection (24/7)
- Lambda max timeout: 15 minutes
- Lambda inefficient cho long-running tasks
- Fargate cost: ~$7/month per task (0.25 vCPU)
- Lambda cost: ~$20/month (polling every 5 min)

**Cost:** $14/month (2 tasks * $7)

---

### 2. SMTP Sender Service

**Purpose:** Send emails via SMTP with connection pooling

**Configuration:**
```yaml
Task Definition:
  CPU: 0.25 vCPU (256)
  Memory: 512 MB
  Container Image: cms-email-smtp-sender:latest

Service:
  Desired Count: 2

Auto Scaling:
  Target: SQS Queue Length > 100
  Min: 2 tasks
  Max: 20 tasks
  Scale-out: Add 2 tasks when queue > 100
  Scale-in: Remove 1 task when queue < 50

Networking:
  VPC: Private subnet
  Security Group: Outbound SMTP (587)
```

**Environment Variables:**
```
DATABASE_URL=postgresql://...
SQS_SEND_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_POOL_SIZE=10
AWS_REGION=us-east-1
```

**Implementation Logic:**
```typescript
// smtp-sender.service.ts
export class SmtpSenderService {
  private transporterPool: nodemailer.Transporter[] = [];

  async initialize() {
    // Create SMTP connection pool
    for (let i = 0; i < 10; i++) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        pool: true, // Use pooled connections
        maxConnections: 5,
        maxMessages: 100
      });

      this.transporterPool.push(transporter);
    }

    // Start consuming from SQS
    this.consumeQueue();
  }

  async consumeQueue() {
    while (true) {
      // Receive messages from SQS (batch of 10)
      const messages = await this.sqs.receiveMessage({
        QueueUrl: process.env.SQS_SEND_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20 // Long polling
      });

      if (!messages.Messages) {
        continue;
      }

      // Process messages in parallel
      await Promise.all(
        messages.Messages.map(msg => this.sendEmail(msg))
      );
    }
  }

  async sendEmail(message: any) {
    const emailData = JSON.parse(message.Body);

    try {
      // Get transporter from pool (round-robin)
      const transporter = this.getTransporter();

      // Send email
      await transporter.sendMail({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.bodyHtml,
        text: emailData.bodyText,
        attachments: emailData.attachments
      });

      // Update database (status = sent)
      await this.updateEmailStatus(emailData.id, 'sent');

      // Delete message from queue
      await this.sqs.deleteMessage({
        QueueUrl: process.env.SQS_SEND_QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle
      });

      console.log(`Email sent: ${emailData.id}`);

    } catch (error) {
      console.error(`Failed to send email: ${error.message}`);

      // If retry count > 3, move to DLQ
      // Otherwise, message will return to queue after visibility timeout
    }
  }

  getTransporter(): nodemailer.Transporter {
    // Round-robin load balancing
    return this.transporterPool[
      Math.floor(Math.random() * this.transporterPool.length)
    ];
  }
}
```

**Why Fargate, not Lambda?**
- Connection pooling: Tạo 10 SMTP connections, reuse cho nhiều emails
- Batch processing: Xử lý 10 emails cùng lúc
- Lambda: Mỗi invocation phải tạo mới connection = overhead
- Cost-effective cho high-volume sending

**Cost:** $14/month (2 tasks * $7)

---

## Database Architecture

### Aurora Serverless v2 Configuration

```yaml
Engine: PostgreSQL 15
Capacity:
  Min: 0.5 ACU
  Max: 16 ACU
  Auto-pause: Enabled (after 5 minutes idle)

Multi-AZ: Enabled
Backup:
  Retention: 7 days
  Point-in-time recovery: Enabled

Performance Insights: Enabled
Enhanced Monitoring: Enabled

Instance Class: Serverless (no instance, just ACU)
Storage: Auto-scaling (10GB - 128TB)
```

**Cost Estimation:**
- Low traffic (avg 1 ACU): ~$50/month
- Medium traffic (avg 2 ACU): ~$100/month
- High traffic (avg 4 ACU): ~$200/month

**ACU (Aurora Capacity Unit):**
- 1 ACU = 2 GB RAM + equivalent CPU
- Scales in increments of 0.5 ACU
- Pricing: ~$0.12/ACU-hour

---

### RDS Proxy Configuration

**Purpose:** Connection pooling cho Lambda và Fargate

```yaml
Target: Aurora Serverless cluster
Max Connections: 1000
Idle Client Timeout: 1800 seconds (30 minutes)
Connection Borrow Timeout: 120 seconds

IAM Authentication: Enabled
TLS: Required

Connection Pooling:
  Max Idle Connections: 50% of max
  Connection Timeout: 30 seconds
```

**Why RDS Proxy?**

**Problem without RDS Proxy:**
```
Lambda có 1000 concurrent executions
Mỗi Lambda tạo 1 database connection
Total: 1000 connections

Aurora Serverless max connections:
- 0.5 ACU: ~90 connections
- 1 ACU: ~180 connections
- 2 ACU: ~360 connections

❌ Connections exceeded! Lambda invocations fail!
```

**Solution with RDS Proxy:**
```
Lambda → RDS Proxy (connection pool) → Aurora
1000 Lambda executions → 100 pooled connections → Aurora

✅ No connection exhaustion
✅ Connection reuse
✅ Better performance (no connection overhead)
```

**Cost:** $0.015/vCPU-hour * 2 vCPU * 730 hours = ~$22/month

---

## Caching Strategy

### ElastiCache Redis

**Configuration:**
```yaml
Node Type: cache.t3.micro
Number of Nodes: 2 (primary + replica)
Multi-AZ: Enabled
Automatic Failover: Enabled

Memory: 0.5 GB per node
Network: VPC, private subnet
```

**Use Cases:**

**1. Session Storage**
```typescript
// Store JWT refresh tokens
Key: session:{userId}:{tokenId}
Value: {refreshToken, expiresAt}
TTL: 7 days
```

**2. User Cache**
```typescript
// Cache user info
Key: user:{userId}
Value: {email, firstName, lastName, avatar, settings}
TTL: 1 hour
```

**3. Folder List Cache**
```typescript
// Cache user folders
Key: folders:{userId}
Value: [{id, name, unreadCount, totalCount}]
TTL: 30 minutes
```

**4. Email List Cache**
```typescript
// Cache email list per folder
Key: emails:{userId}:{folderId}:page:{page}
Value: [{id, subject, from, snippet, ...}]
TTL: 5 minutes
```

**5. Search Results Cache**
```typescript
// Cache search results
Key: search:{userId}:{queryHash}
Value: [email results]
TTL: 5 minutes
```

**Cost:** ~$15/month (cache.t3.micro * 2)

---

### CloudFront Caching

**Use Cases:**
- Static assets (JS, CSS, images, fonts)
- User avatars
- Email attachments (với signed URLs)
- API responses (cache-control headers)

**Configuration:**
```yaml
Origins:
  - S3 bucket (static assets)
  - API Gateway (API endpoints)

Cache Behaviors:
  - /static/*: Cache 1 year
  - /avatars/*: Cache 1 day
  - /api/*: Cache 5 minutes (with cache-control)

Geo Restriction: None (global)
SSL Certificate: ACM (free)
HTTP/2: Enabled
```

**Cost:** ~$20/month (50 GB data transfer + 10M requests)

---

## Message Queue Architecture

### SQS Queues

#### 1. Email Send Queue

**Purpose:** Queue emails to be sent

```yaml
Queue Name: email-send-queue
Type: Standard (high throughput)
Visibility Timeout: 300 seconds (5 minutes)
Message Retention: 4 days
Max Message Size: 256 KB

Dead Letter Queue: email-send-dlq
Max Receive Count: 3 (after 3 fails → DLQ)
```

**Flow:**
```
Lambda (Email Handler)
  → Send email request
  → Put message to SQS
  → Return success immediately

Fargate (SMTP Sender)
  → Poll SQS (long polling, 20s)
  → Receive 10 messages (batch)
  → Send emails via SMTP
  → Delete messages from queue
```

**Cost:** $0.40/million requests (after first 1M free)

---

#### 2. Email Process Queue

**Purpose:** Process incoming emails from IMAP

```yaml
Queue Name: email-process-queue
Type: Standard
Visibility Timeout: 60 seconds
Message Retention: 4 days

Dead Letter Queue: email-process-dlq
Max Receive Count: 3
```

**Flow:**
```
Fargate (IMAP Poller)
  → Fetch new email from IMAP
  → Put message to SQS

Lambda (Email Processor)
  → Triggered by SQS (event source)
  → Parse MIME content
  → Extract attachments → Upload to S3
  → Apply filters/rules
  → Save to database
  → Delete message from queue
```

**Lambda SQS Event Source:**
```typescript
// Lambda is triggered automatically by SQS
export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const emailData = JSON.parse(record.body);

    // Process email
    await processEmail(emailData);
  }
}
```

---

#### 3. Attachment Scan Queue

**Purpose:** Scan attachments for viruses

```yaml
Queue Name: attachment-scan-queue
Type: Standard
Visibility Timeout: 300 seconds
```

**Flow:**
```
Lambda (Attachment Upload)
  → Upload file to S3
  → Put message to SQS

Lambda (Virus Scanner)
  → Triggered by SQS
  → Download file from S3
  → Scan with ClamAV
  → Update database (is_safe flag)
  → Delete message
```

---

### SNS Topics

#### 1. Email Notifications Topic

**Purpose:** Fan-out notifications

```yaml
Topic Name: email-notifications
Subscriptions:
  - Lambda (push notification handler)
  - Lambda (email notification sender)
  - SQS (notification queue for mobile)
```

**Flow:**
```
Event occurs (new email received)
  → Publish to SNS
  → SNS fans out to:
    - Lambda (send push notification)
    - Lambda (send email notification)
    - SQS (for mobile app polling)
```

---

### EventBridge Rules

#### 1. Calendar Reminders

```yaml
Rule Name: calendar-reminders
Schedule: rate(1 minute)
Target: Lambda (reminder-processor)
```

```typescript
// Lambda triggered every minute
export async function handler() {
  const now = new Date();
  const upcoming = addMinutes(now, 15); // 15 minutes from now

  // Find events starting in 15 minutes
  const events = await db.query(`
    SELECT * FROM calendar_events
    WHERE start_time BETWEEN $1 AND $2
    AND reminder_sent = false
  `, [now, upcoming]);

  // Send reminders
  for (const event of events) {
    await sendReminder(event);
    event.reminder_sent = true;
  }
}
```

---

#### 2. Email Cleanup

```yaml
Rule Name: email-cleanup
Schedule: cron(0 2 * * ? *)  # Daily at 2 AM UTC
Target: Lambda (cleanup-processor)
```

```typescript
export async function handler() {
  // Delete emails in Trash older than 30 days
  await db.query(`
    DELETE FROM emails
    WHERE folder_id = (SELECT id FROM folders WHERE name = 'Trash')
    AND deleted_at < NOW() - INTERVAL '30 days'
  `);

  // Delete spam emails older than 7 days
  await db.query(`
    DELETE FROM emails
    WHERE folder_id = (SELECT id FROM folders WHERE name = 'Spam')
    AND created_at < NOW() - INTERVAL '7 days'
  `);
}
```

---

## Request/Response Flow

### 1. Send Email Flow (API → Lambda → SQS → Fargate → SMTP)

```
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /emails/send
     │ {to, subject, body, attachments}
     ▼
┌────────────────┐
│  API Gateway   │
│  - Validate    │
│  - Authorize   │
└────┬───────────┘
     │
     ▼
┌─────────────────────┐
│ Lambda (Email)      │
│                     │
│ 1. Validate input   │
│ 2. Check quota      │
│ 3. Save to DB       │
│    (status=queued)  │
│ 4. Send to SQS      │
│ 5. Return 202       │
└────┬────────────────┘
     │ SQS Message
     ▼
┌──────────────────┐
│ SQS Send Queue   │
│ (decoupled)      │
└────┬─────────────┘
     │ Long polling (20s)
     ▼
┌─────────────────────┐
│ Fargate (SMTP)      │
│                     │
│ 1. Receive message  │
│ 2. Get from pool    │
│ 3. Send via SMTP    │
│ 4. Update DB        │
│    (status=sent)    │
│ 5. Delete from SQS  │
└────┬────────────────┘
     │ SMTP
     ▼
┌──────────────┐
│ SMTP Server  │
│ (Gmail, etc) │
└──────────────┘
```

**Timeline:**
- Client → API Gateway: ~50ms
- API Gateway → Lambda: ~20ms (warm)
- Lambda processing: ~100ms
- Lambda → SQS: ~10ms
- **Total API response: ~180ms** (client gets 202 Accepted)
- SQS → Fargate: ~5-30s (depends on queue)
- Fargate → SMTP: ~1-5s
- **Total send time: ~6-35s**

**Benefits:**
- Fast API response (async processing)
- Reliable (SQS guarantees delivery)
- Scalable (Fargate auto-scales based on queue)
- Error handling (DLQ for failures)

---

### 2. Receive Email Flow (IMAP → Fargate → SQS → Lambda → Database)

```
┌──────────────┐
│ IMAP Server  │
│ (Gmail, etc) │
└────┬─────────┘
     │ IDLE connection
     ▼
┌─────────────────────┐
│ Fargate (IMAP)      │
│                     │
│ 1. Maintain IDLE    │
│ 2. On 'mail' event  │
│ 3. Fetch new emails │
│ 4. Send to SQS      │
└────┬────────────────┘
     │ SQS Message
     ▼
┌────────────────────┐
│ SQS Process Queue  │
└────┬───────────────┘
     │ Event source (triggers Lambda)
     ▼
┌─────────────────────┐
│ Lambda (Processor)  │
│                     │
│ 1. Parse MIME       │
│ 2. Extract headers  │
│ 3. Extract body     │
│ 4. Extract attachm. │
│    → Upload to S3   │
│ 5. Apply filters    │
│ 6. Detect spam      │
│ 7. Save to DB       │
│ 8. Notify user (SNS)│
└────┬────────────────┘
     │
     ▼
┌──────────────┐     ┌─────────┐
│   Database   │     │   S3    │
│ (Aurora)     │     │ (Files) │
└──────────────┘     └─────────┘
```

**Timeline:**
- IMAP new mail event: ~instant (IDLE)
- Fargate → SQS: ~10ms
- SQS → Lambda trigger: ~1-5s
- Lambda processing: ~500ms-2s (depends on email size)
- **Total receive time: ~1-7s**

**Benefits:**
- Real-time (IMAP IDLE)
- Persistent connection (no reconnection overhead)
- Scalable (Lambda auto-scales for processing)
- Reliable (SQS guarantees processing)

---

### 3. Get Emails Flow (API → Lambda → Cache → Database)

```
┌─────────┐
│ Client  │
└────┬────┘
     │ GET /emails?folderId=inbox&page=1
     ▼
┌────────────────┐
│  API Gateway   │
└────┬───────────┘
     │
     ▼
┌─────────────────────┐
│ Lambda (Email)      │
│                     │
│ 1. Check Redis cache│
│    Key: emails:     │
│         {userId}:   │
│         {folderId}: │
│         page:{page} │
│                     │
│ Cache HIT? (80%)    │
│   → Return cached   │
│                     │
│ Cache MISS? (20%)   │
│   → Query database  │
│   → Store in cache  │
│   → Return data     │
└────┬────────────────┘
     │
     ▼
┌─────────┐      ┌──────────┐
│  Redis  │      │ Database │
│ (Cache) │      │ (Aurora) │
└─────────┘      └──────────┘
```

**Timeline (Cache HIT):**
- Client → API Gateway: ~50ms
- API Gateway → Lambda: ~20ms (warm)
- Lambda → Redis: ~5ms
- Redis query: ~2ms
- Lambda → Client: ~20ms
- **Total: ~100ms**

**Timeline (Cache MISS):**
- Same as above until Lambda
- Lambda → RDS Proxy: ~10ms
- Database query: ~50-200ms (depends on complexity)
- Update cache: ~5ms
- **Total: ~150-350ms**

**Cache Hit Rate:**
- Target: 80%+ for frequently accessed data
- Reduces database load by 5x
- Reduces API latency by 3x

---

## Networking Architecture

### VPC Configuration

```
VPC: 10.0.0.0/16

Availability Zones: us-east-1a, us-east-1b, us-east-1c

Public Subnets (for NAT Gateway, ALB):
  - 10.0.1.0/24 (us-east-1a)
  - 10.0.2.0/24 (us-east-1b)
  - 10.0.3.0/24 (us-east-1c)

Private Subnets (for Lambda, Fargate, RDS, Redis):
  - 10.0.11.0/24 (us-east-1a)
  - 10.0.12.0/24 (us-east-1b)
  - 10.0.13.0/24 (us-east-1c)

Database Subnets:
  - 10.0.21.0/24 (us-east-1a)
  - 10.0.22.0/24 (us-east-1b)
  - 10.0.23.0/24 (us-east-1c)

NAT Gateways: 1 per AZ (for high availability)
Internet Gateway: 1
```

### Security Groups

#### 1. Lambda Security Group

```yaml
Name: lambda-sg
Inbound: None (Lambda initiates outbound only)
Outbound:
  - PostgreSQL (5432) → RDS Proxy SG
  - Redis (6379) → ElastiCache SG
  - HTTPS (443) → 0.0.0.0/0 (for AWS services)
```

#### 2. Fargate Security Group

```yaml
Name: fargate-sg
Inbound:
  - ALB (8080) → ALB SG (for health checks)
Outbound:
  - PostgreSQL (5432) → RDS Proxy SG
  - Redis (6379) → ElastiCache SG
  - SMTP (587) → 0.0.0.0/0
  - IMAPS (993) → 0.0.0.0/0
  - HTTPS (443) → 0.0.0.0/0
```

#### 3. RDS Proxy Security Group

```yaml
Name: rds-proxy-sg
Inbound:
  - PostgreSQL (5432) → Lambda SG
  - PostgreSQL (5432) → Fargate SG
Outbound:
  - PostgreSQL (5432) → Aurora SG
```

#### 4. Aurora Security Group

```yaml
Name: aurora-sg
Inbound:
  - PostgreSQL (5432) → RDS Proxy SG
Outbound: None
```

#### 5. ElastiCache Security Group

```yaml
Name: redis-sg
Inbound:
  - Redis (6379) → Lambda SG
  - Redis (6379) → Fargate SG
Outbound: None
```

---

## Monitoring & Observability

### CloudWatch Metrics

**Lambda Metrics:**
- Invocations (count)
- Duration (ms)
- Errors (count)
- Throttles (count)
- Concurrent Executions (count)
- Memory Usage (MB)

**Fargate Metrics:**
- CPUUtilization (%)
- MemoryUtilization (%)
- Running Tasks (count)

**Aurora Metrics:**
- DatabaseConnections (count)
- CPUUtilization (%)
- FreeableMemory (MB)
- ReadLatency (ms)
- WriteLatency (ms)

**ElastiCache Metrics:**
- CPUUtilization (%)
- EngineCPUUtilization (%)
- CacheHits (count)
- CacheMisses (count)
- Evictions (count)

**SQS Metrics:**
- ApproximateNumberOfMessagesVisible
- ApproximateAgeOfOldestMessage
- NumberOfMessagesSent
- NumberOfMessagesDeleted

### CloudWatch Alarms

```yaml
High Error Rate:
  Metric: Lambda Errors
  Threshold: > 5% of invocations
  Period: 5 minutes
  Action: SNS notification

High API Latency:
  Metric: API Gateway Latency (p99)
  Threshold: > 2000ms
  Period: 5 minutes
  Action: SNS notification

Database Connections High:
  Metric: Aurora DatabaseConnections
  Threshold: > 80% of max
  Period: 5 minutes
  Action: SNS notification

Queue Backlog:
  Metric: SQS ApproximateNumberOfMessagesVisible
  Threshold: > 1000
  Period: 10 minutes
  Action: Scale Fargate tasks

Low Cache Hit Rate:
  Metric: ElastiCache CacheHitRate
  Threshold: < 70%
  Period: 15 minutes
  Action: SNS notification
```

### X-Ray Distributed Tracing

**Enable X-Ray for:**
- Lambda functions (active tracing)
- API Gateway
- Fargate containers (X-Ray daemon sidecar)

**Benefits:**
- Visualize request flow across services
- Identify bottlenecks
- Debug errors in distributed system
- Analyze latency breakdown

---

## Cost Estimation (Monthly)

### Scenario: 10,000 users, 1M emails/month

```
Lambda:
  - 10M API requests
  - Avg duration: 200ms
  - Avg memory: 512MB
  Cost: $0.20 * 10 + $0.0000166667 * 512 * 0.2 * 10M
      = $2 + $17 = $19

Fargate:
  - IMAP Poller: 2 tasks * 0.25 vCPU * $0.04/hour * 730 hours = $14.6
  - SMTP Sender: 2 tasks * 0.25 vCPU * $0.04/hour * 730 hours = $14.6
  Total: $29.2

Aurora Serverless v2:
  - Avg 2 ACU * 730 hours * $0.12/ACU-hour = $175

RDS Proxy:
  - 2 vCPU * 730 hours * $0.015/hour = $21.9

ElastiCache Redis:
  - cache.t3.micro * 2 nodes * $0.017/hour * 730 hours = $24.8

S3:
  - 100 GB storage * $0.023/GB = $2.3
  - 1M PUT requests * $0.005/1000 = $5
  - 5M GET requests * $0.0004/1000 = $2
  Total: $9.3

CloudFront:
  - 50 GB data transfer * $0.085/GB = $4.25
  - 10M requests * $0.0075/10000 = $7.5
  Total: $11.75

API Gateway:
  - 10M requests * $3.50/M = $35

SQS:
  - 5M requests (after 1M free) * $0.40/M = $2

EventBridge:
  - 100K events * $1/M = $0.1

SNS:
  - 100K notifications * $0.50/M = $0.05

Data Transfer:
  - Outbound: 20 GB * $0.09/GB = $1.8

---

Total Monthly Cost: ~$330
```

### Cost Breakdown by Component:

| Service | Cost/Month | % of Total |
|---------|-----------|------------|
| Aurora Serverless | $175 | 53% |
| API Gateway | $35 | 11% |
| Fargate | $29 | 9% |
| ElastiCache | $25 | 8% |
| RDS Proxy | $22 | 7% |
| Lambda | $19 | 6% |
| CloudFront | $12 | 4% |
| S3 | $9 | 3% |
| Others | $4 | 1% |

**Cost Optimization Tips:**
1. Use Aurora auto-pause (saves ~30% for dev/staging)
2. Use Fargate Spot for non-critical tasks (saves ~70%)
3. Implement aggressive caching (reduces Aurora ACU)
4. Use S3 Intelligent Tiering (saves ~40% on storage)
5. Reserved Capacity for ElastiCache (saves ~30%)

---

## Scalability

### Auto-Scaling Configuration

**Lambda:**
- Reserved Concurrency: 100 per function (predictable functions)
- Provisioned Concurrency: 5 (for auth-handler, eliminate cold start)
- Max Concurrency: 1000 (account limit, can request increase)
- Burst: 500-3000 per minute (region-dependent)

**Fargate:**
```yaml
IMAP Poller:
  Target Tracking:
    Metric: CPUUtilization
    Target: 70%
  Min Tasks: 2
  Max Tasks: 10
  Scale-out Cooldown: 60s
  Scale-in Cooldown: 300s

SMTP Sender:
  Target Tracking:
    Metric: SQS ApproximateNumberOfMessagesVisible
    Target: 100 messages per task
  Min Tasks: 2
  Max Tasks: 20
  Scale-out Cooldown: 60s
  Scale-in Cooldown: 300s
```

**Aurora Serverless v2:**
```yaml
Min Capacity: 0.5 ACU
Max Capacity: 16 ACU
Auto-pause: After 5 minutes of inactivity
Scale-up: Within seconds (based on CPU/connections)
Scale-down: Gradual (to avoid thrashing)
```

### Performance Under Load

| Metric | 1K users | 10K users | 50K users | 100K users |
|--------|----------|-----------|-----------|------------|
| API Latency (p50) | 100ms | 120ms | 150ms | 180ms |
| API Latency (p99) | 500ms | 800ms | 1200ms | 1500ms |
| Throughput | 100 req/s | 1000 req/s | 5000 req/s | 10000 req/s |
| Lambda Concurrency | 10 | 100 | 500 | 1000 |
| Fargate Tasks | 2 | 4 | 10 | 20 |
| Aurora ACU | 1 | 2 | 6 | 12 |
| Cost/Month | $100 | $330 | $800 | $1500 |

---

## Security

### IAM Roles & Policies

**Lambda Execution Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": "arn:aws:rds-db:us-east-1:*:dbuser:prx-*/app_user"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:us-east-1:*:email-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::email-attachments/*"
    }
  ]
}
```

**Fargate Task Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": "arn:aws:rds-db:us-east-1:*:dbuser:prx-*/app_user"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:*"
      ],
      "Resource": "arn:aws:sqs:us-east-1:*:email-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:email/*"
    }
  ]
}
```

### Encryption

**At Rest:**
- Aurora: Encrypted with KMS
- S3: Server-side encryption (SSE-S3 or SSE-KMS)
- ElastiCache: Encryption at rest enabled
- EBS volumes (Fargate): Encrypted

**In Transit:**
- API Gateway: HTTPS only (TLS 1.2+)
- CloudFront: HTTPS only
- Database: TLS connections required
- Redis: TLS enabled
- SMTP/IMAP: TLS/SSL

### Secrets Management

```yaml
AWS Secrets Manager:
  - database/credentials
  - redis/credentials
  - smtp/credentials
  - imap/credentials
  - jwt/secrets

Rotation: Enabled (30 days)
Encryption: KMS
Access: IAM policies (least privilege)
```

---

## Disaster Recovery

### Backup Strategy

**Aurora:**
- Automated backups: 7 days retention
- Manual snapshots: Before major changes
- Point-in-time recovery: Up to 5 minutes

**S3:**
- Versioning: Enabled
- Cross-region replication: Enabled (to us-west-2)
- Lifecycle policy: Glacier after 90 days

**Configuration:**
- Infrastructure as Code (Terraform) in Git
- Environment variables in Secrets Manager
- Lambda code in S3 versioned buckets

### Multi-Region Failover (Optional)

```
Primary Region: us-east-1
DR Region: us-west-2

Aurora Global Database:
  - Primary: us-east-1
  - Read Replica: us-west-2
  - Failover time: < 1 minute

Route53 Health Checks:
  - Monitor API Gateway in us-east-1
  - If unhealthy: Route traffic to us-west-2
  - Automatic DNS failover

S3 Cross-Region Replication:
  - Attachments replicated to us-west-2
  - Automatic and near real-time
```

**RTO (Recovery Time Objective):** < 15 minutes
**RPO (Recovery Point Objective):** < 5 minutes

---

## Summary

Hybrid Architecture (Lambda + Fargate) là lựa chọn tối ưu cho CMS Email System vì:

### ✅ Advantages:

1. **Cost-Effective**
   - Low traffic: ~$100/month (Lambda scales to zero)
   - Medium traffic: ~$330/month (optimal balance)
   - High traffic: ~$800/month (still cheaper than EC2)

2. **Scalable**
   - Lambda: 0 → 1000+ concurrent executions
   - Fargate: 2 → 20+ tasks auto-scaling
   - Aurora: 0.5 → 16 ACU auto-scaling
   - Handle traffic spikes effortlessly

3. **Reliable**
   - Multi-AZ by default (99.99% uptime)
   - SQS guarantees message delivery
   - Auto-retry on failures
   - Dead letter queues for error handling

4. **Performant**
   - API latency: 100-200ms (p50)
   - Email send: < 35s
   - Email receive: Real-time (IMAP IDLE)
   - Caching reduces latency by 3x

5. **Maintainable**
   - No server management
   - Auto-patching & updates
   - Infrastructure as Code (Terraform)
   - CI/CD automation

### 🎯 Best For:

- ✅ Email systems (IMAP/SMTP long-running + API bursty)
- ✅ Unpredictable traffic patterns
- ✅ Cost-conscious startups
- ✅ Global user base (CloudFront)
- ✅ Teams familiar with AWS

### ⚠️ Trade-offs:

- Cold start: 500ms (mitigated with provisioned concurrency)
- Vendor lock-in: AWS-specific
- Complexity: More moving parts than monolithic
- Learning curve: Team needs AWS knowledge

---

**Document version**: 1.0
**Last updated**: 2025-01-13
**Next steps**: Read [COMPARISON.md](COMPARISON.md) for detailed architecture comparison
