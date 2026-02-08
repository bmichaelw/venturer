import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, Table } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function ExportOptions({ data, filters }) {
  const exportToCSV = () => {
    try {
      // Create CSV content
      let csv = 'Report Generated: ' + new Date().toLocaleString() + '\n\n';
      
      // Add filters info
      if (filters.dateRange?.from && filters.dateRange?.to) {
        csv += `Date Range: ${format(filters.dateRange.from, 'MMM d, yyyy')} - ${format(filters.dateRange.to, 'MMM d, yyyy')}\n`;
      }
      csv += '\n';

      // Summary metrics
      csv += 'Summary\n';
      csv += 'Total Items,' + data.totalItems + '\n';
      csv += 'Total Tasks,' + data.totalTasks + '\n';
      csv += 'Completion Rate,' + data.completionRate + '%\n\n';

      // Status breakdown
      csv += 'Status Breakdown\n';
      csv += 'Status,Count\n';
      csv += 'Completed,' + data.statusBreakdown.completed + '\n';
      csv += 'In Progress,' + data.statusBreakdown.in_progress + '\n';
      csv += 'Not Started,' + data.statusBreakdown.not_started + '\n';
      csv += 'Canceled,' + data.statusBreakdown.canceled + '\n\n';

      // Venture breakdown
      if (data.ventureBreakdown?.length > 0) {
        csv += 'Venture Breakdown\n';
        csv += 'Venture,Count\n';
        data.ventureBreakdown.forEach(v => {
          csv += `${v.name},${v.count}\n`;
        });
        csv += '\n';
      }

      // Assignee breakdown
      if (data.assigneeBreakdown?.length > 0) {
        csv += 'Assignee Breakdown\n';
        csv += 'Assignee,Tasks\n';
        data.assigneeBreakdown.forEach(a => {
          csv += `${a.name},${a.count}\n`;
        });
      }

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Report exported to CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.text('Custom Report', 20, yPos);
      yPos += 10;

      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
      yPos += 10;

      // Filters
      if (filters.dateRange?.from && filters.dateRange?.to) {
        doc.text(`Date Range: ${format(filters.dateRange.from, 'MMM d, yyyy')} - ${format(filters.dateRange.to, 'MMM d, yyyy')}`, 20, yPos);
        yPos += 10;
      }
      yPos += 5;

      // Summary
      doc.setFontSize(14);
      doc.text('Summary', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.text(`Total Items: ${data.totalItems}`, 30, yPos);
      yPos += 6;
      doc.text(`Total Tasks: ${data.totalTasks}`, 30, yPos);
      yPos += 6;
      doc.text(`Completion Rate: ${data.completionRate}%`, 30, yPos);
      yPos += 10;

      // Status Breakdown
      doc.setFontSize(14);
      doc.text('Status Breakdown', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.text(`Completed: ${data.statusBreakdown.completed}`, 30, yPos);
      yPos += 6;
      doc.text(`In Progress: ${data.statusBreakdown.in_progress}`, 30, yPos);
      yPos += 6;
      doc.text(`Not Started: ${data.statusBreakdown.not_started}`, 30, yPos);
      yPos += 6;
      doc.text(`Canceled: ${data.statusBreakdown.canceled}`, 30, yPos);
      yPos += 10;

      // Venture Breakdown
      if (data.ventureBreakdown?.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('Venture Breakdown', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        data.ventureBreakdown.forEach(v => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${v.name}: ${v.count}`, 30, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Assignee Breakdown
      if (data.assigneeBreakdown?.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('Assignee Breakdown', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        data.assigneeBreakdown.forEach(a => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${a.name}: ${a.count} tasks`, 30, yPos);
          yPos += 6;
        });
      }

      doc.save(`report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('Report exported to PDF');
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <Table className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}