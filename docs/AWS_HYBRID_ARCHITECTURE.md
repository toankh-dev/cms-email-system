# AWS Microservices Architecture - CMS Email System

## Overview

CMS Email System uses **AWS Cloud-Native Microservices Architecture** with **NestJS** and **Domain-Driven Design (DDD)** principles. The architecture leverages AWS managed services to build a highly scalable, resilient, and cost-effective email management system.

## Architecture Philosophy

- **Microservices**: Independent, loosely-coupled services
- **Domain-Driven Design**: Clear bounded contexts
- **Cloud-Native**: Leverage AWS managed services
- **Event-Driven**: Asynchronous communication via events
- **Serverless-First**: Use serverless where appropriate
- **Container-Based**: ECS Fargate for microservices

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USERS / CLIENTS                              │
│              (Web App, Mobile App, Desktop App)                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────────┐
│                      AWS CloudFront (CDN)                            │
│  • Global edge locations                                             │
│  • Static assets caching                                             │
│  • DDoS protection (AWS Shield)                                      │
│  • SSL/TLS termination                                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│            Application Load Balancer (ALB)                           │
│  • Path-based routing                                                │
│  • Health checks                                                     │
│  • SSL termination                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                     API Gateway Service                              │
│                  (ECS Fargate - 2-10 tasks)                          │
│  • Request routing to microservices                                  │
│  • Authentication & Authorization                                    │
│  • Rate limiting                                                     │
│  • Response aggregation                                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────────────┐
            │                │                        │
┌───────────▼─────┐  ┌───────▼────────┐  ┌──────────▼────────┐
│  Auth Service   │  │ Email Service  │  │ Contact Service   │
│  (ECS Fargate)  │  │ (ECS Fargate)  │  │  (ECS Fargate)    │
│  2-5 tasks      │  │ 5-20 tasks     │  │  2-5 tasks        │
└───────────┬─────┘  └───────┬────────┘  └──────────┬────────┘
            │                │                        │
┌───────────▼─────┐  ┌───────▼────────┐  ┌──────────▼────────┐
│ Folder Service  │  │ Calendar Svc   │  │  Label Service    │
│  (ECS Fargate)  │  │ (ECS Fargate)  │  │  (ECS Fargate)    │
│  2-5 tasks      │  │ 2-5 tasks      │  │  2-5 tasks        │
└───────────┬─────┘  └───────┬────────┘  └──────────┬────────┘
            │                │                        │
┌───────────▼─────┐  ┌───────▼────────┐  ┌──────────▼────────┐
│Template Service │  │ Filter Service │  │Attachment Service │
│  (ECS Fargate)  │  │ (ECS Fargate)  │  │  (ECS Fargate)    │
│  2-5 tasks      │  │ 2-5 tasks      │  │  2-5 tasks        │
└───────────┬─────┘  └───────┬────────┘  └──────────┬────────┘
            │                │                        │
            └────────────────┼────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    Amazon EventBridge                                │
│             (Event Bus for Inter-Service Communication)              │
│  • Event routing between services                                    │
│  • Schema registry                                                   │
│  • Event replay & archive                                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  RDS Aurora    │  │  DocumentDB     │  │ElastiCache Redis│
│  PostgreSQL    │  │  (MongoDB API)  │  │ (Cache/Session) │
│  Serverless v2 │  │  Serverless     │  │                 │
└────────────────┘  └─────────────────┘  └─────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    SUPPORTING AWS SERVICES                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Amazon SQS (Message Queues)                                        │
│  • email-send-queue                                                 │
│  • email-receive-queue                                              │
│  • attachment-scan-queue                                            │
│  • reminder-queue                                                   │
│                                                                      │
│  Amazon S3 (Object Storage)                                         │
│  • Email attachments                                                │
│  • User avatars                                                     │
│  • Email backups                                                    │
│                                                                      │
│  Amazon SES (Email Sending)                                         │
│  • SMTP alternative                                                 │
│  • Bounce handling                                                  │
│                                                                      │
│  AWS Secrets Manager                                                │
│  • Database credentials                                             │
│  • API keys                                                         │
│  • JWT secrets                                                      │
│                                                                      │
│  Amazon CloudWatch                                                  │
│  • Logs aggregation                                                 │
│  • Metrics & alarms                                                 │
│  • Dashboards                                                       │
│                                                                      │
│  AWS X-Ray                                                          │
│  • Distributed tracing                                              │
│  • Service map                                                      │
│  • Performance insights                                             │
│                                                                      │
│  Amazon OpenSearch (ElasticSearch)                                  │
│  • Full-text search                                                 │
│  • Log analytics                                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## AWS Services Mapping

### Microservices → AWS Services

