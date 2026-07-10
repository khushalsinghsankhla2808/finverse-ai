const fs = require('fs');
const path = 'd:/FinVerse/frontend/src/pages/ai/AIAssistantPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add disabled={isLoading} to input
const oldInput = `<input
                  type="text"
                  placeholder="Ask FinVerse AI..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-hidden focus:ring-0 focus:border-transparent py-1"
                />`;
const newInput = `<input
                  type="text"
                  placeholder="Ask FinVerse AI..."
                  value={inputValue}
                  disabled={isLoading}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-white/20 focus:outline-hidden focus:ring-0 focus:border-transparent py-1 disabled:opacity-50"
                />`;
code = code.replace(oldInput, newInput);

// Inject useCurrencyStore
if (!code.includes('useCurrencyStore')) {
  code = code.replace(
    "import { useToast } from '@/hooks/useToast';",
    "import { useToast } from '@/hooks/useToast';\nimport { useCurrencyStore } from '@/stores/currencyStore';"
  );
  
  code = code.replace(
    '  const { showToast } = useToast();\n  const messagesEndRef = useRef<HTMLDivElement | null>(null);',
    '  const { showToast } = useToast();\n  const { activeCurrency } = useCurrencyStore();\n  const messagesEndRef = useRef<HTMLDivElement | null>(null);'
  );
  
  // Update renderHighlightedContent to use activeCurrency
  code = code.replace(
    'const renderHighlightedContent = (text: string) => {',
    'const renderHighlightedContent = (text: string, currencySymbol: string) => {'
  );
  code = code.replace(
    "const parts = text.split(/(₹\\d+(?:,\\d+)*(?:\\.\\d+)?)/g);",
    "const parts = text.split(new RegExp(`(\\\\\\${currencySymbol}\\\\d+(?:,\\\\d+)*(?:\\\\.\\\\d+)?)`, 'g'));"
  );
  code = code.replace(
    "if (part.startsWith('₹')) {",
    "if (part.startsWith(currencySymbol)) {"
  );
  code = code.replace(
    "{isUser ? msg.content : renderHighlightedContent(msg.content)}",
    "{isUser ? msg.content : renderHighlightedContent(msg.content, activeCurrency.symbol)}"
  );
}

fs.writeFileSync(path, code);
console.log("Updated AIAssistantPage.tsx successfully.");
