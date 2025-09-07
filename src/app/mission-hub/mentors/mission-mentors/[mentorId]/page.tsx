"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  BookOpen, 
  Users, 
  Edit,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';

interface MissionMentor {
  _id: string;
  missionId: {
    _id: string;
    code: string;
    title: string;
  };
  mentorId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  role: 'mission-lead' | 'coordinator' | 'advisor' | 'supervisor';
  assignedStudents: Array<{
    _id: string;
    name: string;
    email: string;
    studentId: string;
  }>;
  specialization: string[];
  maxStudents: number;
  currentWorkload: number;
  status: 'active' | 'deactive' | 'irregular' | 'overloaded' | 'unavailable';
  notes?: string;
  assignedGroups: string[];
  groupStatuses: Array<{
    groupId: string;
    status: string;
    role: string;
    changedAt: string;
  }>;
  stats: {
    avgStudentProgress: number;
    sessionCompletionRate: number;
    studentSatisfaction: number;
  };
  availabilityRate: number;
  isRegular: boolean;
}

interface StudentProgress {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  progress: number;
  lastActivity: string;
  status: 'active' | 'completed' | 'failed' | 'dropped';
  coursesProgress: Array<{
    courseId: string;
    courseName: string;
    progress: number;
  }>;
}

interface MentorshipGroup {
  _id: string;
  name: string;
  studentCount: number;
  status: string;
  createdAt: string;
}