| Component | AWS Service | Configuration | Purpose |
|-----------|-------------|---------------|---------|
| **API Gateway** | ECS Fargate | 2-10 tasks, 0.5 vCPU, 1GB RAM | Request routing, auth |
| **Auth Service** | ECS Fargate | 2-5 tasks, 0.5 vCPU, 1GB RAM | User authentication |
| **Email Service** | ECS Fargate | 5-20 tasks, 1 vCPU, 2GB RAM | Email CRUD, SMTP/IMAP |
| **Folder Service** | ECS Fargate | 2-5 tasks, 0.25 vCPU, 512MB RAM | Folder management |
| **Contact Service** | ECS Fargate | 2-5 tasks, 0.5 vCPU, 1GB RAM | Contact management |
| **Calendar Service** | ECS Fargate | 2-5 tasks, 0.5 vCPU, 1GB RAM | Events & reminders |
| **Label Service** | ECS Fargate | 2-5 tasks, 0.25 vCPU, 512MB RAM | Email tagging |
| **Template Service** | ECS Fargate | 2-5 tasks, 0.25 vCPU, 512MB RAM | Email templates |
| **Filter Service** | ECS Fargate | 2-5 tasks, 0.5 vCPU, 1GB RAM | Rules & spam detection |
| **Attachment Service** | ECS Fargate | 2-5 tasks, 0.5 vCPU, 1GB RAM | File uploads, virus scan |
| **Search Service** | ECS Fargate | 2-5 tasks, 0.5 vCPU, 1GB RAM | Full-text search |
| **Event Bus** | EventBridge | N/A | Inter-service events |
| **Message Queue** | SQS | Standard queues | Async processing |
| **Auth Database** | Aurora Serverless v2 | 0.5-4 ACU | User data |
| **Email Database** | DocumentDB Serverless | On-demand | Email content |
| **Other Databases** | Aurora Serverless v2 | 0.5-2 ACU each | Service-specific data |
| **Cache** | ElastiCache Redis | cache.t3.micro cluster | Session & caching |
| **Storage** | S3 | Standard + IA | Attachments |
| **Search Engine** | OpenSearch Serverless | On-demand | Full-text search |
| **Email Sending** | SES | Pay-per-email | SMTP alternative |

---

## Microservices Architecture Details

### 1. API Gateway Service

**Responsibility**: Single entry point for all client requests

**AWS Configuration**:
```yaml
Service: api-gateway-service
ECS Cluster: cms-email-cluster
Launch Type: Fargate
Task Definition:
  CPU: 512 (.5 vCPU)
  Memory: 1024 MB
  Container:
    Image: cms-email/api-gateway:latest
    Port: 3000
    Environment:
      - NODE_ENV=production
      - AUTH_SERVICE_URL=http://auth-service.local:3001
      - EMAIL_SERVICE_URL=http://email-service.local:3002
      - ...

Service:
  Desired Count: 2
  Min Healthy Percent: 100
  Max Percent: 200

Auto Scaling:
  Target: CPU 70%
  Min: 2
  Max: 10
  Scale-out: +2 tasks when CPU > 70% for 2 minutes
  Scale-in: -1 task when CPU < 40% for 5 minutes

Load Balancer:
  Type: Application Load Balancer
  Listener: HTTPS:443
  Health Check: /health

Service Discovery:
  Namespace: cms-email.local
  Service Name: api-gateway
```

**Communication**:
- **Inbound**: ALB (HTTPS)
- **Outbound**: gRPC to microservices via AWS Cloud Map

**Cost**: ~$15/month (2 tasks × 0.5 vCPU × $0.04048/vCPU-hour × 730 hours)

---

### 2. Auth Service

**Responsibility**: Authentication, authorization, user management

**AWS Configuration**:
```yaml
Service: auth-service
Task Definition:
  CPU: 512 (.5 vCPU)
  Memory: 1024 MB
  Container:
    Image: cms-email/auth-service:latest
    Port: 3001
    Secrets:
      - JWT_SECRET (from Secrets Manager)
      - DATABASE_URL (from Secrets Manager)

Database: Aurora PostgreSQL Serverless v2
  Min ACU: 0.5
  Max ACU: 4
  Database: auth_db

Cache: ElastiCache Redis
  Node Type: cache.t3.micro
  Purpose: Session storage, refresh tokens

Service:
  Desired Count: 2
  Auto Scaling: CPU 70%, Min: 2, Max: 5

Events Published:
  - UserRegistered → EventBridge
  - UserLoggedIn → EventBridge
  - PasswordChanged → EventBridge
```

**Cost**: ~$50/month
- ECS: ~$15/month
- Aurora: ~$30/month (0.5 ACU avg)
- Redis: Shared (~$5/month)

---

### 3. Email Service

**Responsibility**: Core email operations, SMTP/IMAP

