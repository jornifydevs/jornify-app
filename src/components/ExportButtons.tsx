"use client";

import { FileDown, Table2, Download, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCSV, downloadPDF } from "@/lib/export-utils";

interface ExportButtonsProps {
  columns: string[];
  rows: string[][];
  filename: string;
  title?: string;
  disabled?: boolean;
}

export default function ExportButtons({
  columns,
  rows,
  filename,
  title,
  disabled = false,
}: ExportButtonsProps) {
  const t = useTranslations("common.export");

  const handlePDF = () => {
    downloadPDF(columns, rows, filename, title);
  };

  const handleCSV = () => {
    downloadCSV(columns, rows, filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" />
          {t("trigger")}
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePDF} className="gap-2 cursor-pointer">
          <FileDown className="w-4 h-4" />
          {t("pdf")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCSV} className="gap-2 cursor-pointer">
          <Table2 className="w-4 h-4" />
          {t("csv")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
