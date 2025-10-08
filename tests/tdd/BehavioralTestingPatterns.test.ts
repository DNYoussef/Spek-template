/**
 * Behavioral Testing Patterns - London School TDD Examples
 *
 * This file demonstrates CORRECT behavioral testing patterns that replace
 * weak assertions like toBeDefined() and toBeTruthy() with meaningful
 * behavioral verification.
 *
 * Key Principles:
 * 1. Test BEHAVIOR, not existence
 * 2. Verify INTERACTIONS, not implementation details
 * 3. Mock EXTERNAL dependencies only
 * 4. Use PRECISE assertions with expected values
 */

import { jest } from '@jest/globals';

// Mock external dependencies (London School approach)
jest.mock('../external/EmailService');
jest.mock('../external/DatabaseClient');
jest.mock('../external/PaymentGateway');

import { EmailService } from '../external/EmailService';
import { DatabaseClient } from '../external/DatabaseClient';
import { PaymentGateway } from '../external/PaymentGateway';

// Internal business logic classes (NOT mocked in London School)
class UserRegistration {
  constructor(
    private emailService: EmailService,
    private databaseClient: DatabaseClient
  ) {}

  async registerUser(userData: {
    email: string;
    name: string;
    password: string;
  }): Promise<{
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    status: 'pending' | 'active';
  }> {
    // Validate email format
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await this.databaseClient.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user record
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      id: userId,
      email: userData.email,
      name: userData.name,
      password: this.hashPassword(userData.password),
      createdAt: new Date(),
      status: 'pending' as const
    };

    // Save to database
    await this.databaseClient.saveUser(user);

