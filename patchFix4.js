const fs = require('fs');
const analyticsPath = 'd:/FinVerse/frontend/src/pages/analytics/AnalyticsPage.tsx';
let anCode = fs.readFileSync(analyticsPath, 'utf8');

anCode = anCode.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/g, "import React, { useState, useEffect } from 'react';");
anCode = anCode.replace(/import \{ formatINR, getCategoryColor, cn \} from '@\/lib\/utils';/g, "import { formatINR, cn } from '@/lib/utils';");
// just in case:
anCode = anCode.replace(/useMemo,/g, "");
anCode = anCode.replace(/getCategoryColor,/g, "");

fs.writeFileSync(analyticsPath, anCode);
console.log("Fixed AnalyticsPage third time");