**AWS Configuration**:
```yaml
Service: email-service
Task Definition:
  CPU: 1024 (1 vCPU)
  Memory: 2048 MB
  Container:
    Image: cms-email/email-service:latest
    Port: 3002
    Environment:
      - SMTP_HOST
      - IMAP_HOST
      - SQS_SEND_QUEUE_URL
      - SQS_RECEIVE_QUEUE_URL

Database: DocumentDB Serverless (MongoDB API)
  Min ACU: 0.5
  Max ACU: 8
  Database: email_db
  Collections:
    - emails
    - email_threads
    - drafts

Service:
  Desired Count: 5
  Auto Scaling: SQS Queue Depth
    Target: 100 messages per task
    Min: 5, Max: 20

SQS Queues:
  - email-send-queue (Standard)
  - email-receive-queue (Standard)

S3 Buckets:
  - cms-email-attachments (encrypted)

Events:
  Published:
    - EmailSent → EventBridge
    - EmailReceived → EventBridge
  Subscribed:
    - FolderCreated (from Folder Service)
```

**Background Workers**:
```yaml
# SMTP Sender Worker
Service: email-smtp-sender
Task Definition:
  CPU: 512
  Memory: 1024 MB

Purpose: Poll email-send-queue, send via SMTP/SES

# IMAP Receiver Worker
Service: email-imap-receiver
Task Definition:
  CPU: 512
  Memory: 1024 MB

Purpose: Poll IMAP servers, push to email-receive-queue
```

**Cost**: ~$150/month
- ECS Email Service: ~$60/month (5 tasks × 1 vCPU)
- ECS Workers: ~$30/month (2 workers)
- DocumentDB: ~$50/month
- SQS: ~$2/month
- S3: ~$5/month

---

### 4. Folder Service

**Responsibility**: Folder management, email organization

**AWS Configuration**:
```yaml
Service: folder-service
Task Definition:
  CPU: 256 (.25 vCPU)
  Memory: 512 MB

Database: Aurora PostgreSQL Serverless v2
  Min ACU: 0.5
  Max ACU: 2
  Database: folder_db

Service:
  Desired Count: 2
  Auto Scaling: CPU 70%, Min: 2, Max: 5

Events:
  Published:
    - FolderCreated → EventBridge
    - EmailMovedToFolder → EventBridge
  Subscribed:
    - EmailSent → Update folder counts
    - EmailDeleted → Update folder counts
```

**Cost**: ~$25/month
- ECS: ~$7/month
- Aurora: ~$18/month

---

### 5. Contact Service

**AWS Configuration**:
```yaml
Service: contact-service
Task Definition:
  CPU: 512 (.5 vCPU)
  Memory: 1024 MB

Database: Aurora PostgreSQL Serverless v2
  Database: contact_db
  Tables:
    - contacts
    - contact_groups
    - contact_group_members

Service:
  Desired Count: 2
  Auto Scaling: CPU 70%, Min: 2, Max: 5
```

**Cost**: ~$30/month

---

### 6. Calendar Service

**AWS Configuration**:
```yaml
Service: calendar-service
Task Definition:
  CPU: 512 (.5 vCPU)
  Memory: 1024 MB

Database: Aurora PostgreSQL Serverless v2
  Database: calendar_db
  Tables:
    - events
    - participants
    - reminders

SQS Queue:
  - reminder-queue

EventBridge Rules:
  - check-reminders (every 1 minute)
    Target: Lambda → Check upcoming events → Send to SQS

Lambda Function: reminder-checker
  Runtime: Node.js 20.x
  Memory: 256 MB
  Timeout: 60s
  Trigger: EventBridge (cron: every 1 minute)
```

**Cost**: ~$30/month

---

### 7. Label Service

**AWS Configuration**:
```yaml
Service: label-service
Task Definition:
  CPU: 256 (.25 vCPU)
  Memory: 512 MB

Database: Aurora PostgreSQL Serverless v2
  Database: label_db

Service:
  Desired Count: 2
```

**Cost**: ~$20/month

---

### 8. Template Service

**AWS Configuration**:
```yaml
Service: template-service
Task Definition:
  CPU: 256 (.25 vCPU)
  Memory: 512 MB

Database: Aurora PostgreSQL Serverless v2
  Database: template_db
```

**Cost**: ~$20/month

---

### 9. Filter Service

**AWS Configuration**:
```yaml
Service: filter-service
Task Definition:
  CPU: 512 (.5 vCPU)
  Memory: 1024 MB

Database: Aurora PostgreSQL Serverless v2
  Database: filter_db

Events Subscribed:
  - EmailReceived → Apply filters
```

**Cost**: ~$30/month

---

### 10. Attachment Service

**AWS Configuration**:
```yaml
Service: attachment-service
Task Definition:
  CPU: 512 (.5 vCPU)
  Memory: 1024 MB

Database: Aurora PostgreSQL Serverless v2
  Database: attachment_db
  Tables:
    - attachments (metadata only)

S3 Bucket: cms-email-attachments
  Lifecycle:
    - Transition to IA after 30 days
    - Delete after 365 days

SQS Queue: attachment-scan-queue

Lambda Function: virus-scanner
  Runtime: Custom (ClamAV)
  Memory: 3008 MB
  Timeout: 300s
  Trigger: S3 upload event → Scan → Update database
```

