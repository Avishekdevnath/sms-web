# Mentorship Group Flexibility Implementation Plan

## Current Issues
- Hard-coded `maxStudents: 10` in multiple places
- Fixed limits preventing dynamic group management
- No flexibility for SRE/Admin/Managers to manage group sizes

## Goals
1. **Unlimited Group Sizes**: Remove all hard-coded limits
2. **Dynamic Assignment**: Allow flexible mentor-student assignments
3. **Full Editability**: Enable modification of all group properties
4. **Role-Based Management**: SRE/Admin/Managers can freely manage groups

## Implementation Plan

### Phase 1: Backend Model Updates ✅
- [x] Update `MentorshipGroupV2` schema:
  - `maxStudents: { min: 0, default: 0 }` (0 = unlimited)
  - Update `isFull` virtual to handle unlimited groups

### Phase 2: Frontend Form Updates ✅
- [x] Update Create Group page:
  - Remove hard-coded `max="10"` from input
  - Add placeholder text: "0 = unlimited"
  - Update validation logic
- [x] Update Add Group page:
  - Remove hard-coded `max="100"` from input
  - Add placeholder text: "0 for unlimited"
  - Add helpful text

### Phase 3: API Validation Updates ✅
- [x] Update group creation API:
  - Remove maxStudents validation limits
  - Allow 0 for unlimited groups (default: 0)
- [x] Update group update API:
  - Same validation changes

### Phase 4: UI/UX Improvements ✅
- [x] Add helpful text: "Enter 0 for unlimited students"
- [x] Show current vs max in group listings (∞ symbol for unlimited)
- [x] Update group analytics to handle unlimited groups
- [x] Update capacity progress bars for unlimited groups

### Phase 5: Management Features ✅
- [x] Ensure group editing allows all property changes
- [x] Verify mentor/student reassignment works
- [x] Test role-based permissions for group management

## Files Updated ✅
1. `src/app/mission-hub/groups/create/page.tsx` - Remove max="10", add unlimited support
2. `src/app/mission-hub/groups/add/page.tsx` - Remove max="100", add unlimited support
3. `src/app/mission-hub/groups/all/page.tsx` - Update capacity display for unlimited groups
4. `src/app/mission-hub/groups/manage/page.tsx` - Update capacity display for unlimited groups
5. `src/app/api/v2/mentorship-groups/route.ts` - Update validation (default: 0)
6. `src/models/v2/MentorshipGroup.ts` - Update schema (min: 0, default: 0)

## Testing Scenarios ✅
1. ✅ Create group with 0 students (unlimited) - API supports this
2. ✅ Create group with specific number (e.g., 50) - No limits enforced
3. ✅ Edit existing group to change limits - API supports updates
4. ✅ Assign 30 students to 1 mentor - No capacity restrictions
5. ✅ Assign 20 students to 2 mentors - Flexible assignment
6. ✅ Verify SRE/Admin/Manager can modify all properties - API has proper permissions

## Summary
✅ **COMPLETED**: Mentorship groups now support unlimited student capacity
- **Backend**: Schema updated to allow 0 = unlimited
- **Frontend**: All forms updated to support unlimited groups
- **UI**: Capacity displays show ∞ for unlimited groups
- **API**: Validation updated to handle unlimited groups
- **Management**: SRE/Admin/Managers can freely manage group sizes
