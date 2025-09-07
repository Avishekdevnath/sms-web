# 🚀 Redux Toolkit Implementation for Mission Hub

## Overview
This document explains how Redux Toolkit is implemented in the Mission Hub for state management, replacing the previous Context API approach.

## 🛠️ Installation

First, install the required dependencies:

```bash
npm install @reduxjs/toolkit react-redux
```

## 📁 File Structure

```
src/
├── store/
│   ├── index.ts                 # Store configuration
│   └── missionHubSlice.ts       # Mission Hub state slice
├── hooks/
│   ├── useAppDispatch.ts        # Typed dispatch hook
│   └── useAppSelector.ts        # Typed selector hook
├── providers/
│   └── ReduxProvider.tsx        # Redux Provider wrapper
└── components/mission-hub/
    ├── MissionHubSidebar.tsx    # Updated to use Redux
    └── MissionHubClientWrapper.tsx
```

## 🔧 Store Configuration

### Store Setup (`src/store/index.ts`)
```typescript
import { configureStore } from '@reduxjs/toolkit';
import missionHubReducer from './missionHubSlice';

export const store = configureStore({
  reducer: {
    missionHub: missionHubReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 📊 State Structure

### Mission Hub State Interface
```typescript
interface MissionHubState {
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
```

## 🔄 Async Actions (Thunks)

### Fetch Missions
```typescript
export const fetchMissions = createAsyncThunk(
  'missionHub/fetchMissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v2/missions');
      if (!response.ok) {
        throw new Error('Failed to fetch missions');
      }
      const data = await response.json();
      return data.missions || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch missions');
    }
  }
);
```

### Fetch Students
```typescript
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
```

## 🎯 Actions & Reducers

### UI Actions
```typescript
setSidebarOpen: (state, action: PayloadAction<boolean>) => {
  state.sidebarOpen = action.payload;
},

setCurrentView: (state, action: PayloadAction<MissionHubState['currentView']>) => {
  state.currentView = action.payload;
},

setSelectedMission: (state, action: PayloadAction<Mission | null>) => {
  state.selectedMission = action.payload;
},
```

### Filter Actions
```typescript
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
```

## 🔍 Selectors

### Mission Selectors
```typescript
export const selectMissions = (state: { missionHub: MissionHubState }) => state.missionHub.missions;
export const selectSelectedMission = (state: { missionHub: MissionHubState }) => state.missionHub.selectedMission;
export const selectMissionsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.missionsLoading;
export const selectMissionsError = (state: { missionHub: MissionHubState }) => state.missionHub.missionsError;
```

### Student Selectors
```typescript
export const selectStudents = (state: { missionHub: MissionHubState }) => state.missionHub.students;
export const selectStudentsLoading = (state: { missionHub: MissionHubState }) => state.missionHub.studentsLoading;
export const selectStudentsError = (state: { missionHub: MissionHubState }) => state.missionHub.studentsError;
```

## 🎣 Custom Hooks

### Typed Dispatch Hook
```typescript
// src/hooks/useAppDispatch.ts
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
```

### Typed Selector Hook
```typescript
// src/hooks/useAppSelector.ts
import { useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '@/store';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## 🚀 Usage in Components

### Using Redux in Components
```typescript
import { useAppSelector, useAppDispatch } from "@/hooks/useAppSelector";
import { 
  selectMissions, 
  selectSelectedMission, 
  fetchMissions,
  setSelectedMission
} from "@/store/missionHubSlice";

export default function MissionHubSidebar() {
  const dispatch = useAppDispatch();
  const missions = useAppSelector(selectMissions);
  const selectedMission = useAppSelector(selectSelectedMission);
  
  useEffect(() => {
    dispatch(fetchMissions());
  }, [dispatch]);
  
  const handleMissionChange = (missionId: string) => {
    const mission = missions.find(m => m._id === missionId);
    dispatch(setSelectedMission(mission || null));
  };
  
  // ... rest of component
}
```

## 🔄 Provider Setup

### Redux Provider
```typescript
// src/providers/ReduxProvider.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';

interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
```

### Layout Integration
```typescript
// src/app/mission-hub/layout.tsx
import ReduxProvider from "@/providers/ReduxProvider";

export default async function MissionHubLayout({ children }: { children: React.ReactNode }) {
  // ... authentication logic
  
  return (
    <ReduxProvider>
      <MissionHubClientWrapper user={user}>
        {children}
      </MissionHubClientWrapper>
    </ReduxProvider>
  );
}
```

## ✨ Benefits of Redux Toolkit

### 1. **Predictable State Management**
- Single source of truth for all Mission Hub state
- Clear data flow with actions → reducers → state updates

### 2. **Developer Experience**
- Built-in TypeScript support
- Redux DevTools integration
- Immutable updates with Immer

### 3. **Performance**
- Automatic memoization with selectors
- Efficient re-renders
- Optimized state updates

### 4. **Scalability**
- Easy to add new features
- Modular slice architecture
- Async action handling with thunks

### 5. **Debugging**
- Time-travel debugging
- Action logging
- State inspection

## 🔧 Adding New Features

### 1. **Add New State**
```typescript
// In missionHubSlice.ts
interface MissionHubState {
  // ... existing state
  newFeature: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}
```

### 2. **Add New Actions**
```typescript
// In missionHubSlice.ts
export const newAction = createAsyncThunk(
  'missionHub/newAction',
  async (params: any, { rejectWithValue }) => {
    // Implementation
  }
);
```

### 3. **Add New Selectors**
```typescript
// In missionHubSlice.ts
export const selectNewFeature = (state: { missionHub: MissionHubState }) => 
  state.missionHub.newFeature;
```

## 🚨 Migration Notes

### From Context API to Redux
1. **Replace Context Hooks**: `useMissionContext()` → `useAppSelector()` + `useAppDispatch()`
2. **Update State Access**: Direct context values → Redux selectors
3. **Update State Mutations**: Context setters → Redux actions
4. **Add Provider**: Wrap Mission Hub with `ReduxProvider`

### Benefits of Migration
- **Better Performance**: Optimized re-renders
- **Easier Testing**: Mock store for unit tests
- **Better Debugging**: Redux DevTools integration
- **Scalability**: Easier to manage complex state
- **Type Safety**: Full TypeScript support

## 📚 Additional Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Immer for Immutable Updates](https://immerjs.github.io/immer/)

---

This implementation provides a robust, scalable state management solution for the Mission Hub, making it easier to manage complex state, debug issues, and add new features.
