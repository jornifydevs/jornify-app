"use client";

import { useState, useMemo } from "react";
import { FileText, Eye, Download, Search, X } from "lucide-react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import type { Document } from "@/core/domain/entities";
import { useTranslations, useLocale } from "next-intl";

interface PayrollViewProps {
  documents: Document[];
}

function getYear(dateString: string | undefined): number | null {
  if (!dateString) return null;
  return new Date(dateString).getFullYear();
}

export default function PayrollView({ documents }: PayrollViewProps) {
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
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("title")} />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("documents")}
            </h2>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11"
                />
              </div>
              <NativeSelect
                aria-label={t("year")}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="sm:w-44"
              >
                <option value="all">{t("allYears")}</option>
                {availableYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </NativeSelect>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X />
                  {t("clearFilters")}
                </Button>
              )}
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <FileText
                  className="size-10 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="font-medium">{t("noDocuments")}</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Search
                  className="size-10 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="font-medium">{t("noFiltered")}</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t("colName")}</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        {t("colUploadDate")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("colActions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <span className="font-medium [overflow-wrap:anywhere]">
                            {doc.name}
                          </span>
                          {/* On phones the upload date folds under the name */}
                          <span className="mt-0.5 block text-muted-foreground tabular-nums sm:hidden">
                            {formatDate(doc.timestamp)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                          {formatDate(doc.timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(doc.document)}
                              className="sm:w-auto sm:px-3.5"
                            >
                              <Eye />
                              <span className="sr-only sm:not-sr-only">
                                {t("view")}
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDownload(doc.document, doc.name)
                              }
                              className="sm:w-auto sm:px-3.5"
                            >
                              <Download />
                              <span className="sr-only sm:not-sr-only">
                                {t("download")}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("showing", {
                    filtered: filteredDocuments.length,
                    total: documents.length,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
