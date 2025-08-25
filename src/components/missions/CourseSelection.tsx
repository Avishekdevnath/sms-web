'use client';

import React, { useState } from 'react';


interface CourseOffering {
  _id: string;
  courseId?: {
    title: string;
    code: string;
  };
}

interface CourseSelectionProps {
  courseOfferings: CourseOffering[];
}

export default function CourseSelection({ courseOfferings }: CourseSelectionProps) {
  const [courses, setCourses] = useState([{ courseOfferingId: '', weight: '' }]);

  const addCourse = () => {
    setCourses([...courses, { courseOfferingId: '', weight: '' }]);
  };

  const removeCourse = (index: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter((_, i) => i !== index));
    }
  };

  const updateCourse = (index: number, field: 'courseOfferingId' | 'weight', value: string) => {
    const newCourses = [...courses];
    newCourses[index] = { ...newCourses[index], [field]: value };
    setCourses(newCourses);
  };

  const validateWeights = () => {
    const total = courses.reduce((sum, course) => sum + (parseFloat(course.weight) || 0), 0);
    return Math.abs(total - 100) <= 0.01;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Courses <span className="text-red-500">*</span>
      </label>
      <div className="space-y-3">
        {courses.map((course, index) => (
          <div key={index} className="course-entry grid md:grid-cols-3 gap-3 p-3 border rounded">
            <select
              name="courseOfferingIds[]"
              value={course.courseOfferingId}
              onChange={(e) => updateCourse(index, 'courseOfferingId', e.target.value)}
              className="input"
              required
            >
              <option value="">Select Course</option>
              {courseOfferings.map((offering) => (
                <option key={offering._id} value={offering._id}>
                  {offering.courseId 
                    ? `${offering.courseId.code} — ${offering.courseId.title}`
                    : offering._id
                  }
                </option>
              ))}
            </select>
            <input
              type="number"
              name="weights[]"
              value={course.weight}
              onChange={(e) => updateCourse(index, 'weight', e.target.value)}
              placeholder="Weight %"
              className="input"
              min="0"
              max="100"
              required
            />
            <button
              type="button"
              onClick={() => removeCourse(index)}
              className="btn btn-danger"
              disabled={courses.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addCourse}
        className="btn btn-secondary mt-2"
      >
        Add Course
      </button>
      
      {courses.length > 0 && (
        <div className="mt-2 text-sm">
          <span className={validateWeights() ? 'text-green-600' : 'text-red-600'}>
            Total Weight: {courses.reduce((sum, course) => sum + (parseFloat(course.weight) || 0), 0)}%
            {!validateWeights() && ' (must equal 100%)'}
          </span>
        </div>
      )}
    </div>
  );
} 