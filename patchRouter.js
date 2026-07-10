const fs = require('fs');
const path = 'd:/FinVerse/frontend/src/router/index.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add import
if (!code.includes("import SettingsPage from '@/pages/settings/SettingsPage';")) {
  code = code.replace(
    "import ReportsPage from '@/pages/reports/ReportsPage';",
    "import ReportsPage from '@/pages/reports/ReportsPage';\nimport SettingsPage from '@/pages/settings/SettingsPage';"
  );
}

// Replace route
code = code.replace(
  "path: 'settings',\n        element: <PlaceholderPage title=\"Account Settings\" icon={Settings} />",
  "path: 'settings',\n        element: <SettingsPage />"
);

fs.writeFileSync(path, code);
console.log("Updated index.tsx router successfully.");