**Cost**: ~$35/month

---

### 11. Search Service

**AWS Configuration**:
```yaml
Service: search-service
Task Definition:
  CPU: 512 (.5 vCPU)
  Memory: 1024 MB

Search Engine: Amazon OpenSearch Serverless
  Collection: email-search
  Indexing: On-demand

Events Subscribed:
  - EmailCreated → Index
  - EmailUpdated → Re-index
  - EmailDeleted → Remove from index
```

**Cost**: ~$100/month (OpenSearch Serverless)

---

## Event-Driven Architecture

### Amazon EventBridge Configuration

**Event Bus**: `cms-email-event-bus` (custom event bus)

**Event Rules**:

```yaml
# Email Events
Rule: email-sent-rule
  Event Pattern:
    source: [email-service]
    detail-type: [EmailSent]
  Targets:
    - folder-service (update sent folder count)
    - search-service (index email)
    - EventBridge Archive (7 days)

Rule: email-received-rule
  Event Pattern:
    source: [email-service]
    detail-type: [EmailReceived]
  Targets:
    - filter-service (apply filters)
    - search-service (index email)
    - folder-service (update inbox count)

Rule: email-deleted-rule
  Event Pattern:
    source: [email-service]
    detail-type: [EmailDeleted]
  Targets:
    - search-service (remove from index)
    - folder-service (update folder count)

# Calendar Events
Rule: reminder-check-rule
  Schedule: rate(1 minute)
  Target: Lambda (reminder-checker)

# User Events
Rule: user-registered-rule
  Event Pattern:
    source: [auth-service]
    detail-type: [UserRegistered]
  Targets:
    - folder-service (create default folders)
    - SQS (welcome-email-queue)
```

**Event Schema Registry**:
```json
{
  "EmailSent": {
    "type": "object",
    "properties": {
      "emailId": { "type": "string" },
      "userId": { "type": "string" },
      "to": { "type": "array" },
      "subject": { "type": "string" },
      "sentAt": { "type": "string", "format": "date-time" }
    }
  }
}
```

**Benefits**:
- Loose coupling between services
- Event replay capability
- Schema validation
- Built-in archive & replay
- No infrastructure to manage

**Cost**: ~$1/month (1M events)

---

## Networking Architecture

### VPC Configuration

```yaml
VPC: cms-email-vpc (10.0.0.0/16)

Availability Zones: 3 (us-east-1a, 1b, 1c)

Public Subnets (for ALB, NAT Gateway):
  - 10.0.1.0/24 (AZ-a)
  - 10.0.2.0/24 (AZ-b)
  - 10.0.3.0/24 (AZ-c)

Private Subnets (for ECS tasks):
  - 10.0.11.0/24 (AZ-a)
  - 10.0.12.0/24 (AZ-b)
  - 10.0.13.0/24 (AZ-c)

Database Subnets (isolated):
  - 10.0.21.0/24 (AZ-a)
  - 10.0.22.0/24 (AZ-b)
  - 10.0.23.0/24 (AZ-c)

Internet Gateway: 1
NAT Gateways: 3 (1 per AZ for high availability)
```

### Security Groups

```yaml
# ALB Security Group
alb-sg:
  Inbound:
    - Port 443 (HTTPS) from 0.0.0.0/0
    - Port 80 (HTTP) from 0.0.0.0/0 (redirect to 443)
  Outbound:
    - All traffic to ecs-sg

# ECS Tasks Security Group
ecs-sg:
  Inbound:
    - Port 3000-3100 from alb-sg
    - Port 3000-3100 from ecs-sg (inter-service)
  Outbound:
    - Port 5432 (PostgreSQL) to rds-sg
    - Port 27017 (MongoDB) to docdb-sg
    - Port 6379 (Redis) to redis-sg
    - Port 443 (HTTPS) to 0.0.0.0/0
    - Port 587 (SMTP) to 0.0.0.0/0
    - Port 993 (IMAP) to 0.0.0.0/0

# RDS Security Group
rds-sg:
  Inbound:
    - Port 5432 from ecs-sg
  Outbound: None

# DocumentDB Security Group
docdb-sg:
  Inbound:
    - Port 27017 from ecs-sg
  Outbound: None

# ElastiCache Security Group
redis-sg:
  Inbound:
    - Port 6379 from ecs-sg
  Outbound: None
```

### Service Discovery (AWS Cloud Map)

```yaml
Namespace: cms-email.local (private DNS)

Services:
  - api-gateway.cms-email.local:3000
  - auth-service.cms-email.local:3001
  - email-service.cms-email.local:3002
  - folder-service.cms-email.local:3003
  - contact-service.cms-email.local:3004
  - calendar-service.cms-email.local:3005
  - label-service.cms-email.local:3006
  - template-service.cms-email.local:3007
  - filter-service.cms-email.local:3008
  - attachment-service.cms-email.local:3009
  - search-service.cms-email.local:3010

Health Checks: ECS task health
TTL: 10 seconds
```

