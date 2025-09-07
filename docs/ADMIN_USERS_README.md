# Adding Admin and Moderator Users

This guide explains how to add new admin, moderator, and mentor users to the SMS system.

## Option 1: Using the Standalone Script (Recommended)

### Prerequisites
- Node.js installed
- MongoDB connection string
- bcryptjs package installed

### Installation
```bash
npm install bcryptjs
```

### Configuration
1. Update the MongoDB connection string in `create-admin-users.js`:
   ```javascript
   const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms-web';
   ```

2. Or set the environment variable:
   ```bash
   export MONGODB_URI="your_mongodb_connection_string"
   ```

### Running the Script
```bash
node create-admin-users.js
```

### What the Script Creates
The script will create **20 users** with the following roles:

#### Admin Users (3)
- **John Admin** (admin.john@example.com) - Password: admin123
- **Sarah Admin** (admin.sarah@example.com) - Password: admin123
- **Michael Admin** (admin.michael@example.com) - Password: admin123

#### Manager Users (3)
- **Mike Manager** (manager.mike@example.com) - Password: manager123
- **Lisa Manager** (manager.lisa@example.com) - Password: manager123
- **David Manager** (manager.david@example.com) - Password: manager123

#### Developer Users (3)
- **Alex Developer** (developer.alex@example.com) - Password: dev123
- **Emma Developer** (developer.emma@example.com) - Password: dev123
- **Ryan Developer** (developer.ryan@example.com) - Password: dev123

#### SRE Users (3)
- **Tom SRE** (sre.tom@example.com) - Password: sre123
- **Anna SRE** (sre.anna@example.com) - Password: sre123
- **Chris SRE** (sre.chris@example.com) - Password: sre123

#### Mentor Users (5)
- **Jessica Mentor** (mentor.jessica@example.com) - Password: mentor123
- **Robert Mentor** (mentor.robert@example.com) - Password: mentor123
- **Maria Mentor** (mentor.maria@example.com) - Password: mentor123
- **James Mentor** (mentor.james@example.com) - Password: mentor123
- **Sophia Mentor** (mentor.sophia@example.com) - Password: mentor123

## Option 2: Using the API Endpoint

### Endpoint
```
POST /api/admin/create-users
```

### Authentication
- Requires admin role
- Include JWT token in Authorization header

### Request Body
```json
{
  "users": [
    {
      "email": "new.admin@example.com",
      "name": "New Admin",
      "role": "admin",
      "password": "optional_password"
    },
    {
      "email": "new.mentor@example.com",
      "name": "New Mentor",
      "role": "mentor",
      "maxStudents": 75
    }
  ]
}
```

### Valid Roles
- `admin` - Full system access and user management
- `developer` - Development and testing access
- `manager` - Management oversight and reporting
- `sre` - Site reliability engineering and monitoring
- `mentor` - Student guidance and mission management

### Mentor-Specific Fields
When creating mentor users, you can specify:
- `maxStudents` - Maximum number of students the mentor can handle (default: 50)

### Response
```json
{
  "success": true,
  "message": "Successfully created 2 users",
  "data": {
    "created": [...],
    "errors": [...],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

## Option 3: Manual Database Insertion

### Using MongoDB Compass or Shell
1. Connect to your MongoDB database
2. Navigate to the `users` collection
3. Insert user documents with the following structure:

```json
{
  "email": "user@example.com",
  "password": "hashed_password_here",
  "role": "admin",
  "name": "User Name",
  "userId": "AD123456",
  "isActive": true,
  "mustChangePassword": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Mentor User Structure
```json
{
  "email": "mentor@example.com",
  "password": "hashed_password_here",
  "role": "mentor",
  "name": "Mentor Name",
  "userId": "MT123456",
  "isActive": true,
  "mustChangePassword": false,
  "studentsCount": 0,
  "maxStudents": 50,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Password Hashing
Use bcrypt to hash passwords:
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('your_password', 10);
```

## User ID Format

The system automatically generates user IDs with the following format:
- **AD** - Admin users
- **DV** - Developer users  
- **MG** - Manager users
- **SR** - SRE users
- **MT** - Mentor users

Example: `AD123456`, `MG789012`, `MT345678`

## Role Descriptions

### Admin
- Full system access and user management
- Can create, modify, and delete users
- Access to all system features and data

### Manager
- Management oversight and reporting
- Can view system statistics and reports
- Limited user management capabilities

### Developer
- Development and testing access
- Can access development tools and APIs
- Limited to development-related features

### SRE (Site Reliability Engineering)
- System monitoring and reliability
- Access to system health and performance data
- Infrastructure and deployment management

### Mentor
- Student guidance and mission management
- Can assign and manage students in missions
- Limited to mentor-specific features
- Has student capacity limits

## Security Notes

1. **Change Default Passwords**: All users should change their passwords on first login
2. **Strong Passwords**: Use strong, unique passwords for production
3. **Access Control**: Regularly review user roles and permissions
4. **Audit Logging**: Monitor user creation and role changes
5. **Mentor Limits**: Set appropriate `maxStudents` limits for mentors

## Troubleshooting

### Common Issues
1. **Connection Error**: Check MongoDB connection string and network access
2. **Permission Error**: Ensure you have admin role to create users
3. **Duplicate Email**: Check if user already exists
4. **Invalid Role**: Use only valid roles from the list above
5. **Mentor Fields**: Ensure mentor users have proper capacity settings

### Logs
Check the console output for detailed information about:
- Connection status
- User creation progress
- Any errors encountered
- Final summary of created users
- Users grouped by role

## Next Steps

After creating users:
1. Test login with new credentials
2. Verify role-based access permissions
3. Update user profiles if needed
4. Set up mentor-student assignments
5. Configure role-specific permissions
6. Test different user workflows

## Quick Test

After running the script, you can test the system by:
1. Logging in as different user types
2. Checking role-based access controls
3. Testing mentor-student assignment features
4. Verifying admin user management capabilities
