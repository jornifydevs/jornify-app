"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  ArrowRightLeft,
  X,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { WorkerWithUser } from "@/core/application/dtos/admin-workers.dto";
import type { InvitationCode, User, Center } from "@/core/domain/entities";
import InvitationCodePanel from "./InvitationCodePanel";
import UnassignedWorkerPanel from "./UnassignedWorkerPanel";

interface WorkerListViewProps {
  workers: WorkerWithUser[];
  initialCodes: InvitationCode[];
  unassignedWorkers: User[];
  centers: Center[];
}

function Checkbox({
  checked,
  indeterminate,
  label,
  onChange,
  onClick,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: () => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const active = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => {
        onClick?.(e);
        onChange();
      }}
      className="group/checkbox -m-3 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-none md:-m-2 md:size-8"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[18px] items-center justify-center rounded-[5px] border transition-colors group-focus-visible/checkbox:ring-2 group-focus-visible/checkbox:ring-ring group-focus-visible/checkbox:ring-offset-2 group-focus-visible/checkbox:ring-offset-background",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-card group-hover/checkbox:border-foreground"
        )}
      >
        {indeterminate && !checked ? (
          <span className="block h-0.5 w-2 rounded-full bg-current" />
        ) : checked ? (
          <svg className="size-3" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 5l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </button>
  );
}

const CONTRACT_MAP: Record<string, string> = {
  "tiempo completo": "full_time",
  full_time: "full_time",
  "tiempo parcial": "part_time",
  part_time: "part_time",
  temporal: "temporary",
  temporary: "temporary",
  prácticas: "internship",
  practicas: "internship",
  internship: "internship",
};

interface ParsedRow {
  name: string;
  lastName: string;
  email: string;
  dni: string;
  centerName: string;
  job: string;
  contractType: string;
  hourWeek: number;
  phone: string;
  centerId?: string;
  errors: string[];
  valid: boolean;
}

const BLANK_MANUAL = {
  name: "",
  lastName: "",
  email: "",
  phone: "",
  dni: "",
  centerId: "",
  contractType: "full_time",
  hourWeek: "40",
  job: "",
};

type SortKey = "name" | "email" | "dni" | "center" | "contract" | "hourWeek";
type SortDir = "asc" | "desc";