export default function MissionMentorViewPage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params.mentorId as string;
  
  const [mentor, setMentor] = useState<MissionMentor | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [groups, setGroups] = useState<MentorshipGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  useEffect(() => {
    if (mentorId) {
      fetchMentorData();
      fetchMentorGroups();
    }
  }, [mentorId]);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v2/mission-mentors/${mentorId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Transform V2 data to match expected format
          const mentorData = data.data;
          const transformedMentor = {
            _id: mentorData._id,
            missionId: {
              _id: mentorData.missionId?._id || 'unknown',
              code: mentorData.missionId?.code || 'UNKNOWN-MISSION',
              title: mentorData.missionId?.title || 'Unknown Mission'
            },
            mentorId: {
              _id: mentorData.mentorId?._id || 'unknown',
              name: mentorData.mentorId?.name || 'Unknown Mentor',
              email: mentorData.mentorId?.email || 'no-email@example.com',
              role: mentorData.mentorId?.role || 'mentor'
            },
            role: mentorData.role,
            assignedStudents: mentorData.assignedStudentIds?.map((studentId: any) => ({
              _id: studentId?._id || 'unknown',
              name: studentId?.name || 'Unknown Student',
              email: studentId?.email || 'no-email@example.com',
              studentId: studentId?.studentId || 'UNKNOWN'
            })) || [],
            specialization: mentorData.specialization || [],
            maxStudents: mentorData.maxStudents || 0,
            currentWorkload: mentorData.currentStudents || 0,
            status: mentorData.status,
            notes: mentorData.notes,
            assignedGroups: mentorData.assignedGroups || [],
            groupStatuses: mentorData.groupStatuses || [],
            stats: mentorData.stats || {
              avgStudentProgress: 0,
              sessionCompletionRate: 0,
              studentSatisfaction: 0
            },
            availabilityRate: mentorData.availabilityRate || 100,
            isRegular: mentorData.isRegular || true
          };
          setMentor(transformedMentor);
          
          // Transform students data
          const transformedStudents = mentorData.assignedStudentIds?.map((studentId: any) => ({
            _id: studentId?._id || 'unknown',
            name: studentId?.name || 'Unknown Student',
            email: studentId?.email || 'no-email@example.com',
            studentId: studentId?.studentId || 'UNKNOWN',
            progress: studentId?.progress || 0,
            lastActivity: studentId?.lastActivity || null,
            status: studentId?.status || 'active',
            coursesProgress: studentId?.coursesProgress || []
          })) || [];
          setStudents(transformedStudents);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch mentor data');
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error);
      setError('Failed to fetch mentor data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorGroups = async () => {
    try {
      const response = await fetch(`/api/v2/mentorship-groups?mentorId=${mentorId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const transformedGroups = data.data.map((group: any) => ({
            _id: group._id,
            name: group.name,
            studentCount: group.students?.length || 0,
            status: group.status,
            createdAt: group.createdAt
          }));
          setGroups(transformedGroups);
        }
      }
    } catch (error) {
      console.error('Error fetching mentor groups:', error);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'deactive') => {
    if (!mentor) return;
    
    try {
      setStatusChangeLoading(true);
      const response = await fetch(`/api/v2/mission-mentors/${mentorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMentor(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating mentor status:', error);
      setError('Failed to update mentor status');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'primary': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'secondary': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'moderator': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'deactive': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'overloaded': return 'bg-red-100 text-red-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkloadPercentage = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mentor details...</p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Mentor Not Found</h3>
        <p className="text-gray-600">The requested mentor could not be found.</p>
        <Link
          href="/mission-hub/mentors/mission-mentors"
          className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mission Mentors
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Link
                href="/mission-hub/mentors/mission-mentors"
                className="inline-flex items-center text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Mission Mentors
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Mentor Details</h1>
                <p className="text-xs text-gray-600">
                  {mentor.mentorId.name} - {mentor.missionId.code}
                </p>
              </div>
            </div>
            <Link
              href={`/mission-hub/mentors/mission-mentors/${mentorId}/edit`}
              className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-3">
            {/* Compact Mentor Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 truncate">{mentor.mentorId.name}</h2>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleColor(mentor.role)}`}>
                      {mentor.role.charAt(0).toUpperCase() + mentor.role.slice(1)}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(mentor.status)}`}>
                      {mentor.status.charAt(0).toUpperCase() + mentor.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{mentor.mentorId.email}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <BookOpen className="h-3 w-3" />
                  <span className="font-medium">Availability:</span>
                  <span>{mentor.availabilityRate}%</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${mentor.isRegular ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {mentor.isRegular ? 'Regular' : 'Irregular'}
                  </span>
                </div>
                
                {mentor.specialization.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <BookOpen className="h-3 w-3 mt-0.5" />
                    <div>
                      <span className="font-medium">Specializations:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {mentor.specialization.map((spec, index) => (
                          <span key={index} className="inline-block bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {mentor.notes && (
                  <div className="flex items-start space-x-2">
                    <BookOpen className="h-3 w-3 mt-0.5" />
                    <div>
                      <span className="font-medium">Notes:</span>
                      <p className="mt-1 text-xs">{mentor.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Performance Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-3">Performance</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{mentor.stats.avgStudentProgress}%</div>
                  <div className="text-gray-600">Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{mentor.stats.sessionCompletionRate}%</div>
                  <div className="text-gray-600">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {mentor.stats.studentSatisfaction > 0 ? `${mentor.stats.studentSatisfaction}/5` : 'N/A'}
                  </div>
                  <div className="text-gray-600">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${getWorkloadColor(getWorkloadPercentage(mentor.currentWorkload, mentor.maxStudents))}`}>
                    {mentor.currentWorkload}/{mentor.maxStudents === 0 ? '∞' : mentor.maxStudents}
                  </div>
                  <div className="text-gray-600">Workload</div>
                </div>
              </div>
              {mentor.maxStudents > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        getWorkloadPercentage(mentor.currentWorkload, mentor.maxStudents) >= 90
                          ? 'bg-red-500'
                          : getWorkloadPercentage(mentor.currentWorkload, mentor.maxStudents) >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(getWorkloadPercentage(mentor.currentWorkload, mentor.maxStudents), 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {getWorkloadPercentage(mentor.currentWorkload, mentor.maxStudents)}% capacity
                  </div>
                </div>
              )}
            </div>

            {/* Compact Status Control */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-3">Status Control</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusChange('active')}
                  disabled={mentor.status === 'active' || statusChangeLoading}
                  className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                    mentor.status === 'active'
                      ? 'bg-green-100 text-green-800 border border-green-200 cursor-not-allowed'
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Activate
                </button>
                <button
                  onClick={() => handleStatusChange('deactive')}
                  disabled={mentor.status === 'deactive' || statusChangeLoading}
                  className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                    mentor.status === 'deactive'
                      ? 'bg-gray-100 text-gray-800 border border-gray-200 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Deactivate
                </button>
              </div>
            </div>

            {/* Compact Mentorship Groups Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Groups</h3>
              {groups.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">No groups</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div key={group._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="text-xs font-medium text-gray-900">{group.name}</div>
                        <div className="text-xs text-gray-500">{group.studentCount} students</div>
                      </div>
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                        group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {group.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {/* Compact Students Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Assigned Students</h2>
                    <p className="text-xs text-gray-600 mt-1">
                      {students.length} student{students.length !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                  <Link
                    href={`/mission-hub/mentors/assign-students?mentorId=${mentorId}`}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Manage
                  </Link>
                </div>
              </div>

              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No Students Assigned</h3>
                  <p className="text-xs text-gray-600 mb-4">This mentor doesn't have any students assigned yet.</p>
                  <Link
                    href={`/mission-hub/mentors/assign-students?mentorId=${mentorId}`}
                    className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Assign Students
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-xs font-medium text-gray-900">{student.name}</div>
                                <div className="text-xs text-gray-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                              student.status === 'active' ? 'bg-green-100 text-green-800' :
                              student.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              student.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    student.progress >= 80 ? 'bg-green-500' :
                                    student.progress >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${student.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-900">{student.progress}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                            {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs font-medium">
                            <Link
                              href={`/mission-hub/students/${student._id}`}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
