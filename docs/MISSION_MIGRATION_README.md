# Mission Model Migration Guide

## **Overview**

This migration moves the Student Management System from using **embedded students arrays** in the Mission model to using a **dedicated StudentMission collection**. This resolves data inconsistency issues and provides a cleaner, more normalized database structure.

## **What Changed**

### **Before (Old Structure)**
```typescript
// Mission model had embedded students array
interface IMission {
  _id: string;
  code: string;
  title: string;
  // ... other fields
  students: IMissionStudent[]; // ❌ Embedded array - PROBLEMATIC
}

interface IMissionStudent {
  studentId: Types.ObjectId;
  mentors: Types.ObjectId[];
  primaryMentorId?: Types.ObjectId;
  status: 'active' | 'completed' | 'failed' | 'dropped';
  progress: number;
  // ... other fields
}
```

### **After (New Structure)**
```typescript
// Mission model - no embedded students
interface IMission {
  _id: string;
  code: string;
  title: string;
  // ... other fields
  // ✅ No embedded students array
}

// Dedicated StudentMission collection
interface IStudentMission {
  _id: string;
  studentId: Types.ObjectId;
  missionId: Types.ObjectId;
  batchId: Types.ObjectId;
  status: 'active' | 'completed' | 'failed' | 'dropped';
  progress: number;
  mentorId?: Types.ObjectId;
  // ... other fields
}
```

## **Migration Steps**

### **Step 1: Run Migration Script**
```bash
# Make sure you're in the project directory
cd sms-web

# Run the migration script
node migrate-mission-students.js
```

**What this does:**
- Finds all missions with embedded students
- Creates StudentMission records for each embedded student
- Preserves all student data (progress, status, dates, etc.)

### **Step 2: Verify Migration**
```bash
# Check the debug endpoint to verify data
# Go to: /dashboard/admin/missions/[MISSION_ID]/students?debug=true
```

**Expected results:**
- StudentMission records should exist for each mission
- Student count should match between old and new systems
- All student data should be preserved

### **Step 3: Run Cleanup Script**
```bash
# After verifying migration success, remove embedded arrays
node cleanup-mission-students.js
```

**What this does:**
- Removes the `students` array from all Mission documents
- Only runs if StudentMission records exist (safety check)

### **Step 4: Test the System**
- Verify that missions display correctly
- Check that student management works
- Ensure all APIs function properly

## **What You Need to Do**

### **1. Environment Setup**
Make sure your MongoDB connection is working:
```bash
# Check your .env file has:
MONGODB_URI=mongodb://localhost:27017/sms
# or your actual MongoDB connection string
```

### **2. Run Migration**
```bash
# Install dependencies if needed
npm install mongodb

# Run migration
node migrate-mission-students.js
```

### **3. Verify Data**
- Check the debug endpoint for each mission
- Verify student counts match
- Ensure no data loss

### **4. Clean Up**
```bash
# Only after successful verification
node cleanup-mission-students.js
```

### **5. Test Everything**
- Admin missions page
- Mission hub
- Student management
- All CRUD operations

## **Rollback Plan**

If something goes wrong, you can rollback:

### **Option 1: Restore from Backup**
```bash
# Restore your MongoDB from backup
mongorestore --db sms backup_folder/
```

### **Option 2: Manual Rollback**
```bash
# Re-add students array to missions (if needed)
# This would require custom script based on your backup
```

## **Benefits of New Structure**

### **✅ Advantages**
1. **Data Consistency** - Single source of truth
2. **Better Performance** - Indexed queries on StudentMission
3. **Easier Maintenance** - Cleaner code structure
4. **Scalability** - Can handle large numbers of students
5. **Data Integrity** - Proper foreign key relationships

### **⚠️ Considerations**
1. **Migration Required** - One-time process
2. **Code Updates** - Some components updated
3. **Testing Needed** - Verify all functionality works

## **API Changes**

### **Student Management**
- **Before**: `POST /api/admin/missions/[id]/students` updated embedded array
- **After**: `POST /api/admin/missions/[id]/students` creates StudentMission records

### **Student Queries**
- **Before**: `mission.students` array
- **After**: `StudentMission.find({ missionId })` collection query

### **Progress Updates**
- **Before**: Update embedded student progress
- **After**: Update StudentMission document

## **Troubleshooting**

### **Common Issues**

#### **1. Migration Fails**
```bash
# Check MongoDB connection
# Verify database name
# Check permissions
```

#### **2. Student Count Mismatch**
```bash
# Use debug endpoint to compare
# Check for duplicate records
# Verify migration completed fully
```

#### **3. API Errors**
```bash
# Check server logs
# Verify StudentMission collection exists
# Check indexes are created
```

### **Debug Commands**
```bash
# Check MongoDB collections
mongo sms --eval "db.getCollectionNames()"

# Check mission data
mongo sms --eval "db.missions.findOne({code: 'MISSION-001'})"

# Check StudentMission data
mongo sms --eval "db.studentmissions.find({missionId: ObjectId('MISSION_ID')})"
```

## **Support**

If you encounter issues:

1. **Check the logs** - Look for error messages
2. **Verify data** - Use debug endpoints
3. **Check MongoDB** - Ensure collections exist
4. **Review migration** - Ensure it completed successfully

## **Post-Migration Checklist**

- [ ] Migration script completed successfully
- [ ] All missions have StudentMission records
- [ ] Student counts match between old and new systems
- [ ] Cleanup script completed
- [ ] Admin missions page works
- [ ] Mission hub displays correctly
- [ ] Student management functions work
- [ ] All APIs respond correctly
- [ ] No data loss occurred

## **Next Steps**

After successful migration:

1. **Monitor the system** for any issues
2. **Update documentation** if needed
3. **Train users** on any UI changes
4. **Plan future improvements** using the new structure

---

**⚠️ IMPORTANT**: Always backup your database before running migrations!
