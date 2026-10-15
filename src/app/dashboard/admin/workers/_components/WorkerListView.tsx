"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Search,
  Eye,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  LogOut,
  Trash2,
  ArrowRightLeft,
  X,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  onChange,
  onClick,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const active = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      onClick={(e) => {
        onClick?.(e);
        onChange();
      }}
      className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all cursor-pointer ${
        active
          ? "bg-blue-600 border-blue-600"
          : "bg-white dark:bg-slate-700/80 border-slate-300 dark:border-slate-500 hover:border-slate-400 dark:hover:border-slate-400"
      }`}
    >
      {indeterminate && !checked ? (
        <span className="block w-2 h-px bg-white rounded-full" />
      ) : checked ? (
        <svg
          className="w-2.5 h-2.5 text-white"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden
        >
          <path
            d="M1.5 5l2.5 2.5 4.5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
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
      if (!name) errors.push("Nombre vacío");
      if (!lastName) errors.push("Apellidos vacíos");
      if (!email) errors.push("Email vacío");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.push("Email inválido");

      // Center is optional — empty means unassigned
      const matchedCenter = centerName
        ? centers.find((c) => c.name.toLowerCase() === centerName.toLowerCase())
        : undefined;
      if (centerName && !matchedCenter)
        errors.push(`Centro "${centerName}" no encontrado`);

      // DNI and job are only required when a center is assigned
      if (centerName) {
        if (!dni) errors.push("DNI vacío");
        if (!job) errors.push("Puesto vacío");
      }

      let contractType = "full_time";
      if (contractRaw) {
        const normalized = CONTRACT_MAP[contractRaw];
        if (!normalized) errors.push(`Tipo contrato "${contractRaw}" inválido`);
        else contractType = normalized;
      }

      let hourWeek = 40;
      if (hourWeekRaw) {
        const n = Number(hourWeekRaw);
        if (isNaN(n) || n < 1 || n > 168)
          errors.push("Horas/semana inválidas (1-168)");
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
        setExcelError(`Fila ${i + 1} (${r.email}): ${data.error ?? "Error"}`);
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
        <ChevronsUpDown className="w-3 h-3 opacity-40 group-hover:opacity-80 transition-opacity" />
      );
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-blue-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-400" />
    );
  };

  const SortableHead = ({
    label,
    column,
    className,
  }: {
    label: string;
    column: SortKey;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group select-none"
      >
        {label}
        <SortIcon column={column} />
      </button>
    </TableHead>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {workers.length} trabajador{workers.length !== 1 ? "es" : ""}{" "}
                registrado{workers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post" className="ml-auto">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{tc("signOut")}</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <InvitationCodePanel initialCodes={initialCodes} />
        <UnassignedWorkerPanel
          unassignedWorkers={unassignedWorkers}
          centers={centers}
        />

        {/* Add worker buttons */}
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              setManualForm(BLANK_MANUAL);
              setManualError("");
              setAddModal("manual");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t("addWorker")}
          </button>
          <button
            type="button"
            onClick={() => {
              setExcelRows([]);
              setExcelError("");
              setAddModal("excel");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t("importExcel")}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <select
            value={centerFilter}
            onChange={(e) => setCenterFilter(e.target.value)}
            className="sm:w-56 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 [&>option]:bg-white dark:[&>option]:bg-slate-800"
          >
            <option value="">{t("allCenters")}</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-blue-900/40 border border-blue-700/50 rounded-xl">
            <span className="text-sm font-medium text-blue-300">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setBulkError("");
                  setBulkTargetCenter("");
                  setBulkModal("move");
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t("changeCenter")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkError("");
                  setBulkModal("delete");
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t("delete")}</span>
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="flex items-center justify-center w-8 h-8 bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                title={t("clearSelection")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("noWorkersFound")}</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                {filtered.map((w) => (
                  <div
                    key={w.worker.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.has(w.worker.id)}
                      onChange={() => toggleSelect(w.worker.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Link
                      href={`/dashboard/admin/workers/${w.worker.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          {w.userName} {w.userLastName}
                        </span>
                        <Eye className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </div>
                      <div className="space-y-0.5 text-sm text-slate-500 dark:text-slate-400">
                        <p className="truncate">{w.userEmail}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{w.centerName}</span>
                          <span className="shrink-0">
                            {contractLabels[w.worker.contractType] ??
                              w.worker.contractType}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allFilteredSelected}
                          indeterminate={
                            someFilteredSelected && !allFilteredSelected
                          }
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
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort("hourWeek")}
                          className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group select-none ml-auto"
                        >
                          {t("colHourWeek")}
                          <SortIcon column="hourWeek" />
                        </button>
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((w) => (
                      <TableRow
                        key={w.worker.id}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(w.worker.id)}
                            onChange={() => toggleSelect(w.worker.id)}
                          />
                        </TableCell>
                        <TableCell className="text-slate-900 dark:text-white font-medium">
                          {w.userName} {w.userLastName}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {w.userEmail}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {w.worker.dni}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {w.centerName}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {contractLabels[w.worker.contractType] ??
                            w.worker.contractType}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 text-right">
                          {w.worker.hourWeek}h
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/admin/workers/${w.worker.id}`}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <p className="text-sm text-slate-500">
          Mostrando {filtered.length} de {workers.length} trabajador
          {workers.length !== 1 ? "es" : ""}
        </p>
      </main>

      {/* Modal — Cambiar centro */}
      {bulkModal === "move" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("changeCenter")}
              </h2>
              <button
                type="button"
                onClick={closeBulkModal}
                disabled={bulkProcessing}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {selectedIds.size} trabajador{selectedIds.size !== 1 ? "es" : ""}{" "}
              seleccionado{selectedIds.size !== 1 ? "s" : ""}
            </p>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
              {t("targetCenter")}
            </label>
            <select
              value={bulkTargetCenter}
              onChange={(e) => setBulkTargetCenter(e.target.value)}
              disabled={bulkProcessing}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 [&>option]:bg-white dark:[&>option]:bg-slate-700"
            >
              <option value="">{t("selectCenter")}</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {bulkError && (
              <p className="text-sm text-red-400 mb-3">{bulkError}</p>
            )}
            {bulkProcessing && (
              <p className="text-sm text-blue-400 mb-3">
                {t("movingProgress", {
                  current: bulkProgress.current,
                  total: bulkProgress.total,
                })}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeBulkModal}
                disabled={bulkProcessing}
                className="flex-1 px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                onClick={handleBulkMove}
                disabled={!bulkTargetCenter || bulkProcessing}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkProcessing
                  ? t("movingProgress", {
                      current: bulkProgress.current,
                      total: bulkProgress.total,
                    })
                  : `${t("changeCenter")} ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Añadir trabajador manualmente */}
      {addModal === "manual" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("modalAddWorker")}
              </h2>
              <button
                type="button"
                onClick={() => !manualSaving && setAddModal(null)}
                disabled={manualSaving}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelName")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.name}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelLastName")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.lastName}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelEmail")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelPhone")}
                  </label>
                  <input
                    type="tel"
                    value={manualForm.phone}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelDni")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.dni}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, dni: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelCenter")} <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={manualForm.centerId}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, centerId: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white dark:[&>option]:bg-slate-700"
                  >
                    <option value="">{t("selectOption")}</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelJob")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.job}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, job: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelContractType")}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={manualForm.contractType}
                    onChange={(e) =>
                      setManualForm((f) => ({
                        ...f,
                        contractType: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-white dark:[&>option]:bg-slate-700"
                  >
                    <option value="full_time">{t("contractFull")}</option>
                    <option value="part_time">{t("contractPart")}</option>
                    <option value="temporary">{t("contractTemp")}</option>
                    <option value="internship">{t("contractIntern")}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {t("labelHourWeek")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={168}
                    value={manualForm.hourWeek}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, hourWeek: e.target.value }))
                    }
                    className="w-full sm:w-32 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {manualError && (
                <p className="text-sm text-red-400">{manualError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !manualSaving && setAddModal(null)}
                  disabled={manualSaving}
                  className="flex-1 px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {tc("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualSaving ? t("creating") : t("createWorker")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Confirmar eliminación */}
      {bulkModal === "delete" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("modalDeleteWorkers")}
              </h2>
              <button
                type="button"
                onClick={closeBulkModal}
                disabled={bulkProcessing}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Se eliminarán{" "}
              <span className="text-slate-900 dark:text-white font-medium">
                {selectedIds.size}
              </span>{" "}
              trabajador{selectedIds.size !== 1 ? "es" : ""} junto con todos sus
              registros. Esta acción no se puede deshacer.
            </p>
            {bulkError && (
              <p className="text-sm text-red-400 mb-3">{bulkError}</p>
            )}
            {bulkProcessing && (
              <p className="text-sm text-red-400 mb-3">
                {t("deletingProgress", {
                  current: bulkProgress.current,
                  total: bulkProgress.total,
                })}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeBulkModal}
                disabled={bulkProcessing}
                className="flex-1 px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkProcessing}
                className="flex-1 px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {bulkProcessing ? "..." : `${t("delete")} ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal — Importar Excel */}
      {addModal === "excel" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("modalImportExcel")}
              </h2>
              <button
                type="button"
                onClick={() => !excelImporting && setAddModal(null)}
                disabled={excelImporting}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {excelRows.length === 0 ? (
              /* Step 1 — file picker */
              <div className="space-y-5">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t("uploadInstruction")}
                </p>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t("downloadTemplate")}
                </button>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-10 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {t("clickToSelect")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    .xlsx · .xls · .csv
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
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
                <div className="flex items-center gap-4 mb-4 shrink-0">
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    {excelRows.filter((r) => r.valid).length} válidas
                  </span>
                  {excelRows.some((r) => !r.valid) && (
                    <span className="flex items-center gap-1.5 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {excelRows.filter((r) => !r.valid).length} inválidas
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setExcelRows([])}
                    disabled={excelImporting}
                    className="ml-auto text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-40"
                  >
                    {t("changeFile")}
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-slate-100/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 sticky top-0">
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
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {excelRows.map((r, i) => (
                        <tr
                          key={i}
                          className={
                            r.valid ? "bg-emerald-900/20" : "bg-red-900/20"
                          }
                        >
                          <td className="px-3 py-2 text-slate-900 dark:text-white">
                            {r.name} {r.lastName}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {r.email}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {r.dni}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {r.centerName}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {contractLabels[r.contractType] ?? r.contractType}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-right">
                            {r.hourWeek}
                          </td>
                          <td className="px-3 py-2">
                            {r.valid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <span
                                className="text-red-400"
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
                  <p className="text-sm text-red-400 mt-3 shrink-0">
                    {excelError}
                  </p>
                )}
                {excelImporting && (
                  <p className="text-sm text-blue-400 mt-3 shrink-0">
                    {t("importingProgress", {
                      current: excelProgress.current,
                      total: excelProgress.total,
                    })}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => !excelImporting && setAddModal(null)}
                    disabled={excelImporting}
                    className="px-4 py-2 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {tc("cancel")}
                  </button>
                  {excelRows.some((r) => !r.valid) &&
                    excelRows.some((r) => r.valid) && (
                      <button
                        type="button"
                        onClick={() => handleExcelImport(true)}
                        disabled={excelImporting}
                        className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {excelImporting
                          ? t("importing")
                          : `${t("importing")} (${excelRows.filter((r) => r.valid).length})`}
                      </button>
                    )}
                  {excelRows.every((r) => r.valid) && (
                    <button
                      type="button"
                      onClick={() => handleExcelImport(false)}
                      disabled={excelImporting}
                      className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {excelImporting
                        ? t("importing")
                        : `${t("importing")} (${excelRows.length})`}
                    </button>
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
