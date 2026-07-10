const fs = require('fs');
const analyticsPath = 'd:/FinVerse/frontend/src/pages/analytics/AnalyticsPage.tsx';
let anCode = fs.readFileSync(analyticsPath, 'utf8');

// Replace any occurrence of getCategoryColor from the imports
anCode = anCode.replace(/import \{ formatINR, cn, getCategoryColor \} from '@\/lib\/utils';/g, "import { formatINR, cn } from '@/lib/utils';");
anCode = anCode.replace(/import \{ formatINR, getCategoryColor, cn \} from '@\/lib\/utils';/g, "import { formatINR, cn } from '@/lib/utils';");

fs.writeFileSync(analyticsPath, anCode);
console.log("Fixed AnalyticsPage for the fourth time");
