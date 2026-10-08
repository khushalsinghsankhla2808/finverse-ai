import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';

export const PrivacyPage: React.FC = () => {
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto px-4 py-8 text-white space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FF9A6B]/10 border border-[#FF9A6B]/20 text-[#FF9A6B] rounded-lg">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">Privacy Policy</h1>
              <p className="text-xs text-white/50">Last updated: [LAST UPDATED DATE]</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> Back to App
          </Link>
        </div>

        <div className="space-y-6 text-sm text-white/80 leading-relaxed">
          <section className="bg-[#2F343C] p-6 border border-white/8 rounded-lg space-y-3">
            <h2 className="text-base font-bold text-white">1. Information We Store in Our Database</h2>
            <p>
              FinVerse AI collects and stores personal data strictly required to deliver personal finance tracking services. The data stored in our MongoDB database includes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-white/70">
              <li><strong>Account Credentials & Profile:</strong> Email address, Firebase Authentication User Identifier (UID), display name, and currency preference.</li>
              <li><strong>Transactions:</strong> Amount, transaction type (income/expense), category, transaction date, merchant name, and optional description notes.</li>
              <li><strong>Budgets:</strong> Category allocation limits, monthly targets, and utilization progress.</li>
              <li><strong>Savings Goals:</strong> Target amount, current saved progress, deadline dates, and category.</li>
              <li><strong>Investment Portfolio:</strong> Asset names, ticker symbols, asset types (stocks, mutual funds, gold, fixed deposits, crypto, real estate), unit quantities, purchase prices, current market values, and broker names.</li>
              <li><strong>AI Assistant Chat History:</strong> Session titles, user prompt messages, AI advisor response content, and timestamps.</li>
            </ul>
          </section>

          <section className="bg-[#2F343C] p-6 border border-white/8 rounded-lg space-y-3">
            <h2 className="text-base font-bold text-white">2. Data Sent to External Services</h2>
            <p>
              To process requests and provide core features, specific data items are transmitted to third-party infrastructure providers:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-white/70">
              <li><strong>Google Gemini AI API:</strong> When using the AI Assistant, your query text and an aggregated summary of your financial metrics (last 30 days of income/expenses, active budget caps, and goal progress) are sent to Google Gemini API to generate personalized responses.</li>
              <li><strong>Firebase Authentication:</strong> User registration and sign-in credentials (email address and login tokens) are processed through Google Firebase Auth for identity verification. Passwords are never sent to or stored on our primary Express application server.</li>
              <li><strong>Cloudinary:</strong> If enabled by system configuration, generated PDF and Excel financial reports are stored securely in Cloudinary for export downloads.</li>
            </ul>
          </section>

          <section className="bg-[#2F343C] p-6 border border-white/8 rounded-lg space-y-3">
            <h2 className="text-base font-bold text-white">3. Data Isolation and Security</h2>
            <p>
              All database records in FinVerse AI are strictly isolated by authenticated user IDs. Every database query enforces account-level scoping to ensure your financial data is accessible only by your verified session.
            </p>
          </section>

          <section className="bg-[#2F343C] p-6 border border-white/8 rounded-lg space-y-3">
            <h2 className="text-base font-bold text-white">4. User Rights & Account Deletion</h2>
            <p>
              You maintain full ownership of your data. You may export your transaction logs into PDF, Excel, or CSV files at any time via the Reports page. Additionally, triggering account deletion in Settings permanently and irreversibly purges your user profile, transactions, budgets, goals, investments, and AI chat history from our system.
            </p>
          </section>

          <section className="bg-[#2F343C] p-6 border border-white/8 rounded-lg space-y-3">
            <h2 className="text-base font-bold text-white">5. Governing Law and Contact</h2>
            <p>
              This policy is governed under [APPLICABLE LAW]. For questions regarding data handling or privacy requests, contact us at <a href="mailto:[CONTACT EMAIL]" className="text-[#FF9A6B] hover:underline">[CONTACT EMAIL]</a>.
            </p>
          </section>
        </div>
      </div>
    </PageTransition>
  );
};

export default PrivacyPage;
