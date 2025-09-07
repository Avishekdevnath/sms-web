import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Mission {
  _id: string;
  code: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  maxStudents: number;
  totalStudents?: number;
  totalMentors?: number;
  batchId?: {
    _id: string;
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  batchId?: {
    _id: string;
    code: string;
  };
  enrollmentDate: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
}

export interface Mentor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  assignedStudents: string[];
  totalStudents: number;
  status: 'active' | 'inactive';
}

export interface MentorshipGroup {
  _id: string;
  name: string;
  mentorId: string;
  studentIds: string[];
  meetingSchedule: string;
  status: 'active' | 'completed';
}

export interface MissionHubState {
  // Missions
  missions: Mission[];
  selectedMission: Mission | null;
  missionsLoading: boolean;
  missionsError: string | null;
  
  // Students
  students: Student[];
  studentsLoading: boolean;
  studentsError: string | null;
  
  // Mentors
  mentors: Mentor[];
  mentorsLoading: boolean;
  mentorsError: string | null;
  
  // Groups
  groups: MentorshipGroup[];
  groupsLoading: boolean;
  groupsError: string | null;
  
  // UI State
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'students' | 'mentors' | 'groups' | 'analytics';
  filters: {
    missionStatus: string;
    studentStatus: string;
    mentorStatus: string;
    searchQuery: string;
  };
}

const initialState: MissionHubState = {
  // Missions
  missions: [],
  selectedMission: null,
  missionsLoading: false,
  missionsError: null,
  
  // Students
  students: [],
  studentsLoading: false,
  studentsError: null,
  
  // Mentors
  mentors: [],
  mentorsLoading: false,
  mentorsError: null,
  
  // Groups
  groups: [],
  groupsLoading: false,
  groupsError: null,
  
  // UI State
  sidebarOpen: false,
  currentView: 'dashboard',
  filters: {
    missionStatus: '',
    studentStatus: '',
    mentorStatus: '',
    searchQuery: '',
  },
};

// Async Thunks
export const fetchMissions = createAsyncThunk(
  'missionHub/fetchMissions',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching missions from /api/v2/missions...');
      const response = await fetch('/api/v2/missions');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API response not ok:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📡 API Response:', data);
      
      // The API returns { success: true, data: missions[], pagination: {...} }
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Successfully fetched ${data.data.length} missions:`, data.data);
        return data.data;
      } else {
        console.error('❌ Invalid API response format:', data);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('❌ Error in fetchMissions:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch missions');
    }
  }
);

export const fetchStudents = createAsyncThunk(
  'missionHub/fetchStudents',
  async (missionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v2/missions/${missionId}/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      return data.students || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch students');
    }
  }
);

export const fetchMentors = createAsyncThunk(
  'missionHub/fetchMentors',
  async (missionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v2/missions/${missionId}/mentors`);
      if (!response.ok) {
        throw new Error('Failed to fetch mentors');
      }
      const data = await response.json();
      return data.mentors || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch mentors');
    }
  }
);

