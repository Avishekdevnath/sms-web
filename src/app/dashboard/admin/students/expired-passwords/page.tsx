"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import SimpleSearchAndFilter from "@/components/SimpleSearchAndFilter";
import SimplePagination from "@/components/SimplePagination";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useToast } from "@/components/shared/ToastContainer";

interface ExpiredPasswordUser {
  _id: string;
  email: string;
  name: string;
  passwordExpiresAt: string;
  profileCompleted: boolean;
  createdAt: string;
  batchId?: {
    code: string;
    title: string;
  };
  enrollmentId?: string;
  daysExpired: number;
}

interface ExpiredPasswordResponse {
  success: boolean;
  data: ExpiredPasswordUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ExpiredPasswordsPage() {
  const { showToast } = useToast();
  const [expiredUsers, setExpiredUsers] = useState<ExpiredPasswordUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpired, setTotalExpired] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [reinviteLoading, setReinviteLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const fetchExpiredPasswords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });

      if (searchTerm) params.append("email", searchTerm);

      const response = await fetch(`/api/students/expired-passwords?${params}`);
      const data: ExpiredPasswordResponse = await response.json();

      if (data.success) {
        setExpiredUsers(data.data);
        setTotalPages(data.pagination.pages);
        setTotalExpired(data.pagination.total);
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: "Error fetching expired passwords"
        });
      }
    } catch (error) {
      console.error("Error fetching expired passwords:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to fetch expired passwords"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiredPasswords();
  }, [currentPage, searchTerm]);

  const handleReinviteSelected = async () => {
    if (selectedEmails.length === 0) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please select at least one student to reinvite"
      });
      return;
    }

    try {
      setReinviteLoading(true);
      const response = await fetch("/api/students/reinvite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: selectedEmails }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: "success",
          title: "Success",
          message: `Successfully sent ${data.results.successful} reinvitations`
        });
        setSelectedEmails([]);
        fetchExpiredPasswords(); // Refresh the list
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: data.error?.message || "Failed to send reinvitations"
        });
      }
    } catch (error) {
      console.error("Error sending reinvitations:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to send reinvitations"
      });
    } finally {
      setReinviteLoading(false);
    }
  };

  const handleReinviteSingle = async (email: string) => {
    try {
      setReinviteLoading(true);
      const response = await fetch("/api/students/reinvite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: [email] }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          type: "success",
          title: "Success",
          message: `Successfully sent reinvitation to ${email}`
        });
        fetchExpiredPasswords(); // Refresh the list
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: data.error?.message || "Failed to send reinvitation"
        });
      }
    } catch (error) {
      console.error("Error sending reinvitation:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to send reinvitation"
      });
    } finally {
      setReinviteLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === expiredUsers.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(expiredUsers.map(user => user.email));
    }
  };

  const handleSelectEmail = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysExpiredBadge = (daysExpired: number) => {
    if (daysExpired <= 7) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (daysExpired <= 30) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    } else {
      return "bg-red-100 text-red-800 border-red-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expired Passwords"
        subtitle="Manage students with expired temporary passwords"
        actions={
          <div className="flex items-center space-x-4">
            {selectedEmails.length > 0 && (
              <button
                onClick={handleReinviteSelected}
                disabled={reinviteLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {reinviteLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    📧 Reinvite Selected ({selectedEmails.length})
                  </>
                )}
              </button>
            )}
            <div className="text-sm text-gray-600">
              Total Expired: {totalExpired}
            </div>
          </div>
        }
      />

      {/* Filters */}
      <SimpleSearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by email..."
      />

      {/* Expired Passwords Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedEmails.length === expiredUsers.length && expiredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Password Expired
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Expired
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expiredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No expired passwords found
                  </td>
                </tr>
              ) : (
                expiredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(user.email)}
                        onChange={() => handleSelectEmail(user.email)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.batchId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.batchId.code}
                          </span>
                        ) : (
                          <span className="text-gray-500">No batch</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(user.passwordExpiresAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getDaysExpiredBadge(user.daysExpired)}`}>
                        {user.daysExpired} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                        user.profileCompleted 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      }`}>
                        {user.profileCompleted ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleReinviteSingle(user.email)}
                        disabled={reinviteLoading}
                        className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                      >
                        Reinvite
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
