import { CheckCircle, XCircle, Trash2, Edit, Eye, Settings, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Mission {
  _id: string;
  code: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  batchId?: {
    _id: string;
    code: string;
    title: string;
  };
  startDate?: any;
  endDate?: any;
  createdAt: any;
}

interface MissionTableProps {
  missions: Mission[];
  loading: boolean;
  selectedMissions: string[];
  toggleMissionSelection: (missionId: string) => void;
  selectAllMissions: () => void;
  unselectAllMissions: () => void;
  handleDeleteMission: (missionId: string) => void;
  handleStatusChange: (missionId: string, status: string) => void;
  statusChangeLoading: string | null;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusCount: (status: string) => number;
  getAvailableStatuses: (status: string) => string[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  handlePageSizeChange: (size: number) => void;
  setCurrentPage: (page: number) => void;
  formatMongoDate: (date: any, format: string, fallback: string) => string;
  formatDateRange: (start: any, end: any, format: string, separator: string, fallback: string) => string;
}

// Status Change Modal Component
function StatusChangeModal({ 
  isOpen, 
  onClose, 
  mission, 
  onStatusChange, 
  loading, 
  getAvailableStatuses, 
  getStatusColor 
}: {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  onStatusChange: (missionId: string, status: string) => void;
  loading: boolean;
  getAvailableStatuses: (status: string) => string[];
  getStatusColor: (status: string) => string;
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen && mission) {
      setSelectedStatus('');
    }
  }, [isOpen, mission]);

  if (!isOpen || !mission) return null;

  const availableStatuses = getAvailableStatuses(mission.status);

  const handleSubmit = () => {
    if (selectedStatus) {
      onStatusChange(mission._id, selectedStatus);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Change Mission Status</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Mission:</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{mission.title}</p>
              <p className="text-sm text-gray-600">{mission.code}</p>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(mission.status)}`}>
                  Current: {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Status:
            </label>
            <div className="space-y-2">
              {availableStatuses.map((status) => (
                <label key={status} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStatus || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MissionTable({
  missions,
  loading,
  selectedMissions,
  toggleMissionSelection,
  selectAllMissions,
  unselectAllMissions,
  handleDeleteMission,
  handleStatusChange,
  statusChangeLoading,
  getStatusColor,
  getStatusIcon,
  getStatusCount,
  getAvailableStatuses,
  currentPage,
  totalPages,
  pageSize,
  handlePageSizeChange,
  setCurrentPage,
  formatMongoDate,
  formatDateRange
}: MissionTableProps) {
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const openStatusModal = (mission: Mission) => {
    setSelectedMission(mission);
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setSelectedMission(null);
  };

  return (
    <div className="space-y-6">
      {/* Missions Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                All Missions ({missions.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage and organize student learning missions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={selectAllMissions}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Select all
              </button>
              <button
                onClick={unselectAllMissions}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Unselect
              </button>
              {selectedMissions.length > 0 && (
                <button 
                  onClick={() => {
                    selectedMissions.forEach(id => handleDeleteMission(id));
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedMissions.length})
                </button>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading missions...</p>
          </div>
        ) : missions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No missions found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedMissions.length === missions.length && missions.length > 0}
                      onChange={(e) => e.target.checked ? selectAllMissions() : unselectAllMissions()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {missions.map((mission) => (
                  <tr key={mission._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedMissions.includes(mission._id)}
                        onChange={() => toggleMissionSelection(mission._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mission.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{mission.title}</div>
                        {mission.description && (
                          <div className="text-sm text-gray-500">{mission.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mission.batchId ? mission.batchId.code : '❓'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(mission.status)}`}>
                        {mission.status ? mission.status.charAt(0).toUpperCase() + mission.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateRange(mission.startDate, mission.endDate, 'medium', ' - ', 'No dates')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatMongoDate(mission.createdAt, 'short', 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/admin/missions/${mission._id}`}
                          className="text-gray-600 hover:text-black"
                          title="Manage Mission"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          href={`/dashboard/admin/missions/${mission._id}/edit`}
                          className="text-gray-600 hover:text-black"
                          title="Edit Mission"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => openStatusModal(mission)}
                          className="text-gray-600 hover:text-black"
                          title="Change Status"
                          disabled={statusChangeLoading === mission._id}
                        >
                          {statusChangeLoading === mission._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <Settings className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteMission(mission._id)}
                          className="text-gray-600 hover:text-red-600"
                          title="Delete Mission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={statusModalOpen}
        onClose={closeStatusModal}
        mission={selectedMission}
        onStatusChange={handleStatusChange}
        loading={statusChangeLoading === selectedMission?._id}
        getAvailableStatuses={getAvailableStatuses}
        getStatusColor={getStatusColor}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-700 font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, missions.length)} of {missions.length} missions
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium text-gray-700"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium text-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
