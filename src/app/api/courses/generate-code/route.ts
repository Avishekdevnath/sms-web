import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { Course } from '@/models/Course';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    
    // Check if user has permission to generate course codes
    if (!['admin', 'manager', 'developer'].includes(me.role)) {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Get course title from query params if available
    const { searchParams } = new URL(req.url);
    const courseTitle = searchParams.get('title') || '';

    // Generate a meaningful course code based on title
    let courseCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      attempts++;
      
      if (attempts === 1) {
        // First attempt: Generate a meaningful course code
        courseCode = generateMeaningfulCourseCode(courseTitle);
      } else {
        // Subsequent attempts: Add random suffix
        courseCode = generateMeaningfulCourseCode(courseTitle) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
      }

      // Check if code already exists
      const existingCourse = await Course.findOne({ code: courseCode });
      
      if (!existingCourse) {
        break; // Found a unique code
      }
      
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return createErrorResponse('Unable to generate unique course code after multiple attempts', 500);
    }

    return createSuccessResponse({ courseCode }, 'Course code generated successfully');

  } catch (error) {
    console.error('Error in generate-course-code API:', error);
    return handleApiError(error);
  }
}

function generateMeaningfulCourseCode(courseTitle: string): string {
  if (!courseTitle.trim()) {
    // If no title provided, generate a generic code
    return generateGenericCourseCode();
  }

  const title = courseTitle.toLowerCase();
  
  // Computer Science and Programming
  if (title.includes('programming') || title.includes('coding') || title.includes('software')) {
    if (title.includes('introduction') || title.includes('basic') || title.includes('fundamental')) {
      return 'CS101';
    } else if (title.includes('advanced') || title.includes('expert')) {
      return 'CS401';
    } else {
      return 'CS201';
    }
  }
  
  if (title.includes('data structure') || title.includes('algorithm')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'CS201';
    } else {
      return 'CS301';
    }
  }
  
  if (title.includes('web development') || title.includes('frontend') || title.includes('html') || title.includes('css')) {
    return 'WEB201';
  }
  
  if (title.includes('database') || title.includes('sql') || title.includes('mongodb')) {
    return 'DB201';
  }
  
  if (title.includes('artificial intelligence') || title.includes('ai') || title.includes('machine learning') || title.includes('ml')) {
    return 'AI301';
  }
  
  if (title.includes('operating system') || title.includes('os')) {
    return 'OS301';
  }
  
  if (title.includes('network') || title.includes('networking')) {
    return 'NET301';
  }
  
  if (title.includes('software engineering') || title.includes('software development')) {
    return 'SE301';
  }
  
  // Mathematics
  if (title.includes('calculus') || title.includes('math')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'MATH101';
    } else if (title.includes('advanced')) {
      return 'MATH301';
    } else {
      return 'MATH201';
    }
  }
  
  if (title.includes('linear algebra') || title.includes('algebra')) {
    return 'MATH201';
  }
  
  if (title.includes('statistics') || title.includes('probability')) {
    return 'MATH301';
  }
  
  // Engineering
  if (title.includes('engineering') || title.includes('eng')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'ENG101';
    } else if (title.includes('advanced')) {
      return 'ENG401';
    } else {
      return 'ENG201';
    }
  }
  
  // Physics
  if (title.includes('physics')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'PHY101';
    } else if (title.includes('advanced')) {
      return 'PHY301';
    } else {
      return 'PHY201';
    }
  }
  
  // Chemistry
  if (title.includes('chemistry') || title.includes('chem')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'CHEM101';
    } else if (title.includes('advanced')) {
      return 'CHEM301';
    } else {
      return 'CHEM201';
    }
  }
  
  // Biology
  if (title.includes('biology') || title.includes('bio')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'BIO101';
    } else if (title.includes('advanced')) {
      return 'BIO301';
    } else {
      return 'BIO201';
    }
  }
  
  // Business and Management
  if (title.includes('business') || title.includes('management') || title.includes('marketing')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'BUS101';
    } else if (title.includes('advanced')) {
      return 'BUS401';
    } else {
      return 'BUS201';
    }
  }
  
  // Economics
  if (title.includes('economics') || title.includes('econ')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'ECON101';
    } else if (title.includes('advanced')) {
      return 'ECON301';
    } else {
      return 'ECON201';
    }
  }
  
  // Psychology
  if (title.includes('psychology') || title.includes('psych')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'PSY101';
    } else if (title.includes('advanced')) {
      return 'PSY301';
    } else {
      return 'PSY201';
    }
  }
  
  // English and Literature
  if (title.includes('english') || title.includes('literature') || title.includes('writing')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'ENG101';
    } else if (title.includes('advanced')) {
      return 'ENG301';
    } else {
      return 'ENG201';
    }
  }
  
  // History
  if (title.includes('history') || title.includes('hist')) {
    if (title.includes('basic') || title.includes('fundamental')) {
      return 'HIST101';
    } else if (title.includes('advanced')) {
      return 'HIST301';
    } else {
      return 'HIST201';
    }
  }
  
  // Generic fallback based on title length and content
  if (title.length < 20) {
    return 'GEN101';
  } else if (title.length < 40) {
    return 'GEN201';
  } else {
    return 'GEN301';
  }
}

function generateGenericCourseCode(): string {
  const prefixes = ['CS', 'MATH', 'ENG', 'PHY', 'CHEM', 'BIO', 'BUS', 'ECON', 'PSY', 'HIST'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${prefix}${number}`;
}
