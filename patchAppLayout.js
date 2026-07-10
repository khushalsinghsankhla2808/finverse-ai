const fs = require('fs');
const path = 'd:/FinVerse/frontend/src/components/layout/AppLayout.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('useLocation')) {
  code = code.replace(
    "import { Outlet } from 'react-router-dom';",
    "import { Outlet, useLocation } from 'react-router-dom';"
  );
}

if (!code.includes('useEffect(() => {')) {
  code = code.replace(
    "import React, { useState } from 'react';",
    "import React, { useState, useEffect } from 'react';"
  );
}

if (!code.includes('document.title')) {
  const insertIndex = code.indexOf('  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);') + '  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);'.length;
  
  const effectCode = `\n  const location = useLocation();\n  useEffect(() => {\n    const path = location.pathname.substring(1);\n    const title = path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';\n    document.title = \`FinVerse | \${title}\`;\n  }, [location]);`;
  
  code = code.slice(0, insertIndex) + effectCode + code.slice(insertIndex);
}

fs.writeFileSync(path, code);
console.log("Updated AppLayout.tsx successfully.");
