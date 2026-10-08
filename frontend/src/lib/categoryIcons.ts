import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  ShoppingCart,
  Zap,
  Banknote,
  ArrowLeftRight,
  Activity,
  GraduationCap,
  TrendingUp,
  PiggyBank,
  Plane,
  Folder,
  Briefcase,
  Gift,
  Shield,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // Named categories
  Housing: Home,
  Food: Utensils,
  Dining: Utensils,
  Transport: Car,
  Transportation: Car,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Groceries: ShoppingCart,
  Utilities: Zap,
  Income: Banknote,
  Salary: Banknote,
  Transfer: ArrowLeftRight,
  Healthcare: Activity,
  Medical: Activity,
  Education: GraduationCap,
  Investment: TrendingUp,
  Investments: TrendingUp,
  Savings: PiggyBank,
  Emergency: PiggyBank,
  Travel: Plane,
  Vacation: Plane,
  Other: Folder,

  // Emoji fallbacks mapped to standard icons
  "🏠": Home,
  "🍔": Utensils,
  "🚗": Car,
  "🛍️": ShoppingBag,
  "🎬": Film,
  "🛒": ShoppingCart,
  "💡": Zap,
  "💵": Banknote,
  "🔄": ArrowLeftRight,
  "🏥": Activity,
  "🎓": GraduationCap,
  "📈": TrendingUp,
  "💰": PiggyBank,
  "✈️": Plane,
  "🎁": Gift,
  "🛡️": Shield,
  "💼": Briefcase,
};

export function getCategoryIcon(key: string): LucideIcon {
  if (!key) return Folder;
  const trimmed = key.trim();
  return CATEGORY_ICON_MAP[trimmed] || Folder;
}

export function renderCategoryIcon(key: string, props: { className?: string } = {}) {
  const IconComponent = getCategoryIcon(key);
  return React.createElement(IconComponent, { className: props.className || "w-4 h-4" });
}

export const REPORT_FORMAT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  pdf: { icon: FileText, label: "PDF" },
  excel: { icon: FileSpreadsheet, label: "Excel" },
  csv: { icon: FileSpreadsheet, label: "CSV" },
};
