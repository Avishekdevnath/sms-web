import { CheckCircle } from "lucide-react";
import StudentStatusBadge from "./StudentStatusBadge";
import StudentAvatar from "./StudentAvatar";

interface Student {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    userId: string;
    isActive: boolean;
    profileCompleted: boolean;
    invitedAt?: string;
    createdAt: string;
    phone?: string;
    profilePicture?: string;
  };
  batchId: {
    _id: string;
    code: string;
    title: string;
  };
  status: string;
  createdAt: string;
}

interface StudentTableProps {
  students: Student[];
  selectedStudents: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewProfile: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  loading?: boolean;
}

export default function StudentTable({
  students,
  selectedStudents,
  onToggleSelect,
  onToggleSelectAll,
  onViewProfile,
  onEditStudent,
  onDeleteStudent,
  loading = false
}: StudentTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500">Get started by enrolling some students.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={onToggleSelectAll}
                  className="flex items-center hover:bg-gray-100 p-1 rounded transition-colors"
                >
                  {selectedStudents.length === students.length ? (
                    <CheckCircle className="h-5 w-5 text-black" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded"></div>
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enrolled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <button
                    onClick={() => onToggleSelect(student.studentId._id)}
                    className="flex items-center"
                  >
                    {selectedStudents.includes(student.studentId._id) ? (
                      <CheckCircle className="h-4 w-4 text-black" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-gray-300 rounded"></div>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <StudentAvatar student={student} size="md" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {student.studentId?.name || 'No Name'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.studentId?.email || 'No Email'}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {student.studentId?.userId || 'No ID'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StudentStatusBadge student={student} />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {student.batchId?.code || 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {student.batchId?.title || 'No Title'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(student.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewProfile(student)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="View Profile"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEditStudent(student)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Edit Profile"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteStudent(student)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete Student"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
