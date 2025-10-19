# Features Specification - CMS Email System

## Tổng quan

Document này mô tả chi tiết các tính năng của hệ thống Email Management, user flows, và use cases.

---

## 1. Email Management

### 1.1. Email Composer

**Mô tả:**
Soạn email mới với rich text editor hỗ trợ formatting, emoji, và attachments.

**User Flow:**
```
1. User clicks "Compose" button
2. Composer window opens (modal or full-page)
3. User fills in:
   - To (multiple recipients, autocomplete from contacts)
   - Cc (optional)
   - Bcc (optional)
   - Subject
   - Body (rich text editor)
4. User can:
   - Format text (bold, italic, underline, colors, fonts)
   - Insert emojis
   - Add attachments (drag & drop or browse)
   - Insert images inline
   - Add links
   - Use email templates
5. Auto-save to Drafts every 30 seconds
6. User clicks "Send" or "Schedule"
7. Email is sent via SMTP or scheduled
```

**Technical Details:**
- Rich text editor: TinyMCE, CKEditor, hoặc Quill
- Max body size: 10MB
- Auto-save: Debounced 30s
- Attachment upload: Chunked upload cho files lớn
- Draft saved in `emails` table với `is_draft=true`

**API Endpoints:**
- `POST /api/v1/emails/send`
- `POST /api/v1/emails/drafts`
- `PUT /api/v1/emails/drafts/:id`

---

### 1.2. Receive Emails (IMAP)

**Mô tả:**
Tự động nhận email từ email server qua IMAP protocol.

**User Flow:**
```
1. User configures email account (IMAP settings)
2. System connects to IMAP server
3. Background job polls for new emails every 30s
4. New emails are:
   - Downloaded and parsed (MIME)
   - Checked against filters/rules
   - Saved to database (Inbox folder)
   - User notified (WebSocket/Push notification)
5. User sees new email in Inbox
```

**Technical Details:**
- IMAP library: `node-imap`
- Polling interval: 30 seconds (configurable)
- Alternative: IMAP IDLE command (real-time)
- MIME parsing: `mailparser`
- Attachments: Saved to storage (local/S3)
- Email threading: Group by `In-Reply-To` header

**Background Job:**
```typescript
@Processor('email-fetch')
export class EmailFetchProcessor {
  @Process('fetch-new-emails')
  async handleFetch(job: Job) {
    const account = job.data.emailAccount;
    const imap = await this.imapService.connect(account);
    const newEmails = await imap.fetchUnseen();

    for (const email of newEmails) {
      await this.emailService.saveIncoming(email);
    }
  }
}
```

---

### 1.3. Email Threading (Conversation View)

**Mô tả:**
Nhóm các email có liên quan thành một conversation (thread).

**User Flow:**
```
1. User receives/sends email
2. System identifies thread using:
   - Message-ID
   - In-Reply-To header
   - References header
   - Subject similarity
3. Emails are grouped by thread_id
4. User sees conversation view:
   - Original email
   - All replies (collapsed/expanded)
   - Reply inline in conversation
```

**Technical Details:**
```typescript
// Thread detection algorithm
function detectThread(email: Email): string {
  // 1. Check In-Reply-To header
  if (email.inReplyTo) {
    const parent = await findEmailByMessageId(email.inReplyTo);
    if (parent) return parent.threadId;
  }

  // 2. Check References header
  if (email.references) {
    const refs = email.references.split(' ');
    for (const ref of refs) {
      const related = await findEmailByMessageId(ref);
      if (related) return related.threadId;
    }
  }

  // 3. Subject-based matching (fuzzy)
  const cleanSubject = email.subject.replace(/^(Re:|Fwd:)\s*/i, '').trim();
  const similar = await findEmailsBySimilarSubject(cleanSubject);
  if (similar.length > 0) return similar[0].threadId;

  // 4. Create new thread
  return generateThreadId();
}
```

---

### 1.4. Email Search

**Mô tả:**
Tìm kiếm email với full-text search và advanced filters.

**User Flow:**
```
1. User enters search query in search box
2. User can add filters:
   - From: specific sender
   - To: specific recipient
   - Date range
   - Has attachment
   - Folder
   - Labels
3. System performs search:
   - Full-text search in subject & body
   - Filter by metadata
   - Rank by relevance
4. Results displayed with highlights
5. User can save search query for later
```

