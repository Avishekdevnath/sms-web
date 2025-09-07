# Student Management System (SMS)

A comprehensive, production-ready Student Management System built with Next.js 15, TypeScript, and MongoDB. This system provides complete student enrollment, management, and administrative capabilities with role-based access control.

## 🆕 What's New

- Communication Hub updates
  - Back buttons added to Guideline and Coding zones
  - Coding Zone now mirrors Guideline Zone, with detail pages at `/mission-communication-hub/helpzone/coding/[postId]`
  - Sidebar simplified: concise labels and category text for non-links
- Admin sidebar labels simplified: "Students", "Moderators", "Assignments" (removed "Management")
- Mission Overview counts now use Mission V2 aggregate fields (`totalStudents`, `totalMentors`, `totalGroups`) with Redux fallbacks
- Counts on dashboards now sourced from correct APIs
  - Students: `/api/students` (uses `pagination.total` when available)
  - Courses: `/api/courses` (`total`)
  - Active Missions: `/api/v2/missions?status=active` (uses `pagination.total`)
  - Assignments: `/api/assignments` (`total`, pending derived from unpublished/unsubmitted)

## 🚀 Features

### Functional Areas

#### Dashboard
- Live totals: Students, Courses, Active Missions, Pending Assignments
- Quick actions to Students, Missions, Courses, Assignments
- Recent activity feed
- Admin/role-aware navigation and simplified sidebar labels

#### Missions (Mission Hub)
- Mission context selector and Mission Overview
- V2-backed counts: `totalStudents`, `totalMentors`, `totalGroups` with client fallbacks
- Students: assign, manage, and view capacity usage per mission
- Mentors: list, status, workload; assign students to mentors
- Mentorship Groups: create/list/analyze groups; student/mentor membership
- Analytics: mission/group-level trends and summaries

#### Communication Hub
- Channels for Announcements, Guideline Session, Resources (mission-wide)
- Admin channels for messaging/resources (admins/mentors)
- Helpzone with Guideline and Coding zones
  - Search and status filter, markdown content, comments/replies
  - Detail pages: `/mission-communication-hub/helpzone/guideline/[postId]` and `/helpzone/coding/[postId]`
  - Back buttons and simplified sidebar (category text for non-links)

### Core Functionality
- **Complete Authentication System** - JWT-based authentication with role-based access control
- **Student Enrollment Workflow** - Enroll → Invite → Activate → Manage
- **Student Profile Management** - Comprehensive student profiles with batch memberships
- **Admin Dashboard** - Full administrative control with student management
- **Student Dashboard** - Student self-service portal
- **Password Management** - Reset and forgot password functionality
- **Email Integration** - Automated email notifications and invitations

### User Roles & Permissions
- **Admin** - Full system access and management
- **Student** - Profile viewing/editing and course access
- **Manager** - Limited administrative access
- **Instructor** - Course and assignment management

