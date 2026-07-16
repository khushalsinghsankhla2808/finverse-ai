import { Request, Response, NextFunction } from 'express';
import { Mistral } from '@mistralai/mistralai';
import AIHistoryModel from '../models/AIHistory.model';
import TransactionModel from '../models/Transaction.model';
import BudgetModel from '../models/Budget.model';
import GoalModel from '../models/Goal.model';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import env from '../config/env';
import redis from '../config/redis';
import { logger } from '../middleware/logger.middleware';

// ─── Startup: validate MISTRAL_API_KEY immediately on module load ──────────────
(() => {
  const key = env.MISTRAL_API_KEY;
  if (!key || key === 'your-mistral-api-key') {
    logger.warn({
      context: 'ai.controller',
      event: 'mistral_key_missing',
      message: '⚠️  MISTRAL_API_KEY is not set or is a placeholder — AI routes will use rule-based mock fallback.',
    });
  } else {
    logger.info({
      context: 'ai.controller',
      event: 'mistral_key_present',
      message: `✅ MISTRAL_API_KEY is configured (starts: ${key.slice(0, 6)}…) — live Mistral AI enabled.`,
    });
  }
})();

// Suggested prompt questions
const AI_SUGGESTIONS = [
  'Where am I spending the most?',
  'How can I improve my savings rate?',
  'Am I on track with my goals?',
  'Which subscriptions can I cancel?',
  'How does my spending compare to last month?',
  'What is my biggest unnecessary expense?',
  'How long until I reach my Emergency Fund goal?',
  'Give me a budget plan for next month',
];

// Helper to compile user's financial details to inject as LLM context
const getFinancialContextText = async (userId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOf30DaysAgo = new Date();
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);

  const [txns, budgets, goals] = await Promise.all([
    TransactionModel.find({ userId, date: { $gte: startOf30DaysAgo } }).sort({ date: -1 }).limit(50),
    BudgetModel.find({ userId }),
    GoalModel.find({ userId, isCompleted: false }),
  ]);

  const monthlyIncome = txns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = txns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const rate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // Identify top category
  const categoryTotals: Record<string, number> = {};
  txns.filter((t) => t.type === 'expense').forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
  });
  let topCategory = 'None';
  let maxExpense = 0;
  Object.entries(categoryTotals).forEach(([cat, val]) => {
    if (val > maxExpense) {
      maxExpense = val;
      topCategory = cat;
    }
  });

  return {
    raw: { income: monthlyIncome, expenses: monthlyExpenses, rate, topCategory, txns, budgets, goals },
    text: `
USER FINANCIAL CONTEXT:
Monthly Income: ₹${monthlyIncome}
Monthly Expenses: ₹${monthlyExpenses}  
Savings Rate: ${rate.toFixed(1)}%
Top Spending Category: ${topCategory}

Recent Transactions (last 30 days):
${txns.map((t) => `- ${t.merchant}: ₹${t.amount} [${t.category}] (${t.date.toISOString().split('T')[0]})`).join('\n')}

Active Budgets:
${budgets.map((b) => `- ${b.category}: ₹${b.spent}/₹${b.limit} (${((b.spent / b.limit) * 100).toFixed(0)}% used)`).join('\n')}

Active Savings Goals:
${goals.map((g) => `- ${g.name}: ₹${g.currentAmount}/₹${g.targetAmount} (${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}% reached, Target: ${g.deadline.toISOString().split('T')[0]})`).join('\n')}
    `,
  };
};