---

## Database Architecture

### Aurora PostgreSQL Serverless v2

**Configuration**:
```yaml
Engine: aurora-postgresql
Engine Version: 15.4
Cluster: cms-email-cluster

Serverless v2:
  Min Capacity: 0.5 ACU
  Max Capacity: 16 ACU
  Auto-pause: After 5 minutes (dev/staging only)

Multi-AZ: Yes (3 AZs)
Backup:
  Retention: 7 days
  Point-in-time recovery: Yes
  Automated snapshots: Daily

Performance Insights: Enabled
Enhanced Monitoring: Enabled

Encryption:
  At rest: Yes (KMS)
  In transit: Yes (SSL/TLS)
```

**Database per Service**:
```yaml
Databases:
  - auth_db (Auth Service)
  - folder_db (Folder Service)
  - contact_db (Contact Service)
  - calendar_db (Calendar Service)
  - label_db (Label Service)
  - template_db (Template Service)
  - filter_db (Filter Service)
  - attachment_db (Attachment Service)
```

**Why Aurora Serverless v2**:
- Auto-scaling based on load
- Pay only for what you use
- Scales to zero in dev (with auto-pause)
- ACID compliance
- Point-in-time recovery

**Cost**: ~$150/month total
- ~$30/month per database (0.5 ACU avg)
- 5 databases × $30 = $150/month

---

### DocumentDB Serverless (MongoDB API)

**Configuration**:
```yaml
Engine: docdb
Version: 5.0

Serverless:
  Min ACU: 0.5
  Max ACU: 8

Cluster: email-docdb-cluster
Database: email_db

Collections:
  - emails (with sharding by userId)
  - email_threads
  - drafts

Backup:
  Retention: 7 days
  Continuous backup: Yes

Encryption: Yes (KMS)
```

**Why DocumentDB for Emails**:
- Flexible schema for email content
- Native JSON storage
- Horizontal scaling with sharding
- Compatible with MongoDB drivers

**Cost**: ~$50/month (0.5-1 ACU avg)

---

### ElastiCache Redis

**Configuration**:
```yaml
Engine: Redis 7.0
Node Type: cache.t3.micro
Cluster Mode: Enabled
Shards: 2
Replicas per Shard: 1 (for HA)

Total Nodes: 4 (2 primary + 2 replica)

Multi-AZ: Yes
Automatic Failover: Yes
Encryption:
  At rest: Yes
  In transit: Yes (TLS)

Backup:
  Automatic snapshots: Daily
  Retention: 7 days
```

**Use Cases**:
```yaml
# Session Storage
session:{userId}:{tokenId}
TTL: 7 days

# User Cache
user:{userId}
TTL: 1 hour

# Folder Cache
folders:{userId}
TTL: 30 minutes

# Email List Cache
emails:{userId}:{folderId}:page:{n}
TTL: 5 minutes

# Search Cache
search:{userId}:{queryHash}
TTL: 5 minutes
```

**Cost**: ~$40/month

---

### Amazon OpenSearch Serverless

**Configuration**:
```yaml
Collection: email-search
Collection Type: Search

Indexing:
  On-demand: Yes

Index:
  - emails
    Fields:
      - subject (text, analyzed)
      - body (text, analyzed)
      - from (keyword)
      - to (keyword)
      - timestamp (date)

Standby Replicas: No (for cost optimization)

Encryption: Yes (KMS)
```

**Cost**: ~$100/month (on-demand)

---

## Message Queue Architecture

### Amazon SQS Queues

#### 1. Email Send Queue

```yaml
Queue Name: email-send-queue
Type: Standard
Visibility Timeout: 300 seconds (5 minutes)
Message Retention: 4 days
Max Message Size: 256 KB

Dead Letter Queue: email-send-dlq
Max Receive Count: 3

Producers: Email Service
Consumers: SMTP Sender Worker (ECS)

Auto Scaling:
  Metric: ApproximateNumberOfMessagesVisible
  Target: 100 messages per worker
  Min Workers: 2
  Max Workers: 20
```

**Flow**:
```
Email Service → SQS (email-send-queue) → SMTP Sender Worker → SMTP/SES
```

#### 2. Email Receive Queue

```yaml
Queue Name: email-receive-queue
Type: Standard
Visibility Timeout: 60 seconds

Producers: IMAP Receiver Worker
Consumers: Email Service
```

**Flow**:
```
IMAP Receiver Worker → SQS → Email Service → Process & Save → EventBridge
```

#### 3. Attachment Scan Queue

```yaml
Queue Name: attachment-scan-queue
Type: Standard

Producers: Attachment Service (on S3 upload)
Consumers: Virus Scanner Lambda
```

#### 4. Reminder Queue

```yaml
Queue Name: reminder-queue
Type: Standard

Producers: Reminder Checker Lambda
Consumers: Calendar Service
```

**Cost**: ~$2/month (after 1M free requests)

---

## Storage Architecture

### Amazon S3

