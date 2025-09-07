"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  UserCheck,
  UserX,
  MoreHorizontal,
  RefreshCw,
  Mail,
  Key
} from "lucide-react";
import { formatMongoDate } from '@/utils/dateUtils';
import { MongoDateValue } from '@/utils/dateUtils';
import AdminUserUpdateModal from '@/components/admin/AdminUserUpdateModal';
import PasswordInput from '@/components/shared/PasswordInput';

interface User {
  _id: string;
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'developer' | 'manager' | 'sre' | 'mentor';
  phone?: string;
  isActive: boolean;
  invitedAt?: MongoDateValue;
  createdAt: MongoDateValue;
  updatedAt: MongoDateValue;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  loading: boolean;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  user: User | null;
  loading: boolean;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  loading: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [updatingUser, setUpdatingUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { status: statusFilter })
      });

      const response = await fetch(`/api/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUsers(data.data.users || []);
          setTotalPages(data.data.totalPages || 1);
        } else {
          console.error('Invalid response format:', data);
          setUsers([]);
          setTotalPages(1);
        }
      } else {
        console.error('Failed to fetch users');
        setUsers([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (userData: any) => {
    if (!editingUser) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminUpdateUser = async (userData: any) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/users/admin-update', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setShowUpdateModal(false);
        setUpdatingUser(null);
        fetchUsers();
        alert('User updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error?.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
      setActionLoading(false);
    }
  };

  const handleInviteUser = async (userData: any) => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setShowInviteModal(false);
        fetchUsers();
        alert('User invited successfully!');
      } else {
        const error = await response.json();
        alert(error.error?.message || 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to invite user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone and the user will be completely removed from the system.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}?hard=true`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers();
        alert('User permanently deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'invite') => {
    if (selectedUsers.length === 0) return;
    
    let actionText = action;
    let confirmMessage = '';
    
    switch (action) {
      case 'delete':
        actionText = 'permanently delete';
        confirmMessage = `Are you sure you want to permanently delete ${selectedUsers.length} user(s)? This action cannot be undone and the users will be completely removed from the system.`;
        break;
      case 'invite':
        actionText = 'send invitation emails to';
        confirmMessage = `Are you sure you want to send invitation emails to ${selectedUsers.length} user(s)? They will receive login credentials and be prompted to change their passwords.`;
        break;
      default:
        confirmMessage = `Are you sure you want to ${actionText} ${selectedUsers.length} user(s)?`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      setActionLoading(true);
      
      if (action === 'invite') {
        // Handle bulk invitations individually since we need to send emails
        let successCount = 0;
        let errorCount = 0;
        
        for (const userId of selectedUsers) {
          try {
            const response = await fetch(`/api/users/${userId}/invite`, {
              method: 'POST'
            });
            
            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
        
        alert(`Bulk invitation completed! ${successCount} successful, ${errorCount} failed.`);
        setSelectedUsers([]);
        fetchUsers(); // Refresh to update invitedAt timestamps
      } else {
        // Handle other bulk actions through the bulk API
        const response = await fetch('/api/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, userIds: selectedUsers })
        });

        if (response.ok) {
          const result = await response.json();
          alert(result.message);
          setSelectedUsers([]);
          fetchUsers();
        } else {
          const error = await response.json();
          alert(error.error || `Failed to ${action} users`);
        }
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      alert(`Failed to ${action} users`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleInviteExistingUser = async (user: User) => {
    if (!confirm(`Are you sure you want to send an invitation email to ${user.name}? They will receive login credentials and be prompted to change their password.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${user._id}/invite`, {
        method: 'POST'
      });

      if (response.ok) {
        alert(`Invitation email sent successfully to ${user.name}!`);
        fetchUsers(); // Refresh to update invitedAt timestamp
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send invitation email');
      }
    } catch (error) {
      console.error('Error sending invitation email:', error);
      alert('Failed to send invitation email');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordReset = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password? They will receive a new temporary password via email.')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Password reset successfully. New temporary password sent to user\'s email.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'developer': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'sre': return 'bg-purple-100 text-purple-800';
      case 'mentor': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'developer': return <Users className="w-4 h-4" />;
      case 'manager': return <UserCheck className="w-4 h-4" />;
      case 'sre': return <Shield className="w-4 h-4" />;
      case 'mentor': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Moderator Management</h1>
        <p className="text-gray-600">Manage admin, developer, manager, SRE, and mentor accounts</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black w-64"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="developer">Developer</option>
            <option value="manager">Manager</option>
            <option value="sre">SRE</option>
            <option value="mentor">Mentor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-black transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Invite User
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                disabled={actionLoading}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Activate All
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={actionLoading}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                Deactivate All
              </button>
                             <button
                 onClick={() => handleBulkAction('invite')}
                 disabled={actionLoading}
                 className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
               >
                 Invite All
               </button>
               <button
                 onClick={() => handleBulkAction('delete')}
                 disabled={actionLoading}
                 className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
               >
                 Delete All
               </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === (users?.length || 0) && (users?.length || 0) > 0}
                    onChange={(e) => {
                      if (e.target.checked && users) {
                        setSelectedUsers(users.map(u => u._id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                </th>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   User
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Role
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Status
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Created
                 </th>
                 <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Actions
                 </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users && users.length > 0 ? users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                                     <td className="px-4 py-4 whitespace-nowrap">
                     <input
                       type="checkbox"
                       checked={selectedUsers.includes(user._id)}
                       onChange={(e) => handleUserSelection(user._id, e.target.checked)}
                       className="rounded border-gray-300 text-black focus:ring-black"
                     />
                   </td>
                                     <td className="px-4 py-4 whitespace-nowrap">
                     <div className="flex items-center">
                       <div className="flex-shrink-0 h-8 w-8">
                         <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                           <span className="text-xs font-medium text-gray-700">
                             {user.name.charAt(0).toUpperCase()}
                           </span>
                         </div>
                       </div>
                       <div className="ml-3">
                         <div className="text-sm font-medium text-gray-900">{user.name}</div>
                         <div className="text-xs text-gray-500">{user.email}</div>
                         <div className="text-xs text-gray-400">ID: {user.userId}</div>
                         {user.invitedAt && (
                           <div className="text-xs text-green-600">✓ Invited {formatMongoDate(user.invitedAt)}</div>
                         )}
                       </div>
                     </div>
                   </td>
                                     <td className="px-4 py-4 whitespace-nowrap">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                       {getRoleIcon(user.role)}
                       <span className="ml-1">{user.role}</span>
                     </span>
                   </td>
                   <td className="px-4 py-4 whitespace-nowrap">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                       user.isActive 
                         ? 'bg-green-100 text-green-800' 
                         : 'bg-red-100 text-red-800'
                     }`}>
                       {user.isActive ? 'Active' : 'Inactive'}
                     </span>
                   </td>
                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                     {formatMongoDate(user.createdAt)}
                   </td>
                   <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                         <div className="flex items-center justify-end gap-1">
                       <button
                         onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                         className={`px-2 py-1 rounded text-xs ${
                           user.isActive 
                             ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                             : 'bg-green-100 text-green-700 hover:bg-green-200'
                         }`}
                         title={user.isActive ? 'Deactivate' : 'Activate'}
                       >
                         {user.isActive ? 'Off' : 'On'}
                       </button>
                       <button
                         onClick={() => handleInviteExistingUser(user)}
                         className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                         title="Send Invitation Email"
                       >
                         <Mail className="w-3 h-3" />
                       </button>
                       <button
                         onClick={() => handlePasswordReset(user._id)}
                         className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                         title="Reset Password"
                       >
                         <Key className="w-3 h-3" />
                       </button>
                       <button
                         onClick={() => {
                           setUpdatingUser(user);
                           setShowUpdateModal(true);
                         }}
                         className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                         title="Admin Update"
                       >
                         <Shield className="w-3 h-3" />
                       </button>
                       <button
                         onClick={() => {
                           setEditingUser(user);
                           setShowEditModal(true);
                         }}
                         className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                         title="Edit User"
                       >
                         <Edit className="w-3 h-3" />
                       </button>
                       <button
                         onClick={() => handleDeleteUser(user._id)}
                         className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                         title="Delete User"
                       >
                         <Trash2 className="w-3 h-3" />
                       </button>
                     </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-black transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          loading={actionLoading}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSubmit={handleEditUser}
          user={editingUser}
          loading={actionLoading}
        />
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInviteUser}
          loading={actionLoading}
        />
      )}

      {/* Admin Update User Modal */}
      {showUpdateModal && (
        <AdminUserUpdateModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setUpdatingUser(null);
          }}
          onSubmit={handleAdminUpdateUser}
          user={updatingUser}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Create User Modal Component
function CreateUserModal({ isOpen, onClose, onSubmit, loading }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'mentor',
    password: '',
    phone: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            >
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="sre">SRE</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password (min 6 characters)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              placeholder="Enter phone number"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ isOpen, onClose, onSubmit, user, loading }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'mentor' as any,
    password: '',
    isActive: true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        isActive: user.isActive
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }
    onSubmit(submitData);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            >
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="sre">SRE</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Invite User Modal Component
function InviteUserModal({ isOpen, onClose, onSubmit, loading }: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'mentor' as any,
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Invite New User</h2>
        <p className="text-sm text-gray-600 mb-4">The user will receive an email with temporary login credentials.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            >
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
              <option value="manager">Manager</option>
              <option value="sre">SRE</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              placeholder="Enter phone number"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending Invite...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
