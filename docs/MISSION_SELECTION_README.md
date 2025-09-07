# 🚀 Mission Selection System - Global Mission Context

## Overview

The Mission Selection System provides a global way to select and manage missions across all pages. When a user selects a mission (e.g., MISSION-001) from the sidebar, all other mission-related pages will automatically use that selected mission for CRUD operations.

## 🏗️ Architecture

### 1. Mission Context (`src/context/MissionContext.tsx`)
- **Global State Management**: Manages the selected mission across the entire application
- **Automatic Persistence**: Saves selected mission to localStorage
- **Role-Based Loading**: Automatically loads missions based on user role
- **Real-time Updates**: Provides refresh functionality for mission data

### 2. Sidebar Integration (`src/components/dashboard/Sidebar.tsx`)
- **Mission Selector**: Dropdown to choose from available missions
- **Mission Display**: Shows current mission details (code, title, status, student count)
- **Refresh Button**: Updates mission list from server
- **Visual Indicators**: Clear display of selected mission information

### 3. Custom Hook (`src/hooks/useSelectedMission.ts`)
- **Easy Access**: Simple hook to get selected mission data
- **Validation Helpers**: Functions to validate mission operations
- **Data Getters**: Convenient methods to access mission properties
- **Type Safety**: Full TypeScript support

## 🎯 How It Works

### 1. Mission Selection Flow
```
User selects MISSION-001 from sidebar
    ↓
Mission Context updates global state
    ↓
All pages automatically use MISSION-001
    ↓
CRUD operations target MISSION-001
```

### 2. Data Persistence
- Selected mission is automatically saved to localStorage
- Mission selection persists across page refreshes
- User can switch between missions seamlessly

### 3. Role-Based Access
- **Students**: See only their enrolled missions
- **Admin/SRE/Mentor**: See all available missions
- **Automatic Filtering**: Based on user permissions

## 📱 Usage Examples

### Basic Mission Access
```tsx
import { useSelectedMission } from '@/hooks/useSelectedMission';

function MyComponent() {
  const { 
    selectedMission, 
    hasSelectedMission, 
    getSelectedMissionCode 
  } = useSelectedMission();

  if (!hasSelectedMission) {
    return <div>Please select a mission from the sidebar</div>;
  }

  return (
    <div>
      <h1>Working with {getSelectedMissionCode()}</h1>
      <p>Mission: {selectedMission.title}</p>
    </div>
  );
}
```

### Mission Validation
```tsx
function MissionOperation() {
  const { validateMissionForOperation } = useSelectedMission();

  const handleOperation = () => {
    const validation = validateMissionForOperation('student_enrollment', ['active', 'draft']);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Proceed with operation
    performStudentEnrollment();
  };
}
```

### Mission Data Access
```tsx
function MissionDetails() {
  const {
    getSelectedMissionId,
    getSelectedMissionStudentCount,
    getSelectedMissionBatch,
    isMissionActive
  } = useSelectedMission();

  const missionId = getSelectedMissionId();
  const studentCount = getSelectedMissionStudentCount();
  const batch = getSelectedMissionBatch();
  const isActive = isMissionActive();

  return (
    <div>
      <h2>Mission ID: {missionId}</h2>
      <p>Students: {studentCount}</p>
      <p>Batch: {batch?.code}</p>
      <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
    </div>
  );
}
```

### API Calls with Selected Mission
```tsx
function StudentManagement() {
  const { getSelectedMissionId, validateMissionForOperation } = useSelectedMission();

  const addStudent = async (studentData) => {
    // Validate mission is suitable for student enrollment
    const validation = validateMissionForOperation('student_enrollment', ['active', 'draft']);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const missionId = getSelectedMissionId();
    
    // API call uses selected mission
    const response = await fetch(`/api/v2/missions/${missionId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });

    // Handle response...
  };
}
```

## 🔧 Available Methods

### Mission Data
- `selectedMission` - Full mission object
- `hasSelectedMission` - Boolean check
- `getSelectedMissionId()` - Mission ID for API calls
- `getSelectedMissionCode()` - Mission code (e.g., "MISSION-001")
- `getSelectedMissionTitle()` - Mission title
- `getSelectedMissionDescription()` - Mission description

### Mission Status
- `isMissionStatus(status)` - Check specific status
- `isMissionActive()` - Check if active
- `isMissionDraft()` - Check if draft
- `isMissionCompleted()` - Check if completed

### Mission Details
- `getSelectedMissionBatch()` - Batch information
- `getSelectedMissionStudentCount()` - Current student count
- `getSelectedMissionMentorCount()` - Current mentor count
- `getSelectedMissionMaxStudents()` - Maximum allowed students
- `getSelectedMissionCourses()` - Mission courses
- `getSelectedMissionRequirements()` - Mission requirements
- `getSelectedMissionRewards()` - Mission rewards

### Course Helpers
- `hasCourse(courseId)` - Check if mission has specific course
- `getCourseWeight(courseId)` - Get course weight in mission
- `getCourseMinProgress(courseId)` - Get required progress for course

### Validation
- `validateMissionForOperation(operation, requiredStatus)` - Validate mission for operation

### Display Helpers
- `getMissionDisplayName()` - Full mission name
- `getMissionShortName()` - Short mission code

## 🚨 Best Practices

### 1. Always Validate
```tsx
// ✅ Good: Validate before operations
const validation = validateMissionForOperation('student_management', ['active']);
if (!validation.valid) {
  showError(validation.error);
  return;
}

// ❌ Bad: Assume mission is valid
if (selectedMission) {
  // Proceed without validation
}
```

### 2. Handle No Mission Selected
```tsx
// ✅ Good: Check if mission is selected
if (!hasSelectedMission) {
  return <MissionSelectionRequired />;
}

// ❌ Bad: Direct access without check
return <div>{selectedMission.title}</div>; // Could crash
```

### 3. Use Appropriate Status Checks
```tsx
// ✅ Good: Check specific status for operation
if (isMissionActive()) {
  // Allow student enrollment
}

// ❌ Bad: Generic status check
if (selectedMission.status) {
  // Too generic
}
```

## 🔄 Migration Guide

### From Local Mission State
```tsx
// ❌ Old: Local state management
const [selectedMission, setSelectedMission] = useState(null);

// ✅ New: Use global context
const { selectedMission, setSelectedMission } = useSelectedMission();
```

### From Props Drilling
```tsx
// ❌ Old: Pass mission through props
function ChildComponent({ mission }) {
  return <div>{mission.title}</div>;
}

// ✅ New: Use hook directly
function ChildComponent() {
  const { getSelectedMissionTitle } = useSelectedMission();
  return <div>{getSelectedMissionTitle()}</div>;
}
```

## 🎉 Benefits

1. **Global Consistency**: All pages use the same selected mission
2. **No Props Drilling**: Access mission data anywhere in the app
3. **Automatic Persistence**: Mission selection survives page refreshes
4. **Role-Based Access**: Automatic filtering based on user permissions
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Easy Validation**: Built-in validation helpers for operations
7. **Performance**: Efficient state management with React Context
8. **User Experience**: Clear visual feedback of selected mission

## 🚀 Getting Started

1. **Wrap your app** with `MissionProvider` in the root layout
2. **Use the hook** in any component that needs mission data
3. **Validate operations** before proceeding
4. **Handle edge cases** when no mission is selected

The system is now ready to use! Select a mission from the sidebar and all your mission-related pages will automatically work with that mission. 🎯
