# Student Enrollment & Profile Completion Workflow

## 📋 Overview

This document outlines the complete student enrollment and profile completion workflow in the Student Management System (SMS).

## 🔄 Complete Workflow

### 1. **Enrollment Phase**
- **Action**: Admin/Manager/SRE uploads student emails for a batch
- **Result**: Creates `StudentEnrollment` records with `status: "pending"`
- **Location**: `/dashboard/admin/students/enroll`

### 2. **Approval Phase**
- **Action**: Admin/Manager/SRE approves pending enrollments
- **Result**: 
  - Creates `User` account with `isActive: false`, `profileCompleted: false`
  - Creates `StudentBatchMembership` with `status: "approved"`
  - Updates `StudentEnrollment` to `status: "approved"`
- **Location**: `/dashboard/admin/students?tab=pending`

### 3. **Invitation Phase**
- **Action**: Admin/Manager/SRE sends invitation email
- **Result**: 
  - Sends email with temporary password
  - Updates `User` with `invitedAt` timestamp
  - User can now login with temporary credentials
- **Location**: `/dashboard/admin/students?tab=batch`

### 4. **Profile Completion Phase**
- **Action**: Student logs in and completes profile
- **Result**: 
  - Creates `StudentProfile` record
  - Updates `User` with `isActive: true`, `profileCompleted: true`
  - Account becomes fully active
- **Location**: `/dashboard/student/profile/complete`

### 5. **Active Phase**
- **Action**: Student has full access to system
- **Result**: Student can access dashboard and all features
- **Location**: `/dashboard`

## 📊 Status Tracking

### Student Status Flow:
```
Pending → Approved → Invited → Profile Complete → Active
```

### Status Definitions:
- **Pending**: Email uploaded, waiting for approval
- **Approved**: User account created, waiting for invitation
- **Invited**: Email sent, waiting for profile completion
- **Profile Complete**: Profile filled, account active
- **Active**: Fully functional student account

## 📝 Required Profile Fields

### Mandatory Fields:
- ✅ **First Name** (string, required)
- ✅ **Last Name** (string, required)
- ✅ **Username** (string, unique, min 3 chars)
- ✅ **New Password** (string, min 8 chars)
- ✅ **Confirm Password** (string, must match)
- ✅ **Phone Number** (string, required)
- ✅ **Profile Picture** (URL, 500x500 recommended)

### Optional Fields:
- **Bio** (text)
- **Date of Birth** (date)
- **Address** (text)
- **Emergency Contact** (name, phone, relationship)
- **Academic Info** (previous institution, graduation year, GPA)
- **Social Links** (LinkedIn, GitHub, Portfolio)
- **Skills** (comma-separated)
- **Interests** (comma-separated)

## 🎯 Admin Interface Features

### Pending Approvals Tab:
- View all pending enrollments
- Bulk approve/deny/delete
- Individual approve/deny/delete actions
- Status badges for clear visibility

### Batch Students Tab:
- View all students in a batch
- Status tracking with badges:
  - **Needs Invitation**: Approved but not invited
  - **Profile Incomplete**: Invited but profile not completed
  - **Profile Complete**: Profile completed, account active
  - **Active**: Fully functional account
- Invite/Re-invite functionality
- Activate/Suspend controls
- Delete functionality

### Bulk Actions:
- **Bulk Approve**: Approve multiple pending enrollments
- **Bulk Deny**: Deny multiple pending enrollments
- **Bulk Delete**: Delete multiple pending enrollments
- **Bulk Invite**: Send invitations to multiple students

## 🔧 Technical Implementation

### Database Models:

#### User Model (Extended):
```typescript
{
  userId: string,           // Custom ID (ST001, etc.)
  email: string,           // Unique email
  password: string,        // Hashed password
  role: "student",         // User role
  name: string,           // Display name
  isActive: boolean,      // Account status
  mustChangePassword: boolean, // Force password change
  username?: string,      // Unique username
  phone?: string,         // Phone number
  profilePicture?: string, // Profile picture URL
  profileCompleted?: boolean, // Profile completion status
  invitedAt?: Date,       // Invitation timestamp
  deletedAt?: Date,       // Soft delete
  deletedBy?: ObjectId    // Who deleted
}
```