**Technical Details:**
- PostgreSQL full-text search với `tsvector`
- Index: GIN index on search fields
- Ranking: `ts_rank` function
- Highlight: `ts_headline` function

**Search Query:**
```sql
SELECT
  id, subject, snippet,
  ts_rank(
    to_tsvector('english', subject || ' ' || body_text),
    plainto_tsquery('english', $1)
  ) as rank,
  ts_headline(
    'english',
    body_text,
    plainto_tsquery('english', $1),
    'MaxWords=50, MinWords=20'
  ) as highlighted_snippet
FROM emails
WHERE
  user_id = $2
  AND to_tsvector('english', subject || ' ' || body_text)
      @@ plainto_tsquery('english', $1)
ORDER BY rank DESC, received_at DESC
LIMIT 50;
```

---

### 1.5. Email Actions

**Supported Actions:**

#### Reply
```
1. User clicks "Reply" on email
2. Composer opens with:
   - To: Original sender
   - Subject: "Re: [original subject]"
   - Body: Quoted original email
3. User types reply and sends
```

#### Reply All
```
Same as Reply, but includes all original recipients (To + Cc)
```

#### Forward
```
1. User clicks "Forward"
2. Composer opens with:
   - Subject: "Fwd: [original subject]"
   - Body: Quoted original email with attachments
3. User adds recipients and sends
```

#### Mark as Read/Unread
```
Toggle is_read flag
Update unread_count in folder
```

#### Star/Unstar
```
Toggle is_starred flag
```

#### Move to Folder
```
Update folder_id
Invalidate folder cache
```

#### Delete (Soft Delete)
```
1. Move to Trash folder
2. Auto-delete from Trash after 30 days
```

#### Permanently Delete
```
1. Delete from database
2. Delete attachments from storage
3. Cannot be undone
```

---

## 2. Folder Management

### 2.1. System Folders

**Default Folders:**
- **Inbox**: Nơi nhận email mới
- **Sent**: Email đã gửi
- **Drafts**: Email nháp (chưa gửi)
- **Trash**: Email đã xóa (soft delete)
- **Spam**: Email spam (auto-detected hoặc manual)
- **Archive**: Email lưu trữ (optional)

**Rules:**
- System folders không thể xóa
- Có thể rename (optional)
- Order cố định

### 2.2. Custom Folders

**User Flow:**
```
1. User clicks "New Folder"
2. Enter folder name
3. Choose parent folder (optional, for hierarchy)
4. Choose color/icon
5. Folder created
6. User can drag & drop emails into folder
```

**Features:**
- Unlimited custom folders
- Nested folders (max depth: 5)
- Drag & drop to reorder
- Color coding
- Custom icons

**API:**
- `POST /api/v1/folders`
- `PATCH /api/v1/folders/:id`
- `DELETE /api/v1/folders/:id` (moves emails to Inbox)

---

## 3. Labels & Categories

### 3.1. Labels

**Mô tả:**
Tags/labels để categorize emails (many-to-many relationship).

**User Flow:**
```
1. User creates labels:
   - Name: "Work", "Personal", "Important"
   - Color: Choose from palette
2. User applies labels to emails:
   - Single email: Click label icon, select labels
   - Multiple emails: Select emails, bulk apply label
3. Filter emails by label in sidebar
```

**Features:**
- Unlimited labels per user
- Multiple labels per email
- Color-coded
- Quick filters in sidebar
- Label usage statistics

**Use Cases:**
- Work vs Personal
- Projects (Project A, Project B)
- Priority (High, Medium, Low)
- Status (Todo, In Progress, Done)

---

## 4. Email Filters & Rules

### 4.1. Auto-Categorization

**Mô tả:**
Tự động phân loại email dựa trên rules.

**User Flow:**
```
1. User creates filter:
   - Name: "Work Emails"
   - Conditions: From contains "@company.com"
   - Actions: Move to "Work" folder + Add "Work" label
2. Enable filter
3. All incoming emails matching condition are auto-processed
4. User can manually apply filter to existing emails
```

