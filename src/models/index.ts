// This file ensures all Mongoose models are registered
// Import all models to register their schemas with Mongoose

// Core models
export { User, type IUser } from './User';
export { Batch, type IBatch } from './Batch';
export { Semester, type ISemester } from './Semester';
export { Course, type ICourse } from './Course';
export { CourseOffering, type ICourseOffering } from './CourseOffering';

// Student-related models
export { StudentProfile, type IStudentProfile } from './StudentProfile';
export { StudentEnrollment, type IStudentEnrollment } from './StudentEnrollment';
export { StudentBatchMembership, type IStudentBatchMembership } from './StudentBatchMembership';
export { StudentCourse, type IStudentCourse } from './StudentCourse';
export { StudentMission, type IStudentMission } from './StudentMission';


// Invitation models
export { Invitation, type IInvitation } from './Invitation';

// Academic models
export { Assignment, type IAssignment } from './Assignment';
export { Exam, type IExam } from './Exam';
export { Attendance, type IAttendance } from './Attendance';
export { Notice, type INotice } from './Notice';

// Mission models
export { Mission, type IMission } from './Mission';
export { MissionParticipant, type IMissionParticipant } from './MissionParticipant';

// Feature models
export { FeatureRequest, type IFeatureRequest } from './FeatureRequest';

// Utility models
export { CallLog, type ICallLog } from './CallLog';

// New Student Support & Mentoring Models
export { StudentAssessment, type IStudentAssessment } from './StudentAssessment';
export { GuidelineSession, type IGuidelineSession } from './GuidelineSession';
export { WeeklySession, type IWeeklySession } from './WeeklySession';
export { StrugglingStudent, type IStrugglingStudent } from './StrugglingStudent';
export { MentorAssignment, type IMentorAssignment } from './MentorAssignment';
export { MentorMeeting, type IMentorMeeting } from './MentorMeeting';
export { MissionMentor, type IMissionMentor } from './MissionMentor';
export { MentorshipGroup, type IMentorshipGroup } from './MentorshipGroup';
export { DiscordIntegration, type IDiscordIntegration } from './DiscordIntegration';
export { DiscordActivity, type IDiscordActivity } from './DiscordActivity';
export { ProgressTracking, type IProgressTracking } from './ProgressTracking';
export { MeetingAttendance, type IMeetingAttendance } from './MeetingAttendance';
export { default as Group, type IGroup } from './Group';

// Messaging & Posts models
export { Channel, type IChannel } from './Channel';
export { Message, type IMessage } from './Message';
export { Post, type IPost } from './Post';
export { Comment, type IComment } from './Comment';
export { ModerationLog, type IModerationLog } from './ModerationLog';
export { Template, type ITemplate } from './Template';
export { GroupTransferLog, type IGroupTransferLog } from './GroupTransferLog';

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

import './Invitation';
import './Assignment';
import './Exam';
import './Attendance';
import './Notice';
import './Mission';
import './MissionParticipant';
import './FeatureRequest';
import './CallLog';

// Import new models
import './StudentAssessment';
import './GuidelineSession';
import './WeeklySession';
import './StrugglingStudent';
import './MentorAssignment';
import './MentorMeeting';
import './MissionMentor';
import './MentorshipGroup';
import './DiscordIntegration';
import './DiscordActivity';
import './ProgressTracking';
import './MeetingAttendance';
import './Group';
import './Channel';
import './Message';
import './Post';
import './Comment';
import './ModerationLog';
import './Template';
