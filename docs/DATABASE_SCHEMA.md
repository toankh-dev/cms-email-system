# Database Schema - CMS Email System

## Overview

Database uses **PostgreSQL** for the following reasons:
- ACID compliance
- Full-text search support
- JSON/JSONB support
- Mature ecosystem
- Excellent performance

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    users    │──────<│email_accounts│>──────│   folders   │
└──────┬──────┘       └──────┬───────┘       └──────┬──────┘
       │                     │                       │
       │                     │                       │
       │              ┌──────▼───────┐               │
       │              │    emails    │<──────────────┘
       │              └──────┬───────┘
       │                     │
       │         ┌───────────┼───────────┐
       │         │           │           │
       │    ┌────▼──────┐ ┌─▼─────────┐ │
       │    │recipients │ │attachments│ │
       │    └───────────┘ └───────────┘ │
       │                                 │
       │         ┌───────────────────────┘
       │         │
       │    ┌────▼─────┐       ┌──────────┐
       ├───>│  labels  │<──────│email_    │
       │    └──────────┘       │ labels   │
       │                       └──────────┘
       │
       │    ┌───────────┐      ┌──────────┐
       ├───>│ contacts  │<─────│contact_  │
       │    └───────────┘      │ groups   │
       │                       └──────────┘
       │
       │    ┌───────────┐      ┌──────────┐
       ├───>│  events   │<─────│event_    │
       │    └───────────┘      │attendees │
       │                       └──────────┘
       │
       │    ┌───────────┐
       ├───>│ templates │
       │    └───────────┘
       │
       │    ┌───────────┐
       └───>│  filters  │
            └───────────┘
```

---

## Tables

### 1. users

Table storing user information

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  signature TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Fields:**
- `id`: UUID primary key
- `email`: Login email (unique)
- `password_hash`: Hashed password (bcrypt)
- `first_name`, `last_name`: User name
- `avatar_url`: Avatar image URL
- `signature`: Email signature (HTML)
- `is_verified`: Email verified status
- `is_active`: Account active status
- `settings`: JSON containing settings (timezone, language, etc.)
- `last_login_at`: Last login time
- `created_at`, `updated_at`, `deleted_at`: Timestamps (soft delete)

---

### 2. email_accounts

Table storing email accounts (multi-account support)

```sql
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),

  -- SMTP settings
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_secure BOOLEAN DEFAULT FALSE,
  smtp_username VARCHAR(255),
  smtp_password_encrypted TEXT,

  -- IMAP settings
  imap_host VARCHAR(255) NOT NULL,
  imap_port INTEGER NOT NULL DEFAULT 993,
  imap_secure BOOLEAN DEFAULT TRUE,
  imap_username VARCHAR(255),
  imap_password_encrypted TEXT,

  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, email)
);

-- Indexes
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_is_primary ON email_accounts(user_id, is_primary);
```

---

### 3. folders

Table storing folders (system + custom)

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'custom', -- system, custom
  icon VARCHAR(50),
  color VARCHAR(7), -- hex color code
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, name, parent_id)
);

-- Indexes
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_type ON folders(type);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_order ON folders(user_id, order_index);
```

**System folders:**
- Inbox
- Sent
- Drafts
- Trash
- Spam
- Archive

---

### 4. emails

Table storing emails (main table, most important)

```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,

  -- Email headers
  message_id VARCHAR(255), -- RFC 5322 Message-ID
  in_reply_to VARCHAR(255), -- Reply to message ID
  references TEXT, -- Thread references
  thread_id UUID, -- Custom thread grouping

  -- Sender & Recipients (stored as JSON for flexibility)
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),

  subject TEXT,
  snippet TEXT, -- First 200 chars of body for preview

  -- Body content
  body_html TEXT,
  body_text TEXT,

  -- Metadata
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  has_attachment BOOLEAN DEFAULT FALSE,

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE, -- For scheduled emails

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_folder_id ON emails(folder_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_is_read ON emails(user_id, is_read);
CREATE INDEX idx_emails_is_starred ON emails(user_id, is_starred);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_from_email ON emails(from_email);

-- Full-text search index
CREATE INDEX idx_emails_search ON emails USING gin(
  to_tsvector('english',
    COALESCE(subject, '') || ' ' ||
    COALESCE(body_text, '') || ' ' ||
    COALESCE(from_name, '') || ' ' ||
    COALESCE(from_email, '')
  )
);
```

---

### 5. email_recipients

Table storing email recipients (to, cc, bcc)

```sql
CREATE TABLE email_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  recipient_type VARCHAR(10) NOT NULL, -- to, cc, bcc
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_email_recipients_email_id ON email_recipients(email_id);
CREATE INDEX idx_email_recipients_email ON email_recipients(email);
CREATE INDEX idx_email_recipients_type ON email_recipients(email_id, recipient_type);
```

---

### 6. attachments

