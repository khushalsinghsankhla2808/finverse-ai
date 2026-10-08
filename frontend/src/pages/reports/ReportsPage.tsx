import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import reportService from '@/services/reportService';
import { useToast } from '@/hooks/useToast';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import { REPORT_FORMAT_ICONS } from '@/lib/categoryIcons';

const reportSchema = z.object({
  type: z.enum(['monthly', 'yearly', 'custom']),
  format: z.enum(['pdf', 'excel', 'csv']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  categories: z.array(z.string()).optional().default([]),
});

interface ReportFormValues {
  type: 'monthly' | 'yearly' | 'custom';
  format: 'pdf' | 'excel' | 'csv';
  startDate: string;
  endDate: string;
  categories: string[];
}

interface HistoricalReport {
  id: string;
  name: string;
  generatedAt: string;
  format: 'pdf' | 'excel' | 'csv';
  url: string;
}

export const ReportsPage: React.FC = () => {
  const { showToast } = useToast();

  const [history, setHistory] = useState<HistoricalReport[]>([
    {
      id: 'rep-1',
      name: 'FinVerse_Report_monthly_June2026.pdf',
      generatedAt: '2026-06-30T18:30:00.000Z',
      format: 'pdf',
      url: 'https://cloudinary.com/reports/FinVerse_Report_monthly_June2026.pdf',
    },
    {
      id: 'rep-2',
      name: 'FinVerse_Report_monthly_May2026.excel',
      generatedAt: '2026-05-31T18:30:00.000Z',
      format: 'excel',
      url: 'https://cloudinary.com/reports/FinVerse_Report_monthly_May2026.xlsx',
    },
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema) as any,
    defaultValues: {
      type: 'monthly',
      format: 'pdf',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      categories: [],
    },
  });

  const formType = watch('type');
  const formFormat = watch('format');
  const formCategories = watch('categories') || [];

  const handleToggleCategory = (category: string) => {
    const current = [...formCategories];
    const index = current.indexOf(category);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(category);
    }
    setValue('categories', current);
  };

  const CATEGORY_OPTIONS = [
    'Housing',
    'Food',
    'Transport',
    'Shopping',
    'Entertainment',
    'Groceries',
    'Utilities',
    'Healthcare',
    'Education',
    'Investment',
    'Other',
  ];

  const onGenerateSubmit = async (values: ReportFormValues) => {
    try {
      const res = await reportService.generate(values);
      const { downloadUrl, fileName } = res.data;

      const newReport: HistoricalReport = {
        id: `rep-${Date.now()}`,
        name: fileName,
        generatedAt: new Date().toISOString(),
        format: values.format,
        url: downloadUrl,
      };
      setHistory((prev) => [newReport, ...prev]);

      showToast('Report generated successfully!', 'success');
      window.open(downloadUrl, '_blank');
    } catch (err) {
      showToast('Failed to compile report statement', 'error');
    }
  };

  const handleQuickExport = async (format: 'pdf' | 'excel' | 'csv') => {
    const values: ReportFormValues = {
      type: 'monthly',
      format,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      categories: [],
    };

    try {
      showToast(`Generating Quick ${format.toUpperCase()} statement...`, 'info');
      const res = await reportService.generate(values);
      const { downloadUrl, fileName } = res.data;

      const newReport: HistoricalReport = {
        id: `rep-${Date.now()}`,
        name: fileName,
        generatedAt: new Date().toISOString(),
        format,
        url: downloadUrl,
      };
      setHistory((prev) => [newReport, ...prev]);

      showToast(`${format.toUpperCase()} generated! Downloading...`, 'success');
      window.open(downloadUrl, '_blank');
    } catch (err) {
      showToast(`Failed to generate ${format.toUpperCase()} file`, 'error');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 text-ink">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-sans font-bold tracking-tight">Reports & Statements</h1>
          <p className="text-xs text-ink-muted font-medium">Export statements and financial analyses</p>
        </div>

        {/* Quick Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PDF Card */}
          <div className="card flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-surface-sunken border border-line text-loss rounded-[var(--radius-control)]">
                <FileText size={20} />
              </div>
              <span className="px-2 py-0.5 rounded-[var(--radius-control)] text-[10px] font-bold bg-surface-sunken border border-line text-ink-subtle flex items-center gap-1">
                <FileText size={10} /> PDF
              </span>
            </div>
            <div className="my-5">
              <h3 className="text-sm font-bold text-ink">Statement PDF</h3>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                Full-page document covering balance, category ratios and transaction ledgers.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleQuickExport('pdf')}
              className="w-full text-xs justify-center cursor-pointer py-2"
              leftIcon={<Download size={14} />}
            >
              Quick Export
            </Button>
          </div>

          {/* Excel Card */}
          <div className="card flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-surface-sunken border border-line amount-gain rounded-[var(--radius-control)]">
                <FileSpreadsheet size={20} />
              </div>
              <span className="px-2 py-0.5 rounded-[var(--radius-control)] text-[10px] font-bold bg-surface-sunken border border-line text-ink-subtle flex items-center gap-1">
                <FileSpreadsheet size={10} /> Excel
              </span>
            </div>
            <div className="my-5">
              <h3 className="text-sm font-bold text-ink">Excel Workbook</h3>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                Multi-tab grid worksheet containing transactional raw files and category metrics.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleQuickExport('excel')}
              className="w-full text-xs justify-center cursor-pointer py-2"
              leftIcon={<Download size={14} />}
            >
              Quick Export
            </Button>
          </div>

          {/* CSV Card */}
          <div className="card flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-surface-sunken border border-line text-primary rounded-[var(--radius-control)]">
                <Layers size={20} />
              </div>
              <span className="px-2 py-0.5 rounded-[var(--radius-control)] text-[10px] font-bold bg-surface-sunken border border-line text-ink-subtle flex items-center gap-1">
                <FileSpreadsheet size={10} /> CSV
              </span>
            </div>
            <div className="my-5">
              <h3 className="text-sm font-bold text-ink">CSV Data File</h3>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                Standard comma-separated format suited for ingestion in custom sheet pipelines.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleQuickExport('csv')}
              className="w-full text-xs justify-center cursor-pointer py-2"
              leftIcon={<Download size={14} />}
            >
              Quick Export
            </Button>
          </div>
        </div>

        {/* Builder & History segments */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Custom Builder Form */}
          <div className="card lg:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider block">Builder</span>
              <h3 className="text-sm font-bold text-ink mt-0.5">Custom Report Builder</h3>
            </div>

            <form onSubmit={handleSubmit(onGenerateSubmit)} className="space-y-4 mt-4 text-xs">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider block">Statement Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'yearly', 'custom'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setValue('type', t)}
                      className={`py-1.5 rounded-[var(--radius-control)] border text-[10px] font-semibold text-center cursor-pointer transition-all ${
                        formType === t
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface border-line text-ink-muted hover:border-ink-subtle'
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider block">Output Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pdf', 'excel', 'csv'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setValue('format', f)}
                      className={`py-1.5 rounded-[var(--radius-control)] border text-[10px] font-semibold text-center cursor-pointer transition-all ${
                        formFormat === f
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface border-line text-ink-muted hover:border-ink-subtle'
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="input text-xs"
                  />
                  {errors.startDate && <span className="text-[10px] amount-loss font-medium">{errors.startDate.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="input text-xs"
                  />
                  {errors.endDate && <span className="text-[10px] amount-loss font-medium">{errors.endDate.message}</span>}
                </div>
              </div>

              {/* Multi-select category tags */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider block">Filter Category tags</label>
                <div className="flex flex-wrap gap-1.5 max-h-85px overflow-y-auto pr-1">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = formCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-[var(--radius-control)] text-[9px] font-bold cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface border-line text-ink-muted hover:border-ink-subtle'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="w-full justify-center text-xs py-2.5 mt-2"
                leftIcon={<Sparkles size={14} />}
              >
                Compile & Export Statement
              </Button>
            </form>
          </div>

          {/* Download History Table */}
          <div className="card lg:col-span-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider block">Archive</span>
              <h3 className="text-sm font-bold text-ink mt-0.5">Exports Ledger History</h3>
            </div>

            <div className="flex-1 mt-4 overflow-y-auto pr-1 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line text-[9px] uppercase font-bold text-ink-subtle tracking-wider">
                    <th className="py-2 px-3">Report Name</th>
                    <th className="py-2 px-3">Generated At</th>
                    <th className="py-2 px-3 text-right">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rep) => {
                    const formatInfo = REPORT_FORMAT_ICONS[rep.format] || { icon: FileText, label: rep.format.toUpperCase() };
                    const FormatIcon = formatInfo.icon;

                    return (
                      <tr key={rep.id} className="border-b border-line font-medium text-ink-muted">
                        <td className="py-3 px-3 flex items-center gap-2 max-w-150px">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-control)] bg-surface-sunken border border-line uppercase flex items-center gap-1">
                            <FormatIcon size={10} /> {formatInfo.label}
                          </span>
                          <span className="font-semibold text-ink truncate" title={rep.name}>
                            {rep.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px]">
                          {new Date(rep.generatedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <a
                            href={rep.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-link font-bold hover:underline"
                          >
                            Link <ExternalLink size={10} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ReportsPage;
