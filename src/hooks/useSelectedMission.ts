import { useMissionContext } from '@/context/MissionContext';

/**
 * Custom hook to get the currently selected mission and perform CRUD operations
 * This ensures all mission-related pages use the same selected mission from the sidebar
 */
export function useSelectedMission() {
  const { selectedMission, setSelectedMission, availableMissions, loading, refreshMissions } = useMissionContext();

  /**
   * Check if a mission is selected
   */
  const hasSelectedMission = !!selectedMission;

  /**
   * Get the selected mission ID for API calls
   */
  const getSelectedMissionId = () => selectedMission?._id;

  /**
   * Get the selected mission code (e.g., "MISSION-001")
   */
  const getSelectedMissionCode = () => selectedMission?.code;

  /**
   * Get the selected mission title
   */
  const getSelectedMissionTitle = () => selectedMission?.title;

  /**
   * Check if the selected mission is in a specific status
   */
  const isMissionStatus = (status: string) => selectedMission?.status === status;

  /**
   * Check if the selected mission is active
   */
  const isMissionActive = () => selectedMission?.status === 'active';

  /**
   * Check if the selected mission is draft
   */
  const isMissionDraft = () => selectedMission?.status === 'draft';

  /**
   * Check if the selected mission is completed
   */
  const isMissionCompleted = () => selectedMission?.status === 'completed';

  /**
   * Get the selected mission's batch information
   */
  const getSelectedMissionBatch = () => selectedMission?.batchId;

  /**
   * Get the selected mission's student count
   */
  const getSelectedMissionStudentCount = () => selectedMission?.totalStudents || 0;

  /**
   * Get the selected mission's mentor count
   */
  const getSelectedMissionMentorCount = () => selectedMission?.totalMentors || 0;

  /**
   * Get the selected mission's max students
   */
  const getSelectedMissionMaxStudents = () => selectedMission?.maxStudents;

  /**
   * Get the selected mission's courses
   */
  const getSelectedMissionCourses = () => selectedMission?.courses || [];

  /**
   * Get the selected mission's requirements
   */
  const getSelectedMissionRequirements = () => selectedMission?.requirements || [];

  /**
   * Get the selected mission's rewards
   */
  const getSelectedMissionRewards = () => selectedMission?.rewards || [];

  /**
   * Get the selected mission's date range
   */
  const getSelectedMissionDateRange = () => ({
    startDate: selectedMission?.startDate,
    endDate: selectedMission?.endDate
  });

  /**
   * Get the selected mission's creation date
   */
  const getSelectedMissionCreatedAt = () => selectedMission?.createdAt;

  /**
   * Get the selected mission's description
   */
  const getSelectedMissionDescription = () => selectedMission?.description;

  /**
   * Check if the selected mission has a specific course
   */
  const hasCourse = (courseId: string) => {
    return selectedMission?.courses?.some(course => 
      course.courseOfferingId._id === courseId
    ) || false;
  };

  /**
   * Get the weight of a specific course in the selected mission
   */
  const getCourseWeight = (courseId: string) => {
    const course = selectedMission?.courses?.find(course => 
      course.courseOfferingId._id === courseId
    );
    return course?.weight || 0;
  };

  /**
   * Get the minimum progress required for a specific course in the selected mission
   */
  const getCourseMinProgress = (courseId: string) => {
    const course = selectedMission?.courses?.find(course => 
      course.courseOfferingId._id === courseId
    );
    return course?.minProgress || 0;
  };

  /**
   * Validate if the selected mission is suitable for a specific operation
   */
  const validateMissionForOperation = (operation: string, requiredStatus?: string[]) => {
    if (!selectedMission) {
      return {
        valid: false,
        error: 'No mission selected. Please select a mission from the sidebar.'
      };
    }

    if (requiredStatus && !requiredStatus.includes(selectedMission.status)) {
      return {
        valid: false,
        error: `Operation '${operation}' requires mission status to be one of: ${requiredStatus.join(', ')}. Current status: ${selectedMission.status}`
      };
    }

    return {
      valid: true,
      error: null
    };
  };

  /**
   * Get a formatted display name for the selected mission
   */
  const getMissionDisplayName = () => {
    if (!selectedMission) return 'No Mission Selected';
    return `${selectedMission.code} - ${selectedMission.title}`;
  };

  /**
   * Get a short display name for the selected mission
   */
  const getMissionShortName = () => {
    if (!selectedMission) return 'No Mission';
    return selectedMission.code;
  };

  return {
    // Mission data
    selectedMission,
    hasSelectedMission,
    getSelectedMissionId,
    getSelectedMissionCode,
    getSelectedMissionTitle,
    getSelectedMissionDescription,
    
    // Mission status
    isMissionStatus,
    isMissionActive,
    isMissionDraft,
    isMissionCompleted,
    
    // Mission details
    getSelectedMissionBatch,
    getSelectedMissionStudentCount,
    getSelectedMissionMentorCount,
    getSelectedMissionMaxStudents,
    getSelectedMissionCourses,
    getSelectedMissionRequirements,
    getSelectedMissionRewards,
    getSelectedMissionDateRange,
    getSelectedMissionCreatedAt,
    
    // Course helpers
    hasCourse,
    getCourseWeight,
    getCourseMinProgress,
    
    // Validation
    validateMissionForOperation,
    
    // Display helpers
    getMissionDisplayName,
    getMissionShortName,
    
    // Context methods
    setSelectedMission,
    availableMissions,
    loading,
    refreshMissions
  };
}