Table storing file attachments

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  size BIGINT NOT NULL, -- in bytes
  storage_path TEXT NOT NULL, -- local path or S3 key
  storage_type VARCHAR(20) DEFAULT 'local', -- local, s3
  checksum VARCHAR(64), -- SHA-256 hash
  is_inline BOOLEAN DEFAULT FALSE, -- inline attachment (images in HTML)
  content_id VARCHAR(255), -- CID for inline images
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_attachments_email_id ON attachments(email_id);
CREATE INDEX idx_attachments_checksum ON attachments(checksum);
```

---

### 7. labels

Table storing labels/tags

```sql
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL, -- hex color
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX idx_labels_user_id ON labels(user_id);
CREATE INDEX idx_labels_order ON labels(user_id, order_index);
```

---

### 8. email_labels

Many-to-many junction table between emails and labels

```sql
CREATE TABLE email_labels (
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (email_id, label_id)
);

-- Indexes
CREATE INDEX idx_email_labels_email_id ON email_labels(email_id);
CREATE INDEX idx_email_labels_label_id ON email_labels(label_id);
```

---

### 9. contacts

Table storing contacts

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  job_title VARCHAR(255),
  avatar_url TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, email)
);

-- Indexes
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_name ON contacts(first_name, last_name);
CREATE INDEX idx_contacts_favorite ON contacts(user_id, is_favorite);
```

---

### 10. contact_groups

Table storing contact groups

```sql
CREATE TABLE contact_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX idx_contact_groups_user_id ON contact_groups(user_id);
```

---

### 11. contact_group_members

Many-to-many junction table between contacts and groups

```sql
CREATE TABLE contact_group_members (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (contact_id, group_id)
);

-- Indexes
CREATE INDEX idx_group_members_contact ON contact_group_members(contact_id);
CREATE INDEX idx_group_members_group ON contact_group_members(group_id);
```

---

### 12. calendar_events

Table storing calendar events

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,

  -- Recurrence (RRULE format)
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMP WITH TIME ZONE,

  -- Metadata
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, tentative, cancelled
  visibility VARCHAR(20) DEFAULT 'private', -- public, private

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_events_end_time ON calendar_events(end_time);
CREATE INDEX idx_events_date_range ON calendar_events(user_id, start_time, end_time);
```

---

### 13. event_attendees

Table storing event attendees

```sql
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, tentative
  is_optional BOOLEAN DEFAULT FALSE,
  is_organizer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_attendees_email ON event_attendees(email);
```

---

### 14. event_reminders

Table storing event reminders

```sql
CREATE TABLE event_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- email, notification, sms
  minutes_before INTEGER NOT NULL, -- Minutes before event
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reminders_event_id ON event_reminders(event_id);
CREATE INDEX idx_reminders_pending ON event_reminders(is_sent, event_id);
```

---

### 15. email_templates

Table storing email templates

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body_html TEXT NOT NULL,
  body_text TEXT,
  category VARCHAR(100),
  variables JSONB DEFAULT '[]', -- Array of variable names
  is_shared BOOLEAN DEFAULT FALSE, -- Share with team
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_templates_user_id ON email_templates(user_id);
CREATE INDEX idx_templates_category ON email_templates(category);
CREATE INDEX idx_templates_usage ON email_templates(usage_count DESC);
```

---

### 16. email_filters

Table storing email filters/rules

```sql
CREATE TABLE email_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,

  -- Conditions (stored as JSON array)
  conditions JSONB NOT NULL,
  -- Example: [
  --   {"field": "from", "operator": "contains", "value": "@company.com"},
  --   {"field": "subject", "operator": "equals", "value": "Newsletter"}
  -- ]

  -- Actions (stored as JSON array)
  actions JSONB NOT NULL,
  -- Example: [
  --   {"type": "move", "folderId": "uuid"},
  --   {"type": "addLabel", "labelId": "uuid"},
  --   {"type": "markAsRead"}
  -- ]

  match_type VARCHAR(10) DEFAULT 'all', -- all, any
  apply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_filters_user_id ON email_filters(user_id);
CREATE INDEX idx_filters_enabled ON email_filters(user_id, is_enabled);
CREATE INDEX idx_filters_order ON email_filters(user_id, order_index);
```

---

### 17. refresh_tokens

Table storing refresh tokens (for JWT)

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

---

### 18. email_verification_tokens

Table storing email verification tokens

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_token ON email_verification_tokens(token);
```

---

### 19. password_reset_tokens

Table storing password reset tokens

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
```

---

### 20. audit_logs

Table storing audit logs (optional, for enterprise)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- login, send_email, delete_email, etc.
  entity_type VARCHAR(50), -- email, folder, contact, etc.
  entity_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

## Sample Queries

### 1. Get emails in Inbox folder

```sql
SELECT
  e.id,
  e.subject,
  e.from_email,
  e.from_name,
  e.snippet,
  e.is_read,
  e.is_starred,
  e.has_attachment,
  e.received_at,
  f.name as folder_name,
  ARRAY_AGG(DISTINCT l.name) as labels
FROM emails e
JOIN folders f ON e.folder_id = f.id
LEFT JOIN email_labels el ON e.id = el.email_id
LEFT JOIN labels l ON el.label_id = l.id
WHERE
  e.user_id = $1
  AND f.name = 'Inbox'
  AND e.deleted_at IS NULL
GROUP BY e.id, f.name
ORDER BY e.received_at DESC
LIMIT 50 OFFSET 0;
```