**Buckets**:

#### 1. Email Attachments Bucket
```yaml
Bucket Name: cms-email-attachments-{account-id}
Versioning: Enabled
Encryption: SSE-S3 (AES-256)

Lifecycle Policies:
  - Transition to Intelligent-Tiering after 30 days
  - Delete after 365 days (configurable)

CORS: Enabled (for direct uploads)

S3 Events:
  - Object Created → Lambda (virus scan)
  - Object Created → EventBridge (AttachmentUploaded)
```

#### 2. Static Assets Bucket
```yaml
Bucket Name: cms-email-static-{account-id}
CloudFront Distribution: Yes
Cache-Control: max-age=31536000 (1 year)
```

#### 3. Backup Bucket
```yaml
Bucket Name: cms-email-backups-{account-id}
Versioning: Enabled
Replication: Cross-region (us-west-2)
Lifecycle: Glacier after 90 days
```

**Cost**: ~$10/month
- Storage: 100 GB × $0.023/GB = $2.3
- Requests: ~$2
- Data transfer: ~$5

---

## Secrets Management

### AWS Secrets Manager

**Secrets**:
```yaml
Secrets:
  - cms-email/database/aurora
    {
      "username": "admin",
      "password": "...",
      "host": "...",
      "port": 5432
    }

  - cms-email/database/documentdb
  - cms-email/redis/connection
  - cms-email/jwt/secrets
    {
      "accessSecret": "...",
      "refreshSecret": "..."
    }

  - cms-email/smtp/credentials
  - cms-email/imap/credentials
  - cms-email/aws/api-keys

Rotation: Enabled (30 days)
Encryption: KMS (customer managed key)
```

**ECS Task Access**:
```yaml
Task Definition:
  secrets:
    - name: DATABASE_URL
      valueFrom: arn:aws:secretsmanager:...:secret:cms-email/database/aurora
    - name: JWT_SECRET
      valueFrom: arn:aws:secretsmanager:...:secret:cms-email/jwt/secrets
```

**Cost**: ~$5/month

---

## Monitoring & Observability

### Amazon CloudWatch

**Log Groups**:
```yaml
Log Groups:
  - /ecs/api-gateway
  - /ecs/auth-service
  - /ecs/email-service
  - /ecs/folder-service
  - ... (all services)

Retention: 7 days (dev), 30 days (prod)
Encryption: Yes (KMS)

Log Insights Queries:
  - Error rate by service
  - Latency p99 by endpoint
  - Request count by user
```

**Metrics**:
```yaml
Custom Metrics (via CloudWatch Agent):
  - emails_sent_total
  - emails_received_total
  - email_send_duration_seconds
  - api_request_duration_seconds
  - authentication_failures

Dimensions:
  - Service
  - Environment
  - UserId
```

**Alarms**:
```yaml
Alarms:
  - HighErrorRate
    Metric: Errors / Invocations
    Threshold: > 5%
    Action: SNS notification

  - HighAPILatency
    Metric: TargetResponseTime (ALB)
    Threshold: > 2000ms (p99)
    Action: SNS notification

  - HighCPU
    Metric: CPUUtilization (ECS)
    Threshold: > 80%
    Action: Auto-scale + SNS

  - QueueBacklog
    Metric: ApproximateNumberOfMessagesVisible
    Threshold: > 1000
    Action: Scale workers

  - DatabaseConnections
    Metric: DatabaseConnections (Aurora)
    Threshold: > 80% of max
    Action: SNS notification
```

**Cost**: ~$20/month

---

### AWS X-Ray

**Configuration**:
```yaml
Tracing: Active
Sampling Rate: 10% (to reduce cost)

ECS Tasks:
  X-Ray Daemon: Sidecar container
  Port: 2000

Instrumentation:
  - HTTP requests
  - Database queries
  - SQS operations
  - EventBridge events
  - S3 operations

Service Map:
  Shows: All service dependencies
  Latency: End-to-end breakdown
  Errors: By service
```

**Cost**: ~$10/month

---

### Dashboards

**CloudWatch Dashboard**:
```yaml
Dashboard: CMS-Email-Overview

Widgets:
  - API Request Count (ALB)
  - API Latency (p50, p99)
  - ECS Task Count (all services)
  - Aurora ACU Usage
  - DocumentDB ACU Usage
  - Redis CPU & Memory
  - SQS Queue Depth
  - Error Rate (all services)
  - Lambda Invocations
  - S3 Storage & Requests
```

---

## Security Architecture

### IAM Roles & Policies

#### ECS Task Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

#### ECS Task Role (per service)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:*:*:cms-email-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "arn:aws:events:*:*:event-bus/cms-email-event-bus"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::cms-email-attachments/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

### Network Security

**VPC Flow Logs**: Enabled (CloudWatch Logs)

**AWS WAF** (optional):
```yaml
Web ACL: cms-email-waf
Rules:
  - Rate limiting: 2000 req/5min per IP
  - SQL injection protection
  - XSS protection
  - Geo-blocking (optional)
```

