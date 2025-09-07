// ✅ V2 SCHEMAS INDEX FILE
// Export all V2 validation schemas

export * from './mission';
export * from './missionStudent';
export * from './missionMentor';
export * from './mentorshipGroup';

// ✅ V2 SCHEMAS SUMMARY
/*
V2 Validation Schemas Created:

1. MissionV2 Schema - Complete validation for mission creation and updates
   - Code format validation (MISSION-XXX)
   - Date range validation (endDate > startDate)
   - Course weight validation (sum to 100%)
   - Comprehensive field validation with proper error messages

2. MissionStudentV2 Schema - Student assignment validation with dual-level status
   - Mission-level status validation
   - Group-level status validation
   - Progress and attendance validation
   - Course progress validation
   - Bulk assignment validation

3. MissionMentorV2 Schema - Mentor assignment validation with dual-level status
   - Mission-level status validation
   - Group-level status validation
   - Availability and capacity validation
   - Specialization and role validation
   - Bulk assignment validation

4. MentorshipGroupV2 Schema - Group creation and management validation
   - Participant assignment validation
   - Meeting schedule validation
   - Communication channel validation
   - Group formation from participants validation

Key Features:
- ✅ Zod validation for type safety
- ✅ Comprehensive error messages
- ✅ Business logic validation (dates, weights, etc.)
- ✅ Query parameter validation with defaults
- ✅ MongoDB ObjectId format validation
- ✅ Enum validation for status and role fields
- ✅ Dual-level status validation (mission + group)
- ✅ Bulk operation validation
- ✅ Participant management validation
*/