**Condition Types:**
- From (email address or domain)
- To
- Subject (contains, equals, regex)
- Body (contains keywords)
- Has attachment
- Size (greater than, less than)
- Date range

**Action Types:**
- Move to folder
- Add label
- Mark as read
- Star
- Forward to address
- Delete
- Mark as spam

**Match Types:**
- Match ALL conditions (AND)
- Match ANY condition (OR)

**Example Rules:**
```typescript
{
  name: "Newsletter Auto-Archive",
  conditions: [
    { field: "subject", operator: "contains", value: "Newsletter" },
    { field: "from", operator: "contains", value: "newsletter@" }
  ],
  actions: [
    { type: "move", folderId: "archive-folder-id" },
    { type: "markAsRead" }
  ],
  matchType: "any"
}
```

---

### 4.2. Spam Detection

**Mô tả:**
Tự động phát hiện và lọc email spam.

**Methods:**

**1. Rule-based:**
```typescript
const spamKeywords = [
  'congratulations you won',
  'click here now',
  'limited time offer',
  'act now',
  'free money'
];

function isSpam(email: Email): boolean {
  const body = email.bodyText.toLowerCase();
  const subject = email.subject.toLowerCase();

  // Check spam keywords
  for (const keyword of spamKeywords) {
    if (body.includes(keyword) || subject.includes(keyword)) {
      return true;
    }
  }

  // Check suspicious links
  const linkCount = (body.match(/http/g) || []).length;
  if (linkCount > 10) return true;

  // Check all caps subject
  if (email.subject === email.subject.toUpperCase()) return true;

  return false;
}
```

**2. ML-based (Future):**
- Train model với spam/ham dataset
- Feature extraction: keywords, link density, sender reputation
- Classification: Naive Bayes, SVM, hoặc Neural Network

**User Actions:**
- Mark as spam (moves to Spam folder)
- Not spam (moves back to Inbox, trains model)
- Block sender (auto-spam all future emails)

---

### 4.3. Auto-Reply

**Mô tả:**
Tự động trả lời email dựa trên conditions.

**Use Cases:**
- Out of office message
- Auto-acknowledgment ("We received your inquiry")
- Auto-reply to specific senders

**User Flow:**
```
1. User enables auto-reply
2. Set message template
3. Optional: Set conditions (date range, specific senders)
4. System auto-replies to matching emails
5. Track auto-reply history
```

**Configuration:**
```typescript
{
  enabled: true,
  message: {
    subject: "Re: ${originalSubject}",
    body: "Thank you for your email. I'm currently out of office..."
  },
  conditions: {
    dateRange: {
      from: "2025-01-15",
      to: "2025-01-20"
    },
    maxRepliesPerSender: 1 // Only reply once per sender
  }
}
```

---

## 5. Contact Management

### 5.1. Contact CRUD

**User Flow:**
```
1. User goes to Contacts page
2. View all contacts in list/grid view
3. Search contacts by name/email/company
4. Add new contact:
   - First name, Last name
   - Email (required, unique)
   - Phone
   - Company, Job title
   - Avatar
   - Notes
5. Edit/Delete contact
```

**Features:**
- Contact avatar upload
- Quick add from email sender
- Merge duplicate contacts
- Contact history (emails sent/received)

---

### 5.2. Contact Groups

**User Flow:**
```
1. User creates groups:
   - Friends
   - Family
   - Work Team
   - Clients
2. Add contacts to groups (multiple groups per contact)
3. Send email to entire group
4. Filter contacts by group
```

---

### 5.3. Import/Export

**Import:**
```
1. User uploads CSV or vCard file
2. System parses file
3. Preview imported contacts
4. Map columns (CSV):
   - First Name → firstName
   - Email → email
5. Import with duplicate detection
6. Show import summary (success/failed)
```

**CSV Format:**
```csv
firstName,lastName,email,phone,company
John,Doe,john@example.com,+1234567890,Acme Inc
Jane,Smith,jane@example.com,+0987654321,Tech Corp
```

**Export:**
```
1. User selects contacts (or all)
2. Choose format: CSV or vCard (.vcf)
3. Download file
```

---

## 6. Calendar Integration

### 6.1. Event Management

