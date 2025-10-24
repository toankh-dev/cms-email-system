# Email Service Testing Guide

Hướng dẫn chi tiết để testing Email Service v0.3.0

## 📋 Prerequisites

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Setup MongoDB
Email Service sử dụng MongoDB. Đảm bảo MongoDB đang chạy:

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use existing MongoDB instance
```

### 3. Configure Environment Variables

Tạo file `.env` trong root project:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cms-email-system

# Email Service
EMAIL_SERVICE_PORT=3002

# Optional: Redis for Bull Queue (future)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Setup Gmail App Password (Nếu test với Gmail)

1. Bật 2-Factor Authentication tại Google Account
2. Tạo App Password:
   - Truy cập: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và thiết bị của bạn
   - Copy password 16 ký tự
3. Sử dụng App Password này (không phải mật khẩu Gmail thường)

**QUAN TRỌNG**: KHÔNG commit App Password vào Git!

## 🚀 Start Email Service

### Build và Run
```bash
# Build
pnpm run build email-service

# Run in development mode
pnpm run start:dev email-service

# Or run specific service
cd apps/email-service
pnpm start:dev
```

Service sẽ chạy tại: **http://localhost:3002**

### Verify Service Started
```bash
curl http://localhost:3002
# Should return: {"message":"Email Service is running"}
```

### Access Swagger Documentation
Mở browser: **http://localhost:3002/api/emails/docs**

## 🧪 Testing với REST Client (VS Code)

### 1. Install VS Code Extension
- Extension: "REST Client" by Huachao Mao
- Hoặc tìm trong Extensions: `humao.rest-client`

### 2. Open Test File
Mở file `test-apis.http` trong VS Code

### 3. Testing Workflow

#### Step 1: Test Connection (QUAN TRỌNG!)
```http
POST http://localhost:3002/api/emails/accounts/test-connection
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "password": "your-app-password",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  },
  "imap": {
    "host": "imap.gmail.com",
    "port": 993,
    "tls": true
  }
}
```

**Kết quả mong đợi**:
```json
{
  "smtp": true,
  "imap": true,
  "message": "Both SMTP and IMAP connections successful"
}
```

#### Step 2: Create Email Account
Nếu connection test thành công, tạo email account:

```http
POST http://localhost:3002/api/emails/accounts
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "displayName": "My Gmail Account",
  "username": "your-email@gmail.com",
  "password": "your-app-password",
  "smtpConfig": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  },
  "imapConfig": {
    "host": "imap.gmail.com",
    "port": 993,
    "tls": true
  }
}
```

**Lưu lại `emailAccountId`** từ response!

#### Step 3: Initialize Folders
```http
POST http://localhost:3002/api/emails/folders/initialize/{emailAccountId}
```

Tạo 6 system folders: INBOX, SENT, DRAFTS, TRASH, SPAM, ARCHIVE

#### Step 4: Send Test Email
```http
POST http://localhost:3002/api/emails/emails/send
Content-Type: application/json

{
  "emailAccountId": "{your-email-account-id}",
  "from": {
    "email": "your-email@gmail.com",
    "name": "Your Name"
  },
  "to": [
    {
      "email": "recipient@example.com",
      "name": "Recipient"
    }
  ],
  "subject": "Test Email",
  "textBody": "This is a test email.",
  "htmlBody": "<p>This is a <strong>test email</strong>.</p>"
}
```

## 📊 All Available Endpoints

### Email Accounts (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounts/test-connection` | Test SMTP/IMAP connection |
| POST | `/accounts` | Create email account |
| GET | `/accounts` | List all accounts |
| GET | `/accounts/:id` | Get account by ID |
| PATCH | `/accounts/:id` | Update account |
| DELETE | `/accounts/:id` | Delete account |

### Folders (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/folders/initialize/:accountId` | Initialize system folders |
| GET | `/folders?emailAccountId=` | List folders |
| GET | `/folders/:id` | Get folder by ID |
| POST | `/folders?emailAccountId=` | Create custom folder |
| PATCH | `/folders/:id` | Update folder |
| DELETE | `/folders/:id` | Delete folder |

### Emails (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emails/send` | Send email |
| POST | `/emails/drafts` | Save draft |
| GET | `/emails` | List emails (with filters) |
| GET | `/emails/:id` | Get email by ID |
| PATCH | `/emails/:id/read` | Mark as read/unread |
| PATCH | `/emails/:id/star` | Toggle star |
| PATCH | `/emails/:id/move` | Move to folder |

## 🔍 Advanced Testing

### Pagination
```http
GET http://localhost:3002/api/emails/emails?page=1&limit=20
```

### Filtering by Folder
```http
GET http://localhost:3002/api/emails/emails?folderId={folder-id}&page=1&limit=10
```

### Filter Unread Emails
```http
GET http://localhost:3002/api/emails/emails?isRead=false
```

### Full-text Search
```http
GET http://localhost:3002/api/emails/emails?searchQuery=important&page=1&limit=10
```

## 🐛 Troubleshooting

### Connection Test Fails

**SMTP Connection Failed**:
- Kiểm tra firewall/antivirus blocking port 587
- Thử port 465 với `secure: true`
- Verify App Password correct

**IMAP Connection Failed**:
- Kiểm tra IMAP enabled trong Gmail settings
- Port 993 phải open
- Verify App Password

### Email Send Fails

**Common Issues**:
1. **"Email account not found"** → Tạo email account trước
2. **"SENT folder not found"** → Initialize folders trước
3. **"SMTP connection failed"** → Test connection lại
4. **"Authentication failed"** → Check App Password

### MongoDB Connection Issues

```bash
# Check MongoDB running
docker ps | grep mongodb

# Check MongoDB logs
docker logs mongodb

# Restart MongoDB
docker restart mongodb
```

## 📝 Sample Test Scenarios

### Scenario 1: Complete Email Workflow
1. Test connection ✅
2. Create email account ✅
3. Initialize folders ✅
4. Send email ✅
5. List sent emails ✅
6. Mark as read ✅
7. Star email ✅

### Scenario 2: Draft Management
1. Save draft ✅
2. List drafts (filter by folder) ✅
3. Get draft by ID ✅
4. Update draft (future) ⏳
5. Send draft (convert to sent) ⏳

### Scenario 3: Folder Organization
1. Create custom folder "Work" ✅
2. Create subfolder "Important" ✅
3. Move emails to folders ✅
4. List emails by folder ✅

## 🎯 Next Steps

### Features to Test (When Available)
- [ ] Bull Queue integration
- [ ] IMAP polling (background email fetch)
- [ ] Email threading
- [ ] Reply/Forward emails
- [ ] Attachment handling
- [ ] Email deletion

### Performance Testing
```bash
# Load test with Apache Bench
ab -n 100 -c 10 http://localhost:3002/api/emails/accounts

# Or use Artillery
artillery quick --count 10 --num 100 http://localhost:3002/api/emails/emails
```

## 📚 Additional Resources

- [Swagger Docs](http://localhost:3002/api/emails/docs)
- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI for MongoDB
- [Nodemailer Docs](https://nodemailer.com/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

## ⚠️ Security Notes

1. **NEVER** commit credentials to Git
2. Use `.env` for sensitive data
3. Use App Passwords, not regular passwords
4. Rotate App Passwords periodically
5. Test với email account riêng, không dùng email chính

## 🤝 Support

Nếu gặp issues:
1. Check logs: `docker logs {container-name}`
2. Verify MongoDB connection
3. Test SMTP/IMAP connection endpoint
4. Check Swagger docs for API schema

Happy Testing! 🚀
