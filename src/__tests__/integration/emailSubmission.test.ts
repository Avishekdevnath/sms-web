import { NextRequest } from 'next/server';
import { POST } from '@/app/api/assignments/[id]/add-emails/route';
import { Assignment } from '@/models/Assignment';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { processEmailListForAssignment } from '@/utils/emailProcessing';
import { rateLimitMiddleware } from '@/utils/rateLimiting';
import { sendAssignmentEmailSubmissionNotifications } from '@/utils/notificationUtils';

// Mock dependencies
jest.mock('@/models/Assignment');
jest.mock('@/lib/rbac');
jest.mock('@/utils/emailProcessing');
jest.mock('@/utils/rateLimiting');
jest.mock('@/utils/notificationUtils');

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
  emailSubmissions: [],
  save: jest.fn()
};

const mockUser = {
  _id: 'admin1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
};

const mockProcessingResult = {
  validEmails: ['user1@example.com', 'user2@test.com'],
  invalidEmails: ['invalid-email'],
  duplicateEmails: ['existing@example.com'],
  newEmails: ['user1@example.com', 'user2@test.com']
};

describe('Email Submission Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (getAuthUserFromRequest as jest.Mock).mockResolvedValue(mockUser);
    (Assignment.findById as jest.Mock).mockResolvedValue(mockAssignment);
    (processEmailListForAssignment as jest.Mock).mockResolvedValue(mockProcessingResult);
    (rateLimitMiddleware as jest.Mock).mockImplementation((req, res, next) => next());
    (sendAssignmentEmailSubmissionNotifications as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /api/assignments/[id]/add-emails', () => {
    it('should successfully process email submission', async () => {
      const requestBody = {
        emailList: ['user1@example.com', 'user2@test.com', 'invalid-email', 'existing@example.com']
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.processedCount).toBe(4);
      expect(data.data.successCount).toBe(2);
      expect(data.data.errorCount).toBe(1);
      expect(data.data.duplicateCount).toBe(1);
      expect(data.data.newEmails).toEqual(['user1@example.com', 'user2@test.com']);

      // Verify assignment was updated
      expect(mockAssignment.completedEmails).toHaveLength(3); // 1 existing + 2 new
      expect(mockAssignment.emailSubmissions).toHaveLength(1);
      expect(mockAssignment.save).toHaveBeenCalled();

      // Verify notifications were sent
      expect(sendAssignmentEmailSubmissionNotifications).toHaveBeenCalledWith(
        'assignment1',
        mockProcessingResult,
        'admin1'
      );
    });

    it('should handle unpublished assignment', async () => {
      const unpublishedAssignment = {
        ...mockAssignment,
        publishedAt: null
      };
      (Assignment.findById as jest.Mock).mockResolvedValue(unpublishedAssignment);

      const requestBody = {
        emailList: ['user1@example.com']
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Assignment must be published to receive email submissions');
    });

    it('should handle non-existent assignment', async () => {
      (Assignment.findById as jest.Mock).mockResolvedValue(null);

      const requestBody = {
        emailList: ['user1@example.com']
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/nonexistent/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toBe('Assignment not found');
    });

    it('should handle unauthorized access', async () => {
      (getAuthUserFromRequest as jest.Mock).mockResolvedValue(null);

      const requestBody = {
        emailList: ['user1@example.com']
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Unauthorized');
    });

    it('should handle rate limiting', async () => {
      (rateLimitMiddleware as jest.Mock).mockImplementation((req, res, next) => {
        res.status(429).json({ error: { message: 'Rate limit exceeded' } });
      });

      const requestBody = {
        emailList: ['user1@example.com']
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.message).toBe('Rate limit exceeded');
    });

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({}) // Missing emailList
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Email list is required');
    });

    it('should handle empty email list', async () => {
      const requestBody = {
        emailList: []
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Email list cannot be empty');
    });

    it('should handle processing errors', async () => {
      (processEmailListForAssignment as jest.Mock).mockRejectedValue(
        new Error('Processing failed')
      );

      const requestBody = {
        emailList: ['user1@example.com']
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.message).toBe('Failed to process email list');
    });

    it('should handle database save errors', async () => {
      mockAssignment.save.mockRejectedValue(new Error('Database error'));

      const requestBody = {
        emailList: ['user1@example.com']
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.message).toBe('Failed to save assignment');
    });

    it('should handle notification errors gracefully', async () => {
      (sendAssignmentEmailSubmissionNotifications as jest.Mock).mockRejectedValue(
        new Error('Notification failed')
      );

      const requestBody = {
        emailList: ['user1@example.com']
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      // Should still succeed even if notifications fail
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle large email lists', async () => {
      const largeEmailList = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);
      
      const largeProcessingResult = {
        validEmails: largeEmailList,
        invalidEmails: [],
        duplicateEmails: [],
        newEmails: largeEmailList
      };

      (processEmailListForAssignment as jest.Mock).mockResolvedValue(largeProcessingResult);

      const requestBody = {
        emailList: largeEmailList
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.processedCount).toBe(1000);
      expect(data.data.successCount).toBe(1000);
      expect(data.data.newEmails).toHaveLength(1000);
    });

    it('should handle mixed valid and invalid emails', async () => {
      const mixedEmailList = [
        'valid1@example.com',
        'invalid-email',
        'valid2@test.com',
        '@invalid.com',
        'valid3@domain.org',
        'existing@example.com' // duplicate
      ];

      const mixedProcessingResult = {
        validEmails: ['valid1@example.com', 'valid2@test.com', 'valid3@domain.org', 'existing@example.com'],
        invalidEmails: ['invalid-email', '@invalid.com'],
        duplicateEmails: ['existing@example.com'],
        newEmails: ['valid1@example.com', 'valid2@test.com', 'valid3@domain.org']
      };

      (processEmailListForAssignment as jest.Mock).mockResolvedValue(mixedProcessingResult);

      const requestBody = {
        emailList: mixedEmailList
      };

      const request = new NextRequest('http://localhost:3000/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request, { params: { id: 'assignment1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.processedCount).toBe(6);
      expect(data.data.successCount).toBe(4);
      expect(data.data.errorCount).toBe(2);
      expect(data.data.duplicateCount).toBe(1);
      expect(data.data.newEmails).toHaveLength(3);
    });
  });
});
