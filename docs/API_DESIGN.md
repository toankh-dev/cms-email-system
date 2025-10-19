# API Design - CMS Email System

## Overview

RESTful API designed following REST standards, using HTTP methods (GET, POST, PUT, PATCH, DELETE) and standard status codes.

**Base URL**: `http://localhost:3000/api/v1`

**API Documentation**: Swagger UI at `http://localhost:3000/api/docs`

## Authentication

All endpoints (except Auth endpoints) require JWT token in header:

```http
Authorization: Bearer <access_token>
```

---

## 1. Authentication APIs

### 1.1. Register
Register a new account

```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-10-13T10:00:00Z"
    }
  },
  "message": "Registration successful. Please verify your email."
}
```

**Errors:**
- `400 Bad Request`: Validation error
- `409 Conflict`: Email already exists

---

### 1.2. Login
User login

```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account not verified

---

### 1.3. Refresh Token
Refresh access token

```http
POST /api/v1/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid or expired refresh token

---

### 1.4. Logout
User logout

```http
POST /api/v1/auth/logout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.5. Verify Email
Verify email address

```http
POST /api/v1/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token_string"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### 1.6. Forgot Password
Request password reset

```http
POST /api/v1/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### 1.7. Reset Password
Reset password with token

```http
POST /api/v1/auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_string",
  "newPassword": "NewSecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 2. User APIs

### 2.1. Get Current User
Get current user information

```http
GET /api/v1/users/me
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg",
    "signature": "<p>Best regards,<br>John Doe</p>",
    "settings": {
      "language": "en",
      "timezone": "Asia/Ho_Chi_Minh",
      "emailsPerPage": 50
    },
    "createdAt": "2025-10-13T10:00:00Z",
    "updatedAt": "2025-10-13T10:00:00Z"
  }
}
```

---

### 2.2. Update Profile
Update user profile

```http
PATCH /api/v1/users/me
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

---

### 2.3. Update Email Signature
Update email signature

```http
PUT /api/v1/users/me/signature
```

**Request Body:**
```json
{
  "signature": "<p>Best regards,<br>John Smith<br>CEO, Company</p>"
}
```

**Response:** `200 OK`

---

### 2.4. Update Settings
Update user settings

```http
PUT /api/v1/users/me/settings
```

**Request Body:**
```json
{
  "language": "vi",
  "timezone": "Asia/Ho_Chi_Minh",
  "emailsPerPage": 100,
  "autoReply": {
    "enabled": true,
    "message": "I'm out of office"
  }
}
```

**Response:** `200 OK`

---

### 2.5. Change Password
Change user password

```http
POST /api/v1/users/me/change-password
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:** `200 OK`

---

## 3. Email APIs

### 3.1. List Emails
Get list of emails

```http
GET /api/v1/emails?folderId=inbox&page=1&limit=50&sort=-createdAt
```

