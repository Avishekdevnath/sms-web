// Focus Areas Configuration
// This can be used in other parts of the application where focus areas are needed

export const FOCUS_AREAS = [
  'Frontend Development',
  'Backend Development', 
  'Full Stack Development',
  'Database Design',
  'UI/UX Design',
  'Project Management',
  'Code Review',
  'Testing & QA',
  'DevOps',
  'Mobile Development'
] as const;

export type FocusArea = typeof FOCUS_AREAS[number];

// Helper function to get focus areas
export const getFocusAreas = (): FocusArea[] => {
  return [...FOCUS_AREAS];
};

// Helper function to validate focus area
export const isValidFocusArea = (area: string): area is FocusArea => {
  return FOCUS_AREAS.includes(area as FocusArea);
};
