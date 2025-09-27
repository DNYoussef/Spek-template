/**
 * Mock-First Development - TDD London School Implementation
 * Demonstrates the London School approach to Test-Driven Development
 * where mocks are created first to define collaborator contracts.
 * 
 * London School TDD Principles:
 * 1. Start with acceptance tests
 * 2. Mock all collaborators first 
 * 3. Work outside-in (UI to domain)
 * 4. Focus on behavior, not state
 * 5. Double-loop TDD (acceptance + unit)
 * 6. Define contracts through mock expectations
 */

import { jest } from '@jest/globals';

// ==========================================
// London School TDD: Mock-First Example
// ==========================================

/**
 * Step 1: Define the acceptance test first (outside)
 * This describes the behavior we want from the user's perspective
 */
describe('London School TDD: Mock-First Development', () => {
  describe('User Registration Feature (Acceptance Test)', () => {
    it('should register a new user successfully', async () => {
      // Arrange: Define all collaborators as mocks first
      const mockUserRepository = {
        findByEmail: jest.fn(),
        save: jest.fn(),
        generateId: jest.fn()
      };

      const mockEmailService = {
        sendWelcomeEmail: jest.fn(),
        validateEmailFormat: jest.fn()
      };

      const mockPasswordHasher = {
        hash: jest.fn(),
        validateStrength: jest.fn()
      };

      const mockEventPublisher = {
        publish: jest.fn()
      };

      // Configure mock behaviors (define contracts)
      mockUserRepository.findByEmail.mockResolvedValue(null); // User doesn't exist
      mockUserRepository.generateId.mockReturnValue('user-123');
      mockUserRepository.save.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        hashedPassword: 'hashed-password-123'
      });

      mockEmailService.validateEmailFormat.mockReturnValue(true);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);

      mockPasswordHasher.validateStrength.mockReturnValue(true);
      mockPasswordHasher.hash.mockResolvedValue('hashed-password-123');

      mockEventPublisher.publish.mockResolvedValue(true);

      // Act: Create the UserRegistrationService with mocked collaborators
      const userRegistrationService = new UserRegistrationService(
        mockUserRepository,
        mockEmailService,
        mockPasswordHasher,
        mockEventPublisher
      );

      const registrationData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userRegistrationService.register(registrationData);

      // Assert: Verify behavior through mock interactions
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');

      // Verify the conversation between objects (London School focus)
      expect(mockEmailService.validateEmailFormat).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordHasher.validateStrength).toHaveBeenCalledWith('SecurePassword123!');
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('SecurePassword123!');
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        hashedPassword: 'hashed-password-123',
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('user-123', 'test@example.com');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith({
        type: 'USER_REGISTERED',
        userId: 'user-123',
        email: 'test@example.com'
      });

      // Verify call order (important in London School)
      const callOrder = [
        mockEmailService.validateEmailFormat,
        mockUserRepository.findByEmail,
        mockPasswordHasher.validateStrength,
        mockPasswordHasher.hash,
        mockUserRepository.save,
        mockEmailService.sendWelcomeEmail,
        mockEventPublisher.publish
      ];

      // Check that calls happened in the expected order
      expect(mockEmailService.validateEmailFormat).toHaveBeenCalledBefore(mockUserRepository.findByEmail as jest.MockedFunction<any>);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledBefore(mockPasswordHasher.validateStrength as jest.MockedFunction<any>);
      expect(mockPasswordHasher.hash).toHaveBeenCalledBefore(mockUserRepository.save as jest.MockedFunction<any>);
      expect(mockUserRepository.save).toHaveBeenCalledBefore(mockEmailService.sendWelcomeEmail as jest.MockedFunction<any>);
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledBefore(mockEventPublisher.publish as jest.MockedFunction<any>);
    });

    it('should handle duplicate email registration', async () => {
      // Arrange: Mock scenario where user already exists
      const mockUserRepository = {
        findByEmail: jest.fn(),
        save: jest.fn(),
        generateId: jest.fn()
      };

      const mockEmailService = {
        sendWelcomeEmail: jest.fn(),
        validateEmailFormat: jest.fn()
      };

      const mockPasswordHasher = {
        hash: jest.fn(),
        validateStrength: jest.fn()
      };

      const mockEventPublisher = {
        publish: jest.fn()
      };

      // Configure mocks for duplicate scenario
      mockEmailService.validateEmailFormat.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user-456',
        email: 'test@example.com'
      }); // User already exists

      // Act
      const userRegistrationService = new UserRegistrationService(
        mockUserRepository,
        mockEmailService,
        mockPasswordHasher,
        mockEventPublisher
      );

      const registrationData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await userRegistrationService.register(registrationData);

      // Assert: Verify error handling behavior
      expect(result.success).toBe(false);
      expect(result.error).toBe('EMAIL_ALREADY_EXISTS');

      // Verify that collaboration stopped at the right point
      expect(mockEmailService.validateEmailFormat).toHaveBeenCalled();
      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockPasswordHasher.validateStrength).not.toHaveBeenCalled();
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });
  });

  /**
   * Step 2: Now implement the UserRegistrationService
   * driven by the mock contracts we defined above
   */
  describe('UserRegistrationService Implementation (Unit Tests)', () => {
    let mockUserRepository: any;
    let mockEmailService: any;
    let mockPasswordHasher: any;
    let mockEventPublisher: any;
    let userRegistrationService: UserRegistrationService;

    beforeEach(() => {
      // Create fresh mocks for each test
      mockUserRepository = {
        findByEmail: jest.fn(),
        save: jest.fn(),
        generateId: jest.fn()
      };

      mockEmailService = {
        sendWelcomeEmail: jest.fn(),
        validateEmailFormat: jest.fn()
      };

      mockPasswordHasher = {
        hash: jest.fn(),
        validateStrength: jest.fn()
      };

      mockEventPublisher = {
        publish: jest.fn()
      };

      userRegistrationService = new UserRegistrationService(
        mockUserRepository,
        mockEmailService,
        mockPasswordHasher,
        mockEventPublisher
      );
    });

    it('should validate email format before proceeding', async () => {
      // Arrange
      mockEmailService.validateEmailFormat.mockReturnValue(false);

      // Act
      const result = await userRegistrationService.register({
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      // Assert: Focus on the specific collaboration
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL_FORMAT');
      expect(mockEmailService.validateEmailFormat).toHaveBeenCalledWith('invalid-email');
      
      // Verify no other collaborators were called
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockPasswordHasher.validateStrength).not.toHaveBeenCalled();
    });

    it('should check for existing user before creating new one', async () => {
      // Arrange
      mockEmailService.validateEmailFormat.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com'
      });

      // Act
      const result = await userRegistrationService.register({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      // Assert: Verify the collaboration pattern
      expect(mockEmailService.validateEmailFormat).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.success).toBe(false);
      expect(result.error).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should validate password strength', async () => {
      // Arrange
      mockEmailService.validateEmailFormat.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.validateStrength.mockReturnValue(false);

      // Act
      const result = await userRegistrationService.register({
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      });

      // Assert
      expect(mockPasswordHasher.validateStrength).toHaveBeenCalledWith('weak');
      expect(result.success).toBe(false);
      expect(result.error).toBe('WEAK_PASSWORD');
      
      // Verify password hashing didn't happen
      expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
    });

    it('should coordinate all services for successful registration', async () => {
      // Arrange: Happy path scenario
      mockEmailService.validateEmailFormat.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.validateStrength.mockReturnValue(true);
      mockPasswordHasher.hash.mockResolvedValue('hashed-password');
      mockUserRepository.generateId.mockReturnValue('user-123');
      mockUserRepository.save.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        hashedPassword: 'hashed-password'
      });
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);
      mockEventPublisher.publish.mockResolvedValue(true);

      // Act
      const result = await userRegistrationService.register({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      // Assert: Verify complete collaboration
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');

      // Verify all collaborators were used correctly
      expect(mockEmailService.validateEmailFormat).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordHasher.validateStrength).toHaveBeenCalledWith('SecurePassword123!');
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('SecurePassword123!');
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        hashedPassword: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('user-123', 'test@example.com');
      expect(mockEventPublisher.publish).toHaveBeenCalledWith({
        type: 'USER_REGISTERED',
        userId: 'user-123',
        email: 'test@example.com'
      });
    });
  });
});

