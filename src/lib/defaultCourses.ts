import { generateCourseCodeForPosition } from './courseCodeGenerator';

export type DefaultCourse = { title: string; code: string; description?: string };

export function getDefaultCoursesForSemester(semNumber: 1 | 2 | 3): DefaultCourse[] {
  if (semNumber === 1) {
    return [
      { 
        title: "CSE Fundamental", 
        code: generateCourseCodeForPosition(1, 1), // CS101
        description: "Computer Science & Engineering fundamentals covering programming basics, algorithms, and problem-solving"
      },
      { 
        title: "Introduction to Programming Language", 
        code: generateCourseCodeForPosition(1, 2), // CS102
        description: "Learn the fundamentals of programming with C language"
      },
      { 
        title: "Introduction to C++ for DSA", 
        code: generateCourseCodeForPosition(1, 3), // CS103
        description: "Master C++ programming concepts for Data Structures and Algorithms"
      },
    ];
  }
  if (semNumber === 2) {
    return [
      { 
        title: "Basic Data Structures", 
        code: generateCourseCodeForPosition(2, 1), // CS201
        description: "Learn fundamental data structures like arrays, linked lists, stacks, and queues"
      },
      { 
        title: "Introduction to Algorithms", 
        code: generateCourseCodeForPosition(2, 2), // CS202
        description: "Understand algorithm design, analysis, and basic algorithmic techniques"
      },
      { 
        title: "Object-Oriented Programming", 
        code: generateCourseCodeForPosition(2, 3), // CS203
        description: "Master OOP concepts, classes, inheritance, and polymorphism"
      },
    ];
  }
  if (semNumber === 3) {
    return [
      { 
        title: "Advanced Data Structures", 
        code: generateCourseCodeForPosition(3, 1), // CS301
        description: "Master advanced data structures like trees, graphs, and hash tables"
      },
      { 
        title: "Advanced Algorithms", 
        code: generateCourseCodeForPosition(3, 2), // CS302
        description: "Learn advanced algorithmic techniques and optimization strategies"
      },
      { 
        title: "Software Engineering Principles", 
        code: generateCourseCodeForPosition(3, 3), // CS303
        description: "Understand software development lifecycle, design patterns, and best practices"
      },
    ];
  }
  return [];
} 