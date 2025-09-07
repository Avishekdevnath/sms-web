import { performance } from 'perf_hooks';
import { processEmailListForAssignment } from '@/utils/emailProcessing';
import { Assignment } from '@/models/Assignment';

// Mock the Assignment model
jest.mock('@/models/Assignment');

describe('Bulk Email Processing Performance Tests', () => {
  const mockAssignment = {
    _id: 'assignment1',
    title: 'Performance Test Assignment',
    courseOfferingId: 'course1',
    publishedAt: new Date(),
    completedEmails: [],
    emailSubmissions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Processing Performance', () => {
    it('should process 100 emails within acceptable time', async () => {
      const emailList = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);
      
      const startTime = performance.now();
      const result = await processEmailListForAssignment(emailList, mockAssignment);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.validEmails).toHaveLength(100);
      expect(result.newEmails).toHaveLength(100);
    });

    it('should process 1000 emails within acceptable time', async () => {
      const emailList = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);
      
      const startTime = performance.now();
      const result = await processEmailListForAssignment(emailList, mockAssignment);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.validEmails).toHaveLength(1000);
      expect(result.newEmails).toHaveLength(1000);
    });

    it('should process 10000 emails within acceptable time', async () => {
      const emailList = Array.from({ length: 10000 }, (_, i) => `user${i}@example.com`);
      
      const startTime = performance.now();
      const result = await processEmailListForAssignment(emailList, mockAssignment);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.validEmails).toHaveLength(10000);
      expect(result.newEmails).toHaveLength(10000);
    });

    it('should handle mixed valid and invalid emails efficiently', async () => {
      const emailList = Array.from({ length: 1000 }, (_, i) => {
        if (i % 10 === 0) return `invalid-email-${i}`; // 10% invalid
        return `user${i}@example.com`;
      });
      
      const startTime = performance.now();
      const result = await processEmailListForAssignment(emailList, mockAssignment);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(5000);
      expect(result.validEmails).toHaveLength(900);
      expect(result.invalidEmails).toHaveLength(100);
      expect(result.newEmails).toHaveLength(900);
    });

    it('should handle duplicate detection efficiently', async () => {
      const baseEmails = Array.from({ length: 500 }, (_, i) => `user${i}@example.com`);
      const duplicateEmails = Array.from({ length: 500 }, (_, i) => `user${i}@example.com`);
      const emailList = [...baseEmails, ...duplicateEmails];
      
      const startTime = performance.now();
      const result = await processEmailListForAssignment(emailList, mockAssignment);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(3000);
      expect(result.validEmails).toHaveLength(1000);
      expect(result.duplicateEmails).toHaveLength(500);
      expect(result.newEmails).toHaveLength(500);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not exceed memory limits with large email lists', async () => {
      const emailList = Array.from({ length: 50000 }, (_, i) => `user${i}@example.com`);
      
      const initialMemory = process.memoryUsage();
      
      const result = await processEmailListForAssignment(emailList, mockAssignment);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      expect(result.validEmails).toHaveLength(50000);
    });

    it('should handle concurrent processing without memory leaks', async () => {
      const emailLists = Array.from({ length: 10 }, (_, i) => 
        Array.from({ length: 1000 }, (_, j) => `user${i}-${j}@example.com`)
      );
      
      const initialMemory = process.memoryUsage();
      
      const promises = emailLists.map(emailList => 
        processEmailListForAssignment(emailList, mockAssignment)
      );
      
      const results = await Promise.all(promises);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable even with concurrent processing
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.validEmails).toHaveLength(1000);
      });
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle large assignment updates efficiently', async () => {
      const largeAssignment = {
        ...mockAssignment,
        completedEmails: Array.from({ length: 10000 }, (_, i) => ({
          email: `existing${i}@example.com`,
          addedAt: new Date(),
          addedBy: 'admin1'
        }))
      };

      const newEmails = Array.from({ length: 1000 }, (_, i) => `new${i}@example.com`);
      
      const startTime = performance.now();
      const result = await processEmailListForAssignment(newEmails, largeAssignment);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.validEmails).toHaveLength(1000);
      expect(result.newEmails).toHaveLength(1000);
    });

    it('should handle duplicate detection with large existing email lists', async () => {
      const largeAssignment = {
        ...mockAssignment,
        completedEmails: Array.from({ length: 50000 }, (_, i) => ({
          email: `existing${i}@example.com`,
          addedAt: new Date(),
          addedBy: 'admin1'
        }))
      };

      const newEmails = Array.from({ length: 1000 }, (_, i) => `new${i}@example.com`);
      const duplicateEmails = Array.from({ length: 1000 }, (_, i) => `existing${i}@example.com`);
      const emailList = [...newEmails, ...duplicateEmails];
      
      const startTime = performance.now();
      const result = await processEmailListForAssignment(emailList, largeAssignment);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(result.validEmails).toHaveLength(2000);
      expect(result.duplicateEmails).toHaveLength(1000);
      expect(result.newEmails).toHaveLength(1000);
    });
  });

  describe('API Performance Tests', () => {
    it('should handle bulk email submission API calls efficiently', async () => {
      const emailList = Array.from({ length: 5000 }, (_, i) => `user${i}@example.com`);
      
      const requestBody = {
        emailList
      };

      const startTime = performance.now();
      
      // Simulate API call
      const response = await fetch('/api/assignments/assignment1/add-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(requestBody)
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(response.status).toBe(200);
    });

    it('should handle concurrent API calls efficiently', async () => {
      const emailLists = Array.from({ length: 5 }, (_, i) => 
        Array.from({ length: 1000 }, (_, j) => `user${i}-${j}@example.com`)
      );
      
      const startTime = performance.now();
      
      const promises = emailLists.map(emailList => 
        fetch('/api/assignments/assignment1/add-emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify({ emailList })
        })
      );
      
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle processing errors efficiently', async () => {
      const emailList = Array.from({ length: 1000 }, (_, i) => {
        if (i % 100 === 0) throw new Error('Processing error');
        return `user${i}@example.com`;
      });
      
      const startTime = performance.now();
      
      try {
        await processEmailListForAssignment(emailList, mockAssignment);
      } catch (error) {
        // Expected to throw
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(2000); // Should fail quickly
    });

    it('should handle timeout scenarios efficiently', async () => {
      const emailList = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);
      
      const startTime = performance.now();
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
      
      const processingPromise = processEmailListForAssignment(emailList, mockAssignment);
      
      try {
        await Promise.race([processingPromise, timeoutPromise]);
      } catch (error) {
        // Expected to timeout or complete
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(6000); // Should complete or timeout within 6 seconds
    });
  });

  describe('Scalability Tests', () => {
    it('should maintain performance with increasing email list sizes', async () => {
      const sizes = [100, 1000, 5000, 10000];
      const results = [];
      
      for (const size of sizes) {
        const emailList = Array.from({ length: size }, (_, i) => `user${i}@example.com`);
        
        const startTime = performance.now();
        const result = await processEmailListForAssignment(emailList, mockAssignment);
        const endTime = performance.now();
        
        const processingTime = endTime - startTime;
        results.push({ size, processingTime, emailsPerSecond: size / (processingTime / 1000) });
      }
      
      // Performance should scale reasonably (not exponentially)
      results.forEach((result, index) => {
        if (index > 0) {
          const previousResult = results[index - 1];
          const timeRatio = result.processingTime / previousResult.processingTime;
          const sizeRatio = result.size / previousResult.size;
          
          // Time increase should be less than size increase (sub-linear scaling)
          expect(timeRatio).toBeLessThan(sizeRatio);
        }
      });
    });

    it('should handle peak load scenarios', async () => {
      const peakLoadEmails = Array.from({ length: 100000 }, (_, i) => `user${i}@example.com`);
      
      const startTime = performance.now();
      const result = await processEmailListForAssignment(peakLoadEmails, mockAssignment);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      const emailsPerSecond = peakLoadEmails.length / (processingTime / 1000);
      
      expect(processingTime).toBeLessThan(60000); // Should complete within 1 minute
      expect(emailsPerSecond).toBeGreaterThan(1000); // Should process at least 1000 emails per second
      expect(result.validEmails).toHaveLength(100000);
    });
  });
});