### Technical Features
- **Modern Tech Stack** - Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database** - MongoDB with Mongoose ODM
- **Security** - JWT tokens, HTTP-only cookies, password hashing
- **API** - 50+ RESTful endpoints with comprehensive CRUD operations
- **UI/UX** - Responsive design with modern components
- **File Upload** - Cloudinary integration for media files

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **MongoDB** database (local or cloud)
- **Email service** (for notifications)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sms-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/sms-database
   
   # JWT Secret (generate a secure 64-character string)
   JWT_SECRET_KEY=your-super-secure-jwt-secret-key-here-64-chars-long
   
   # Email Configuration (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Cloudinary (optional - for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Application
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   ```

4. **Database Setup**
   - Ensure MongoDB is running
   - The application will automatically create collections and indexes

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
sms-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── api/               # API routes (50+ endpoints)
│   │   ├── dashboard/         # Dashboard pages
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable React components
│   │   ├── shared/           # Common UI components
│   │   ├── student-management/ # Student-specific components
│   │   └── ui/               # Base UI components
│   ├── context/              # React context providers
│   ├── lib/                  # Utility libraries
│   ├── models/               # MongoDB/Mongoose models
│   ├── schemas/              # Zod validation schemas
│   ├── services/             # Business logic services
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Helper utilities
├── public/                   # Static assets
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔐 Authentication & Security

### JWT Token System
- Secure token-based authentication
- HTTP-only cookies for token storage
- Automatic token refresh
- Role-based authorization

### Password Security
- bcrypt hashing for passwords
- Temporary password generation
- Password expiry management
- Secure password reset flow

### API Protection
- Middleware-based route protection
- Role-based access control
- Input validation with Zod
- Error handling and logging

## 📊 Database Models

### Core Models
- **User** - Authentication and basic user info
- **StudentProfile** - Detailed student information
- **StudentEnrollment** - Enrollment records
- **StudentBatchMembership** - Batch associations
- **Batch** - Academic batches
- **Course** - Course definitions
- **CourseOffering** - Course instances
- **Semester** - Academic semesters

### Supporting Models
- **Assignment** - Course assignments
- **Exam** - Examination records
- **Mission** - Learning missions
- **Invitation** - Student invitations
- **AuditLog** - System audit trail

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset request
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Student Management
- `GET /api/student-profiles` - List all students
- `GET /api/student-profiles/[id]` - Get student details
- `PUT /api/student-profiles/[id]` - Update student
- `GET /api/student-profiles/me` - Get own profile
- `POST /api/students/enroll` - Enroll new student
- `POST /api/students/invite` - Send invitation

### Administrative
- `GET /api/batches` - Manage batches
- `GET /api/courses` - Manage courses
- `GET /api/semesters` - Manage semesters
- `GET /api/users` - User management

## 🎨 UI Components

### Shared Components
- **FormInput** - Reusable form inputs
- **Modal** - Modal dialogs
- **Toast** - Notification system
- **LoadingSpinner** - Loading indicators
- **Pagination** - Data pagination
- **SearchAndFilter** - Search functionality

### Student Management
- **StudentTable** - Student listing
- **StudentFilters** - Advanced filtering
- **StudentStatistics** - Analytics display
- **StudentAvatar** - Profile pictures

## 🔧 Configuration

### Environment Variables
All configuration is handled through environment variables. See the installation section for required variables.

### Database Configuration
The system automatically:
- Creates database indexes
- Validates data schemas
- Handles connections efficiently
- Provides error recovery

### Email Configuration
Supports multiple email providers:
- Gmail SMTP
- SendGrid
- AWS SES
- Custom SMTP servers

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup for Production
- Use strong JWT secrets
- Configure production MongoDB
- Set up email service
- Enable HTTPS
- Configure CORS properly

## 🧪 Testing

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test student profiles
curl -X GET http://localhost:3000/api/student-profiles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Manual Testing
1. **Admin Flow**: Login → Dashboard → Student Management
2. **Student Flow**: Login → Profile → Edit Information
3. **Enrollment Flow**: Enroll → Invite → Activate

## 🔍 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Verify MongoDB is running
- Check connection string in `.env.local`
- Ensure network access

**JWT Token Issues**
- Verify JWT_SECRET_KEY is set
- Check token expiration
- Clear browser cookies

**Email Not Sending**
- Verify email credentials
- Check SMTP settings
- Test with different email provider

**Build Errors**
- Clear `.next` directory
- Reinstall dependencies
- Check TypeScript errors

## 📈 Performance

### Optimization Features
- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js built-in optimization
- **Database Indexing** - Optimized queries
- **Caching** - API response caching
- **Lazy Loading** - Component lazy loading

### Monitoring
- API response times
- Database query performance
- User session tracking
- Error rate monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Complete student management system
- Role-based access control
- Email integration
- Modern UI/UX

---

**Built with ❤️ using Next.js, TypeScript, and MongoDB**
