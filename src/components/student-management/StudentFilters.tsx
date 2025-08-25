import { Search, Filter } from "lucide-react";

interface Batch {
  _id: string;
  code: string;
  title: string;
}

interface StudentFiltersProps {
  searchTerm: string;
  selectedBatch: string;
  statusFilter: string;
  batches: Batch[];
  onSearchChange: (value: string) => void;
  onBatchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  variant?: 'default' | 'compact';
}

export default function StudentFilters({
  searchTerm,
  selectedBatch,
  statusFilter,
  batches,
  onSearchChange,
  onBatchChange,
  onStatusChange,
  onClearFilters,
  variant = 'default'
}: StudentFiltersProps) {
  const isCompact = variant === 'compact';
  
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'profile-complete', label: 'Profile Complete' },
    { value: 'profile-incomplete', label: 'Profile Incomplete' },
    { value: 'invited', label: 'Invited' },
    { value: 'not-invited', label: 'Not Invited' }
  ];

  if (isCompact) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => onBatchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="batch-selector" className="block text-sm font-medium text-gray-700 mb-2">
            Select Batch
          </label>
          <select
            id="batch-selector"
            value={selectedBatch}
            onChange={(e) => onBatchChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="">Choose a batch...</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.code} - {batch.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Students
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          />
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="needsInvitation">Needs Invitation</option>
            <option value="profileIncomplete">Profile Incomplete</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
}