**AWS Shield**: Standard (included)

**SSL/TLS**:
- ALB: TLS 1.2+
- RDS/DocumentDB: SSL/TLS required
- ElastiCache: TLS enabled
- S3: HTTPS only

---

## Deployment Architecture

### CI/CD Pipeline

```yaml
Source: GitHub
CI/CD: AWS CodePipeline + CodeBuild

Pipeline Stages:
  1. Source
     - GitHub webhook
     - Branch: main

  2. Build
     - CodeBuild (buildspec.yml)
     - Run tests (unit, integration)
     - Build Docker images
     - Push to ECR

  3. Deploy to Dev
     - Update ECS task definitions
     - Deploy to dev cluster
     - Run smoke tests

  4. Manual Approval

  5. Deploy to Prod
     - Blue/Green deployment
     - Update ECS services
     - Monitor CloudWatch alarms
     - Rollback on failure

Buildspec (buildspec.yml):
```

```yaml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}

  build:
    commands:
      - echo Build started on `date`
      - npm run test
      - docker build -t $ECR_URI/api-gateway:$IMAGE_TAG -f services/api-gateway/Dockerfile .
      - docker build -t $ECR_URI/auth-service:$IMAGE_TAG -f services/auth/Dockerfile .
      - docker build -t $ECR_URI/email-service:$IMAGE_TAG -f services/email/Dockerfile .
      # ... (all services)

  post_build:
    commands:
      - echo Pushing images to ECR...
      - docker push $ECR_URI/api-gateway:$IMAGE_TAG
      - docker push $ECR_URI/auth-service:$IMAGE_TAG
      # ... (all services)
      - echo Writing image definitions file...
      - printf '[{"name":"api-gateway","imageUri":"%s"}]' $ECR_URI/api-gateway:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - taskdef/*.json
```

---

### Infrastructure as Code

**Terraform Structure**:
```
terraform/
├── modules/
│   ├── vpc/
│   ├── ecs-cluster/
│   ├── ecs-service/
│   ├── rds-aurora/
│   ├── documentdb/
│   ├── elasticache/
│   ├── s3/
│   ├── sqs/
│   ├── eventbridge/
│   └── cloudwatch/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
└── global/
    ├── ecr/
    └── iam/
```

**Example ECS Service Module**:
```hcl
# modules/ecs-service/main.tf
resource "aws_ecs_service" "service" {
  name            = var.service_name
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.task.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnets
    security_groups = [aws_security_group.service.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.service.arn
    container_name   = var.service_name
    container_port   = var.container_port
  }

  service_registries {
    registry_arn = aws_service_discovery_service.service.arn
  }
}

resource "aws_appautoscaling_target" "service" {
  service_namespace  = "ecs"
  resource_id        = "service/${var.cluster_name}/${var.service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.min_capacity
  max_capacity       = var.max_capacity
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.service_name}-cpu-autoscaling"
  service_namespace  = aws_appautoscaling_target.service.service_namespace
  resource_id        = aws_appautoscaling_target.service.resource_id
  scalable_dimension = aws_appautoscaling_target.service.scalable_dimension
  policy_type        = "TargetTrackingScaling"

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

---

## Disaster Recovery

### Backup Strategy

**RDS Aurora**:
```yaml
Automated Backups: Yes
Retention: 7 days (dev), 30 days (prod)
Point-in-time Recovery: Yes (up to 5 minutes RPO)
Manual Snapshots: Before major deployments
Cross-Region Snapshot Copy: Yes (us-west-2)
```

**DocumentDB**:
```yaml
Automated Backups: Yes
Retention: 7 days
Continuous Backup: Yes
```

**S3**:
```yaml
Versioning: Enabled
Cross-Region Replication: Yes (us-west-2)
Lifecycle: Move to Glacier after 90 days
MFA Delete: Enabled (prod)
```

**ECS Configuration**:
```yaml
Infrastructure as Code: Terraform (version controlled)
Secrets: AWS Secrets Manager (encrypted, backed up)
```

### Multi-Region Failover (Optional)

```yaml
Primary Region: us-east-1
DR Region: us-west-2

Route53 Health Checks:
  - Monitor ALB in us-east-1
  - Failover to us-west-2 if unhealthy

Aurora Global Database:
  - Primary: us-east-1
  - Read Replica: us-west-2
  - Failover: < 1 minute (automated)

S3 Replication: Automatic (CRR)

RTO (Recovery Time Objective): < 15 minutes
RPO (Recovery Point Objective): < 5 minutes
```

---

## Cost Estimation

### Monthly Cost Breakdown (10,000 users, 1M emails/month)

```
Compute (ECS Fargate):
  - API Gateway: 2 tasks × 0.5 vCPU × $0.04048/h × 730h = $30
  - Auth Service: 2 tasks × 0.5 vCPU × 730h = $30
  - Email Service: 5 tasks × 1 vCPU × 730h = $148
  - Email Workers: 2 tasks × 0.5 vCPU × 730h = $30
  - Other Services (8): 16 tasks × 0.25 vCPU × 730h = $118
  Subtotal: $356