export const fetchGroups = createAsyncThunk(
  'missionHub/fetchGroups',
  async (missionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/v2/missions/${missionId}/groups`);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data = await response.json();
      return data.groups || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch groups');
    }
  }
);

// Slice
const missionHubSlice = createSlice({
  name: 'missionHub',
  initialState,
  reducers: {
    // UI Actions
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    setCurrentView: (state, action: PayloadAction<MissionHubState['currentView']>) => {
      state.currentView = action.payload;
    },
    
    setSelectedMission: (state, action: PayloadAction<Mission | null>) => {
      state.selectedMission = action.payload;
    },
    
    // Filter Actions
    setFilter: (state, action: PayloadAction<{ key: keyof MissionHubState['filters']; value: string }>) => {
      state.filters[action.payload.key] = action.payload.value;
    },
    
    clearFilters: (state) => {
      state.filters = {
        missionStatus: '',
        studentStatus: '',
        mentorStatus: '',
        searchQuery: '',
      };
    },
    
    // Local State Updates
    addMission: (state, action: PayloadAction<Mission>) => {
      state.missions.push(action.payload);
    },
    
    updateMission: (state, action: PayloadAction<{ id: string; updates: Partial<Mission> }>) => {
      const index = state.missions.findIndex(m => m._id === action.payload.id);
      if (index !== -1) {
        state.missions[index] = { ...state.missions[index], ...action.payload.updates };
      }
    },
    
    removeMission: (state, action: PayloadAction<string>) => {
      state.missions = state.missions.filter(m => m._id !== action.payload);
      if (state.selectedMission?._id === action.payload) {
        state.selectedMission = null;
      }
    },
    
    addStudent: (state, action: PayloadAction<Student>) => {
      state.students.push(action.payload);
    },
    
    updateStudent: (state, action: PayloadAction<{ id: string; updates: Partial<Student> }>) => {
      const index = state.students.findIndex(s => s._id === action.payload.id);
      if (index !== -1) {
        state.students[index] = { ...state.students[index], ...action.payload.updates };
      }
    },
    
    removeStudent: (state, action: PayloadAction<string>) => {
      state.students = state.students.filter(s => s._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Missions
    builder
      .addCase(fetchMissions.pending, (state) => {
        state.missionsLoading = true;
        state.missionsError = null;
      })
      .addCase(fetchMissions.fulfilled, (state, action) => {
        state.missionsLoading = false;
        state.missions = action.payload;
        
        // Auto-select the first mission if no mission is currently selected
        if (action.payload.length > 0 && !state.selectedMission) {
          state.selectedMission = action.payload[0];
        }
      })
      .addCase(fetchMissions.rejected, (state, action) => {
        state.missionsLoading = false;
        state.missionsError = action.payload as string;
      });
    
    // Students
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.studentsLoading = true;
        state.studentsError = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.students = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.studentsLoading = false;
        state.studentsError = action.payload as string;
      });
    
    // Mentors
    builder
      .addCase(fetchMentors.pending, (state) => {
        state.mentorsLoading = true;
        state.mentorsError = null;
      })
      .addCase(fetchMentors.fulfilled, (state, action) => {
        state.mentorsLoading = false;
        state.mentors = action.payload;
      })
      .addCase(fetchMentors.rejected, (state, action) => {
        state.mentorsLoading = false;
        state.mentorsError = action.payload as string;
      });
    
    // Groups
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.groupsLoading = true;
        state.groupsError = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.groupsLoading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.groupsLoading = false;
        state.groupsError = action.payload as string;
      });
  },
});

// Export actions
export const {
  setSidebarOpen,
  setCurrentView,
  setSelectedMission,
  setFilter,
  clearFilters,
  addMission,
  updateMission,
  removeMission,
  addStudent,
  updateStudent,
  removeStudent,
} = missionHubSlice.actions;

// Export selectors
export const selectMissions = (state: { missionHub: MissionHubState }) => state.missionHub.missions;
export const selectSelectedMission = (state: { missionHub: MissionHubState }) => state.missionHub.selectedMission;
export const selectMissionsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.missionsLoading;
export const selectMissionsError = (state: { missionHub: MissionHubState }) => state.missionHub.missionsError;

export const selectStudents = (state: { missionHub: MissionHubState }) => state.missionHub.students;
export const selectStudentsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.studentsLoading;
export const selectStudentsError = (state: { missionHub: MissionHubState }) => state.missionHub.studentsError;

export const selectMentors = (state: { missionHub: MissionHubState }) => state.missionHub.mentors;
export const selectMentorsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.mentorsLoading;
export const selectMentorsError = (state: { missionHub: MissionHubState }) => state.missionHub.mentorsError;

export const selectGroups = (state: { missionHub: MissionHubState }) => state.missionHub.groups;
export const selectGroupsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.groupsLoading;
export const selectGroupsError = (state: { missionHub: MissionHubState }) => state.missionHub.groupsError;

export const selectSidebarOpen = (state: { missionHub: MissionHubState }) => state.missionHub.sidebarOpen;
export const selectCurrentView = (state: { missionHub: MissionHubState }) => state.missionHub.currentView;
export const selectFilters = (state: { missionHub: MissionHubState }) => state.missionHub.filters;

export default missionHubSlice.reducer;