**Query Parameters:**
- `folderId` (optional): Folder ID
- `page` (default: 1): Current page
- `limit` (default: 50): Items per page
- `sort` (default: -createdAt): Sort order (-createdAt, +subject, etc.)
- `isRead` (optional): true/false
- `isStarred` (optional): true/false
- `hasAttachment` (optional): true/false

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "subject": "Meeting tomorrow",
        "from": {
          "name": "Jane Doe",
          "email": "jane@example.com"
        },
        "to": [
          {
            "name": "John Doe",
            "email": "john@example.com"
          }
        ],
        "snippet": "Hi John, Let's meet tomorrow at 10 AM...",
        "isRead": false,
        "isStarred": true,
        "hasAttachment": true,
        "labels": ["Work", "Important"],
        "folder": {
          "id": "uuid",
          "name": "Inbox"
        },
        "createdAt": "2025-10-13T10:00:00Z"
      }
    ],
    "meta": {
      "total": 250,
      "page": 1,
      "limit": 50,
      "totalPages": 5
    }
  }
}
```

---

### 3.2. Get Email Detail
Get email details

```http
GET /api/v1/emails/:id
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subject": "Meeting tomorrow",
    "from": {
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "to": [
      {
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "cc": [],
    "bcc": [],
    "replyTo": "jane@example.com",
    "body": {
      "html": "<p>Hi John,</p><p>Let's meet tomorrow at 10 AM...</p>",
      "text": "Hi John, Let's meet tomorrow at 10 AM..."
    },
    "attachments": [
      {
        "id": "uuid",
        "filename": "document.pdf",
        "size": 102400,
        "contentType": "application/pdf",
        "url": "/api/v1/attachments/uuid/download"
      }
    ],
    "isRead": false,
    "isStarred": true,
    "labels": ["Work", "Important"],
    "folder": {
      "id": "uuid",
      "name": "Inbox"
    },
    "threadId": "thread-uuid",
    "inReplyTo": null,
    "createdAt": "2025-10-13T10:00:00Z",
    "updatedAt": "2025-10-13T10:00:00Z"
  }
}
```

---

### 3.3. Send Email
Send a new email

```http
POST /api/v1/emails/send
```

**Request Body:**
```json
{
  "to": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  ],
  "cc": [],
  "bcc": [],
  "subject": "Hello from API",
  "body": {
    "html": "<p>This is the <strong>HTML</strong> body</p>",
    "text": "This is the text body"
  },
  "attachments": ["attachment-uuid-1", "attachment-uuid-2"],
  "scheduledAt": null
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subject": "Hello from API",
    "status": "sent",
    "sentAt": "2025-10-13T10:05:00Z"
  },
  "message": "Email sent successfully"
}
```

---

### 3.4. Reply to Email
Reply to an email

```http
POST /api/v1/emails/:id/reply
```

**Request Body:**
```json
{
  "body": {
    "html": "<p>Thanks for your email!</p>",
    "text": "Thanks for your email!"
  },
  "replyAll": false,
  "attachments": []
}
```

**Response:** `201 Created`

---

### 3.5. Forward Email
Forward an email

```http
POST /api/v1/emails/:id/forward
```

**Request Body:**
```json
{
  "to": [
    {
      "name": "Bob Smith",
      "email": "bob@example.com"
    }
  ],
  "body": {
    "html": "<p>Please see the email below.</p>",
    "text": "Please see the email below."
  }
}
```

**Response:** `201 Created`

---

### 3.6. Save Draft
Save email draft

```http
POST /api/v1/emails/drafts
PUT /api/v1/emails/drafts/:id
```

**Request Body:**
```json
{
  "to": [{"email": "jane@example.com"}],
  "subject": "Draft subject",
  "body": {
    "html": "<p>Draft content...</p>"
  }
}
```

**Response:** `200 OK` / `201 Created`

---

### 3.7. Delete Email
Delete email (move to Trash)

```http
DELETE /api/v1/emails/:id
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email moved to trash"
}
```

---

### 3.8. Permanently Delete
Permanently delete email

```http
DELETE /api/v1/emails/:id/permanent
```

**Response:** `200 OK`

---

### 3.9. Mark as Read/Unread
Mark email as read or unread

```http
PATCH /api/v1/emails/:id/read
PATCH /api/v1/emails/:id/unread
```

**Response:** `200 OK`

---

### 3.10. Star/Unstar Email
Star or unstar email

```http
PATCH /api/v1/emails/:id/star
PATCH /api/v1/emails/:id/unstar
```

**Response:** `200 OK`

---

### 3.11. Move to Folder
Move email to another folder

```http
PATCH /api/v1/emails/:id/move
```

**Request Body:**
```json
{
  "folderId": "folder-uuid"
}
```

**Response:** `200 OK`

---

### 3.12. Bulk Actions
Perform bulk operations on emails

```http
POST /api/v1/emails/bulk
```

**Request Body:**
```json
{
  "emailIds": ["uuid1", "uuid2", "uuid3"],
  "action": "markAsRead",
  "folderId": "folder-uuid"
}
```

**Available Actions:**
- `markAsRead`
- `markAsUnread`
- `delete`
- `move` (requires folderId)
- `star`
- `unstar`

**Response:** `200 OK`

---

### 3.13. Search Emails
Search emails

```http
GET /api/v1/emails/search?q=meeting&from=jane@example.com&hasAttachment=true
```

**Query Parameters:**
- `q`: Search keyword
- `from`: Sender email
- `to`: Recipient email
- `subject`: Search in subject
- `body`: Search in body
- `hasAttachment`: true/false
- `dateFrom`: From date (YYYY-MM-DD)
- `dateTo`: To date (YYYY-MM-DD)
- `folderId`: Search in folder
- `labelIds`: Search by labels

**Response:** `200 OK` (same format as List Emails)

---

## 4. Folder APIs

### 4.1. List Folders
Get list of folders

```http
GET /api/v1/folders
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Inbox",
      "type": "system",
      "icon": "inbox",
      "color": null,
      "unreadCount": 15,
      "totalCount": 250,
      "parentId": null,
      "order": 1
    },
    {
      "id": "uuid",
      "name": "Work",
      "type": "custom",
      "icon": "folder",
      "color": "#FF5733",
      "unreadCount": 5,
      "totalCount": 50,
      "parentId": null,
      "order": 10
    }
  ]
}
```

---

### 4.2. Create Folder
Create a new folder

```http
POST /api/v1/folders
```

**Request Body:**
```json
{
  "name": "Personal",
  "color": "#3498db",
  "parentId": null
}
```

**Response:** `201 Created`

---

### 4.3. Update Folder
Update folder

```http
PATCH /api/v1/folders/:id
```

**Request Body:**
```json
{
  "name": "Personal Projects",
  "color": "#2ecc71"
}
```

**Response:** `200 OK`

---

### 4.4. Delete Folder
Delete folder (moves emails to Inbox)

```http
DELETE /api/v1/folders/:id
```

**Response:** `200 OK`

---

## 5. Label APIs

### 5.1. List Labels
Get list of labels

```http
GET /api/v1/labels
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Important",
      "color": "#e74c3c",
      "order": 1,
      "emailCount": 25
    },
    {
      "id": "uuid",
      "name": "Work",
      "color": "#3498db",
      "order": 2,
      "emailCount": 150
    }
  ]
}
```

---

### 5.2. Create Label
Create a new label

```http
POST /api/v1/labels
```

**Request Body:**
```json
{
  "name": "Urgent",
  "color": "#e74c3c"
}
```

**Response:** `201 Created`

---

### 5.3. Update Label
Update label

```http
PATCH /api/v1/labels/:id
```

**Request Body:**
```json
{
  "name": "High Priority",
  "color": "#c0392b"
}
```

**Response:** `200 OK`

---

### 5.4. Delete Label
Delete label

```http
DELETE /api/v1/labels/:id
```

**Response:** `200 OK`

---

### 5.5. Assign Labels to Email
Assign labels to an email

```http
POST /api/v1/emails/:emailId/labels
```

**Request Body:**
```json
{
  "labelIds": ["label-uuid-1", "label-uuid-2"]
}
```

**Response:** `200 OK`

---

### 5.6. Remove Label from Email
Remove label from email

```http
DELETE /api/v1/emails/:emailId/labels/:labelId
```

**Response:** `200 OK`

---

## 6. Contact APIs

### 6.1. List Contacts
Get list of contacts

```http
GET /api/v1/contacts?page=1&limit=50&search=john
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+84 123 456 789",
        "company": "ABC Corp",
        "avatar": "https://example.com/avatar.jpg",
        "groups": ["Friends", "Work"],
        "createdAt": "2025-10-13T10:00:00Z"
      }
    ],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 50
    }
  }
}
```

---

### 6.2. Get Contact Detail
Get contact details

```http
GET /api/v1/contacts/:id
```

**Response:** `200 OK`

---

### 6.3. Create Contact
Create a new contact

```http
POST /api/v1/contacts
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+84 987 654 321",
  "company": "XYZ Inc",
  "notes": "Met at conference 2024"
}
```

**Response:** `201 Created`

---

### 6.4. Update Contact
Update contact

```http
PATCH /api/v1/contacts/:id
```

**Response:** `200 OK`

---

### 6.5. Delete Contact
Delete contact

```http
DELETE /api/v1/contacts/:id
```

**Response:** `200 OK`

---

### 6.6. Import Contacts
Import contacts from CSV/vCard

```http
POST /api/v1/contacts/import
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file`: CSV/vCard file
- `format`: "csv" | "vcard"

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "imported": 50,
    "failed": 2,
    "errors": [
      {
        "row": 5,
        "email": "invalid-email",
        "reason": "Invalid email format"
      }
    ]
  }
}
```

