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

// ─── API Key helper ──────────────
const getCleanMistralKey = (): string => {
  const key = env.MISTRAL_API_KEY ? env.MISTRAL_API_KEY.trim() : '';
  if (!key || key === 'your-mistral-api-key') {
    return '';
  }
  return key;
};

// Startup log
(() => {
  const key = getCleanMistralKey();
  if (!key) {
    logger.warn({
      context: 'ai.controller',
      event: 'mistral_key_missing',
      message: 'MISTRAL_API_KEY is missing/placeholder: AI advisor will run in high-performance rule-based advisor mode.',
    });
  } else {
    logger.info({
      context: 'ai.controller',
      event: 'mistral_key_present',
      message: `MISTRAL_API_KEY configured (starts: ${key.slice(0, 6)}…): live AI enabled with automatic fallback.`,
    });
  }
})();

// Timeout helper function (in milliseconds)
const withTimeout = <T>(promise: Promise<T>, ms = 6000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`API Request timed out after ${ms}ms`)), ms)
    ),
  ]);
};

// Predefined AI suggestions
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

interface RawFinancialData {
  income: number;
  expenses: number;
  rate: number;
  topCategory: string;
  topCategorySpent: number;
  txns: any[];
  budgets: any[];
  goals: any[];
}

// Helper to compile user's financial details to inject as LLM context or rule engine context
const getFinancialContextText = async (userId: string) => {
  const now = new Date();
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

  // Identify top category & category breakdown
  const categoryTotals: Record<string, number> = {};
  txns.filter((t) => t.type === 'expense').forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
  });
  let topCategory = 'None';
  let topCategorySpent = 0;
  Object.entries(categoryTotals).forEach(([cat, val]) => {
    if (val > topCategorySpent) {
      topCategorySpent = val;
      topCategory = cat;
    }
  });

  const rawData: RawFinancialData = {
    income: monthlyIncome,
    expenses: monthlyExpenses,
    rate,
    topCategory,
    topCategorySpent,
    txns,
    budgets,
    goals,
  };

  return {
    raw: rawData,
    text: `
USER FINANCIAL CONTEXT:
Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}  
Savings Rate: ${rate.toFixed(1)}%
Top Spending Category: ${topCategory} (₹${topCategorySpent.toLocaleString('en-IN')})

Recent Transactions (last 30 days):
${txns.length === 0 ? '- No recent transactions' : txns.map((t) => `- ${t.merchant}: ₹${t.amount} [${t.category}] (${t.date ? t.date.toISOString().split('T')[0] : 'recent'})`).join('\n')}

Active Budgets:
${budgets.length === 0 ? '- No active budgets set' : budgets.map((b) => `- ${b.category}: ₹${b.spent}/₹${b.limit} (${((b.spent / (b.limit || 1)) * 100).toFixed(0)}% used)`).join('\n')}

Active Savings Goals:
${goals.length === 0 ? '- No active goals set' : goals.map((g) => `- ${g.name}: ₹${g.currentAmount}/₹${g.targetAmount} (${((g.currentAmount / (g.targetAmount || 1)) * 100).toFixed(0)}% reached)`).join('\n')}
    `,
  };
};

// ─── High-Performance Smart Rule-Based Financial Advisor ──────────────────────
const generateSmartRuleAdvisor = (message: string, raw: RawFinancialData): string => {
  const msgLower = message.toLowerCase();

  // Zero-data / onboarding handling
  if (raw.income === 0 && raw.expenses === 0 && raw.txns.length === 0) {
    return `Welcome to **FinVerse AI**! 🚀\n\nYour account currently has no recorded income or expense transactions for the past 30 days.\n\n**Recommended First Steps:**\n1. Go to **Transactions** to record your latest salary or expenses.\n2. Set up category **Budgets** (e.g., Food, Shopping, Bills) to keep spending in check.\n3. Create your first **Savings Goal** (like an Emergency Fund or Vacation fund).\n\nOnce you add transactions, I will provide personalized insights and wealth planning recommendations!`;
  }

  // 1. Spending / Expenses / Top category queries
  if (msgLower.includes('spend') || msgLower.includes('expense') || msgLower.includes('where') || msgLower.includes('cost') || msgLower.includes('unnecessary')) {
    const topCatText = raw.topCategory !== 'None'
      ? `Your highest spending category is **${raw.topCategory}** at **₹${raw.topCategorySpent.toLocaleString('en-IN')}**.`
      : `You have logged **₹${raw.expenses.toLocaleString('en-IN')}** in total expenses this month.`;

    const recentTxns = raw.txns.filter(t => t.type === 'expense').slice(0, 3);
    const txnList = recentTxns.length > 0
      ? `\n\n**Recent Outflows:**\n` + recentTxns.map(t => `- **${t.merchant}**: ₹${Math.abs(t.amount)} (${t.category})`).join('\n')
      : '';

    return `### Spending Breakdown 📊\n\n${topCatText}\n\nTotal Monthly Outflow: **₹${raw.expenses.toLocaleString('en-IN')}** across **${raw.txns.length}** logged transactions.${txnList}\n\n**Advisor Tip:** To boost your savings rate (currently at **${raw.rate.toFixed(1)}%**), try reducing non-essential expenses in **${raw.topCategory}** by 10-15% next month.`;
  }

  // 2. Budget / Overspending queries
  if (msgLower.includes('budget') || msgLower.includes('limit') || msgLower.includes('overspend')) {
    if (raw.budgets.length === 0) {
      return `You haven't set up category budget limits yet! 🎯\n\nCreating budgets helps prevent unexpected overspending. Based on your current expenses of **₹${raw.expenses.toLocaleString('en-IN')}**, consider creating budget caps for **${raw.topCategory !== 'None' ? raw.topCategory : 'Food & Utilities'}**.`;
    }

    const overBudgets = raw.budgets.filter((b) => b.spent >= b.limit);
    const nearBudgets = raw.budgets.filter((b) => b.spent >= b.limit * 0.8 && b.spent < b.limit);

    let summary = `### Budget Status 🎯\n\nYou have **${raw.budgets.length}** active budgets configured:\n\n`;
    raw.budgets.forEach((b) => {
      const pct = Math.round((b.spent / (b.limit || 1)) * 100);
      const statusIcon = pct >= 100 ? '🚨' : pct >= 80 ? '⚠️' : '✅';
      summary += `- ${statusIcon} **${b.category}**: ₹${b.spent.toLocaleString('en-IN')} / ₹${b.limit.toLocaleString('en-IN')} (${pct}%)\n`;
    });

    if (overBudgets.length > 0) {
      summary += `\n🚨 **Action Needed:** You have exceeded budget limits in **${overBudgets.map(b => b.category).join(', ')}**. Consider pausing discretionary purchases in these categories for the rest of the month.`;
    } else if (nearBudgets.length > 0) {
      summary += `\n⚠️ **Warning:** You are close to your limit in **${nearBudgets.map(b => b.category).join(', ')}**. Keep an eye on new charges.`;
    } else {
      summary += `\n✨ **Great job!** All your category budgets are currently well within target limits!`;
    }

    return summary;
  }

  // 3. Savings / Goals / Investment / Wealth queries
  if (msgLower.includes('save') || msgLower.includes('saving') || msgLower.includes('goal') || msgLower.includes('target') || msgLower.includes('emergency')) {
    const rateText = `Your current monthly savings rate is **${raw.rate.toFixed(1)}%** (Income: ₹${raw.income.toLocaleString('en-IN')} | Expenses: ₹${raw.expenses.toLocaleString('en-IN')}).`;

    if (raw.goals.length === 0) {
      return `### Savings & Wealth Overview 💰\n\n${rateText}\n\nYou don't have active savings goals set up yet. Setting clear targets (e.g. Emergency Fund of 6x monthly expenses = ₹${(raw.expenses * 6).toLocaleString('en-IN')}) helps keep you motivated.\n\n**Recommendation:** Aim for a target savings rate of at least **20%**.`;
    }

    let goalsSummary = `### Savings Goals Progress 🏆\n\n${rateText}\n\n**Active Targets (${raw.goals.length}):**\n`;
    raw.goals.forEach((g) => {
      const pct = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
      goalsSummary += `- **${g.name}**: ₹${g.currentAmount.toLocaleString('en-IN')} / ₹${g.targetAmount.toLocaleString('en-IN')} (**${pct}%** reached)\n`;
    });

    const netSavings = Math.max(0, raw.income - raw.expenses);
    goalsSummary += `\n**Monthly Capital Available:** ₹${netSavings.toLocaleString('en-IN')}. Allocating an automatic SIP toward your main goal will accelerate your target completion.`;
    return goalsSummary;
  }

  // 4. Subscriptions / Recurring queries
  if (msgLower.includes('subscription') || msgLower.includes('cancel') || msgLower.includes('recurring')) {
    const subCategories = ['Entertainment', 'Utilities', 'Subscription', 'Services'];
    const subTxns = raw.txns.filter((t) => t.type === 'expense' && subCategories.includes(t.category));

    if (subTxns.length === 0) {
      return `### Subscriptions & Recurring Bills 📱\n\nNo recurring subscription transactions were detected under Entertainment or Utilities in your recent 30-day history.\n\n**Tip:** Regularly review streaming services, gym memberships, and cloud storage apps to ensure you're only paying for active usage!`;
    }

    const subTotal = subTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
    return `### Subscriptions & Recurring Charges 📱\n\nFound **${subTxns.length}** recurring/utility charges totaling **₹${subTotal.toLocaleString('en-IN')}**:\n\n` +
      subTxns.map(t => `- **${t.merchant}**: ₹${Math.abs(t.amount)} (${t.category})`).join('\n') +
      `\n\n**Recommendation:** Canceling unused subscriptions could free up **₹${(subTotal * 12).toLocaleString('en-IN')}** in annual savings!`;
  }

  // 5. General / Financial Plan / Default Response
  const netProfit = raw.income - raw.expenses;
  const healthStatus = raw.rate >= 30 ? 'Excellent' : raw.rate >= 15 ? 'Healthy' : 'Needs Optimization';

  return `### FinVerse Financial Summary\n\nHere is your financial overview for the past 30 days:\n\n- **Total Income:** ₹${raw.income.toLocaleString('en-IN')}\n- **Total Expenses:** ₹${raw.expenses.toLocaleString('en-IN')}\n- **Net Cashflow:** ₹${netProfit.toLocaleString('en-IN')}\n- **Savings Rate:** ${raw.rate.toFixed(1)}% (${healthStatus})\n- **Top Expense:** ${raw.topCategory !== 'None' ? `${raw.topCategory} (₹${raw.topCategorySpent.toLocaleString('en-IN')})` : 'None logged'}\n\n**50/30/20 Rule Plan:**\n- **Needs (50%):** ₹${(raw.income * 0.5).toLocaleString('en-IN')}\n- **Wants (30%):** ₹${(raw.income * 0.3).toLocaleString('en-IN')}\n- **Savings/Investments (20%):** ₹${(raw.income * 0.2).toLocaleString('en-IN')}\n\nWhat specific area would you like to optimize today: budgets, spending, or savings goals?`;
};

// ─── Rule-Based Insights Generator ──────────────────────────────────────────
const generateSmartRuleInsights = (raw: RawFinancialData): any[] => {
  const insights: any[] = [];

  // Overbudget insight
  const overBudgets = raw.budgets.filter((b) => b.spent >= b.limit);
  if (overBudgets.length > 0) {
    insights.push({
      title: 'Budget Limit Exceeded',
      description: `You crossed your budget limit in ${overBudgets.map(b => b.category).join(', ')}. Pause non-essential purchases.`,
      type: 'warning',
      impact: 'high',
    });
  }

  // High spending category insight
  if (raw.topCategory !== 'None' && raw.topCategorySpent > 0) {
    const topPct = raw.expenses > 0 ? Math.round((raw.topCategorySpent / raw.expenses) * 100) : 0;
    insights.push({
      title: `High ${raw.topCategory} Outflow`,
      description: `${raw.topCategory} accounts for ${topPct}% (₹${raw.topCategorySpent.toLocaleString('en-IN')}) of your total monthly outflows.`,
      type: topPct > 30 ? 'warning' : 'tip',
      impact: topPct > 30 ? 'high' : 'medium',
    });
  }

  // Savings rate insight
  if (raw.rate >= 20) {
    insights.push({
      title: 'Savings Milestone Achieved',
      description: `Great job! Your savings rate reached ${raw.rate.toFixed(1)}%, exceeding the recommended 20% benchmark.`,
      type: 'achievement',
      impact: 'high',
    });
  } else if (raw.income > 0) {
    insights.push({
      title: 'Boost Your Savings Index',
      description: `Your current savings rate is ${raw.rate.toFixed(1)}%. Target at least 20% by cutting top discretionary expenses.`,
      type: 'tip',
      impact: 'medium',
    });
  }

  // Goal deadlines insight
  if (raw.goals.length > 0) {
    const firstGoal = raw.goals[0];
    const pct = Math.round((firstGoal.currentAmount / (firstGoal.targetAmount || 1)) * 100);
    insights.push({
      title: `Goal Target: ${firstGoal.name}`,
      description: `You are ${pct}% of the way toward completing your ${firstGoal.name} target (₹${firstGoal.currentAmount}/₹${firstGoal.targetAmount}).`,
      type: pct >= 80 ? 'achievement' : 'tip',
      impact: 'medium',
    });
  }

  // Default fallbacks if empty
  if (insights.length === 0) {
    insights.push(
      {
        title: 'Start Tracking Expenses',
        description: 'Log your daily transactions to enable automated spending analysis and personalized budget caps.',
        type: 'tip',
        impact: 'medium',
      },
      {
        title: 'Set Up Category Budgets',
        description: 'Create budget targets for Food, Shopping, and Bills to automatically monitor monthly spending.',
        type: 'tip',
        impact: 'low',
      }
    );
  }

  return insights;
};


// ─── Controller Functions ──────────────────────────────────────────────────

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
    const apiKey = getCleanMistralKey();

    if (apiKey) {
      try {
        const client = new Mistral({ apiKey });

        const historyMessages = chatSession.messages.slice(-10).map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
        }));

        const systemInstruction = `You are FinVerse AI, a warm, direct, and expert personal finance advisor for Indian users. You have access to the user's financial data.
        
        CRITICAL INSTRUCTIONS:
        1. TONE & STYLE: Speak as a supportive, professional advisor. Do not write blog-style posts, listicle essays, or unnecessary headers. Avoid repetitive structural dividers or bullet lists unless summarizing numbers.
        2. CONCISENESS: Be extremely brief by default (2-4 paragraphs maximum, or a short bulleted list).
        3. DATA AWARENESS: Ground all advice in the user's actual FinVerse data provided below. Reference actual merchants, budgets, categories, and goals by name and amount in Indian Rupees (₹).
        4. ZERO DATA RULE: If the user has ₹0 income, ₹0 expenses, and no transactions logged, acknowledge this warmly as a fresh account and suggest logging a transaction or budget.
        
        USER FINANCIAL CONTEXT:
        ${contextText}
        `;

        // Use mistral-small-latest (fast & lightweight) with a 6-second timeout race
        const response = await withTimeout(
          client.chat.complete({
            model: 'mistral-small-latest',
            messages: [
              { role: 'system' as const, content: systemInstruction },
              ...historyMessages,
            ],
          }),
          6000
        );

        if (typeof response.choices?.[0]?.message?.content === 'string') {
          aiResponse = response.choices[0].message.content;
        }
      } catch (err: any) {
        logger.warn({
          context: 'ai.controller.chatWithAI',
          event: 'mistral_api_fallback',
          message: `Mistral API call failed (${err?.message || err}). Falling back automatically to smart rule advisor.`,
        });
      }
    }

    // If live API was skipped or failed/timed out, use smart rule engine fallback
    if (!aiResponse) {
      aiResponse = generateSmartRuleAdvisor(message, rawData);
    }

    // Append AI response to chat history
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
      event: 'unexpected_error',
      errorMessage: err.message,
      userId,
    });
    // Fall back gracefully with 200 OK so UI never crashes with 502
    return sendSuccess(
      res,
      {
        message: `Hello! I am your FinVerse AI advisor. I'm currently running in standard mode to ensure fast responses. How can I assist you with your budgets or expenses today?`,
        sessionId: '',
        sessionTitle: 'Chat Session',
      },
      'AI response returned via fallback'
    );
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
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return sendSuccess(res, JSON.parse(cached), 'Spending insights retrieved from cache');
      }
    } catch (e) {
      // Ignore redis read errors
    }

    const { text: contextText, raw: rawData } = await getFinancialContextText(userId);

    let insights: any[] = [];
    const apiKey = getCleanMistralKey();

    if (apiKey) {
      try {
        const client = new Mistral({ apiKey });

        const prompt = `Based on this financial data, provide 3-5 specific, actionable insights in JSON format matching this schema:
        [
          {
            "title": "String name",
            "description": "String details",
            "type": "warning" | "tip" | "achievement",
            "impact": "high" | "medium" | "low"
          }
        ]

        USER DATA:
        ${contextText}
        `;

        const response = await withTimeout(
          client.chat.complete({
            model: 'mistral-small-latest',
            responseFormat: { type: 'json_object' },
            messages: [{ role: 'user' as const, content: prompt }],
          }),
          6000
        );

        const rawContent = response.choices?.[0]?.message?.content;
        if (typeof rawContent === 'string' && rawContent.trim()) {
          // Clean up potential markdown formatting ```json ... ```
          let cleaned = rawContent.trim();
          if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
          }
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            insights = parsed;
          } else if (parsed && Array.isArray(parsed.insights)) {
            insights = parsed.insights;
          }
        }
      } catch (err: any) {
        logger.warn({
          context: 'ai.controller.getAutoInsights',
          event: 'mistral_insights_fallback',
          message: `Mistral insights call failed (${err?.message || err}). Generating rule-based insights.`,
        });
      }
    }

    // Fallback to rule-based insights if live call skipped or failed
    if (!insights || insights.length === 0) {
      insights = generateSmartRuleInsights(rawData);
    }

    // Attempt cache set
    try {
      await redis.set(cacheKey, JSON.stringify(insights), 'EX', 3600);
    } catch (e) {
      // Ignore redis write errors
    }

    return sendSuccess(res, insights, 'Automated financial insights generated successfully');
  } catch (error) {
    const err = error as Error;
    logger.error({
      context: 'ai.controller.getAutoInsights',
      event: 'unexpected_error',
      errorMessage: err.message,
      userId,
    });
    // Fallback response with status 200 OK so UI never crashes with 502
    const defaultInsights = [
      {
        title: 'Smart Spending Advisor',
        description: 'Track your daily outflows and create category budgets to maximize monthly savings.',
        type: 'tip',
        impact: 'medium',
      },
    ];
    return sendSuccess(res, defaultInsights, 'Default financial insights generated');
  }
};

export const getAISuggestions = async (req: Request, res: Response): Promise<Response> => {
  return sendSuccess(res, AI_SUGGESTIONS, 'Predefined AI questions retrieved');
};
