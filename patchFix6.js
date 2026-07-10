const fs = require('fs');
const analyticsPath = 'd:/FinVerse/frontend/src/pages/analytics/AnalyticsPage.tsx';
let anCode = fs.readFileSync(analyticsPath, 'utf8');

anCode = anCode.replace(/import \{ formatINR, cn \} from '@\/lib\/utils';/g, "import { formatINR } from '@/lib/utils';");
anCode = anCode.replace(/import \{ formatINR, formatINRCompact, cn \} from '@\/lib\/utils';/g, "import { formatINR, formatINRCompact } from '@/lib/utils';");

fs.writeFileSync(analyticsPath, anCode);
console.log("Fixed AnalyticsPage for the fifth time");
