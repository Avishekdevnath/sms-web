export type DefaultCourse = { title: string; code: string; description?: string };

export function getDefaultCoursesForSemester(semNumber: 1 | 2 | 3): DefaultCourse[] {
  if (semNumber === 1) {
    return [
      { title: "Introduction to Programming Language", code: "IPL-101" },
      { title: "Introduction to C++ for DSA", code: "CPP-DSA-101" },
    ];
  }
  if (semNumber === 2) {
    return [
      { title: "Basic Data Structures", code: "DS-101" },
      { title: "Introduction to Algorithms", code: "ALG-101" },
    ];
  }
  if (semNumber === 3) {
    return [
      // Add any fixed semester 3 defaults here if needed
    ];
  }
  return [];
} 