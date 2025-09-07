# Demo Data Documentation

This document describes the comprehensive demo data structure that can be seeded into the Student Management System database for testing and development purposes.

## 🚀 Quick Start

1. **Navigate to the seeding page**: `/seed-demo-data`
2. **Click "Seed Demo Data"** to populate the database
3. **Use demo accounts** to test the system

## 📊 Data Structure Overview

### Users Created

#### Mentors (4 total)
- **Sarah Johnson** (MT001) - Capacity: 15 students
- **Mike Chen** (MT002) - Capacity: 12 students  
- **Emma Rodriguez** (MT003) - Capacity: 18 students
- **David Kim** (MT004) - Capacity: 10 students

**Login**: `{email}@example.com` / `mentor123`

#### Students (12 total)
- **Batch 1 (Web Development Fundamentals)**: 5 students
- **Batch 2 (Advanced Web Technologies)**: 3 students
- **Batch 3 (Full Stack Development)**: 4 students

**Login**: `{email}@example.com` / `student123`

#### Additional Users (3 total)
- **Lisa Manager** (MG001) - Manager role
- **Tom SRE** (SR001) - SRE role
- **Anna Developer** (DV001) - Developer role

**Login**: `{email}@example.com` / `{role}123`

### Academic Structure

#### Batches (3 total)
1. **BATCH-001**: Web Development Fundamentals
2. **BATCH-002**: Advanced Web Technologies  
3. **BATCH-003**: Full Stack Development

#### Semesters (9 total)
- Each batch has 3 semesters (Semester 1, 2, 3)
- Semester dates span 2024 with 4-month periods

#### Courses (6 total)
1. **WEB-101**: HTML & CSS Fundamentals
2. **WEB-102**: JavaScript Programming
3. **WEB-201**: React.js Development
4. **WEB-202**: Node.js Backend Development
5. **WEB-203**: Database Design & MongoDB
6. **WEB-301**: Full Stack Project

#### Course Offerings (6 total)
- **Batch 1**: HTML/CSS (Semester 1), JavaScript (Semester 2)
- **Batch 2**: React.js (Semester 1), Node.js (Semester 2)
- **Batch 3**: Database/MongoDB (Semester 1), Full Stack Project (Semester 2)

### Missions (3 total)

#### MISSION-001: Web Development Fundamentals
- **Status**: Active
- **Batch**: BATCH-001
- **Students**: 5 students (Alice, Bob, Carol, Dan, Eve)
- **Courses**: HTML/CSS (40% weight), JavaScript (60% weight)
- **Requirements**: Basic computer skills, no prior programming experience
- **Rewards**: Web Development Certificate, Portfolio, Job-ready skills

#### MISSION-002: Advanced Web Technologies
- **Status**: Active
- **Batch**: BATCH-002
- **Students**: 3 students (Frank, Grace, Henry)
- **Courses**: React.js (50% weight), Node.js (50% weight)
- **Requirements**: HTML, CSS, JavaScript knowledge
- **Rewards**: Advanced Web Development Certificate, Real-world experience

#### MISSION-003: Full Stack Development
- **Status**: Draft
- **Batch**: BATCH-003
- **Students**: 4 students (Iris, Jack, Kate, Leo)
- **Courses**: Database/MongoDB (30% weight), Full Stack Project (70% weight)
- **Requirements**: React.js and Node.js experience
- **Rewards**: Full Stack Development Certificate, Complete portfolio

## 🔗 Relationship Structure

### User Relationships
```
Admin User
├── Creates Missions
├── Manages Batches
└── Oversees System

Mentors
├── Assigned Students (based on batch)
├── Capacity Limits (10-18 students)
└── Student Progress Tracking

Students
├── Assigned to Batches
├── Assigned to Mentors
├── Enrolled in Missions
└── Course Progress Tracking
```

### Academic Relationships
```
Batch
├── Has 3 Semesters
├── Contains Course Offerings
├── Has Students
└── Has Missions

Semester
├── Belongs to Batch
├── Contains Course Offerings
└── Has Start/End Dates

Course
├── Offered in Multiple Batches
├── Has Course Offerings
└── Part of Mission Curriculum

Course Offering
├── Belongs to Batch
├── Belongs to Semester
├── References Course
└── Used in Missions
```

### Mission Relationships
```
Mission
├── Belongs to Batch
├── Contains Courses (with weights)
├── Has Students (with progress)
├── Has Requirements
├── Has Rewards
└── Has Status (draft/active/paused/completed/archived)

Mission Student
├── References User (student)
├── References User (mentor)
├── Has Progress (0-100%)
├── Has Status (active/completed/failed/dropped)
├── Has Course Progress
└── Has Start/Completion Dates

Course Progress
├── References Course Offering
├── Has Progress (0-100%)
├── Has Completed Assignments
└── Has Last Activity Date
```

## 🎯 Testing Scenarios

### Mentor Assignment Testing
1. **Login as admin** and navigate to Mission Hub
2. **Select a mission** (e.g., MISSION-001)
3. **Go to Students** section
4. **Click "Assign Mentors"** to test the improved mentor assignment modal
5. **Verify capacity warnings** and assignment progress

### Student Management Testing
1. **Login as mentor** (e.g., sarah.mentor@example.com)
2. **View assigned students** and their progress
3. **Test mentor-student interactions**

### Mission Management Testing
1. **Login as admin** and create new missions
2. **Assign students** to missions
3. **Test course relationships** and progress tracking

### Batch and Course Testing
1. **Navigate to admin dashboard**
2. **Manage batches, semesters, and courses**
3. **Verify relationships** between academic entities

## 🗑️ Database Management

### Clearing Demo Data
- **Navigate to**: `/seed-demo-data`
- **Click "Clear Database"** button
- **Confirm twice** for safety
- **All demo data** will be removed (admin user preserved)

### Re-seeding Data
- **Clear database first** if data exists
- **Click "Seed Demo Data"** to recreate
- **Fresh data** will be generated

## 🔐 Security Notes

- **Demo passwords** are simple for testing purposes
- **Real production** should use strong, unique passwords
- **Admin access** required for seeding/clearing operations
- **Data relationships** maintain referential integrity

## 📈 Data Statistics

After seeding, the database will contain:
- **Total Users**: 20 (1 admin + 4 mentors + 12 students + 3 additional)
- **Batches**: 3
- **Semesters**: 9
- **Courses**: 6
- **Course Offerings**: 6
- **Missions**: 3
- **Student-Mentor Assignments**: 12
- **Mission Enrollments**: 12

## 🚨 Important Notes

1. **Seeding only works** when database is mostly empty
2. **Existing data** will prevent seeding
3. **Clear database first** if you need to re-seed
4. **All relationships** are properly maintained
5. **Progress values** are randomized for realistic testing
6. **Dates** are set to 2024 for current testing

## 🆘 Troubleshooting

### Common Issues
- **"Demo data already exists"**: Clear database first
- **"Insufficient permissions"**: Must be logged in as admin
- **"Database connection error"**: Check MongoDB connection
- **"Validation errors"**: Check model schemas

### Reset Process
1. Clear database using the clear button
2. Verify only admin user remains
3. Re-seed demo data
4. Test functionality

---

**Happy Testing! 🎉**

This demo data provides a comprehensive foundation for testing all aspects of the Student Management System, from basic user management to complex mission and course relationships.