---

### 6.7. Export Contacts
Export contacts

```http
GET /api/v1/contacts/export?format=csv
```

**Query Parameters:**
- `format`: "csv" | "vcard"

**Response:** File download (CSV/vCard)

---

## 7. Calendar APIs

### 7.1. List Events
Get list of calendar events

```http
GET /api/v1/calendar/events?from=2025-01-01&to=2025-01-31
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Team Meeting",
      "description": "Weekly team sync",
      "startTime": "2025-01-15T10:00:00Z",
      "endTime": "2025-01-15T11:00:00Z",
      "location": "Meeting Room A",
      "attendees": [
        {
          "email": "john@example.com",
          "status": "accepted"
        }
      ],
      "reminders": [
        {
          "type": "email",
          "minutes": 15
        }
      ],
      "isAllDay": false,
      "recurrence": null,
      "createdAt": "2025-10-13T10:00:00Z"
    }
  ]
}
```

---

### 7.2. Create Event
Create a new calendar event

```http
POST /api/v1/calendar/events
```

**Request Body:**
```json
{
  "title": "Project Review",
  "description": "Q1 project review meeting",
  "startTime": "2025-01-20T14:00:00Z",
  "endTime": "2025-01-20T15:30:00Z",
  "location": "Conference Room B",
  "attendees": [
    {
      "email": "jane@example.com",
      "optional": false
    }
  ],
  "reminders": [
    {
      "type": "email",
      "minutes": 30
    },
    {
      "type": "notification",
      "minutes": 10
    }
  ],
  "recurrence": null
}
```

**Response:** `201 Created`

---

### 7.3. Update Event
Update calendar event