**User Flow:**
```
1. User goes to Calendar view
2. View events by:
   - Day view (today's schedule)
   - Week view (7 days)
   - Month view (calendar grid)
3. Create event:
   - Title
   - Description
   - Start time, End time
   - Location
   - Attendees (from contacts)
   - Reminders (15 min, 30 min, 1 hour, 1 day)
   - Recurrence (daily, weekly, monthly)
4. Send invitations to attendees via email
5. Attendees can accept/decline/tentative
```

**Event Types:**
- Meeting
- Appointment
- Task
- All-day event

---

### 6.2. Meeting Invitations

**User Flow:**

**Organizer:**
```
1. Create event with attendees
2. System sends invitation emails with:
   - Event details
   - iCal attachment (.ics)
   - Accept/Decline/Tentative buttons
3. Track attendee responses
4. Update event if needed (sends update email)
```

**Attendee:**
```
1. Receive invitation email
2. Click Accept/Decline/Tentative
3. Event added to calendar (if accepted)
4. Organizer notified of response
```

**Email Format:**
```
Subject: Invitation: Team Meeting @ Mon Jan 15, 2025 10:00 AM

You have been invited to the following event:

Title: Team Meeting
Time: Monday, January 15, 2025 10:00 AM - 11:00 AM (GMT+7)
Location: Conference Room A
Organizer: john@example.com

Description:
Quarterly planning meeting

[Accept] [Decline] [Tentative]
```

---

### 6.3. Reminders

**Types:**
- Email reminder
- Push notification (if mobile app)
- Desktop notification

**Timing:**
- 15 minutes before
- 30 minutes before
- 1 hour before
- 1 day before
- Custom

**Implementation:**
```typescript
@Processor('event-reminders')
export class ReminderProcessor {
  @Cron('* * * * *') // Every minute
  async checkReminders() {
    const now = new Date();
    const upcomingEvents = await this.eventRepository.find({
      where: {
        startTime: Between(now, addMinutes(now, 60))
      }
    });

    for (const event of upcomingEvents) {
      const reminders = event.reminders.filter(
        r => !r.isSent && shouldSendNow(r, event.startTime)
      );

      for (const reminder of reminders) {
        await this.sendReminder(event, reminder);
        reminder.isSent = true;
      }
    }
  }
}
```

---

## 7. Email Templates

### 7.1. Template Management

**User Flow:**
```
1. User creates template:
   - Name: "Meeting Request"
   - Subject: "Meeting on {{date}}"
   - Body: "Hi {{firstName}}, Let's meet on {{date}} at {{time}}..."
   - Category: "Meetings"
2. Save template
3. When composing email:
   - Click "Templates" button
   - Select template
   - Fill in variables
   - Send
```

**Variable System:**
```typescript
interface TemplateVariables {
  // User variables
  firstName: string;
  lastName: string;
  email: string;

  // Dynamic variables
  date: string;
  time: string;
  company: string;

  // Custom variables
  [key: string]: any;
}

function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}
```

**Categories:**
- Welcome emails
- Meeting requests
- Follow-ups
- Newsletters
- Support responses

---

### 7.2. Template Sharing (Future)

- Share templates with team
- Public template marketplace
- Import/Export templates

---

## 8. Attachments

### 8.1. Upload

**User Flow:**
```
1. User attaches files:
   - Click "Attach" button
   - Browse files or drag & drop
2. Files uploaded to server:
   - Progress bar shown
   - Multiple files supported
3. Files appear in attachment list
4. User can remove attachments before sending
```

**Constraints:**
- Max file size: 25MB per file
- Max total size: 100MB per email
- Allowed types: All (configurable)
- Virus scanning before save

**Implementation:**
```typescript
@Post('attachments/upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: User
) {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException('File too large');
  }

  // Scan for virus
  const isSafe = await this.virusScanService.scan(file.buffer);
  if (!isSafe) {
    throw new BadRequestException('File contains malware');
  }

  // Save to storage
  const attachment = await this.attachmentService.save(file, user.id);

  return attachment;
}
```

---

### 8.2. Download

**User Flow:**
```
1. User clicks on attachment name/icon
2. File downloads to browser
3. Browser opens/saves file based on type
```

