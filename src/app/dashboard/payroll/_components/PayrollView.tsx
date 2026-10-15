"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Eye, Download, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserMenu from "../../_components/UserMenu";
import type { Document, CenterFeature } from "@/core/domain/entities";
import { useTranslations, useLocale } from "next-intl";

interface PayrollViewProps {
  documents: Document[];
  userEmail: string;
  enabledFeatures: CenterFeature[];
}

function getYear(dateString: string | undefined): number | null {
  if (!dateString) return null;
  return new Date(dateString).getFullYear();
}

export default function PayrollView({
  documents,
  userEmail,
  enabledFeatures,
}: PayrollViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const t = useTranslations("dashboard.payroll");
  const locale = useLocale();

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    documents.forEach((doc) => {
      const year = getYear(doc.timestamp);
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesYear =
        selectedYear === "all" ||
        getYear(doc.timestamp)?.toString() === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [documents, searchQuery, selectedYear]);

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(fileUrl, "_blank");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedYear("all");
  };

  const hasActiveFilters = searchQuery !== "" || selectedYear !== "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t("title")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
          <UserMenu enabledFeatures={enabledFeatures} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="w-5 h-5" />
              {t("documents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                />
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-10 px-3 rounded-md bg-white border border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t("allYears")}</option>
                {availableYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-600 h-10"
                >
                  <X className="w-4 h-4 mr-1" />
                  {t("clearFilters")}
                </Button>
              )}
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("noDocuments")}</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("noFiltered")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        {t("colName")}
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300">
                        {t("colUploadDate")}
                      </TableHead>
                      <TableHead className="text-slate-700 dark:text-slate-300 text-right">
                        {t("colActions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                      >
                        <TableCell className="text-slate-900 dark:text-white font-medium">
                          {doc.name}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {formatDate(doc.timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(doc.document)}
                              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-600"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {t("view")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownload(doc.document, doc.name)
                              }
                              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-600"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              {t("download")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-sm text-slate-500 mt-4">
                  {t("showing", {
                    filtered: filteredDocuments.length,
                    total: documents.length,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
