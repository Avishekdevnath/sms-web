"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import SimpleSearchAndFilter from "@/components/SimpleSearchAndFilter";
import SimplePagination from "@/components/SimplePagination";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useToast } from "@/components/shared/ToastContainer";

interface Invitation {
  _id: string;
  email: string;
  status: 'pending' | 'sent' | 'accepted' | 'expired' | 'cancelled';
  sentAt?: string;
  acceptedAt?: string;
  invitedBy: {
    name: string;
    email: string;
  };
  batchId?: {
    code: string;
    title: string;
  };
  resendCount: number;
  createdAt: string;
  enrollmentId: string;
  canBeInvited: boolean;
  passwordExpiresAt?: string;
}

interface Batch {
  _id: string;
  code: string;
  title: string;
}

interface InvitationResponse {
  success: boolean;
  data: Invitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function InvitationManagementPage() {
  const { showToast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvitations, setTotalInvitations] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const response = await fetch('/api/batches?limit=100');
      const data = await response.json();
      
      if (data.data) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });

      if (searchTerm) params.append("email", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (batchFilter !== "all") params.append("batchId", batchFilter);

      const response = await fetch(`/api/students/enrollments-for-invitation?${params}`);
      const data: InvitationResponse = await response.json();

      if (data.success) {
        setInvitations(data.data);
        setTotalPages(data.pagination.pages);
        setTotalInvitations(data.pagination.total);
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: "Error fetching invitations"
        });
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to fetch invitations"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [currentPage, searchTerm, statusFilter, batchFilter]);

     const handleSendSingleInvitation = async (email: string) => {
    try {
      setInviteLoading(true);
      const response = await fetch("/api/students/send-invitations", {
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
          message: `Successfully sent invitation to ${email}`
        });
        fetchInvitations(); // Refresh the list
      } else {
        showToast({
          type: "error",
          title: "Error",
          message: data.error?.message || "Failed to send invitation"
        });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to send invitation"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSendInvitations = async () => {
     if (!inviteEmails.trim()) {
       showToast({
         type: "error",
         title: "Validation Error",
         message: "Please enter email addresses"
       });
       return;
     }

     const emails = inviteEmails
       .split(",")
       .map(email => email.trim())
       .filter(email => email.length > 0);

     if (emails.length === 0) {
       showToast({
         type: "error",
         title: "Validation Error",
         message: "Please enter valid email addresses"
       });
       return;
     }

    try {
      setInviteLoading(true);
      const response = await fetch("/api/students/send-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

             if (data.success) {
         showToast({
           type: "success",
           title: "Success",
           message: `Successfully sent ${data.results.successful} invitations`
         });
         setInviteEmails("");
         setShowInviteModal(false);
         fetchInvitations(); // Refresh the list
       } else {
         showToast({
           type: "error",
           title: "Error",
           message: data.error?.message || "Failed to send invitations"
         });
       }
     } catch (error) {
       console.error("Error sending invitations:", error);
       showToast({
         type: "error",
         title: "Error",
         message: "Failed to send invitations"
       });
     } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/students/send-invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: [invitationId] }),
      });

      const data = await response.json();

             if (data.success) {
         showToast({
           type: "success",
           title: "Success",
           message: "Invitation resent successfully"
         });
         fetchInvitations(); // Refresh the list
       } else {
         showToast({
           type: "error",
           title: "Error",
           message: data.error?.message || "Failed to resend invitation"
         });
       }
     } catch (error) {
       console.error("Error resending invitation:", error);
       showToast({
         type: "error",
         title: "Error",
         message: "Failed to resend invitation"
       });
     }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      const response = await fetch(`/api/students/cancel-invitation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enrollmentId: invitationId }),
      });

      const data = await response.json();

             if (data.success) {
         showToast({
           type: "success",
           title: "Success",
           message: "Invitation cancelled successfully"
         });
         fetchInvitations(); // Refresh the list
       } else {
         showToast({
           type: "error",
           title: "Error",
           message: data.error?.message || "Failed to cancel invitation"
         });
       }
     } catch (error) {
       console.error("Error cancelling invitation:", error);
       showToast({
         type: "error",
         title: "Error",
         message: "Failed to cancel invitation"
       });
     }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      invited: "bg-blue-100 text-blue-800 border-blue-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      expired: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const displayText = {
      pending: "Pending",
      invited: "Invited",
      accepted: "Accepted",
      expired: "Expired",
      cancelled: "Cancelled",
    };

    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusConfig[status as keyof typeof statusConfig] || statusConfig.pending}`}>
        {displayText[status as keyof typeof displayText] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
        title="Invitation Management"
        subtitle="Send and manage invitations to enrolled students"
        actions={
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Send Invitations
            </button>
            <div className="text-sm text-gray-600">
              Total Invitations: {totalInvitations}
            </div>
          </div>
        }
      />

      {/* Filters */}
      <SimpleSearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by email..."
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
                         options: [
               { value: "all", label: "All Status" },
               { value: "pending", label: "Pending Invitation" },
               { value: "invited", label: "Invited" },
               { value: "cancelled", label: "Cancelled" },
             ],
          },
                     {
             label: "Batch",
             value: batchFilter,
             onChange: setBatchFilter,
             options: [
               { value: "all", label: "All Batches" },
               ...batches.map(batch => ({
                 value: batch._id,
                 label: `${batch.code} - ${batch.title}`
               }))
             ],
           },
        ]}
      />

      {/* Invitations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                   Enrolled By
                 </th>
                 
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Password Expires
                 </th>
                 
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Actions
                 </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                             {invitations.length === 0 ? (
                                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No invitations found
                    </td>
                  </tr>
              ) : (
                invitations.map((invitation) => (
                  <tr key={invitation._id} className="hover:bg-gray-50">
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm font-medium text-gray-900">
                         {invitation.email}
                       </div>
                       <div className="text-sm text-gray-500">
                         Student will add name during profile completion
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invitation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invitation.batchId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {invitation.batchId.code}
                          </span>
                        ) : (
                          <span className="text-gray-500">No batch</span>
                        )}
                      </div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         {invitation.invitedBy.name}
                       </div>
                       <div className="text-sm text-gray-500">
                         {invitation.invitedBy.email}
                       </div>
                     </td>
                     
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         {invitation.passwordExpiresAt ? (
                           <div>
                             <div className={new Date(invitation.passwordExpiresAt) < new Date() ? "text-red-600 font-medium" : ""}>
                               {new Date(invitation.passwordExpiresAt).toLocaleDateString()}
                             </div>
                             <div className={`text-xs ${new Date(invitation.passwordExpiresAt) < new Date() ? "text-red-500" : "text-gray-500"}`}>
                               {new Date(invitation.passwordExpiresAt).toLocaleTimeString()}
                             </div>
                             {new Date(invitation.passwordExpiresAt) < new Date() && (
                               <div className="text-xs text-red-600 font-medium mt-1">
                                 EXPIRED
                               </div>
                             )}
                           </div>
                         ) : (
                           <span className="text-gray-500">Not set</span>
                         )}
                       </div>
                     </td>
                     
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                               <div className="flex space-x-2">
                          {invitation.status === "pending" && (
                            <button
                              onClick={() => handleSendSingleInvitation(invitation.email)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Send Invitation
                            </button>
                          )}
                          {invitation.status === "invited" && invitation.resendCount < 3 && (
                            <button
                              onClick={() => handleResendInvitation(invitation.email)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Resend
                            </button>
                          )}
                          {["pending", "invited"].includes(invitation.status) && (
                            <button
                              onClick={() => handleCancelInvitation(invitation._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                                                     {invitation.status === "cancelled" && (
                             <span className="text-gray-500 text-sm">No actions available</span>
                           )}
                           {invitation.passwordExpiresAt && new Date(invitation.passwordExpiresAt) < new Date() && (
                             <button
                               onClick={() => handleSendSingleInvitation(invitation.email)}
                               className="text-orange-600 hover:text-orange-900"
                             >
                               Reinvite (Expired)
                             </button>
                           )}
                        </div>
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Send Invitations
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Addresses
                </label>
                <textarea
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  placeholder="Enter email addresses separated by commas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitations}
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {inviteLoading ? "Sending..." : "Send Invitations"}
                </button>
              </div>
            </div>
          </div>
        </div>
             )}
     </div>
   );
 }
