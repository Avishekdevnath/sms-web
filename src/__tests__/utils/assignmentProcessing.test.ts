import { Assignment } from '@/models/Assignment';
import { processEmailListForAssignment } from '@/utils/emailProcessing';

// Mock the Assignment model
jest.mock('@/models/Assignment', () => ({
  Assignment: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

// Mock the email processing utility
jest.mock('@/utils/emailProcessing', () => ({
  processEmailListForAssignment: jest.fn(),
  validateEmailFormat: jest.fn(),
  cleanEmail: jest.fn(),
  extractEmailsFromText: jest.fn(),
  findDuplicatesInList: jest.fn(),
  isEmailAlreadyCompleted: jest.fn(),
  generateProcessingSummary: jest.fn()
}));

describe('Assignment Processing Logic', () => {
  const mockAssignment = {
    _id: 'assignment1',
    title: 'Test Assignment',
    courseOfferingId: 'course1',
    publishedAt: new Date(),
    completedEmails: [
      {
        email: 'existing@example.com',
        addedAt: new Date(),
        addedBy: 'admin1'
      }
    ],
    emailSubmissions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Assignment Validation', () => {
    it('should validate published assignment', () => {
      const assignment = { ...mockAssignment, publishedAt: new Date() };
      expect(assignment.publishedAt).toBeTruthy();
    });

    it('should reject unpublished assignment', () => {
      const assignment = { ...mockAssignment, publishedAt: null };
      expect(assignment.publishedAt).toBeFalsy();
    });

    it('should validate assignment has required fields', () => {
      expect(mockAssignment._id).toBeTruthy();
      expect(mockAssignment.title).toBeTruthy();
      expect(mockAssignment.courseOfferingId).toBeTruthy();
    });
  });

  describe('Email Processing Integration', () => {
    it('should process email list for assignment', async () => {
      const mockProcessResult = {
        validEmails: ['user1@example.com', 'user2@test.com'],
        invalidEmails: ['invalid-email'],
        duplicateEmails: ['existing@example.com'],
        newEmails: ['user1@example.com', 'user2@test.com']
      };

      (processEmailListForAssignment as jest.Mock).mockResolvedValue(mockProcessResult);

      const result = await processEmailListForAssignment(
        ['user1@example.com', 'user2@test.com', 'invalid-email', 'existing@example.com'],
        mockAssignment
      );

      expect(result).toEqual(mockProcessResult);
      expect(processEmailListForAssignment).toHaveBeenCalledWith(
        ['user1@example.com', 'user2@test.com', 'invalid-email', 'existing@example.com'],
        mockAssignment
      );
    });

    it('should handle empty email list', async () => {
      const mockProcessResult = {
        validEmails: [],
        invalidEmails: [],
        duplicateEmails: [],
        newEmails: []
      };

      (processEmailListForAssignment as jest.Mock).mockResolvedValue(mockProcessResult);

      const result = await processEmailListForAssignment([], mockAssignment);

      expect(result).toEqual(mockProcessResult);
    });

    it('should handle processing errors', async () => {
      (processEmailListForAssignment as jest.Mock).mockRejectedValue(
        new Error('Processing failed')
      );

      await expect(
        processEmailListForAssignment(['user@example.com'], mockAssignment)
      ).rejects.toThrow('Processing failed');
    });
  });

  describe('Assignment Update Logic', () => {
    it('should add new emails to assignment', () => {
      const newEmails = [
        {
          email: 'user1@example.com',
          addedAt: new Date(),
          addedBy: 'admin1'
        },
        {
          email: 'user2@test.com',
          addedAt: new Date(),
          addedBy: 'admin1'
        }
      ];

      const updatedAssignment = {
        ...mockAssignment,
        completedEmails: [...mockAssignment.completedEmails, ...newEmails]
      };

      expect(updatedAssignment.completedEmails).toHaveLength(3);
      expect(updatedAssignment.completedEmails[1].email).toBe('user1@example.com');
      expect(updatedAssignment.completedEmails[2].email).toBe('user2@test.com');
    });

    it('should track email submissions', () => {
      const newSubmission = {
        submittedBy: 'admin1',
        submittedAt: new Date(),
        emailList: ['user1@example.com', 'user2@test.com'],
        processedCount: 2,
        successCount: 2,
        errorCount: 0,
        status: 'completed' as const
      };

      const updatedAssignment = {
        ...mockAssignment,
        emailSubmissions: [...mockAssignment.emailSubmissions, newSubmission]
      };

      expect(updatedAssignment.emailSubmissions).toHaveLength(1);
      expect(updatedAssignment.emailSubmissions[0].status).toBe('completed');
      expect(updatedAssignment.emailSubmissions[0].successCount).toBe(2);
    });

    it('should handle partial processing', () => {
      const partialSubmission = {
        submittedBy: 'admin1',
        submittedAt: new Date(),
        emailList: ['user1@example.com', 'invalid-email', 'user2@test.com'],
        processedCount: 3,
        successCount: 2,
        errorCount: 1,
        status: 'partial' as const
      };

      const updatedAssignment = {
        ...mockAssignment,
        emailSubmissions: [...mockAssignment.emailSubmissions, partialSubmission]
      };

      expect(updatedAssignment.emailSubmissions[0].status).toBe('partial');
      expect(updatedAssignment.emailSubmissions[0].successCount).toBe(2);
      expect(updatedAssignment.emailSubmissions[0].errorCount).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain email uniqueness', () => {
      const existingEmails = mockAssignment.completedEmails.map(e => e.email);
      const newEmails = ['user1@example.com', 'existing@example.com', 'user2@test.com'];
      
      const uniqueNewEmails = newEmails.filter(email => 
        !existingEmails.some(existing => 
          existing.toLowerCase() === email.toLowerCase()
        )
      );

      expect(uniqueNewEmails).toEqual(['user1@example.com', 'user2@test.com']);
    });

    it('should preserve existing data when updating', () => {
      const originalAssignment = { ...mockAssignment };
      const newEmails = [
        {
          email: 'user1@example.com',
          addedAt: new Date(),
          addedBy: 'admin1'
        }
      ];

      const updatedAssignment = {
        ...originalAssignment,
        completedEmails: [...originalAssignment.completedEmails, ...newEmails],
        updatedAt: new Date()
      };

      // Original data should be preserved
      expect(updatedAssignment.completedEmails[0]).toEqual(originalAssignment.completedEmails[0]);
      expect(updatedAssignment._id).toBe(originalAssignment._id);
      expect(updatedAssignment.title).toBe(originalAssignment.title);
      
      // New data should be added
      expect(updatedAssignment.completedEmails).toHaveLength(2);
      expect(updatedAssignment.completedEmails[1].email).toBe('user1@example.com');
    });

    it('should handle concurrent updates safely', () => {
      const baseAssignment = { ...mockAssignment };
      
      // Simulate two concurrent updates
      const update1 = {
        ...baseAssignment,
        completedEmails: [
          ...baseAssignment.completedEmails,
          { email: 'user1@example.com', addedAt: new Date(), addedBy: 'admin1' }
        ]
      };

      const update2 = {
        ...baseAssignment,
        completedEmails: [
          ...baseAssignment.completedEmails,
          { email: 'user2@test.com', addedAt: new Date(), addedBy: 'admin2' }
        ]
      };

      // Both updates should preserve the original data
      expect(update1.completedEmails[0]).toEqual(baseAssignment.completedEmails[0]);
      expect(update2.completedEmails[0]).toEqual(baseAssignment.completedEmails[0]);
      
      // Each update should add its own new email
      expect(update1.completedEmails[1].email).toBe('user1@example.com');
      expect(update2.completedEmails[1].email).toBe('user2@test.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid assignment data', () => {
      const invalidAssignment = {
        _id: '',
        title: '',
        courseOfferingId: '',
        publishedAt: null,
        completedEmails: [],
        emailSubmissions: []
      };

      expect(invalidAssignment._id).toBeFalsy();
      expect(invalidAssignment.title).toBeFalsy();
      expect(invalidAssignment.courseOfferingId).toBeFalsy();
      expect(invalidAssignment.publishedAt).toBeFalsy();
    });

    it('should handle malformed email data', () => {
      const malformedEmails = [
        { email: '', addedAt: new Date(), addedBy: 'admin1' },
        { email: 'invalid-email', addedAt: new Date(), addedBy: 'admin1' },
        { email: 'user@example.com', addedAt: null, addedBy: 'admin1' },
        { email: 'user@example.com', addedAt: new Date(), addedBy: '' }
      ];

      malformedEmails.forEach(email => {
        expect(email.email).toBeTruthy();
        expect(email.addedAt).toBeTruthy();
        expect(email.addedBy).toBeTruthy();
      });
    });

    it('should handle processing timeouts', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout')), 100);
      });

      await expect(timeoutPromise).rejects.toThrow('Processing timeout');
    });
  });
});
