// This file ensures all Mongoose models are registered
// Import all models to register their schemas with Mongoose

// Core models
export { User } from './User';
export { Batch } from './Batch';
export { Semester } from './Semester';
export { Course } from './Course';
export { CourseOffering } from './CourseOffering';

// Student-related models
export { StudentProfile } from './StudentProfile';
export { StudentEnrollment } from './StudentEnrollment';
export { StudentBatchMembership } from './StudentBatchMembership';
export { StudentCourse } from './StudentCourse';
export { StudentMission } from './StudentMission';
export { StudentAssignmentSubmission } from './StudentAssignmentSubmission';

// Invitation models
export { Invitation } from './Invitation';

// Academic models
export { Assignment } from './Assignment';
export { Exam } from './Exam';
export { Attendance } from './Attendance';
export { Notice } from './Notice';

// Mission models
export { Mission } from './Mission';
export { MissionParticipant } from './MissionParticipant';

// Feature models
export { FeatureRequest } from './FeatureRequest';

// Utility models
export { CallLog } from './CallLog';

// Ensure all models are loaded by importing them
import './User';
import './Batch';
import './Semester';
import './Course';
import './CourseOffering';
import './StudentProfile';
import './StudentEnrollment';
import './StudentBatchMembership';
import './StudentCourse';
import './StudentMission';
import './StudentAssignmentSubmission';
import './Invitation';
import './Assignment';
import './Exam';
import './Attendance';
import './Notice';
import './Mission';
import './MissionParticipant';
import './FeatureRequest';
import './CallLog';