#### StudentProfile Model:
```typescript
{
  userId: ObjectId,        // Reference to User
  firstName: string,       // Required
  lastName: string,        // Required
  username: string,        // Required, unique
  phone: string,          // Required
  profilePicture: string,  // Required
  bio?: string,           // Optional
  dateOfBirth?: Date,     // Optional
  address?: string,       // Optional
  emergencyContact?: {    // Optional
    name: string,
    phone: string,
    relationship: string
  },
  academicInfo?: {        // Optional
    previousInstitution?: string,
    graduationYear?: number,
    gpa?: number
  },
  socialLinks?: {         // Optional
    linkedin?: string,
    github?: string,
    portfolio?: string
  },
  skills?: string[],      // Optional
  interests?: string[],   // Optional
  completedAt?: Date      // Completion timestamp
}
```

### API Endpoints:

#### Enrollment & Approval:
- `POST /api/students/enroll-emails` - Upload emails for enrollment
- `POST /api/students/pending/approve` - Approve pending enrollments
- `POST /api/students/pending/deny` - Deny pending enrollments
- `POST /api/students/pending/delete` - Delete pending enrollments

#### Invitation:
- `POST /api/students/invite` - Send invitation email
- `POST /api/test-email` - Test email service

#### Profile Management:
- `POST /api/students/profile/complete` - Complete student profile
- `GET /api/students/pending` - Get pending enrollments
- `GET /api/students/batch` - Get batch students

### Email Service:
- Modular email service using Nodemailer
- Rich HTML templates for invitations
- Gmail SMTP configuration
- Test endpoint for verification

## 🎨 UI/UX Features

### Status Badges:
- **Pending**: Yellow with hourglass icon
- **Approved**: Green with checkmark
- **Invited**: Blue with email icon
- **Profile Incomplete**: Purple with document icon
- **Profile Complete**: Green with checkmark
- **Active**: Green with checkmark
- **Inactive**: Gray with pause icon

### Progress Indicators:
- Visual workflow steps
- Current step highlighting
- Completion status tracking

### Bulk Operations:
- Select all/none controls
- Bulk action buttons
- Confirmation dialogs
- Loading states

### Responsive Design:
- Mobile-friendly interface
- Consistent black/white theme
- Clear visual hierarchy

## 🔒 Security Features

### Authentication:
- JWT-based authentication
- HTTP-only cookies
- Role-based access control

### Password Management:
- Temporary password generation
- Force password change on first login
- Secure password hashing (bcrypt)

### Data Protection:
- Input validation (Zod schemas)
- SQL injection prevention
- XSS protection

## 📱 Student Experience

### First Login:
1. Student receives email with temporary password
2. Logs in with temporary credentials
3. Automatically redirected to profile completion
4. Fills required information
5. Account becomes active

### Profile Completion Page:
- Clear form layout with required/optional sections
- Real-time validation
- Progress indicators
- Success/error feedback

### Dashboard Access:
- Full access after profile completion
- Role-based navigation
- Personal information display

## 🚀 Future Enhancements

### Planned Features:
- Profile picture upload (file upload)
- Email verification
- Password strength requirements
- Profile editing capabilities
- Batch import/export
- Advanced filtering and search
- Student analytics dashboard

### Integration Points:
- Learning Management System (LMS)
- Assignment submission system
- Grade tracking
- Communication tools
- Calendar integration

## 📞 Support & Troubleshooting

### Common Issues:
1. **Email not received**: Check spam folder, verify email configuration
2. **Profile completion fails**: Check required fields, username uniqueness
3. **Invitation not working**: Verify email service configuration
4. **Status not updating**: Check database connections, refresh page

### Debug Information:
- Console logging for all operations
- Email service test endpoint
- Database connection status
- API response validation

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintained By**: Development Team 