export default function WorkerListView({
  workers,
  initialCodes,
  unassignedWorkers,
  centers,
}: WorkerListViewProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.admin.workers");
  const tc = useTranslations("common");

  const contractLabels: Record<string, string> = {
    full_time: t("contractFull"),
    part_time: t("contractPart"),
    temporary: t("contractTemp"),
    internship: t("contractIntern"),
  };

  // ── Filtros y ordenación ─────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // ── Selección múltiple ───────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<"move" | "delete" | null>(null);
  const [bulkTargetCenter, setBulkTargetCenter] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkError, setBulkError] = useState("");

  // ── Alta de trabajadores ─────────────────────────────────────────────────
  const [addModal, setAddModal] = useState<"manual" | "excel" | null>(null);

  // Manual form
  const [manualForm, setManualForm] = useState(BLANK_MANUAL);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState("");

  // Excel import
  const [excelRows, setExcelRows] = useState<ParsedRow[]>([]);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelProgress, setExcelProgress] = useState({ current: 0, total: 0 });
  const [excelError, setExcelError] = useState("");

  // ── Ordenación ───────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = workers
    .filter((w) => {
      const term = search.toLowerCase();
      const matchesSearch =
        w.userName.toLowerCase().includes(term) ||
        w.userLastName.toLowerCase().includes(term) ||
        w.userEmail.toLowerCase().includes(term) ||
        w.worker.dni.toLowerCase().includes(term) ||
        w.centerName.toLowerCase().includes(term);
      const matchesCenter =
        centerFilter === "" || w.worker.centerId === centerFilter;
      return matchesSearch && matchesCenter;
    })
    .sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortKey) {
        case "name":
          aVal = `${a.userName} ${a.userLastName}`.toLowerCase();
          bVal = `${b.userName} ${b.userLastName}`.toLowerCase();
          break;
        case "email":
          aVal = a.userEmail.toLowerCase();
          bVal = b.userEmail.toLowerCase();
          break;
        case "dni":
          aVal = a.worker.dni.toLowerCase();
          bVal = b.worker.dni.toLowerCase();
          break;
        case "center":
          aVal = a.centerName.toLowerCase();
          bVal = b.centerName.toLowerCase();
          break;
        case "contract":
          aVal = (
            contractLabels[a.worker.contractType] ?? a.worker.contractType
          ).toLowerCase();
          bVal = (
            contractLabels[b.worker.contractType] ?? b.worker.contractType
          ).toLowerCase();
          break;
        case "hourWeek":
          aVal = a.worker.hourWeek;
          bVal = b.worker.hourWeek;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  // ── Helpers de selección ─────────────────────────────────────────────────
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((w) => selectedIds.has(w.worker.id));
  const someFilteredSelected = filtered.some((w) =>
    selectedIds.has(w.worker.id)
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((w) => w.worker.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const closeBulkModal = () => {
    if (bulkProcessing) return;
    setBulkModal(null);
    setBulkTargetCenter("");
    setBulkError("");
  };

  // ── Manual create ────────────────────────────────────────────────────────
  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSaving(true);
    setManualError("");
    try {
      const res = await fetch("/api/admin/workers/direct-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          hourWeek: Number(manualForm.hourWeek),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setManualError(data.error ?? t("errorCreate"));
        return;
      }
      setAddModal(null);
      setManualForm(BLANK_MANUAL);
      router.refresh();
    } finally {
      setManualSaving(false);
    }
  };

  // ── Excel parse + import ─────────────────────────────────────────────────
  const handleExcelFile = async (file: File) => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
      defval: "",
    });

    const parsed: ParsedRow[] = raw.map((row) => {
      const name = String(row["Nombre"] ?? "").trim();
      const lastName = String(row["Apellidos"] ?? "").trim();
      const email = String(row["Email"] ?? "").trim();
      const dni = String(row["DNI"] ?? "").trim();
      const centerName = String(row["Centro"] ?? "").trim();
      const job = String(row["Puesto"] ?? "").trim();
      const contractRaw = String(row["Tipo contrato"] ?? "")
        .trim()
        .toLowerCase();
      const hourWeekRaw = String(row["Horas/semana"] ?? "").trim();
      const phone = String(row["Teléfono"] ?? row["Telefono"] ?? "").trim();

      const errors: string[] = [];
      if (!name) errors.push(t("importErrors.nameEmpty"));
      if (!lastName) errors.push(t("importErrors.lastNameEmpty"));
      if (!email) errors.push(t("importErrors.emailEmpty"));
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push(t("importErrors.emailInvalid"));

      // Center is optional — empty means unassigned
      const matchedCenter = centerName
        ? centers.find((c) => c.name.toLowerCase() === centerName.toLowerCase())
        : undefined;
      if (centerName && !matchedCenter)
        errors.push(t("importErrors.centerNotFound", { center: centerName }));

      // DNI and job are only required when a center is assigned
      if (centerName) {
        if (!dni) errors.push(t("importErrors.dniEmpty"));
        if (!job) errors.push(t("importErrors.jobEmpty"));
      }

      let contractType = "full_time";
      if (contractRaw) {
        const normalized = CONTRACT_MAP[contractRaw];
        if (!normalized)
          errors.push(
            t("importErrors.contractInvalid", { contract: contractRaw })
          );
        else contractType = normalized;
      }

      let hourWeek = 40;
      if (hourWeekRaw) {
        const n = Number(hourWeekRaw);
        if (isNaN(n) || n < 1 || n > 168)
          errors.push(t("importErrors.hourWeekInvalid"));
        else hourWeek = n;
      }

      return {
        name,
        lastName,
        email,
        dni,
        centerName,
        job,
        contractType,
        hourWeek,
        phone,
        centerId: matchedCenter?.id,
        errors,
        valid: errors.length === 0,
      };
    });

    setExcelRows(parsed);
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "Nombre",
        "Apellidos",
        "Email",
        "DNI",
        "Centro",
        "Puesto",
        "Tipo contrato",
        "Horas/semana",
        "Teléfono",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trabajadores");
    XLSX.writeFile(wb, "plantilla_trabajadores.xlsx");
  };

  const handleExcelImport = async (validOnly: boolean) => {
    const rows = validOnly ? excelRows.filter((r) => r.valid) : excelRows;
    if (!rows.length) return;
    setExcelImporting(true);
    setExcelError("");
    setExcelProgress({ current: 0, total: rows.length });
    for (let i = 0; i < rows.length; i++) {
      setExcelProgress({ current: i + 1, total: rows.length });
      const r = rows[i];
      const res = await fetch("/api/admin/workers/direct-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: r.name,
          lastName: r.lastName,
          email: r.email,
          phone: r.phone || undefined,
          ...(r.centerId
            ? {
                centerId: r.centerId,
                dni: r.dni,
                contractType: r.contractType,
                hourWeek: r.hourWeek,
                job: r.job,
              }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExcelError(
          t("importRowError", {
            row: i + 1,
            email: r.email,
            error: data.error ?? tc("error"),
          })
        );
        setExcelImporting(false);
        return;
      }
    }
    setExcelImporting(false);
    setAddModal(null);
    setExcelRows([]);
    router.refresh();
  };

  // ── Bulk move ────────────────────────────────────────────────────────────
  const handleBulkMove = async () => {
    if (!bulkTargetCenter) return;
    setBulkProcessing(true);
    setBulkError("");
    const ids = Array.from(selectedIds);
    setBulkProgress({ current: 0, total: ids.length });
    for (let i = 0; i < ids.length; i++) {
      setBulkProgress({ current: i + 1, total: ids.length });
      const res = await fetch(`/api/admin/workers/${ids[i]}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: bulkTargetCenter }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBulkError(data.error ?? t("errorMove"));
        setBulkProcessing(false);
        return;
      }
    }
    setBulkProcessing(false);
    setBulkModal(null);
    setBulkTargetCenter("");
    setSelectedIds(new Set());
    router.refresh();
  };

  // ── Bulk delete ──────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setBulkProcessing(true);
    setBulkError("");
    const ids = Array.from(selectedIds);
    setBulkProgress({ current: 0, total: ids.length });
    for (let i = 0; i < ids.length; i++) {
      setBulkProgress({ current: i + 1, total: ids.length });
      const res = await fetch(`/api/admin/workers/${ids[i]}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBulkError(data.error ?? t("errorDelete"));
        setBulkProcessing(false);
        return;
      }
    }
    setBulkProcessing(false);
    setBulkModal(null);
    setSelectedIds(new Set());
    router.refresh();
  };

  // ── Sub-componentes ───────────────────────────────────────────────────────
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column)
      return (
        <ChevronsUpDown
          aria-hidden="true"
          className="size-3.5 opacity-40 transition-opacity group-hover/sort:opacity-80"
        />
      );
    return sortDir === "asc" ? (
      <ChevronUp aria-hidden="true" className="size-3.5" />
    ) : (
      <ChevronDown aria-hidden="true" className="size-3.5" />
    );
  };

  const SortableHead = ({
    label,
    column,
    className,
    align = "start",
  }: {
    label: string;
    column: SortKey;
    className?: string;
    align?: "start" | "end";
  }) => (
    <TableHead
      className={className}
      aria-sort={
        sortKey === column
          ? sortDir === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      <button
        type="button"
        onClick={() => handleSort(column)}
        className={cn(
          "group/sort -mx-1 flex select-none items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          sortKey === column && "text-foreground",
          align === "end" && "ml-auto"
        )}
      >
        {label}
        <SortIcon column={column} />
      </button>
    </TableHead>
  );

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6 lg:pt-8">
        <PageHeader
          title={t("title")}
          description={t("registeredCount", { count: workers.length })}
          actions={
            <>
              <Button
                type="button"
                onClick={() => {
                  setManualForm(BLANK_MANUAL);
                  setManualError("");
                  setAddModal("manual");
                }}
              >
                <UserPlus />
                {t("addWorker")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setExcelRows([]);
                  setExcelError("");
                  setAddModal("excel");
                }}
              >
                <FileSpreadsheet />
                {t("importExcel")}
              </Button>
            </>
          }
        />
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <InvitationCodePanel initialCodes={initialCodes} />
        <UnassignedWorkerPanel
          unassignedWorkers={unassignedWorkers}
          centers={centers}
        />

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={tc("search")}
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>
          <NativeSelect
            aria-label={t("colCenter")}
            value={centerFilter}
            onChange={(e) => setCenterFilter(e.target.value)}
            className="sm:w-56"
          >
            <option value="">{t("allCenters")}</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-secondary px-4 py-3">
            <span className="text-sm font-medium tabular-nums">
              {t("selectedCount", { count: selectedIds.size })}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBulkError("");
                  setBulkTargetCenter("");
                  setBulkModal("move");
                }}
                aria-label={t("changeCenter")}
                className="w-11 px-0 sm:w-auto sm:px-5"
              >
                <ArrowRightLeft />
                <span className="hidden sm:inline">{t("changeCenter")}</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setBulkError("");
                  setBulkModal("delete");
                }}
                aria-label={t("delete")}
                className="w-11 px-0 sm:w-auto sm:px-5"
              >
                <Trash2 />
                <span className="hidden sm:inline">{t("delete")}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                aria-label={t("clearSelection")}
                title={t("clearSelection")}
              >
                <X />
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Users
                aria-hidden="true"
                className="mx-auto mb-3 size-10 text-muted-foreground"
              />
              <p className="font-medium">{t("noWorkersFound")}</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="divide-y md:hidden">
                {filtered.map((w) => (
                  <li
                    key={w.worker.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedIds.has(w.worker.id)}
                      label={t("selectWorker", {
                        name: `${w.userName} ${w.userLastName}`,
                      })}
                      onChange={() => toggleSelect(w.worker.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Link
                      href={`/dashboard/admin/workers/${w.worker.id}`}
                      className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {w.userName} {w.userLastName}
                        </span>
                        <Eye
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="truncate">{w.userEmail}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{w.centerName}</span>
                          <StatusBadge
                            tone="neutral"
                            size="sm"
                            dot={false}
                            className="shrink-0"
                          >
                            {contractLabels[w.worker.contractType] ??
                              w.worker.contractType}
                          </StatusBadge>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-secondary">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 pl-4">
                        <Checkbox
                          checked={allFilteredSelected}
                          indeterminate={
                            someFilteredSelected && !allFilteredSelected
                          }
                          label={t("selectAll")}
                          onChange={toggleSelectAll}
                        />
                      </TableHead>
                      <SortableHead label={t("colName")} column="name" />
                      <SortableHead label={t("colEmail")} column="email" />
                      <SortableHead label={t("colDni")} column="dni" />
                      <SortableHead label={t("colCenter")} column="center" />
                      <SortableHead
                        label={t("colContract")}
                        column="contract"
                      />
                      <SortableHead
                        label={t("colHourWeek")}
                        column="hourWeek"
                        className="text-right"
                        align="end"
                      />
                      <TableHead className="w-14 pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((w) => (
                      <TableRow key={w.worker.id}>
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={selectedIds.has(w.worker.id)}
                            label={t("selectWorker", {
                              name: `${w.userName} ${w.userLastName}`,
                            })}
                            onChange={() => toggleSelect(w.worker.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {w.userName} {w.userLastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {w.userEmail}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {w.worker.dni}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {w.centerName}
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone="neutral" size="sm" dot={false}>
                            {contractLabels[w.worker.contractType] ??
                              w.worker.contractType}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {w.worker.hourWeek}h
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-9"
                          >
                            <Link
                              href={`/dashboard/admin/workers/${w.worker.id}`}
                              aria-label={t("viewWorker", {
                                name: `${w.userName} ${w.userLastName}`,
                              })}
                            >
                              <Eye />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground tabular-nums">
          {t("showingCount", {
            shown: filtered.length,
            count: workers.length,
          })}
        </p>
      </div>

      {/* Modal — Cambiar centro */}
      {bulkModal === "move" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-move-title"
            className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-float"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2
                id="bulk-move-title"
                className="text-lg font-semibold tracking-tight"
              >
                {t("changeCenter")}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeBulkModal}
                disabled={bulkProcessing}
                aria-label={t("close")}
                className="-mr-3 -mt-3"
              >
                <X />
              </Button>
            </div>
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                {t("selectedWorkers", { count: selectedIds.size })}
              </p>
              <div className="space-y-2">
                <Label htmlFor="bulk-target-center">{t("targetCenter")}</Label>
                <NativeSelect
                  id="bulk-target-center"
                  value={bulkTargetCenter}
                  onChange={(e) => setBulkTargetCenter(e.target.value)}
                  disabled={bulkProcessing}
                >
                  <option value="">{t("selectCenter")}</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {bulkError && <Alert variant="error">{bulkError}</Alert>}
              {bulkProcessing && (
                <Alert variant="info">
                  <Loader2 className="animate-spin" />
                  {t("movingProgress", {
                    current: bulkProgress.current,
                    total: bulkProgress.total,
                  })}
                </Alert>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeBulkModal}
                  disabled={bulkProcessing}
                >
                  {tc("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkMove}
                  disabled={!bulkTargetCenter || bulkProcessing}
                >
                  {bulkProcessing ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("movingProgress", {
                        current: bulkProgress.current,
                        total: bulkProgress.total,
                      })}
                    </>
                  ) : (
                    t("moveWorkers", { count: selectedIds.size })
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Añadir trabajador manualmente */}
      {addModal === "manual" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-worker-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-float"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2
                id="add-worker-title"
                className="text-lg font-semibold tracking-tight"
              >
                {t("modalAddWorker")}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => !manualSaving && setAddModal(null)}
                disabled={manualSaving}
                aria-label={t("close")}
                className="-mr-3 -mt-3"
              >
                <X />
              </Button>
            </div>

            <form onSubmit={handleManualCreate} className="space-y-5">
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">
                    {t("labelName")}{" "}
                    <span aria-hidden="true" className="text-alert-text">
                      *
                    </span>
                  </Label>
                  <Input
                    id="manual-name"
                    type="text"
                    required
                    value={manualForm.name}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-last-name">
                    {t("labelLastName")}{" "}
                    <span aria-hidden="true" className="text-alert-text">
                      *
                    </span>
                  </Label>
                  <Input
                    id="manual-last-name"
                    type="text"
                    required
                    value={manualForm.lastName}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-email">
                    {t("labelEmail")}{" "}
                    <span aria-hidden="true" className="text-alert-text">
                      *
                    </span>
                  </Label>
                  <Input
                    id="manual-email"
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-phone">{t("labelPhone")}</Label>
                  <Input
                    id="manual-phone"
                    type="tel"
                    value={manualForm.phone}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-dni">
                    {t("labelDni")}{" "}
                    <span aria-hidden="true" className="text-alert-text">
                      *
                    </span>
                  </Label>
                  <Input
                    id="manual-dni"
                    type="text"
                    required
                    value={manualForm.dni}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, dni: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-center">
                    {t("labelCenter")}{" "}
                    <span aria-hidden="true" className="text-alert-text">
                      *
                    </span>
                  </Label>
                  <NativeSelect
                    id="manual-center"
                    required
                    value={manualForm.centerId}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, centerId: e.target.value }))
                    }
                  >
                    <option value="">{t("selectOption")}</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-job">
                    {t("labelJob")}{" "}
                    <span aria-hidden="true" className="text-alert-text">
                      *
                    </span>
                  </Label>
                  <Input
                    id="manual-job"
                    type="text"
                    required
                    value={manualForm.job}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, job: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-contract">
                    {t("labelContractType")}{" "}
                    <span aria-hidden="true" className="text-alert-text">
                      *
                    </span>
                  </Label>
                  <NativeSelect
                    id="manual-contract"
                    required
                    value={manualForm.contractType}
                    onChange={(e) =>
                      setManualForm((f) => ({
                        ...f,
                        contractType: e.target.value,
                      }))
                    }
                  >
                    <option value="full_time">{t("contractFull")}</option>
                    <option value="part_time">{t("contractPart")}</option>
                    <option value="temporary">{t("contractTemp")}</option>
                    <option value="internship">{t("contractIntern")}</option>
                  </NativeSelect>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="manual-hour-week">
                    {t("labelHourWeek")}{" "}
                    <span aria-hidden="true" className="text-alert-text">
                      *
                    </span>
                  </Label>
                  <Input
                    id="manual-hour-week"
                    type="number"
                    required
                    min={1}
                    max={168}
                    value={manualForm.hourWeek}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, hourWeek: e.target.value }))
                    }
                    className="tabular-nums sm:w-32"
                  />
                </div>
              </div>

              {manualError && <Alert variant="error">{manualError}</Alert>}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => !manualSaving && setAddModal(null)}
                  disabled={manualSaving}
                >
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={manualSaving}>
                  {manualSaving && <Loader2 className="animate-spin" />}
                  {manualSaving ? t("creating") : t("createWorker")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Confirmar eliminación */}
      {bulkModal === "delete" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-title"
            aria-describedby="bulk-delete-description"
            className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-float"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2
                id="bulk-delete-title"
                className="text-lg font-semibold tracking-tight"
              >
                {t("modalDeleteWorkers")}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeBulkModal}
                disabled={bulkProcessing}
                aria-label={t("close")}
                className="-mr-3 -mt-3"
              >
                <X />
              </Button>
            </div>
            <div className="space-y-5">
              <p
                id="bulk-delete-description"
                className="text-sm text-muted-foreground"
              >
                {t.rich("deleteWorkersDescription", {
                  count: selectedIds.size,
                  strong: (chunks) => (
                    <strong className="font-semibold text-foreground tabular-nums">
                      {chunks}
                    </strong>
                  ),
                })}
              </p>
              {bulkError && <Alert variant="error">{bulkError}</Alert>}
              {bulkProcessing && (
                <Alert variant="info">
                  <Loader2 className="animate-spin" />
                  {t("deletingProgress", {
                    current: bulkProgress.current,
                    total: bulkProgress.total,
                  })}
                </Alert>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeBulkModal}
                  disabled={bulkProcessing}
                >
                  {tc("cancel")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("deletingProgress", {
                        current: bulkProgress.current,
                        total: bulkProgress.total,
                      })}
                    </>
                  ) : (
                    t("deleteWorkers", { count: selectedIds.size })
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal — Importar Excel */}
      {addModal === "excel" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-excel-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border bg-card p-6 shadow-float"
          >
            <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
              <h2
                id="import-excel-title"
                className="text-lg font-semibold tracking-tight"
              >
                {t("modalImportExcel")}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => !excelImporting && setAddModal(null)}
                disabled={excelImporting}
                aria-label={t("close")}
                className="-mr-3 -mt-3"
              >
                <X />
              </Button>
            </div>

            {excelRows.length === 0 ? (
              /* Step 1 — file picker */
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  {t("uploadInstruction")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                >
                  <Download />
                  {t("downloadTemplate")}
                </Button>
                <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong px-4 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background hover:border-foreground/30 hover:bg-accent">
                  <FileSpreadsheet
                    aria-hidden="true"
                    className="mb-3 size-10 text-muted-foreground"
                  />
                  <span className="text-sm font-medium">
                    {t("clickToSelect")}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    .xlsx · .xls · .csv
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleExcelFile(file);
                    }}
                  />
                </label>
              </div>
            ) : (
              /* Step 2 — preview + import */
              <>
                {/* Summary */}
                <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
                  <StatusBadge tone="live" size="sm" className="tabular-nums">
                    {t("validRows", {
                      count: excelRows.filter((r) => r.valid).length,
                    })}
                  </StatusBadge>
                  {excelRows.some((r) => !r.valid) && (
                    <StatusBadge
                      tone="alert"
                      size="sm"
                      className="tabular-nums"
                    >
                      {t("invalidRows", {
                        count: excelRows.filter((r) => !r.valid).length,
                      })}
                    </StatusBadge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setExcelRows([])}
                    disabled={excelImporting}
                    className="ml-auto"
                  >
                    {t("changeFile")}
                  </Button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto rounded-lg border text-xs">
                  <table className="w-full min-w-[640px]">
                    <thead className="sticky top-0 bg-secondary text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          {t("colName")}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t("colEmail")}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t("colDni")}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t("colCenter")}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t("colContract")}
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          {t("colHourWeek")}
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          {t("colStatus")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {excelRows.map((r, i) => (
                        <tr key={i} className={cn(!r.valid && "bg-alert-soft")}>
                          <td className="px-3 py-2 font-medium">
                            {r.name} {r.lastName}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {r.email}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {r.dni}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {r.centerName}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {contractLabels[r.contractType] ?? r.contractType}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                            {r.hourWeek}
                          </td>
                          <td className="px-3 py-2">
                            {r.valid ? (
                              <span className="inline-flex text-live-text">
                                <CheckCircle2
                                  aria-hidden="true"
                                  className="size-4"
                                />
                                <span className="sr-only">{t("rowValid")}</span>
                              </span>
                            ) : (
                              <span
                                className="font-medium text-alert-text"
                                title={r.errors.join(" · ")}
                              >
                                {r.errors[0]}
                                {r.errors.length > 1 &&
                                  ` (+${r.errors.length - 1})`}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {excelError && (
                  <Alert variant="error" className="mt-3 shrink-0">
                    {excelError}
                  </Alert>
                )}
                {excelImporting && (
                  <Alert variant="info" className="mt-3 shrink-0">
                    <Loader2 className="animate-spin" />
                    {t("importingProgress", {
                      current: excelProgress.current,
                      total: excelProgress.total,
                    })}
                  </Alert>
                )}

                <div className="mt-4 flex shrink-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => !excelImporting && setAddModal(null)}
                    disabled={excelImporting}
                  >
                    {tc("cancel")}
                  </Button>
                  {excelRows.some((r) => !r.valid) &&
                    excelRows.some((r) => r.valid) && (
                      <Button
                        type="button"
                        onClick={() => handleExcelImport(true)}
                        disabled={excelImporting}
                      >
                        {excelImporting
                          ? t("importing")
                          : t("importValidRows", {
                              count: excelRows.filter((r) => r.valid).length,
                            })}
                      </Button>
                    )}
                  {excelRows.every((r) => r.valid) && (
                    <Button
                      type="button"
                      onClick={() => handleExcelImport(false)}
                      disabled={excelImporting}
                    >
                      {excelImporting
                        ? t("importing")
                        : t("importAllRows", { count: excelRows.length })}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