**Inline Attachments:**
- Images displayed inline in email body
- CID (Content-ID) reference: `<img src="cid:image123">`

---

### 8.3. Preview

**Supported Types:**
- Images: PNG, JPG, GIF (inline preview)
- PDFs: PDF.js viewer
- Documents: Office files (Word, Excel) → Convert to PDF → Preview
- Text files: Syntax highlighted preview

**Not Supported:**
- Video: Download only
- Audio: Download only
- Executables: Download only (with warning)

---

## 9. Advanced Features

### 9.1. Email Scheduling

**User Flow:**
```
1. User composes email
2. Click "Schedule" instead of "Send"
3. Choose date & time
4. Email saved with scheduled_at timestamp
5. Background job sends at scheduled time
```

**Implementation:**
```typescript
@Processor('scheduled-emails')
export class ScheduledEmailProcessor {
  @Cron('* * * * *') // Every minute
  async processScheduled() {
    const now = new Date();
    const scheduledEmails = await this.emailRepository.find({
      where: {
        scheduledAt: LessThanOrEqual(now),
        status: 'scheduled'
      }
    });

    for (const email of scheduledEmails) {
      await this.emailService.send(email);
      email.status = 'sent';
      email.sentAt = new Date();
      await this.emailRepository.save(email);
    }
  }
}
```

---

### 9.2. Undo Send

**User Flow:**
```
1. User sends email
2. "Undo" button appears for 10 seconds
3. User can click "Undo" to cancel send
4. Email moved back to Drafts
```

**Implementation:**
- Email added to queue with delay: 10 seconds
- If undo clicked, remove from queue
- Otherwise, send after delay

---

### 9.3. Email Snooze

**User Flow:**
```
1. User clicks "Snooze" on email
2. Choose snooze time:
   - Later today (6 PM)
   - Tomorrow (8 AM)
   - This weekend (Sat 8 AM)
   - Next week (Mon 8 AM)
   - Custom date & time
3. Email hidden from Inbox
4. Reappears at snooze time (marked as unread)
```

---

### 9.4. Read Receipts (Future)

**User Flow:**
```
1. User enables "Request read receipt" when sending
2. Recipient opens email
3. Tracking pixel/link records open
4. Sender notified: "Email read by recipient at [time]"
```

**Privacy Consideration:**
- Respect user privacy
- Allow users to disable sending read receipts
- Comply with GDPR

---

### 9.5. Multi-Account Support

**User Flow:**
```
1. User adds multiple email accounts:
   - personal@gmail.com
   - work@company.com
2. Each account has separate:
   - Inbox
   - Folders
   - Settings
3. Unified Inbox (optional):
   - All emails from all accounts in one view
4. When composing, choose "From" account
```

**Implementation:**
- `email_accounts` table links to `users`
- `emails.email_account_id` references which account
- Separate SMTP/IMAP connections per account

---

## 10. Analytics & Insights (Future)

### 10.1. Email Statistics

**Metrics:**
- Total emails sent/received
- Average response time
- Most active contacts
- Email volume by day/week/month
- Attachment usage
- Label/Folder distribution

**Visualization:**
- Charts (line, bar, pie)
- Heatmap (activity by hour/day)
- Trends over time

---

### 10.2. Smart Inbox (AI-powered)

**Features:**
- Priority inbox (important emails first)
- Smart categorization (Primary, Social, Promotions)
- Email summarization (TL;DR)
- Suggested replies
- Sentiment analysis

**Implementation:**
- Machine learning models
- NLP (Natural Language Processing)
- Training data from user behavior

---

## Summary

CMS Email System cung cấp đầy đủ tính năng của một email client hiện đại:

✅ **Core Features:**
- Email send/receive (SMTP/IMAP)
- Rich text composer
- Folder & label management
- Full-text search
- Email threading
- Contact management
- Calendar integration

✅ **Advanced Features:**
- Email filters & auto-categorization
- Spam detection
- Auto-reply
- Email templates
- Scheduled emails
- Multi-account support

✅ **Future Enhancements:**
- AI-powered features
- Mobile app
- Team collaboration
- Advanced analytics
- Integration với third-party services (Slack, Trello, etc.)

---

**Document version**: 1.0
**Last updated**: 2025-01-13