---

### 2. Full-text search emails

```sql
SELECT
  e.id,
  e.subject,
  e.from_email,
  e.snippet,
  ts_rank(
    to_tsvector('english', COALESCE(e.subject, '') || ' ' || COALESCE(e.body_text, '')),
    plainto_tsquery('english', $2)
  ) as rank
FROM emails e
WHERE
  e.user_id = $1
  AND to_tsvector('english', COALESCE(e.subject, '') || ' ' || COALESCE(e.body_text, ''))
      @@ plainto_tsquery('english', $2)
  AND e.deleted_at IS NULL
ORDER BY rank DESC, e.received_at DESC
LIMIT 50;
```

---

### 3. Get email thread (conversation)

```sql
WITH RECURSIVE thread AS (
  -- Anchor: original email
  SELECT id, thread_id, in_reply_to, subject, received_at
  FROM emails
  WHERE id = $1

  UNION ALL

  -- Recursive: find emails in same thread
  SELECT e.id, e.thread_id, e.in_reply_to, e.subject, e.received_at
  FROM emails e
  INNER JOIN thread t ON e.thread_id = t.thread_id
  WHERE e.id != t.id
)
SELECT * FROM thread
ORDER BY received_at ASC;
```

---

### 4. Email statistics by folder

```sql
SELECT
  f.name as folder_name,
  COUNT(e.id) as total_emails,
  COUNT(CASE WHEN e.is_read = FALSE THEN 1 END) as unread_count,
  COUNT(CASE WHEN e.has_attachment = TRUE THEN 1 END) as with_attachments
FROM folders f
LEFT JOIN emails e ON f.id = e.folder_id AND e.deleted_at IS NULL
WHERE f.user_id = $1
GROUP BY f.id, f.name
ORDER BY f.order_index;
```

---

### 5. Get most frequently contacted people

```sql
SELECT
  er.email,
  er.name,
  COUNT(*) as email_count,
  MAX(e.received_at) as last_email_at
FROM email_recipients er
JOIN emails e ON er.email_id = e.id
WHERE
  e.user_id = $1
  AND er.recipient_type = 'to'
  AND e.deleted_at IS NULL
GROUP BY er.email, er.name
ORDER BY email_count DESC
LIMIT 10;
```

---

### 6. Apply email filters

```sql
-- Get all active filters
SELECT id, conditions, actions
FROM email_filters
WHERE user_id = $1 AND is_enabled = TRUE
ORDER BY order_index ASC;

-- Example: Check if email matches filter conditions
-- (Will be processed in application code)
SELECT *
FROM emails
WHERE
  user_id = $1
  AND from_email LIKE '%@company.com%' -- condition from filter
  AND deleted_at IS NULL;
```

---

## Database Migrations

Using TypeORM migrations to manage schema changes:

```bash
# Create new migration
pnpm run migration:create --name CreateUsersTable

# Run migrations
pnpm run migration:run

# Rollback migration
pnpm run migration:revert
```

---

## Performance Optimizations

### 1. Indexes

Indexes created for:
- Primary keys (automatic)
- Foreign keys
- Frequently queried fields (user_id, folder_id, etc.)
- Full-text search
- Composite indexes for complex queries

### 2. Partitioning (Future)

With large data volumes, can partition `emails` table by time:

```sql
-- Partition by month
CREATE TABLE emails_2025_01 PARTITION OF emails
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 3. Materialized Views (Future)

Create materialized views for analytics:

```sql
CREATE MATERIALIZED VIEW email_stats AS
SELECT
  user_id,
  folder_id,
  DATE(received_at) as date,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_count
FROM emails
WHERE deleted_at IS NULL
GROUP BY user_id, folder_id, DATE(received_at);

CREATE UNIQUE INDEX ON email_stats(user_id, folder_id, date);
```

---

## Backup Strategy

### 1. Full Backup (Daily)
```bash
pg_dump -Fc cms_email_system > backup_$(date +%Y%m%d).dump
```

### 2. Incremental Backup
Use PostgreSQL WAL archiving

### 3. Point-in-Time Recovery (PITR)
Enable WAL archiving for PITR capability

---

## Data Retention Policy

### Email Data
- Active emails: Keep permanently
- Trash: Auto-delete after 30 days
- Spam: Auto-delete after 7 days

### Logs
- Audit logs: Keep 1 year
- Application logs: Keep 90 days

### Tokens
- Refresh tokens: Delete after revoked or expired
- Verification tokens: Delete after used or expired > 7 days

---

## Security Considerations

### 1. Encryption
- Passwords: bcrypt hash
- SMTP/IMAP passwords: AES-256 encryption
- Sensitive data: Column-level encryption (optional)

### 2. Access Control
- Row-level security (RLS) for multi-tenancy
- Database user permissions

### 3. SQL Injection Prevention
- Use parameterized queries (TypeORM)
- Input validation

### 4. Audit Trail
- Log all sensitive operations
- Track who, what, when

---

**Document version**: 1.1
**Last updated**: 2025-10-13