export const chatWithAI = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { message, sessionId } = req.body;
  if (!message) return sendError(res, 'Message is required', 400);

  try {
    const { text: contextText, raw: rawData } = await getFinancialContextText(userId);

    // Retrieve or create chat session
    let chatSession;
    if (sessionId) {
      chatSession = await AIHistoryModel.findOne({ _id: sessionId, userId });
    }
    
    if (!chatSession) {
      chatSession = await AIHistoryModel.create({
        userId,
        sessionTitle: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
        messages: [],
      });
    }

    // Append user message
    chatSession.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    let aiResponse = '';

    // Check if live Mistral API key is configured.
    const apiKey = env.MISTRAL_API_KEY;
    const isMockKey = !apiKey || apiKey === 'your-mistral-api-key';

    if (isMockKey) {
      // Rule-based Fallback Mock AI advisor
      const msgLower = message.toLowerCase();
      
      if (msgLower.includes('spend') || msgLower.includes('transaction') || msgLower.includes('expense')) {
        aiResponse = `Based on your recent transactions, your top category is **${rawData.topCategory}** where you have spent ₹${Math.max(...Object.values(rawData.txns.reduce((a,c) => { if (c.type==='expense') a[c.category] = (a[c.category]||0) + Math.abs(c.amount); return a; }, {} as Record<string, number>)) || [0])}. You might want to cut down on food deliveries or shopping trips to improve your savings index.`;
      } else if (msgLower.includes('budget') || msgLower.includes('limit')) {
        const overBudgets = rawData.budgets.filter((b) => b.spent >= b.limit);
        if (overBudgets.length > 0) {
          aiResponse = `Warning: You have crossed your monthly budget limits in **${overBudgets.map((b) => b.category).join(', ')}**! I suggest freezing categories where you have overspent until next month.`;
        } else {
          aiResponse = `Excellent work! All of your category budgets are currently within limits. Food is at **${((rawData.budgets.find(b=>b.category==='Food')?.spent || 0)/(rawData.budgets.find(b=>b.category==='Food')?.limit || 1)*100).toFixed(0)}%** limits.`;
        }
      } else if (msgLower.includes('goal') || msgLower.includes('save') || msgLower.includes('target')) {
        aiResponse = `You are tracking **${rawData.goals.length}** savings targets. Your average savings rate is **${rawData.rate.toFixed(1)}%**. To reach your **${rawData.goals[0]?.name || 'wealth'}** goals faster, I recommend setting aside an automatic SIP of ₹5,000 at the beginning of each month.`;
      } else {
        aiResponse = `Hello! I'm FinVerse AI, your personal finance advisor. I see you have an income of **₹${rawData.income}** and expenses of **₹${rawData.expenses}** this month. What specific aspect of your budgets, goals, or transactions can I assist you with today?`;
      }
    } else {
      // Live Mistral call
      const client = new Mistral({ apiKey });

      // Load last 10 messages for conversation thread context
      const historyMessages = chatSession.messages.slice(-10).map((msg) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      // Setup prompt containing financial context
      const systemInstruction = `You are FinVerse AI, a warm, direct, and expert personal finance advisor for Indian users. You have access to the user's financial data.
      
      CRITICAL INSTRUCTIONS:
      1. TONE & STYLE: Speak as a supportive, professional advisor. Do not write blog-style posts, listicle essays, or unnecessary headers. Avoid repetitive structural dividers or bullet lists unless summarizing numbers.
      2. CONCISENESS: Be extremely brief by default (2-4 paragraphs maximum, or a short bulleted list). Provide longer, detailed plans only if the user explicitly asks for step-by-step processes or breakdowns.
      3. DATA AWARENESS: Ground all advice in the user's actual FinVerse data provided in the context below. Reference actual merchants, budgets, categories, and goals by name and amount in Indian Rupees (₹). Use lakhs/crores when appropriate.
      4. ZERO DATA / ONBOARDING RULE: If the user has ₹0 income, ₹0 expenses, and no transactions or budgets logged, acknowledge this warmly as a fresh empty state. Suggest specific first steps (e.g. logging a transaction, setting a budget for Food or shopping, setting up their first savings goal). Do not give generic budgeting advice without stating that their profile is currently empty.
      5. DATA QUALITY WARNING: If the user asks about their spending but transaction data shows ₹0, warn them that no recent transactions are recorded in the system yet.
      
      USER FINANCIAL CONTEXT:
      ${contextText}
      `;

      const response = await client.chat.complete({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system' as const, content: systemInstruction },
          ...historyMessages,
        ],
      });

      aiResponse = typeof response.choices?.[0]?.message?.content === 'string'
        ? response.choices[0].message.content
        : '';
    }

    // Append AI response
    chatSession.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    });

    await chatSession.save();

    return sendSuccess(
      res,
      {
        message: aiResponse,
        sessionId: chatSession.id,
        sessionTitle: chatSession.sessionTitle,
      },
      'AI response compiled successfully'
    );
  } catch (error) {
    const err = error as Error;
    logger.error({
      context: 'ai.controller.chatWithAI',
      event: 'mistral_api_error',
      errorName: err.name,
      errorMessage: err.message,
      userId,
    });
    // Return a clear 502 rather than a generic 500 — signals external API failure
    return sendError(res, `AI service error: ${err.message}`, 502);
  }
};

