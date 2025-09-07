import {
  validateEmailFormat,
  cleanEmail,
  extractEmailsFromText,
  processEmailList,
  checkEmailDuplicate,
  generateProcessingSummary,
  EmailProcessingResult
} from '@/utils/emailProcessing';

describe('Email Processing Utilities', () => {
  describe('validateEmailFormat', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@test.com',
        'a@b.c'
      ];

      validEmails.forEach(email => {
        expect(validateEmailFormat(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test@example..com',
        '',
        ' ',
        'test@example.com.',
        '.test@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmailFormat(email)).toBe(false);
      });
    });
  });

  describe('cleanEmail', () => {
    it('should trim whitespace and convert to lowercase', () => {
      expect(cleanEmail('  Test@Example.COM  ')).toBe('test@example.com');
      expect(cleanEmail('user@domain.com')).toBe('user@domain.com');
      expect(cleanEmail('\t\nuser@domain.com\t\n')).toBe('user@domain.com');
    });

    it('should handle empty strings', () => {
      expect(cleanEmail('')).toBe('');
      expect(cleanEmail('   ')).toBe('');
    });
  });

  describe('extractEmailsFromText', () => {
    it('should extract emails from text with various separators', () => {
      const text = 'user1@example.com, user2@test.com; user3@domain.org\nuser4@site.net';
      const result = extractEmailsFromText(text);
      
      expect(result).toEqual([
        'user1@example.com',
        'user2@test.com',
        'user3@domain.org',
        'user4@site.net'
      ]);
    });

    it('should handle empty text', () => {
      expect(extractEmailsFromText('')).toEqual([]);
      expect(extractEmailsFromText('   ')).toEqual([]);
    });

    it('should handle text with no emails', () => {
      const text = 'This is just regular text with no emails';
      expect(extractEmailsFromText(text)).toEqual([]);
    });

    it('should handle mixed valid and invalid emails', () => {
      const text = 'valid@example.com, invalid-email, another@test.com';
      const result = extractEmailsFromText(text);
      
      expect(result).toEqual([
        'valid@example.com',
        'another@test.com'
      ]);
    });
  });

  describe('checkEmailDuplicate', () => {
    it('should check for duplicates in existing emails', () => {
      const existingEmails = [
        { email: 'user1@example.com', addedAt: new Date(), addedBy: 'admin1' },
        { email: 'user2@test.com', addedAt: new Date(), addedBy: 'admin1' }
      ];
      
      const result = checkEmailDuplicate('user1@example.com', existingEmails);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.existingEmail?.email).toBe('user1@example.com');
    });

    it('should handle case-insensitive duplicates', () => {
      const existingEmails = [
        { email: 'user1@example.com', addedAt: new Date(), addedBy: 'admin1' }
      ];
      
      const result = checkEmailDuplicate('USER1@EXAMPLE.COM', existingEmails);
      
      expect(result.isDuplicate).toBe(true);
    });

    it('should return false for new emails', () => {
      const existingEmails = [
        { email: 'user1@example.com', addedAt: new Date(), addedBy: 'admin1' }
      ];
      
      const result = checkEmailDuplicate('user2@test.com', existingEmails);
      
      expect(result.isDuplicate).toBe(false);
    });

    it('should handle empty existing emails', () => {
      const result = checkEmailDuplicate('user1@example.com', []);
      
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('processEmailList', () => {
    const mockAssignment = {
      _id: 'assignment1',
      completedEmails: [
        { email: 'existing@example.com', addedAt: new Date(), addedBy: 'admin' }
      ]
    };

    it('should process valid emails correctly', async () => {
      const emailList = [
        'new1@example.com',
        'new2@test.com',
        'existing@example.com', // duplicate
        'invalid-email', // invalid
        'new3@domain.org'
      ];

      const result = await processEmailList(emailList, mockAssignment);

      expect(result.validEmails).toContain('new1@example.com');
      expect(result.validEmails).toContain('new2@test.com');
      expect(result.validEmails).toContain('new3@domain.org');
      expect(result.invalidEmails).toContain('invalid-email');
      expect(result.duplicateEmails).toContain('existing@example.com');
    });

    it('should handle empty email list', async () => {
      const result = await processEmailList([], mockAssignment);

      expect(result.validEmails).toEqual([]);
      expect(result.invalidEmails).toEqual([]);
      expect(result.duplicateEmails).toEqual([]);
    });

    it('should handle all invalid emails', async () => {
      const emailList = ['invalid1', 'invalid2', '@invalid.com'];

      const result = await processEmailList(emailList, mockAssignment);

      expect(result.validEmails).toEqual([]);
      expect(result.invalidEmails).toContain('invalid1');
      expect(result.invalidEmails).toContain('invalid2');
      expect(result.invalidEmails).toContain('@invalid.com');
    });
  });



  describe('generateProcessingSummary', () => {
    it('should generate correct summary for mixed results', () => {
      const result: EmailProcessingResult = {
        validEmails: ['user1@example.com', 'user2@test.com'],
        invalidEmails: ['invalid1'],
        duplicateEmails: ['existing@example.com'],
        cleanedEmails: ['user1@example.com', 'user2@test.com', 'invalid1', 'existing@example.com'],
        processingStats: {
          total: 4,
          valid: 2,
          invalid: 1,
          duplicates: 1,
          new: 2
        }
      };

      const summary = generateProcessingSummary(result);

      expect(summary).toContain('4 total');
      expect(summary).toContain('2 valid');
      expect(summary).toContain('1 invalid');
      expect(summary).toContain('1 duplicate');
    });

    it('should handle empty results', () => {
      const result: EmailProcessingResult = {
        validEmails: [],
        invalidEmails: [],
        duplicateEmails: [],
        cleanedEmails: [],
        processingStats: {
          total: 0,
          valid: 0,
          invalid: 0,
          duplicates: 0,
          new: 0
        }
      };

      const summary = generateProcessingSummary(result);

      expect(summary).toContain('0 total');
      expect(summary).toContain('0 valid');
    });

    it('should calculate success rate correctly', () => {
      const result: EmailProcessingResult = {
        validEmails: ['user1@example.com', 'user2@test.com', 'user3@domain.org'],
        invalidEmails: ['invalid1'],
        duplicateEmails: ['existing@example.com'],
        cleanedEmails: ['user1@example.com', 'user2@test.com', 'user3@domain.org', 'invalid1', 'existing@example.com'],
        processingStats: {
          total: 5,
          valid: 3,
          invalid: 1,
          duplicates: 1,
          new: 3
        }
      };

      const summary = generateProcessingSummary(result);

      expect(summary).toContain('5 total');
      expect(summary).toContain('3 valid');
      expect(summary).toContain('1 invalid');
      expect(summary).toContain('1 duplicate');
    });
  });
});