/**
 * Step 3: Implementation driven by the mock contracts
 * This is the actual implementation that satisfies the mock expectations
 */
class UserRegistrationService {
  constructor(
    private userRepository: any,
    private emailService: any,
    private passwordHasher: any,
    private eventPublisher: any
  ) {}

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      // Step 1: Validate email format
      if (!this.emailService.validateEmailFormat(userData.email)) {
        return { success: false, error: 'INVALID_EMAIL_FORMAT' };
      }

      // Step 2: Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return { success: false, error: 'EMAIL_ALREADY_EXISTS' };
      }

      // Step 3: Validate password strength
      if (!this.passwordHasher.validateStrength(userData.password)) {
        return { success: false, error: 'WEAK_PASSWORD' };
      }

      // Step 4: Hash password
      const hashedPassword = await this.passwordHasher.hash(userData.password);

      // Step 5: Create user
      const userId = this.userRepository.generateId();
      const user = await this.userRepository.save({
        id: userId,
        email: userData.email,
        hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName
      });

      // Step 6: Send welcome email
      await this.emailService.sendWelcomeEmail(userId, userData.email);

      // Step 7: Publish event
      await this.eventPublisher.publish({
        type: 'USER_REGISTERED',
        userId,
        email: userData.email
      });

      return { success: true, userId };
    } catch (error) {
      return { success: false, error: 'REGISTRATION_FAILED' };
    }
  }
}