export const getChatHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  try {
    const history = await AIHistoryModel.find({ userId }).sort({ updatedAt: -1 });
    return sendSuccess(res, history, 'Chat logs retrieved');
  } catch (error) {
    next(error);
  }
};

export const clearChatHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  try {
    await AIHistoryModel.deleteMany({ userId });
    return sendSuccess(res, null, 'Chat log database cleared successfully');
  } catch (error) {
    next(error);
  }
};

export const getAutoInsights = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const cacheKey = `insights:${userId}`;

  try {
    // Attempt cache read
    const cached = await redis.get(cacheKey);
    if (cached) {
      return sendSuccess(res, JSON.parse(cached), 'Spending insights retrieved from cache');
    }

    const { text: contextText } = await getFinancialContextText(userId);

    let insights: any[] = [];

    // Check if live Mistral API key is configured.
    const apiKey = env.MISTRAL_API_KEY;
    const isMockKey = !apiKey || apiKey === 'your-mistral-api-key';

    if (isMockKey) {
      // Mock fallback insights
      insights = [
        {
          title: 'High Dining Expenses',
          description: 'You spent 32% of your monthly outflows on Food. Try cooking at home to improve savings.',
          type: 'warning',
          impact: 'medium',
        },
        {
          title: 'Saving Rate Milestone',
          description: 'Congratulations! Your savings rate reached 24% this month, crossing your average index.',
          type: 'achievement',
          impact: 'high',
        },
        {
          title: 'Goal Deadlines Warnings',
          description: 'Your Emergency Fund goal target is only 45 days away with ₹12,000 remaining.',
          type: 'tip',
          impact: 'medium',
        },
      ];
    } else {
      // Call Mistral for JSON insights
      const client = new Mistral({ apiKey });

      const prompt = `Based on this financial data, provide 3-5 specific, actionable insights in JSON format matching this schema:
      [{
        "title": "String name",
        "description": "String details",
        "type": "warning" | "tip" | "achievement",
        "impact": "high" | "medium" | "low"
      }]

      USER DATA:
      ${contextText}
      `;

      const response = await client.chat.complete({
        model: 'mistral-large-latest',
        responseFormat: { type: 'json_object' },
        messages: [
          { role: 'user' as const, content: prompt },
        ],
      });

      const rawText = typeof response.choices?.[0]?.message?.content === 'string'
        ? response.choices[0].message.content
        : '[]';
      insights = JSON.parse(rawText);
    }

    // Save cache with 1 hour TTL
    await redis.set(cacheKey, JSON.stringify(insights), 'EX', 3600);

    return sendSuccess(res, insights, 'Automated financial insights generated successfully');
  } catch (error) {
    const err = error as Error;
    logger.error({
      context: 'ai.controller.getAutoInsights',
      event: 'mistral_api_error',
      errorName: err.name,
      errorMessage: err.message,
      userId,
    });
    // Return a clear 502 rather than a generic 500 — signals external API failure
    return sendError(res, `AI service error: ${err.message}`, 502);
  }
};

export const getAISuggestions = async (req: Request, res: Response): Promise<Response> => {
  return sendSuccess(res, AI_SUGGESTIONS, 'Predefined AI questions retrieved');
};
