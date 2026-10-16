import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// ─── Hoisted Mocks ──────────────────────────────────────────────────

const {
  testUserId,
  mockUserModel,
  mockTransactionModel,
  mockBudgetModel,
  mockGoalModel,
  mockNotificationModel,
  memoryStore,
} = vi.hoisted(() => {
  const testUserId = '507f1f77bcf86cd799439011';
  const mockUser = {
    _id: testUserId,
    id: testUserId,
    name: 'Test Investor',
    email: 'test@example.com',
    firebaseUid: 'mock-firebase-uid-123',
    currency: 'INR',
  };

  const memoryStore = new Map<string, string>();

  const mockUserModel = {
    findOne: vi.fn((query: any) => ({
      select: vi.fn(async () => {
        if (query?.firebaseUid === 'mock-firebase-uid-123') {
          return mockUser;
        }
        return null;
      }),
    })),
  };

  const mockTransactionModel = {
    find: vi.fn((_query: any) => ({
      sort: vi.fn(() => ({
        skip: vi.fn(() => ({
          limit: vi.fn(async () => [
            {
              _id: '507f1f77bcf86cd799439012',
              userId: testUserId,
              name: 'Grocery Store',
              merchant: 'Grocery Store',
              category: 'Food',
              amount: -1500,
              type: 'expense',
              date: new Date('2026-10-10T00:00:00.000Z'),
            },
          ]),
        })),
      })),
    })),
    countDocuments: vi.fn(async (_query: any) => 1),
    create: vi.fn(async (data: any) => ({
      _id: '507f1f77bcf86cd799439013',
      ...data,
    })),
    findOne: vi.fn(async (query: any) => ({
      _id: query._id,
      userId: query.userId,
      merchant: 'Swiggy',
      category: 'Food',
      amount: -500,
      type: 'expense',
    })),
    findOneAndDelete: vi.fn(async (query: any) => {
      if (query._id === '507f1f77bcf86cd799439012' && query.userId === testUserId) {
        return {
          _id: query._id,
          userId: query.userId,
          category: 'Food',
          amount: -1500,
          type: 'expense',
        };
      }
      return null;
    }),
  };

  const mockBudgetModel = {
    find: vi.fn(async () => []),
    findOne: vi.fn(async () => null),
    findOneAndUpdate: vi.fn(async () => null),
    create: vi.fn(async (data: any) => ({
      _id: '507f1f77bcf86cd799439014',
      ...data,
    })),
  };

  const mockGoalModel = {
    find: vi.fn(async () => []),
    findOne: vi.fn(async () => null),
    create: vi.fn(async (data: any) => ({
      _id: '507f1f77bcf86cd799439015',
      ...data,
    })),
  };

  const mockNotificationModel = {
    create: vi.fn(async () => ({})),
  };

  return {
    testUserId,
    mockUser,
    mockUserModel,
    mockTransactionModel,
    mockBudgetModel,
    mockGoalModel,
    mockNotificationModel,
    memoryStore,
  };
});

// 1. Mock Firebase Admin
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [{ name: '[DEFAULT]' }]),
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  cert: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(async (token: string) => {
      if (token === 'valid-test-token') {
        return { uid: 'mock-firebase-uid-123' };
      }
      throw new Error('Firebase ID token is invalid or expired');
    }),
  })),
}));

vi.mock('../config/firebase', () => ({
  firebaseApp: { name: '[DEFAULT]' },
  default: { name: '[DEFAULT]' },
}));

// 2. Mock Redis
vi.mock('../config/redis', () => {
  const mockRedis = {
    get: vi.fn(async (key: string) => memoryStore.get(key) || null),
    set: vi.fn(async (key: string, value: string) => {
      memoryStore.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (key: string) => {
      memoryStore.delete(key);
      return 1;
    }),
    keys: vi.fn(async () => []),
  };
  return {
    redis: mockRedis,
    default: mockRedis,
  };
});

// 3. Mock Models
vi.mock('../models/User.model', () => ({
  UserModel: mockUserModel,
  default: mockUserModel,
}));

vi.mock('../models/Transaction.model', () => ({
  TransactionModel: mockTransactionModel,
  default: mockTransactionModel,
}));

vi.mock('../models/Budget.model', () => ({
  BudgetModel: mockBudgetModel,
  default: mockBudgetModel,
}));

vi.mock('../models/Goal.model', () => ({
  GoalModel: mockGoalModel,
  default: mockGoalModel,
}));

vi.mock('../models/Notification.model', () => ({
  NotificationModel: mockNotificationModel,
  default: mockNotificationModel,
}));

// Import the Express app after mocks are in place
import app from '../app';

// ─── Tests ──────────────────────────────────────────────────────────

describe('Backend API Integration Tests', () => {
  beforeEach(() => {
    memoryStore.clear();
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('returns 200 with status ok and timestamp', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication Enforcement (Real protect middleware + Mocked Firebase Admin)', () => {
    it('returns 401 when no token is provided to a protected route', async () => {
      const res = await request(app).get('/api/v1/transactions');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Not authorized, no token provided',
      });
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Not authorized, invalid token');
    });
  });

  describe('Transactions Routes (/api/v1/transactions)', () => {
    it('returns 400 when creating a transaction with an invalid body (Zod validation)', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', 'Bearer valid-test-token')
        .send({
          amount: -50, // invalid: must be positive
          category: '', // invalid: empty string
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Validation failed');
      expect(res.body).toHaveProperty('errors');
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('creates a transaction successfully and scopes it to req.user.id', async () => {
      const payload = {
        type: 'expense',
        amount: 1200,
        category: 'Food',
        merchant: 'Swiggy',
        date: '2026-10-15T12:00:00.000Z',
        note: 'Team lunch',
      };

      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', 'Bearer valid-test-token')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transaction created successfully');

      // Verify TransactionModel.create was called with the authenticated user ID
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          merchant: 'Swiggy',
          category: 'Food',
          type: 'expense',
          amount: -1200, // expense converted to negative
        })
      );
    });

    it('reads transactions successfully scoped to req.user.id', async () => {
      const res = await request(app)
        .get('/api/v1/transactions')
        .set('Authorization', 'Bearer valid-test-token')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactions');
      expect(mockTransactionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
        })
      );
    });

    it('deletes a transaction successfully scoped to req.user.id', async () => {
      const txnId = '507f1f77bcf86cd799439012';

      const res = await request(app)
        .delete(`/api/v1/transactions/${txnId}`)
        .set('Authorization', 'Bearer valid-test-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Transaction deleted successfully');

      // Verify TransactionModel.findOneAndDelete was scoped to both _id and userId
      expect(mockTransactionModel.findOneAndDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: txnId,
          userId: testUserId,
        })
      );
    });
  });

  describe('Budgets Route Validation (/api/v1/budgets)', () => {
    it('returns 400 when creating a budget with an invalid body', async () => {
      const res = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', 'Bearer valid-test-token')
        .send({
          category: '', // invalid: min length 1
          limit: -500, // invalid: must be positive
          color: 'not-a-hex', // invalid: hex regex
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('Goals Route Validation (/api/v1/goals)', () => {
    it('returns 400 when creating a goal with an invalid body', async () => {
      const res = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', 'Bearer valid-test-token')
        .send({
          name: '', // invalid: min length 1
          targetAmount: -1000, // invalid: must be positive
          deadline: 'invalid-date', // invalid date
          category: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toBeDefined();
    });
  });
});
