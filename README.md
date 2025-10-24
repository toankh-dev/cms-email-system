# CMS Email System

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

## Giới thiệu

**CMS Email System** là một hệ thống quản lý email toàn diện, được xây dựng dựa trên kiến trúc của **Zoho Mail**. Hệ thống cung cấp đầy đủ các tính năng để quản lý email chuyên nghiệp, bao gồm gửi/nhận email, quản lý danh bạ, lịch làm việc, và nhiều tính năng nâng cao khác.

## Tech Stack

### Backend Framework
- **NestJS** v11.0.1 - Progressive Node.js framework
- **TypeScript** v5.7.3 - Type-safe JavaScript
- **Node.js** - Runtime environment

### Database & Storage
- **PostgreSQL** - Primary database
- **Redis** - Caching & session management
- **TypeORM** - ORM for database operations

### Email Protocols
- **SMTP** - Gửi email (Simple Mail Transfer Protocol)
- **IMAP** - Nhận email (Internet Message Access Protocol)
- **POP3** - Alternative email retrieval protocol

### Authentication & Security
- **JWT** - JSON Web Tokens
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing
- **Helmet** - Security headers

### Queue & Background Jobs
- **Bull** - Redis-based queue for async tasks
- **Bull Board** - Queue monitoring dashboard

### File Storage
- **Multer** - File upload handling
- **AWS S3** (optional) - Cloud storage for attachments

### Testing
- **Jest** - Unit & integration testing
- **Supertest** - E2E API testing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Docker** - Containerization

## Tính năng chính

### 📧 Email Management
- ✅ Gửi email (đơn/hàng loạt) với rich text editor
- ✅ Nhận email tự động qua IMAP/POP3
- ✅ Đọc, trả lời, chuyển tiếp email
- ✅ Lưu nháp (auto-save)
- ✅ Xóa, khôi phục email
- ✅ Email threading (xem theo cuộc hội thoại)
- ✅ Đánh dấu quan trọng/đã đọc

### 📁 Folder Management
- ✅ Inbox, Sent, Drafts, Trash, Spam
- ✅ Tạo folder tùy chỉnh
- ✅ Di chuyển email giữa các folder
- ✅ Quản lý folder hierarchy

### 👥 Contact Management
- ✅ Thêm, sửa, xóa danh bạ
- ✅ Nhóm liên hệ
- ✅ Import/Export contacts (CSV, vCard)
- ✅ Tìm kiếm nhanh contact

### 📅 Calendar Integration
- ✅ Tạo sự kiện, cuộc họp
- ✅ Gửi lời mời tham gia
- ✅ Reminder & notifications
- ✅ Xem lịch theo ngày/tuần/tháng

### 🔍 Advanced Search
- ✅ Tìm kiếm full-text
- ✅ Lọc theo người gửi, ngày, folder
- ✅ Tìm kiếm trong attachments
- ✅ Lưu bộ lọc tìm kiếm

### 🏷️ Labels & Categories
- ✅ Tạo nhãn màu sắc
- ✅ Gán nhiều nhãn cho email
- ✅ Lọc email theo nhãn

### 🤖 Email Filters & Rules
- ✅ Tự động phân loại email
- ✅ Auto-reply (trả lời tự động)
- ✅ Forward rules
- ✅ Spam detection

### 📎 Attachments
- ✅ Upload nhiều file (max 25MB/file)
- ✅ Preview file (PDF, images, docs)
- ✅ Virus scanning
- ✅ Cloud storage integration

### 📝 Email Templates
- ✅ Tạo template tùy chỉnh
- ✅ Variables & placeholders
- ✅ Template categories
- ✅ Quick insert templates

### 👤 User Management
- ✅ Đăng ký, đăng nhập
- ✅ Multi-account support
- ✅ Profile management
- ✅ Email signatures
- ✅ Settings & preferences

## Cài đặt

### Yêu cầu
- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x
- pnpm >= 8.x

### Cài đặt dependencies
```bash
pnpm install
```

### Cấu hình môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Cấu hình các biến môi trường:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=cms_email_system

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# SMTP (cho gửi email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# IMAP (cho nhận email)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password

# Application
APP_PORT=3000
APP_URL=http://localhost:3000
```

### Chạy migration
```bash
pnpm run migration:run
```

### Khởi động ứng dụng

#### Development mode
```bash
pnpm run start:dev
```

#### Production mode
```bash
pnpm run build
pnpm run start:prod
```

#### Với Docker
```bash
docker-compose up -d
```

## Chạy Tests

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## API Documentation

API documentation được tạo tự động với Swagger:
```
http://localhost:3000/api/docs
```

## Cấu trúc Project

```
cms-email-system/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication & Authorization
│   │   ├── user/           # User management
│   │   ├── email/          # Email CRUD operations
│   │   ├── folder/         # Folder management
│   │   ├── contact/        # Contact management
│   │   ├── calendar/       # Calendar & events
│   │   ├── label/          # Labels & tags
│   │   ├── filter/         # Email filters & rules
│   │   ├── template/       # Email templates
│   │   ├── attachment/     # File uploads
│   │   └── search/         # Search functionality
│   ├── common/
│   │   ├── decorators/     # Custom decorators
│   │   ├── filters/        # Exception filters
│   │   ├── guards/         # Auth guards
│   │   ├── interceptors/   # HTTP interceptors
│   │   ├── pipes/          # Validation pipes
│   │   └── utils/          # Utility functions
│   ├── config/             # Configuration files
│   ├── database/           # Database migrations & seeds
│   ├── mail/               # SMTP/IMAP services
│   ├── queue/              # Bull queue processors
│   └── main.ts             # Application entry point
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # System architecture
│   ├── API_DESIGN.md       # API specifications
│   ├── DATABASE_SCHEMA.md  # Database design
│   ├── DEVELOPMENT.md      # Development guide
│   └── FEATURES.md         # Feature specifications
├── test/                   # Test files
├── docker/                 # Docker configurations
└── scripts/                # Utility scripts
```

## Documentation

### 🚀 Quick Start

1. **[Quick Start Guide](docs/QUICK_START.md)** - Setup environment (10 minutes)
2. **[Implementation Baseline](docs/IMPLEMENTATION_BASELINE.md)** - Version-based roadmap ⭐

### 📚 Technical Specs

- [Database Schema](docs/DATABASE_SCHEMA.md) - 20 PostgreSQL tables
- [API Design](docs/API_DESIGN.md) - RESTful endpoints
- [Architecture](docs/ARCHITECTURE.md) - System design
- [Features](docs/FEATURES.md) - Requirements
- [Development Guide](docs/DEVELOPMENT.md) - Best practices

### ☁️ Deployment

- [AWS Hybrid](docs/AWS_HYBRID_ARCHITECTURE.md) - Lambda + Fargate
- [Comparison](docs/COMPARISON.md) - Architecture options

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t cms-email-system .

# Run container
docker run -p 3000:3000 --env-file .env cms-email-system
```

### Production Checklist
- [ ] Set proper environment variables
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Setup database backups
- [ ] Enable monitoring & logging
- [ ] Configure rate limiting
- [ ] Setup CDN for static assets
- [ ] Enable Redis persistence

## Performance & Scalability

- **Horizontal Scaling**: Stateless API design cho phép scale dễ dàng
- **Caching**: Redis cache cho hot data
- **Queue System**: Bull queue xử lý async tasks
- **Database Indexing**: Optimized indexes cho search performance
- **CDN**: Static assets served via CDN

## Security Features

- 🔐 JWT authentication với refresh tokens
- 🛡️ CORS protection
- 🔒 Helmet security headers
- 🚫 Rate limiting (chống DDoS)
- ✅ Input validation với class-validator
- 🔑 Password hashing với bcrypt
- 📧 Email verification
- 🔐 2FA (Two-factor authentication)

## Roadmap

> **See [Implementation Baseline](docs/IMPLEMENTATION_BASELINE.md) for version-based plan**

### Version Roadmap
```
v0.1.0 ✅ → v0.2.0 🔄 → v0.3.0 → v0.4.0 → v0.5.0 → v1.0.0
Planning   Auth      Email   Comms    Advanced  Production
```

**Current**: v0.2.0 - Authentication System (Weeks 1-2)

### Milestones

- **v0.1.0** ✅ - Project foundation complete
- **v0.2.0** 🔄 - Authentication & user management
- **v0.3.0** - Email core (SMTP/IMAP, folders)
- **v0.4.0** - Contacts, calendar, labels, filters
- **v0.5.0** - Attachments, search, background jobs
- **v1.0.0** - Production release

## Contributing

Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết quy trình đóng góp cho project.

## License

This project is [UNLICENSED](LICENSE).

## Support & Contact

- **Issues**: [GitHub Issues](https://github.com/your-org/cms-email-system/issues)
- **Email**: support@yourdomain.com
- **Documentation**: [Wiki](https://github.com/your-org/cms-email-system/wiki)

## Credits

Developed with ❤️ using [NestJS](https://nestjs.com/)

---

**Note**: Đây là project đang trong giai đoạn phát triển. Một số tính năng có thể chưa hoàn thiện.
