"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Users, 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Target
} from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectSelectedMission } from "@/store/missionHubSlice";

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  courseOfferingId: {
    _id: string;
    courseId: { _id: string; title: string; code: string; };
    batchId: { _id: string; title: string; code: string; };
    semesterId: { _id: string; title: string; number: number; };
  };
}

interface Assignment {
  _id: string;
  title: string;
  courseOfferingId: {
    _id: string;
    courseId: { _id: string; title: string; code: string; };
    batchId: { _id: string; title: string; code: string; };
    semesterId: { _id: string; title: string; number: number; };
  };
  publishedAt?: string;
  dueAt?: string;
  maxPoints?: number;
}

interface StudentProgress {
  student: Student;
  assignments: {
    assignment: Assignment;
    status: 'completed' | 'pending' | 'overdue' | 'not_started';
    submittedAt?: string;
    score?: number;
  }[];
  isMissionEnrolled: boolean;
  missionStatus: string;
  missionProgress: number;
  groupInfo?: {
    _id: string;
    name: string;
    description: string;
  } | null;
}


interface Semester {
  _id: string;
  title: string;
  number: number;
}

interface Course {
  _id: string;
  title: string;
  code: string;
}

export default function MissionHubAssignmentsPage() {
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Array<{_id: string, name: string, description: string}>>([]);
  const [summary, setSummary] = useState<{
    totalStudents: number;
    missionEnrolledStudents: number;
    totalAssignments: number;
    totalCompletions: number;
  } | null>(null);

  // Redux hooks
  const selectedMission = useAppSelector(selectSelectedMission);

  useEffect(() => {
    fetchData();
  }, [selectedMission]);

  useEffect(() => {
    fetchFilterData();
  }, [selectedMission]);

  // Separate effect to fetch groups when mission changes
  useEffect(() => {
    const fetchGroups = async () => {
      if (selectedMission && selectedMission._id) {
        try {
          const groupsRes = await fetch(`/api/v2/mentorship-groups?missionId=${selectedMission._id}`);
          if (groupsRes.ok) {
            const groupsData = await groupsRes.json();
            setGroups(groupsData.data || []);
          }
        } catch (error) {
          console.error('Error fetching groups:', error);
        }
      } else {
        setGroups([]);
      }
    };

    fetchGroups();
  }, [selectedMission]);


  const fetchFilterData = async () => {
    try {
      const batchId = selectedMission?.batchId?._id || selectedMission?.batchId;
      if (!batchId) {
        setSemesters([]);
        setCourses([]);
        return;
      }

      // Fetch semesters specific to the mission's batch
      const semestersRes = await fetch(`/api/semesters?batchId=${batchId}`);
      
      if (semestersRes.ok) {
        const semestersData = await semestersRes.json();
        setSemesters(semestersData.data || []);
      }

      // Fetch courses through course offerings for this batch
      const courseOfferingsRes = await fetch(`/api/course-offerings?batchId=${batchId}`);
      
      if (courseOfferingsRes.ok) {
        const courseOfferingsData = await courseOfferingsRes.json();
        const courseOfferings = courseOfferingsData.data || [];
        
        // Extract unique courses from course offerings
        const uniqueCourses = courseOfferings.reduce((acc: any[], offering: any) => {
          if (offering.courseId && !acc.find(course => course._id === offering.courseId._id)) {
            acc.push(offering.courseId);
          }
          return acc;
        }, []);
        
        setCourses(uniqueCourses);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!selectedMission || !selectedMission._id) {
        setError("No mission selected");
        setLoading(false);
        return;
      }

      // Use the new dedicated API endpoint
      const missionId = selectedMission._id.toString();
      const response = await fetch(`/api/v2/missions/${missionId}/assignment-progress`);

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const { assignments, studentProgress, assignmentStats, summary } = data.data;
          
          console.log("Assignment Progress Data:", {
            totalStudents: studentProgress.length,
            totalAssignments: assignments.length,
            assignmentStats,
            summary,
            sampleStudent: studentProgress[0],
            sampleAssignment: assignments[0]
          });
          
          setAssignments(assignments);
          setStudentProgress(studentProgress);
          setSummary(summary);
        } else {
          setError("Failed to load assignment progress data");
        }
      } else {
        setError("Failed to fetch assignment progress data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load student progress data");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = studentProgress.filter(progress => {
    const student = progress.student;
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSemester = !filterSemester || 
      student.courseOfferingId.semesterId._id === filterSemester;
    
    const matchesCourse = !filterCourse || 
      student.courseOfferingId.courseId._id === filterCourse;

    // Group filtering - check if student is in the selected group
    const matchesGroup = !filterGroup || 
      progress.groupInfo?._id === filterGroup;

    const matches = matchesSearch && matchesSemester && matchesCourse && matchesGroup;

    return matches;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Done';
      case 'overdue':
        return 'Overdue';
      case 'pending':
        return 'Pending';
      default:
        return 'Not Started';
    }
  };

  const getAssignmentCounts = (assignment: Assignment) => {
    const completedCount = filteredStudents.filter(progress => {
      const assignmentProgress = progress.assignments.find(ap => ap.assignment._id === assignment._id);
      return assignmentProgress?.status === 'completed';
    }).length;
    
    const pendingCount = filteredStudents.filter(progress => {
      const assignmentProgress = progress.assignments.find(ap => ap.assignment._id === assignment._id);
      return assignmentProgress?.status === 'pending' || assignmentProgress?.status === 'not_started';
    }).length;

    return { completedCount, pendingCount };
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterSemester("");
    setFilterCourse("");
    setFilterGroup("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Error Loading Data</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignment Progress</h1>
              <p className="mt-2 text-gray-600">
                Track student progress across all assignments
                {selectedMission && (
                  <span className="ml-2 text-blue-600">
                    • {selectedMission.code} - {selectedMission.title}
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/dashboard/admin/assignments"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Manage Assignments
            </Link>
          </div>
                 </div>

         {/* Summary Stats */}
         {summary && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <div className="flex items-center">
                 <Users className="w-8 h-8 text-blue-600 mr-3" />
                 <div>
                   <p className="text-sm font-medium text-gray-600">Total Students</p>
                   <p className="text-2xl font-bold text-gray-900">{summary.totalStudents}</p>
                 </div>
               </div>
             </div>
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <div className="flex items-center">
                 <Target className="w-8 h-8 text-green-600 mr-3" />
                 <div>
                   <p className="text-sm font-medium text-gray-600">Mission Enrolled</p>
                   <p className="text-2xl font-bold text-gray-900">{summary.missionEnrolledStudents}</p>
                 </div>
               </div>
             </div>
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <div className="flex items-center">
                 <FileText className="w-8 h-8 text-purple-600 mr-3" />
                 <div>
                   <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                   <p className="text-2xl font-bold text-gray-900">{summary.totalAssignments}</p>
                 </div>
               </div>
             </div>
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
               <div className="flex items-center">
                 <CheckCircle className="w-8 h-8 text-orange-600 mr-3" />
                 <div>
                   <p className="text-sm font-medium text-gray-600">Total Completions</p>
                   <p className="text-2xl font-bold text-gray-900">{summary.totalCompletions}</p>
                 </div>
               </div>
             </div>
           </div>
         )}


         {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>


            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            >
              <option value="">All Semesters</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.title}
                </option>
              ))}
            </select>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} ({course.code})
                </option>
              ))}
            </select>

            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            >
              <option value="">All Groups</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>

                         <button
               onClick={clearFilters}
               className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
             >
               Clear Filters
             </button>
          </div>
        </div>



        {/* Progress Table */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterSemester || filterCourse || filterGroup
                ? "Try adjusting your filters to see more students."
                : "No students are enrolled in the selected courses."}
            </p>

          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Email
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Group
                     </th>
                    {assignments.map((assignment) => {
                      const { completedCount, pendingCount } = getAssignmentCounts(assignment);
                      return (
                        <th key={assignment._id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="max-w-32">
                            <div className="truncate" title={assignment.title}>
                              {assignment.title}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {assignment.courseOfferingId.courseId.code}
                            </div>
                            <div className="mt-1 flex space-x-2 text-xs">
                              <span className="text-green-600 font-medium">
                                ✓ {completedCount}
                              </span>
                              <span className="text-yellow-600 font-medium">
                                ⏰ {pendingCount}
                              </span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((progress) => (
                    <tr key={progress.student._id} className="hover:bg-gray-50">
                                             <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="flex-shrink-0 h-8 w-8">
                             <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                               <User className="w-4 h-4 text-gray-600" />
                             </div>
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-medium text-gray-900">
                               {progress.student.name}
                             </div>
                             <div className="text-sm text-gray-500">
                               {progress.student.courseOfferingId.batchId.title} - {progress.student.courseOfferingId.semesterId.title}
                             </div>
                           </div>
                         </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {progress.student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {progress.student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {progress.groupInfo ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {progress.groupInfo.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">No Group</span>
                        )}
                      </td>
                      {progress.assignments.map((assignmentProgress) => (
                        <td key={assignmentProgress.assignment._id} className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(assignmentProgress.status)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getStatusText(assignmentProgress.status)}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}