/**
 * London School TDD: Collaborative Contract Testing
 * This demonstrates how to test contracts between objects
 */
describe('London School: Contract Testing', () => {
  describe('UserRepository Contract', () => {
    it('should define the contract for user repository operations', () => {
      const userRepositoryContract = {
        findByEmail: {
          input: { email: 'string' },
          output: { user: 'object|null' },
          behavior: 'Returns user if found, null if not found'
        },
        save: {
          input: { userData: 'object' },
          output: { savedUser: 'object' },
          behavior: 'Persists user and returns saved user with generated fields'
        },
        generateId: {
          input: {},
          output: { id: 'string' },
          behavior: 'Generates unique user identifier'
        }
      };

      // Verify contract completeness
      expect(userRepositoryContract.findByEmail).toBeDefined();
      expect(userRepositoryContract.save).toBeDefined();
      expect(userRepositoryContract.generateId).toBeDefined();
    });
  });

  describe('EmailService Contract', () => {
    it('should define the contract for email service operations', () => {
      const emailServiceContract = {
        validateEmailFormat: {
          input: { email: 'string' },
          output: { isValid: 'boolean' },
          behavior: 'Validates email format according to RFC standards'
        },
        sendWelcomeEmail: {
          input: { userId: 'string', email: 'string' },
          output: { sent: 'boolean' },
          behavior: 'Sends welcome email to new user'
        }
      };

      expect(emailServiceContract.validateEmailFormat).toBeDefined();
      expect(emailServiceContract.sendWelcomeEmail).toBeDefined();
    });
  });

  describe('PasswordHasher Contract', () => {
    it('should define the contract for password operations', () => {
      const passwordHasherContract = {
        validateStrength: {
          input: { password: 'string' },
          output: { isStrong: 'boolean' },
          behavior: 'Validates password meets strength requirements'
        },
        hash: {
          input: { password: 'string' },
          output: { hashedPassword: 'string' },
          behavior: 'Hashes password using secure algorithm'
        }
      };

      expect(passwordHasherContract.validateStrength).toBeDefined();
      expect(passwordHasherContract.hash).toBeDefined();
    });
  });

  describe('EventPublisher Contract', () => {
    it('should define the contract for event publishing', () => {
      const eventPublisherContract = {
        publish: {
          input: { event: 'object' },
          output: { published: 'boolean' },
          behavior: 'Publishes event to message queue/event bus'
        }
      };

      expect(eventPublisherContract.publish).toBeDefined();
    });
  });
});

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T07:05:32-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create comprehensive Mock-First Development implementation using London School TDD | MockFirstDevelopment.ts | OK | Complete example of outside-in TDD with mock contracts, behavioral verification, and contract testing | 0.00 | c7a9f45 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: phase9-tdd-mock-first-001
 * - inputs: ["London School TDD principles", "Mock-first development patterns"]
 * - tools_used: ["MultiEdit"]
 * - versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */