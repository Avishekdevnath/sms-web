'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/shared/ToastContainer';

interface Student {
  _id: string;
  name: string;
  email: string;
  userId: string;
  isActive: boolean;
  profileCompleted: boolean;
}

interface StudentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedStudentIds: string[]) => void;
  missionId: string;
  batchId: string;
  existingStudentIds: string[];
  isLoading?: boolean;
}

export default function StudentSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  missionId,
  batchId,
  existingStudentIds,
  isLoading = false
}: StudentSelectionModalProps) {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Fetch students from the mission's batch
  useEffect(() => {
    try {
      if (isOpen && batchId) {
        fetchBatchStudents();
      }
    } catch (error) {
      console.error('Error in batch students effect:', error);
    }
  }, [isOpen, batchId]);

  // Filter students based on search query and existing participants
  useEffect(() => {
    try {
      // Create a Set for faster lookup and to ensure uniqueness
      const existingStudentIdsSet = new Set(existingStudentIds);
      
      let filtered = students.filter(student => {
        try {
          if (!student || !student._id) {
            console.warn('Invalid student data in filter:', student);
            return false;
          }
          
          if (!existingStudentIdsSet.has(student._id)) { // Exclude already added students
            if (student.isActive) { // Only active students
              if (searchQuery === '') {
                return true;
              }
              
              // Validate search query
              if (!searchQuery || typeof searchQuery !== 'string') {
                return true;
              }
              
              // Check if student matches search query
              const nameMatch = student.name && student.name.toLowerCase().includes(searchQuery.toLowerCase());
              const emailMatch = student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase());
              
              return nameMatch || emailMatch;
            }
          }
          return false;
        } catch (error) {
          console.error('Error filtering individual student:', error, student);
          return false;
        }
      });
      
      setFilteredStudents(filtered);
    } catch (error) {
      console.error('Error in student filtering effect:', error);
      setFilteredStudents([]);
    }
  }, [students, searchQuery, existingStudentIds]);

  // Update select all state
  useEffect(() => {
    try {
      if (filteredStudents.length === 0) {
        setSelectAll(false);
      } else {
        setSelectAll(selectedStudents.size === filteredStudents.length);
      }
    } catch (error) {
      console.error('Error updating select all state:', error);
      setSelectAll(false);
    }
  }, [selectedStudents, filteredStudents]);

  const fetchBatchStudents = async () => {
    setLoading(true);
    try {
      // Validate batch ID
      if (!batchId || typeof batchId !== 'string') {
        throw new Error('Invalid batch ID provided');
      }
      
      const response = await fetch(`${BASE}/api/students/batch?batchId=${batchId}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
      } else {
        console.error('Failed to fetch batch students:', response.status, response.statusText);
        showToast({
          type: 'error',
          title: 'Failed to Load Students',
          message: 'Unable to load students from this batch.'
        });
      }
    } catch (error) {
      console.error('Error fetching batch students:', error);
      showToast({
        type: 'error',
        title: 'Failed to Load Students',
        message: 'Unable to load students from this batch.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    try {
      if (!studentId || typeof studentId !== 'string') {
        console.warn('Invalid student ID provided to handleStudentToggle:', studentId);
        return;
      }
      const newSelected = new Set(selectedStudents);
      if (newSelected.has(studentId)) {
        newSelected.delete(studentId);
      } else {
        newSelected.add(studentId);
      }
      setSelectedStudents(newSelected);
    } catch (error) {
      console.error('Error toggling student selection:', error);
    }
  };

  const handleSelectAll = () => {
    try {
      if (selectAll) {
        setSelectedStudents(new Set());
      } else {
        const allIds = new Set(filteredStudents
          .filter(student => student && student._id && typeof student._id === 'string')
          .map(student => student._id));
        setSelectedStudents(allIds);
      }
    } catch (error) {
      console.error('Error handling select all:', error);
    }
  };

  const handleConfirm = () => {
    try {
      if (selectedStudents.size === 0) {
        showToast({
          type: 'error',
          title: 'No Students Selected',
          message: 'Please select at least one student to add to the mission.'
        });
        return;
      }
      
      // Validate selected students
      const validStudentIds = Array.from(selectedStudents).filter(id => 
        id && typeof id === 'string' && id.trim() !== ''
      );
      
      if (validStudentIds.length === 0) {
        showToast({
          type: 'error',
          title: 'Invalid Selection',
          message: 'No valid student IDs selected.'
        });
        return;
      }
      
      onConfirm(validStudentIds);
    } catch (error) {
      console.error('Error confirming student selection:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to process student selection.'
      });
    }
  };

  const handleClose = () => {
    try {
      setSelectedStudents(new Set());
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error closing modal:', error);
      // Still try to close even if there's an error
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Students to Mission"
      size="xl"
      closeOnBackdrop={false}
    >
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Students
          </label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
                         onChange={(e) => {
               try {
                 const value = e.target.value || '';
                 setSearchQuery(value);
               } catch (error) {
                 console.error('Error updating search query:', error);
               }
             }}
            className="input w-full"
          />
        </div>

        {/* Select All */}
        {filteredStudents.length > 0 && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                         <input
               type="checkbox"
               checked={selectAll}
               onChange={() => {
                 try {
                   handleSelectAll();
                 } catch (error) {
                   console.error('Error handling select all checkbox:', error);
                 }
               }}
               className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
             />
            <label className="text-sm font-medium text-gray-700">
              Select All ({filteredStudents.length} available students)
            </label>
          </div>
        )}

        {/* Students List */}
        <div className="max-h-96 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No students found matching your search.' : 'No available students in this batch.'}
            </div>
          ) : (
                         <div className="divide-y">
               {filteredStudents.map((student) => {
                 try {
                   if (!student || !student._id) {
                     console.warn('Invalid student data in list:', student);
                     return null;
                   }
                   return (
                     <div
                       key={student._id}
                       className="flex items-center space-x-3 p-3 hover:bg-gray-50"
                     >
                                       <input
                       type="checkbox"
                       checked={selectedStudents.has(student._id)}
                       onChange={() => {
                         try {
                           handleStudentToggle(student._id);
                         } catch (error) {
                           console.error('Error toggling student checkbox:', error);
                         }
                       }}
                       className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                     />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{student.name || 'No Name'}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                    {!student.profileCompleted && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Profile Incomplete
                      </span>
                                         )}
                   </div>
                 </div>
                   );
                 } catch (error) {
                   console.error('Error rendering student item:', error, student);
                   return (
                     <div key={student._id || 'error'} className="p-3 text-red-600">
                       Error rendering student data
                     </div>
                   );
                 }
               }).filter(Boolean)}
            </div>
          )}
        </div>

        {/* Summary */}
        {selectedStudents.size > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>{selectedStudents.size}</strong> student{selectedStudents.size !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
                     <button
             type="button"
             onClick={() => {
               try {
                 handleClose();
               } catch (error) {
                 console.error('Error handling close button:', error);
                 onClose(); // Fallback close
               }
             }}
             className="btn btn-secondary"
             disabled={isLoading}
           >
             Cancel
           </button>
                     <button
             type="button"
             onClick={() => {
               try {
                 handleConfirm();
               } catch (error) {
                 console.error('Error handling confirm button:', error);
               }
             }}
             className="btn btn-primary"
             disabled={isLoading || selectedStudents.size === 0}
           >
             {isLoading ? 'Adding Students...' : `Add ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`}
           </button>
        </div>
      </div>
    </Modal>
  );
} 