    // Send welcome email
    await this.emailService.sendWelcomeEmail({
      to: user.email,
      name: user.name,
      userId: user.id
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      status: user.status
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private hashPassword(password: string): string {
    // Simplified hash for testing
    return `hashed_${password}`;
  }
}

class OrderProcessor {
  constructor(
    private paymentGateway: PaymentGateway,
    private databaseClient: DatabaseClient,
    private emailService: EmailService
  ) {}

  async processOrder(orderData: {
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    paymentMethod: string;
  }): Promise<{
    orderId: string;
    status: 'pending' | 'confirmed' | 'failed';
    totalAmount: number;
    paymentId?: string;
  }> {
    // Calculate total
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Validate minimum order amount
    if (totalAmount < 5.00) {
      throw new Error('Order amount must be at least $5.00');
    }

    // Create order record
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const order = {
      id: orderId,
      userId: orderData.userId,
      items: orderData.items,
      totalAmount,
      status: 'pending' as const,
      createdAt: new Date()
    };

    // Save order
    await this.databaseClient.saveOrder(order);

    try {
      // Process payment
      const paymentResult = await this.paymentGateway.chargePayment({
        amount: totalAmount,
        paymentMethod: orderData.paymentMethod,
        orderId: orderId
      });

      if (paymentResult.success) {
        // Update order status
        order.status = 'confirmed';
        await this.databaseClient.updateOrder(orderId, { status: 'confirmed' });

        // Send confirmation email
        await this.emailService.sendOrderConfirmation({
          userId: orderData.userId,
          orderId: orderId,
          totalAmount: totalAmount
        });

        return {
          orderId,
          status: 'confirmed',
          totalAmount,
          paymentId: paymentResult.paymentId
        };
      } else {
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }
    } catch (error) {
      // Update order status to failed
      order.status = 'failed';
      await this.databaseClient.updateOrder(orderId, { status: 'failed' });

      return {
        orderId,
        status: 'failed',
        totalAmount
      };
    }
  }
}

describe('Behavioral Testing Patterns - London School TDD', () => {
  describe('UserRegistration Service', () => {
    let userRegistration: UserRegistration;
    let mockEmailService: jest.Mocked<EmailService>;
    let mockDatabaseClient: jest.Mocked<DatabaseClient>;

    beforeEach(() => {
      // Setup mocks for external dependencies
      mockEmailService = new EmailService() as jest.Mocked<EmailService>;
      mockDatabaseClient = new DatabaseClient() as jest.Mocked<DatabaseClient>;

      // Configure mock behaviors
      mockDatabaseClient.findUserByEmail.mockResolvedValue(null); // No existing user
      mockDatabaseClient.saveUser.mockResolvedValue(true);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);

      userRegistration = new UserRegistration(mockEmailService, mockDatabaseClient);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // ✅ GOOD: Tests behavior with specific expected values
    describe('Successful User Registration', () => {
      it('should create user with valid data and return user details', async () => {
        const userData = {
          email: 'test@example.com',
          name: 'Test User',
          password: 'securePassword123'
        };

        const result = await userRegistration.registerUser(userData);

        // ✅ BEHAVIORAL ASSERTIONS - Test actual behavior and values
        expect(result.id).toMatch(/^user_\d+_[a-z0-9]{9}$/); // Specific format expected
        expect(result.email).toBe('test@example.com'); // Exact value
        expect(result.name).toBe('Test User'); // Exact value
        expect(result.createdAt).toBeInstanceOf(Date); // Type verification with meaning
        expect(result.status).toBe('pending'); // Specific business rule
        expect(result.createdAt.getTime()).toBeCloseTo(Date.now(), -2); // Recent timestamp
      });

      it('should save user to database with hashed password', async () => {
        const userData = {
          email: 'security@test.com',
          name: 'Security User',
          password: 'myPassword'
        };

        await userRegistration.registerUser(userData);

        // ✅ INTERACTION VERIFICATION - Test external dependency behavior
        expect(mockDatabaseClient.saveUser).toHaveBeenCalledTimes(1);
        expect(mockDatabaseClient.saveUser).toHaveBeenCalledWith({
          id: expect.stringMatching(/^user_\d+_[a-z0-9]{9}$/),
          email: 'security@test.com',
          name: 'Security User',
          password: 'hashed_myPassword', // Verify password hashing behavior
          createdAt: expect.any(Date),
          status: 'pending'
        });
      });

      it('should send welcome email with correct user information', async () => {
        const userData = {
          email: 'welcome@test.com',
          name: 'Welcome User',
          password: 'password123'
        };

        const result = await userRegistration.registerUser(userData);

        // ✅ BEHAVIORAL VERIFICATION - Test service interaction
        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith({
          to: 'welcome@test.com',
          name: 'Welcome User',
          userId: result.id
        });
      });

      it('should check for existing user before creating new one', async () => {
        const userData = {
          email: 'existing@check.com',
          name: 'Check User',
          password: 'password'
        };

        await userRegistration.registerUser(userData);

        // ✅ SEQUENCE VERIFICATION - Test call order
        expect(mockDatabaseClient.findUserByEmail).toHaveBeenCalledWith('existing@check.com');
        expect(mockDatabaseClient.findUserByEmail).toHaveBeenCalledBefore(
          mockDatabaseClient.saveUser as jest.MockedFunction<any>
        );
      });
    });

    // ✅ GOOD: Tests error conditions with specific behaviors
    describe('Registration Validation', () => {
      it('should reject invalid email addresses', async () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'user@',
          'user..double@example.com',
          ''
        ];

        for (const email of invalidEmails) {
          const userData = {
            email,
            name: 'Test User',
            password: 'password'
          };

          // ✅ SPECIFIC ERROR TESTING
          await expect(userRegistration.registerUser(userData))
            .rejects
            .toThrow('Invalid email format');

          // ✅ VERIFY NO SIDE EFFECTS on invalid input
          expect(mockDatabaseClient.findUserByEmail).not.toHaveBeenCalled();
          expect(mockDatabaseClient.saveUser).not.toHaveBeenCalled();
          expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();

          jest.clearAllMocks();
        }
      });

      it('should reject registration when user already exists', async () => {
        // Setup: User exists in database
        mockDatabaseClient.findUserByEmail.mockResolvedValueOnce({
          id: 'existing_user_123',
          email: 'existing@test.com'
        });

        const userData = {
          email: 'existing@test.com',
          name: 'Duplicate User',
          password: 'password'
        };

        // ✅ SPECIFIC ERROR VERIFICATION
        await expect(userRegistration.registerUser(userData))
          .rejects
          .toThrow('User already exists');

        // ✅ VERIFY PARTIAL EXECUTION - Should check but not save
        expect(mockDatabaseClient.findUserByEmail).toHaveBeenCalledWith('existing@test.com');
        expect(mockDatabaseClient.saveUser).not.toHaveBeenCalled();
        expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe('OrderProcessor Service', () => {
    let orderProcessor: OrderProcessor;
    let mockPaymentGateway: jest.Mocked<PaymentGateway>;
    let mockDatabaseClient: jest.Mocked<DatabaseClient>;
    let mockEmailService: jest.Mocked<EmailService>;

    beforeEach(() => {
      mockPaymentGateway = new PaymentGateway() as jest.Mocked<PaymentGateway>;
      mockDatabaseClient = new DatabaseClient() as jest.Mocked<DatabaseClient>;
      mockEmailService = new EmailService() as jest.Mocked<EmailService>;

      // Default successful behaviors
      mockDatabaseClient.saveOrder.mockResolvedValue(true);
      mockDatabaseClient.updateOrder.mockResolvedValue(true);
      mockPaymentGateway.chargePayment.mockResolvedValue({
        success: true,
        paymentId: 'payment_12345'
      });
      mockEmailService.sendOrderConfirmation.mockResolvedValue(true);

      orderProcessor = new OrderProcessor(
        mockPaymentGateway,
        mockDatabaseClient,
        mockEmailService
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // ✅ GOOD: Tests complete workflow behavior
    describe('Successful Order Processing', () => {
      it('should process order with correct total calculation', async () => {
        const orderData = {
          userId: 'user_123',
          items: [
            { productId: 'prod_1', quantity: 2, price: 15.50 },
            { productId: 'prod_2', quantity: 1, price: 8.25 }
          ],
          paymentMethod: 'credit_card_token_abc'
        };

        const result = await orderProcessor.processOrder(orderData);

        // ✅ BEHAVIORAL VERIFICATION - Test calculated values
        expect(result.orderId).toMatch(/^order_\d+_[a-z0-9]{9}$/);
        expect(result.status).toBe('confirmed');
        expect(result.totalAmount).toBe(39.25); // 2*15.50 + 1*8.25
        expect(result.paymentId).toBe('payment_12345');
      });

      it('should save order to database before processing payment', async () => {
        const orderData = {
          userId: 'user_456',
          items: [{ productId: 'prod_1', quantity: 1, price: 25.00 }],
          paymentMethod: 'payment_method_xyz'
        };

        await orderProcessor.processOrder(orderData);

        // ✅ INTERACTION SEQUENCE VERIFICATION
        expect(mockDatabaseClient.saveOrder).toHaveBeenCalledTimes(1);
        expect(mockDatabaseClient.saveOrder).toHaveBeenCalledWith({
          id: expect.stringMatching(/^order_\d+_[a-z0-9]{9}$/),
          userId: 'user_456',
          items: [{ productId: 'prod_1', quantity: 1, price: 25.00 }],
          totalAmount: 25.00,
          status: 'pending',
          createdAt: expect.any(Date)
        });

        // ✅ VERIFY CALL ORDER
        expect(mockDatabaseClient.saveOrder).toHaveBeenCalledBefore(
          mockPaymentGateway.chargePayment as jest.MockedFunction<any>
        );
      });

      it('should charge payment with correct order details', async () => {
        const orderData = {
          userId: 'user_789',
          items: [{ productId: 'prod_5', quantity: 3, price: 12.33 }],
          paymentMethod: 'card_token_def'
        };

        const result = await orderProcessor.processOrder(orderData);

        // ✅ PAYMENT INTERACTION VERIFICATION
        expect(mockPaymentGateway.chargePayment).toHaveBeenCalledTimes(1);
        expect(mockPaymentGateway.chargePayment).toHaveBeenCalledWith({
          amount: 36.99, // 3 * 12.33
          paymentMethod: 'card_token_def',
          orderId: result.orderId
        });
      });

      it('should update order status and send confirmation after payment', async () => {
        const orderData = {
          userId: 'user_confirmation',
          items: [{ productId: 'prod_conf', quantity: 1, price: 50.00 }],
          paymentMethod: 'payment_confirmed'
        };

        const result = await orderProcessor.processOrder(orderData);

        // ✅ POST-PAYMENT WORKFLOW VERIFICATION
        expect(mockDatabaseClient.updateOrder).toHaveBeenCalledWith(
          result.orderId,
          { status: 'confirmed' }
        );

        expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith({
          userId: 'user_confirmation',
          orderId: result.orderId,
          totalAmount: 50.00
        });

        // ✅ VERIFY POST-PAYMENT CALL ORDER
        expect(mockPaymentGateway.chargePayment).toHaveBeenCalledBefore(
          mockDatabaseClient.updateOrder as jest.MockedFunction<any>
        );
        expect(mockDatabaseClient.updateOrder).toHaveBeenCalledBefore(
          mockEmailService.sendOrderConfirmation as jest.MockedFunction<any>
        );
      });
    });

    // ✅ GOOD: Tests error handling behavior
    describe('Order Processing Failures', () => {
      it('should reject orders below minimum amount', async () => {
        const orderData = {
          userId: 'user_small',
          items: [{ productId: 'cheap_item', quantity: 1, price: 2.50 }],
          paymentMethod: 'payment_method'
        };

        // ✅ SPECIFIC ERROR TESTING
        await expect(orderProcessor.processOrder(orderData))
          .rejects
          .toThrow('Order amount must be at least $5.00');

        // ✅ VERIFY NO PROCESSING on invalid input
        expect(mockDatabaseClient.saveOrder).not.toHaveBeenCalled();
        expect(mockPaymentGateway.chargePayment).not.toHaveBeenCalled();
      });

      it('should handle payment failure gracefully', async () => {
        // Setup payment failure
        mockPaymentGateway.chargePayment.mockResolvedValueOnce({
          success: false,
          error: 'Insufficient funds'
        });

        const orderData = {
          userId: 'user_failed_payment',
          items: [{ productId: 'prod_fail', quantity: 1, price: 10.00 }],
          paymentMethod: 'insufficient_funds_card'
        };

        const result = await orderProcessor.processOrder(orderData);

        // ✅ FAILURE HANDLING VERIFICATION
        expect(result.status).toBe('failed');
        expect(result.totalAmount).toBe(10.00);
        expect(result.paymentId).toBeUndefined();

        // ✅ VERIFY FAILURE WORKFLOW
        expect(mockDatabaseClient.saveOrder).toHaveBeenCalledTimes(1); // Initial save
        expect(mockDatabaseClient.updateOrder).toHaveBeenCalledWith(
          result.orderId,
          { status: 'failed' }
        );
        expect(mockEmailService.sendOrderConfirmation).not.toHaveBeenCalled();
      });

      it('should handle payment gateway exceptions', async () => {
        // Setup payment gateway exception
        mockPaymentGateway.chargePayment.mockRejectedValueOnce(
          new Error('Payment gateway timeout')
        );

        const orderData = {
          userId: 'user_gateway_error',
          items: [{ productId: 'prod_timeout', quantity: 1, price: 15.00 }],
          paymentMethod: 'timeout_card'
        };

        const result = await orderProcessor.processOrder(orderData);

        // ✅ EXCEPTION HANDLING VERIFICATION
        expect(result.status).toBe('failed');
        expect(result.orderId).toMatch(/^order_\d+_[a-z0-9]{9}$/);

        // ✅ VERIFY EXCEPTION RECOVERY WORKFLOW
        expect(mockDatabaseClient.updateOrder).toHaveBeenCalledWith(
          result.orderId,
          { status: 'failed' }
        );
      });
    });
  });
});

/**
 * BEHAVIORAL TESTING PATTERNS SUMMARY:
 *
 * ❌ WEAK THEATER PATTERNS (Don't use):
 * - expect(result).toBeDefined()
 * - expect(service).toBeTruthy()
 * - expect(response.data).toBeDefined()
 * - Mock.random() usage for test data
 *
 * ✅ STRONG BEHAVIORAL PATTERNS (Use these):
 * - expect(result.id).toMatch(/specific-format/)
 * - expect(result.email).toBe('exact@value.com')
 * - expect(service.method).toHaveBeenCalledWith(exactParameters)
 * - expect(method1).toHaveBeenCalledBefore(method2)
 * - await expect(promise).rejects.toThrow('Specific error message')
 * - Test calculated values, sequences, and side effects
 *
 * LONDON SCHOOL TDD RULES:
 * 1. Mock EXTERNAL dependencies (EmailService, DatabaseClient, PaymentGateway)
 * 2. Do NOT mock internal business logic (UserRegistration, OrderProcessor)
 * 3. Test INTERACTIONS between objects, not their internal state
 * 4. Verify BEHAVIOR and CONTRACTS, not implementation details
 * 5. Use PRECISE assertions with expected values, not existence checks
 */

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log */
/* | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash | */
/* |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------| */
/* | 1.0.0   | 2025-09-27T08:22:15-04:00 | tdd-london-swarm@claude-sonnet-4-20250514 | Create comprehensive behavioral testing patterns with London School TDD examples | BehavioralTestingPatterns.test.ts | OK | Complete behavioral testing examples replacing weak assertions with precise behavioral verification | 0.00 | b9c4d31 | */
/* ### Receipt */
/* - status: OK */
/* - reason_if_blocked: -- */
/* - run_id: behavioral-testing-patterns-001 */
/* - inputs: ["Theater elimination requirements", "London School TDD principles", "Behavioral testing patterns"] */
/* - tools_used: ["Write"] */
/* - versions: {"model":"claude-sonnet-4-20250514","prompt":"tdd-london-swarm-v1.0"} */
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */