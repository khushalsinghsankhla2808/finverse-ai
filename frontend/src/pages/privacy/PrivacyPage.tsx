import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';

export const PrivacyPage: React.FC = () => {
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8 text-ink space-y-8">
        <div className="flex items-center justify-between border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-surface-sunken border border-line text-primary rounded-[var(--radius-control)]">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-sans text-ink">Privacy Policy</h1>
              <p className="text-xs text-ink-subtle">Last updated: [LAST UPDATED DATE]</p>
            </div>
          </div>
          <Link
            to="/"
            className="btn btn-secondary text-xs"
          >
            <ArrowLeft size={14} /> Back to App
          </Link>
        </div>

        <div className="space-y-6 text-sm text-ink-muted leading-relaxed">
          <section className="card space-y-3">
            <h2 className="text-base font-bold text-ink">1. Information We Store in Our Database</h2>
            <p>
              FinVerse AI collects and stores personal data strictly required to deliver personal finance tracking services. The data stored in our database includes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-ink-subtle">
              <li><strong>Account Credentials & Security:</strong> Account email address, display name, and currency preference. Passwords are securely hashed on our backend using bcrypt (10 rounds) prior to storage. Authentication session tokens are maintained client-side in browser LocalStorage (`finverse_user`).</li>
              <li><strong>Transactions:</strong> Amount, transaction type (income/expense/transfer), category, transaction date, merchant name, and description notes.</li>
              <li><strong>Budgets:</strong> Category limits, monthly targets, and utilization progress.</li>
              <li><strong>Savings Goals:</strong> Target amount, current saved progress, deadline dates, and category.</li>
              <li><strong>Investment Portfolio:</strong> Asset names, ticker symbols, asset types (stocks, mutual funds, gold, fixed deposit, crypto), unit quantities, purchase prices, current market values, and platform names.</li>
              <li><strong>AI Assistant Chat History:</strong> Session titles, prompt messages, AI response content, and timestamps.</li>
            </ul>
          </section>

          <section className="card space-y-3">
            <h2 className="text-base font-bold text-ink">2. Data Transmitted to Google Gemini AI API</h2>
            <p>
              When using the AI Assistant, your prompt query text and an aggregated context string (`contextText`) containing specific financial details are transmitted to the Google Gemini API to generate personalized financial insights. The exact fields transmitted in `contextText` include:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-ink-subtle">
              <li><strong>30-Day Totals:</strong> Total monthly income, total monthly expenses, savings rate percentage, and top spending category with spent amount.</li>
              <li><strong>Recent Transactions:</strong> Merchant names, transaction amounts, categories, and transaction dates.</li>
              <li><strong>Active Budgets:</strong> Category names, spent amounts, limit amounts, and percentage utilized.</li>
              <li><strong>Active Savings Goals:</strong> Goal names, current saved amounts, target amounts, and completion percentages.</li>
            </ul>
          </section>

          <section className="card space-y-3">
            <h2 className="text-base font-bold text-ink">3. Local Storage and Cookies</h2>
            <p>
              The application uses browser LocalStorage (`finverse_user`, `finverse-finance-data`, `finverse_currency`) to preserve your active login session token, user preferences, and offline application state.
            </p>
          </section>

          <section className="card space-y-3">
            <h2 className="text-base font-bold text-ink">4. User Rights & Data Deletion</h2>
            <p>
              You maintain full ownership of your data. You may export your transaction logs into PDF, Excel, or CSV files at any time via the Reports page. Self-serve automated account deletion feature: [DATA DELETION]. Alternatively, you may request manual data deletion by contacting us at <a href="mailto:[CONTACT EMAIL]" className="text-link hover:underline">[CONTACT EMAIL]</a>.
            </p>
          </section>

          <section className="card space-y-3">
            <h2 className="text-base font-bold text-ink">5. Governing Law and Contact</h2>
            <p>
              This policy is governed under [APPLICABLE LAW]. For privacy requests or questions regarding data security, contact us at <a href="mailto:[CONTACT EMAIL]" className="text-link hover:underline">[CONTACT EMAIL]</a>.
            </p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default PrivacyPage;
