const fs = require('fs');

const analyticsPath = 'd:/FinVerse/frontend/src/pages/analytics/AnalyticsPage.tsx';
let anCode = fs.readFileSync(analyticsPath, 'utf8');

// The previous replace for useMemo didn't work because it was probably matched differently. Let's use regex.
anCode = anCode.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/, "import React, { useState, useEffect } from 'react';");
anCode = anCode.replace(/import \{ useFinanceStore \} from '@\/stores\/financeStore';\n/, "");
anCode = anCode.replace(/import \{ formatINR, getCategoryColor, cn \} from '@\/lib\/utils';/, "import { formatINR, cn } from '@/lib/utils';");
anCode = anCode.replace(/const \[isLoading, setIsLoading\] = useState\(true\);/, "const [, setIsLoading] = useState(true);");

fs.writeFileSync(analyticsPath, anCode);
console.log("Fixed AnalyticsPage again");