```http
PATCH /api/v1/calendar/events/:id
```

**Response:** `200 OK`

---

### 7.4. Delete Event
Delete calendar event

```http
DELETE /api/v1/calendar/events/:id
```

**Response:** `200 OK`

---

### 7.5. Respond to Event Invitation
Respond to event invitation

```http
POST /api/v1/calendar/events/:id/respond
```

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Available Statuses:**
- `accepted`
- `declined`
- `tentative`

**Response:** `200 OK`

---

## 8. Template APIs

### 8.1. List Templates
Get list of email templates

```http
GET /api/v1/templates
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Welcome Email",
      "subject": "Welcome to {{company}}",
      "body": "<p>Hi {{firstName}},</p><p>Welcome to our platform!</p>",
      "category": "Onboarding",
      "variables": ["firstName", "company"],
      "createdAt": "2025-10-13T10:00:00Z"
    }
  ]
}
```

---

### 8.2. Create Template
Create a new email template

```http
POST /api/v1/templates
```

**Request Body:**
```json
{
  "name": "Meeting Reminder",
  "subject": "Reminder: Meeting on {{date}}",
  "body": "<p>Hi {{name}},</p><p>This is a reminder for our meeting on {{date}} at {{time}}.</p>",
  "category": "Meetings"
}
```

**Response:** `201 Created`

---

### 8.3. Use Template
Use template to compose email

```http
POST /api/v1/templates/:id/use
```

**Request Body:**
```json
{
  "variables": {
    "firstName": "John",
    "company": "ABC Corp"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "subject": "Welcome to ABC Corp",
    "body": "<p>Hi John,</p><p>Welcome to our platform!</p>"
  }
}
```

---

## 9. Filter APIs

### 9.1. List Filters
Get list of email filters/rules

```http
GET /api/v1/filters
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Work Emails",
      "enabled": true,
      "conditions": [
        {
          "field": "from",
          "operator": "contains",
          "value": "@company.com"
        }
      ],
      "actions": [
        {
          "type": "move",
          "folderId": "work-folder-uuid"
        },
        {
          "type": "addLabel",
          "labelId": "work-label-uuid"
        }
      ],
      "order": 1
    }
  ]
}
```

---

### 9.2. Create Filter
Create a new email filter

```http
POST /api/v1/filters
```

**Request Body:**
```json
{
  "name": "Newsletter Auto-Archive",
  "enabled": true,
  "conditions": [
    {
      "field": "subject",
      "operator": "contains",
      "value": "newsletter"
    }
  ],
  "actions": [
    {
      "type": "move",
      "folderId": "archive-folder-uuid"
    },
    {
      "type": "markAsRead"
    }
  ]
}
```

**Response:** `201 Created`

---

## 10. Attachment APIs

### 10.1. Upload Attachment
Upload file attachment

```http
POST /api/v1/attachments/upload
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file`: File to upload (max 25MB)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "document.pdf",
    "size": 102400,
    "contentType": "application/pdf",
    "url": "/api/v1/attachments/uuid/download",
    "uploadedAt": "2025-10-13T10:00:00Z"
  }
}
```

---

### 10.2. Download Attachment
Download file attachment

```http
GET /api/v1/attachments/:id/download
```

**Response:** File stream

---

### 10.3. Delete Attachment
Delete unsent attachment

```http
DELETE /api/v1/attachments/:id
```

**Response:** `200 OK`

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2025-10-13T10:00:00Z",
  "path": "/api/v1/emails"
}
```

### Common Error Codes

| HTTP Status | Code | Message |
|-------------|------|---------|
| 400 | BAD_REQUEST | Invalid request parameters |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Access denied |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | VALIDATION_ERROR | Validation failed |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Internal server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Rate Limiting

The API uses rate limiting to protect the system:

- **Default**: 100 requests / 15 minutes per user
- **Send Email**: 50 emails / hour per user
- **Upload**: 20 uploads / hour per user

Response headers when rate limited:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1673614800
```

HTTP Status: `429 Too Many Requests`

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` (default: 1): Current page
- `limit` (default: 50, max: 100): Items per page

**Response:**
```json
{
  "data": {
    "items": [...],
    "meta": {
      "total": 250,
      "page": 1,
      "limit": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Sorting

List endpoints support sorting via `sort` parameter:

```
?sort=-createdAt,+subject
```

- `-`: Descending order
- `+`: Ascending order

---

## Filtering

Some endpoints support filtering:

```
?isRead=true&isStarred=false&hasAttachment=true
```

---

## Webhooks (Future)

The system will support webhooks for event notifications:

- `email.received`: When new email is received
- `email.sent`: When email is sent successfully
- `calendar.event.created`: When new event is created
- `calendar.event.reminder`: Before event (X minutes)

---

**Document version**: 1.1
**Last updated**: 2025-10-13
