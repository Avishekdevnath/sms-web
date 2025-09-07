"use client";

import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Calendar,
  Check,
  X
} from "lucide-react";

interface CourseOffering {
  _id: string;
  title: string;
  code: string;
  courseId: {
    _id: string;
    title: string;
    code: string;
  };
  batchId: {
    _id: string;
    title: string;
    code: string;
  };
  semesterId: {
    _id: string;
    number: number;
    title: string;
  };
}

interface EnhancedCourseOfferingSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  groupBy?: 'batch' | 'semester' | 'course' | 'none';
  limit?: number;
  className?: string;
}

export default function EnhancedCourseOfferingSelector({
  value,
  onChange,
  error,
  placeholder = "Select a course offering",
  showSearch = true,
  showFilters = true,
  groupBy = 'batch',
  limit = 100,
  className = ""
}: EnhancedCourseOfferingSelectorProps) {
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [filteredOfferings, setFilteredOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  useEffect(() => {
    fetchCourseOfferings();
  }, []);

  useEffect(() => {
    filterOfferings();
  }, [courseOfferings, searchTerm, selectedBatch, selectedSemester, selectedCourse]);

  const fetchCourseOfferings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/course-offerings?limit=${limit}`);
      const data = await response.json();
      setCourseOfferings(data.data || []);
    } catch (error) {
      console.error("Error fetching course offerings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOfferings = () => {
    let filtered = courseOfferings;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(offering => 
        offering.courseId.title.toLowerCase().includes(term) ||
        offering.courseId.code.toLowerCase().includes(term) ||
        offering.batchId.title.toLowerCase().includes(term) ||
        offering.batchId.code.toLowerCase().includes(term) ||
        offering.semesterId.title.toLowerCase().includes(term) ||
        offering.title.toLowerCase().includes(term)
      );
    }

    // Apply batch filter
    if (selectedBatch) {
      filtered = filtered.filter(offering => offering.batchId._id === selectedBatch);
    }

    // Apply semester filter
    if (selectedSemester) {
      filtered = filtered.filter(offering => offering.semesterId._id === selectedSemester);
    }

    // Apply course filter
    if (selectedCourse) {
      filtered = filtered.filter(offering => offering.courseId._id === selectedCourse);
    }

    setFilteredOfferings(filtered);
  };

  const getDisplayText = (offering: CourseOffering) => {
    return `${offering.batchId.title} - ${offering.semesterId.title} - ${offering.courseId.title}`;
  };

  const getSelectedOffering = () => {
    return courseOfferings.find(offering => offering._id === value);
  };

  const getUniqueValues = (key: keyof CourseOffering, subKey?: string) => {
    const values = courseOfferings.map(offering => {
      const obj = offering[key] as any;
      return subKey ? obj[subKey] : obj;
    });
    return Array.from(new Set(values.map(v => JSON.stringify(v)))).map(v => JSON.parse(v));
  };

  const getGroupedOfferings = () => {
    if (groupBy === 'none') {
      return { 'All Offerings': filteredOfferings };
    }

    const grouped: Record<string, CourseOffering[]> = {};

    filteredOfferings.forEach(offering => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'batch':
          groupKey = offering.batchId.title;
          break;
        case 'semester':
          groupKey = offering.semesterId.title;
          break;
        case 'course':
          groupKey = offering.courseId.title;
          break;
        default:
          groupKey = 'All Offerings';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(offering);
    });

    return grouped;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBatch("");
    setSelectedSemester("");
    setSelectedCourse("");
  };

  const hasActiveFilters = searchTerm || selectedBatch || selectedSemester || selectedCourse;

  return (
    <div className={`relative ${className}`}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-left flex items-center justify-between ${
          error 
            ? "border-red-500 focus:ring-red-500" 
            : "border-gray-300 focus:ring-black"
        }`}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value ? getDisplayText(getSelectedOffering()!) : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search and Filters */}
          {(showSearch || showFilters) && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              {showSearch && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search course offerings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  />
                </div>
              )}

              {showFilters && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Filters</span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {/* Batch Filter */}
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-black focus:border-transparent"
                    >
                      <option value="">All Batches</option>
                      {getUniqueValues('batchId').map((batch: any) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.title}
                        </option>
                      ))}
                    </select>

                    {/* Semester Filter */}
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-black focus:border-transparent"
                    >
                      <option value="">All Semesters</option>
                      {getUniqueValues('semesterId').map((semester: any) => (
                        <option key={semester._id} value={semester._id}>
                          {semester.title}
                        </option>
                      ))}
                    </select>

                    {/* Course Filter */}
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-black focus:border-transparent"
                    >
                      <option value="">All Courses</option>
                      {getUniqueValues('courseId').map((course: any) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
                <p className="mt-2 text-sm">Loading course offerings...</p>
              </div>
            ) : filteredOfferings.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No course offerings found</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="py-1">
                {Object.entries(getGroupedOfferings()).map(([groupName, offerings]) => (
                  <div key={groupName}>
                    {groupBy !== 'none' && (
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 border-b">
                        {groupName} ({offerings.length})
                      </div>
                    )}
                    {offerings.map((offering) => (
                      <button
                        key={offering._id}
                        type="button"
                        onClick={() => {
                          onChange(offering._id);
                          setIsOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          value === offering._id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {getDisplayText(offering)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {offering.batchId.code}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Sem {offering.semesterId.number}
                              </span>
                              <span className="flex items-center">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {offering.courseId.code}
                              </span>
                            </div>
                          </div>
                        </div>
                        {value === offering._id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{filteredOfferings.length} of {courseOfferings.length} offerings</span>
              {hasActiveFilters && (
                <span className="text-blue-600">Filtered</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