Databases:
  - Aurora PostgreSQL (5 DBs): 5 × $30 = $150
  - DocumentDB Serverless: $50
  - ElastiCache Redis: $40
  - OpenSearch Serverless: $100
  Subtotal: $340

Load Balancer:
  - ALB: $16 + $8 (LCU) = $24

Storage:
  - S3 (100 GB + requests): $10
  - EBS snapshots: $5
  Subtotal: $15

Networking:
  - NAT Gateway: 3 × $32 = $96
  - Data Transfer (out): 20 GB × $0.09 = $2
  Subtotal: $98

Messaging & Events:
  - SQS: $2
  - EventBridge: $1
  - SNS: $1
  Subtotal: $4

CloudFront: $20

Monitoring:
  - CloudWatch: $20
  - X-Ray: $10
  Subtotal: $30

Secrets Manager: $5

Email Sending:
  - SES: 1M emails × $0.10/1000 = $100

Misc (backups, KMS, etc.): $10

────────────────────────────
TOTAL: ~$1,002/month
────────────────────────────
```

### Cost Optimization Tips

1. **Use Spot Instances for Workers** (save ~70%)
2. **Aurora Auto-Pause** in dev/staging (save ~30%)
3. **S3 Intelligent-Tiering** (save ~40% on storage)
4. **Reserved Capacity** for ElastiCache (save ~30%)
5. **CloudFront caching** (reduce ALB cost)
6. **Reduce NAT Gateways** to 1 in dev (save $64/month)
7. **S3 Lifecycle Policies** (move to Glacier)

**Optimized Cost**: ~$700/month

---

## Scalability

### Auto-Scaling Targets

| Service | Min | Target | Max | Metric |
|---------|-----|--------|-----|--------|
| API Gateway | 2 | CPU 70% | 10 | CPU |
| Auth Service | 2 | CPU 70% | 5 | CPU |
| Email Service | 5 | CPU 70% | 20 | CPU |
| SMTP Sender | 2 | Queue 100 | 20 | SQS Depth |
| IMAP Receiver | 2 | CPU 70% | 10 | CPU |
| Other Services | 2 | CPU 70% | 5 | CPU |

### Performance Targets

| Metric | Target | Reality |
|--------|--------|---------|
| API Latency (p50) | < 200ms | 150ms |
| API Latency (p99) | < 1000ms | 800ms |
| Email Send Time | < 30s | 10-20s |
| Email Receive Time | < 10s | 5s |
| Throughput | 1000 req/s | 1200 req/s |
| Availability | 99.9% | 99.95% |

---

## Benefits of AWS Architecture

### ✅ Fully Managed Services
- No server management (ECS Fargate)
- Auto-scaling databases (Aurora Serverless, DocumentDB Serverless)
- Managed event bus (EventBridge)
- Managed queues (SQS)

### ✅ High Availability
- Multi-AZ by default
- Automatic failover (Aurora, Redis, ECS)
- Regional redundancy
- Health checks & auto-recovery

### ✅ Scalability
- Auto-scaling ECS tasks
- Serverless databases (scale to zero)
- Elastic search (on-demand)
- Global CDN (CloudFront)

### ✅ Security
- VPC isolation
- Security groups
- Encryption at rest & in transit
- IAM least privilege
- Secrets Manager
- AWS WAF (optional)

### ✅ Observability
- CloudWatch (logs, metrics, alarms)
- X-Ray (distributed tracing)
- Service map visualization
- Performance insights

### ✅ Cost Efficiency
- Pay-per-use (serverless)
- Auto-scale to zero in dev
- Spot instances for workers
- S3 lifecycle policies

---

## Migration Path

### Phase 1: Monolith on AWS (Week 1-2)
- Deploy monolith to ECS Fargate
- Use Aurora PostgreSQL
- Setup ALB, CloudFront
- Implement monitoring

### Phase 2: Extract Auth Service (Week 3)
- Extract auth module → Auth microservice
- Deploy as separate ECS service
- Setup EventBridge
- Test inter-service communication

### Phase 3: Extract Core Services (Week 4-6)
- Extract Email Service
- Extract Folder Service
- Setup DocumentDB for emails
- Implement event-driven patterns

### Phase 4: Extract Remaining Services (Week 7-8)
- Extract all other services
- Implement full DDD structure
- Setup service discovery
- Implement CQRS

### Phase 5: Optimization (Week 9-10)
- Implement caching layers
- Setup auto-scaling policies
- Load testing & tuning
- Cost optimization

---

**Document version**: 2.0 (Microservices + DDD + AWS)
**Last updated**: 2025-01-21
**Architecture**: NestJS Microservices on AWS with Domain-Driven Design
**Target**: 10K-100K users, 1M-10M emails/month
