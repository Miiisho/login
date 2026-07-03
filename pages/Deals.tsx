import React, { useState } from "react";
import { Crown, LayoutGrid, Medal, Plus, Table2, Target, Trophy } from "lucide-react";
import { useApp } from "../state/AppContext";
import { canOwnDeals } from "../lib/permissions";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { Ltr } from "../components/Ltr";
import { formatCurrency, formatDate } from "../lib/format";
import { companyInfo } from "../data/mockData";
import { usePersistedState } from "../lib/usePersistedState";
import type { Deal, DealPriority, DealStage } from "../types";

const COLUMNS: { key: DealStage; label: string }[] = [
  { key: "lead", label: "عميل محتمل" },
  { key: "contacted", label: "تم التواصل" },
  { key: "proposal", label: "عرض مقدم" },
  { key: "negotiation", label: "تفاوض" },
  { key: "won", label: "فوز" },
  { key: "lost", label: "خسارة" },
];

const SOURCE_OPTIONS = ["إحالة", "موقع إلكتروني", "سوشيال ميديا", "معرض", "تواصل بارد", "أخرى"];

const QUARTER_LABELS = ["الأول", "الثاني", "الثالث", "الرابع"];

export const Deals: React.FC = () => {
  const { deals, dealNotes, teamMembers, updateDealStage, addDeal, addDealNote, currentUser } =
    useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [openDeal, setOpenDeal] = useState<Deal | null>(null);
  const [inlineFor, setInlineFor] = useState<string | null>(null);
  const [inlineText, setInlineText] = useState("");
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [view, setView] = usePersistedState<"board" | "table">("deals-view", "board");

  const totalOpenValue = deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((sum, d) => sum + d.value, 0);

  const now = new Date();
  const year = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  // Scope selector: current quarter / last 2 quarters / last 3 quarters / full year
  type Scope = "q1" | "q2" | "q3" | "year";
  const [scope, setScope] = useState<Scope>("q1");
  const SCOPE_OPTIONS: { value: Scope; label: string; quarters: number }[] = [
    { value: "q1", label: `الربع الحالي (${QUARTER_LABELS[currentQuarter - 1]} ${year})`, quarters: 1 },
    { value: "q2", label: "آخر ربعين", quarters: 2 },
    { value: "q3", label: "آخر 3 أرباع", quarters: 3 },
    { value: "year", label: `هذا العام (${year})`, quarters: 4 },
  ];
  const scopeQuarters = SCOPE_OPTIONS.find((o) => o.value === scope)!.quarters;

  const scopeStart =
    scope === "year"
      ? new Date(year, 0, 1)
      : new Date(year, (currentQuarter - scopeQuarters) * 3, 1);
  const scopeEnd = scope === "year" ? new Date(year + 1, 0, 1) : new Date(year, currentQuarter * 3, 1);
  const inScope = (dateStr: string) => {
    const dt = new Date(dateStr);
    return dt >= scopeStart && dt < scopeEnd;
  };

  const annualTarget = companyInfo.annualSalesTarget;
  const wonThisYear = deals.filter((d) => {
    const dt = new Date(d.expectedCloseDate);
    return d.stage === "won" && dt.getFullYear() === year;
  });
  const yearRevenue = wonThisYear.reduce((sum, d) => sum + d.value, 0);
  const yearProgress = Math.min(100, Math.round((yearRevenue / annualTarget) * 100));

  const wonInScope = deals.filter((d) => d.stage === "won" && inScope(d.expectedCloseDate));
  const scopeRevenue = wonInScope.reduce((sum, d) => sum + d.value, 0);
  const scopeTarget = (annualTarget / 4) * scopeQuarters;
  const scopeProgress = Math.min(100, Math.round((scopeRevenue / scopeTarget) * 100));

  const closedInScope = deals.filter(
    (d) => (d.stage === "won" || d.stage === "lost") && inScope(d.expectedCloseDate),
  );
  const closingRate = closedInScope.length
    ? Math.round((wonInScope.length / closedInScope.length) * 100)
    : 0;

  const handleDrop = (stage: DealStage, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    const dealId = e.dataTransfer.getData("text/plain");
    updateDealStage(dealId, stage);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">الصفقات (المبيعات)</h1>
          <p className="text-sm text-gray-500">
            القيمة الإجمالية للصفقات المفتوحة: {formatCurrency(totalOpenValue)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                view === "board" ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid size={14} /> لوحة
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                view === "table" ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Table2 size={14} /> قاعدة بيانات
            </button>
          </div>
          {currentUser.role !== "team_member" && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
            >
              <Plus size={16} /> إضافة صفقة
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Target size={16} className="text-blue-500" /> أهداف المبيعات
          </h2>
          <select
            className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
          >
            {SCOPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">هدف العام {year}</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(annualTarget)}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gray-500"
                style={{ width: `${yearProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              محقق {formatCurrency(yearRevenue)} ({yearProgress}%)
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-blue-600">
              هدف الفترة والمحقق منه —{" "}
              {SCOPE_OPTIONS.find((o) => o.value === scope)?.label}
            </p>
            <p className="mt-1 text-sm font-bold text-blue-900">
              {formatCurrency(scopeRevenue)}{" "}
              <span className="text-xs font-normal text-blue-500">
                من {formatCurrency(scopeTarget)}
              </span>
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${scopeProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-semibold text-blue-700">{scopeProgress}% من هدف الفترة</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600">نسبة الإغلاق لهذه الفترة</p>
            <p className="text-lg font-bold text-emerald-700">
              {closingRate}%{" "}
              <span className="text-xs font-normal text-emerald-500">
                ({wonInScope.length} فوز من {closedInScope.length} مغلقة)
              </span>
            </p>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">العميل المحتمل</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">جهة الاتصال</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">المسؤول</th>
                <th className="px-4 py-3 font-medium">المرحلة</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">الأولوية</th>
                <th className="px-4 py-3 font-medium">القيمة</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">الاحتمالية</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">الإغلاق المتوقع</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => {
                const owner = teamMembers.find((m) => m.id === d.ownerId);
                return (
                  <tr
                    key={d.id}
                    onClick={() => setOpenDeal(d)}
                    className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/40"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">{d.prospectName}</td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{d.contactName}</td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{owner?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.stage} />
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <StatusBadge status={d.priority} />
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-600">
                      {formatCurrency(d.value)}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{d.winProbability}%</td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                      {formatDate(d.expectedCloseDate)}
                    </td>
                  </tr>
                );
              })}
              {deals.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    لا توجد صفقات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col) => {
          const items = deals.filter((d) => d.stage === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.key);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(col.key, e)}
              className={`kanban-column min-h-[180px] rounded-2xl border border-gray-200 bg-white p-3 shadow-sm ${
                dragOverCol === col.key ? "drag-over" : ""
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-gray-700">{col.label}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((d) => {
                  const owner = teamMembers.find((m) => m.id === d.ownerId);
                  const latestNote = dealNotes
                    .filter((n) => n.dealId === d.id)
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                  return (
                    <div
                      key={d.id}
                      draggable={inlineFor !== d.id}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", d.id)}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm"
                    >
                      <div
                        onClick={() => setOpenDeal(d)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-semibold text-gray-800">{d.prospectName}</p>
                          <StatusBadge status={d.priority} className="shrink-0 text-[10px]" />
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-400">{d.contactName}</p>
                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          {formatCurrency(d.value)}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                          <span>{owner?.name}</span>
                          <span>{formatDate(d.expectedCloseDate)}</span>
                        </div>
                        {latestNote && (
                          <p className="mt-1.5 truncate rounded bg-white px-2 py-1 text-[11px] text-gray-500">
                            آخر تحديث: {latestNote.text}
                          </p>
                        )}
                      </div>
                      {inlineFor === d.id ? (
                        <form
                          className="mt-2 flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (inlineText.trim()) addDealNote(d.id, inlineText.trim());
                            setInlineText("");
                            setInlineFor(null);
                          }}
                        >
                          <input
                            autoFocus
                            className="w-full rounded border border-gray-300 px-2 py-1 text-[11px] outline-none focus:border-blue-500"
                            placeholder="اكتب تحديثًا سريعًا..."
                            value={inlineText}
                            onChange={(e) => setInlineText(e.target.value)}
                          />
                          <button
                            type="submit"
                            className="rounded bg-blue-500 px-2 text-[11px] font-semibold text-white hover:bg-blue-600"
                          >
                            حفظ
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineFor(d.id);
                            setInlineText("");
                          }}
                          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:underline"
                        >
                          <Plus size={11} /> إضافة تحديث
                        </button>
                      )}
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="py-6 text-center text-xs text-gray-300">لا توجد صفقات</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
      {view === "board" && (
        <p className="text-center text-xs text-gray-400">اسحب البطاقة إلى عمود آخر لتحديث مرحلة الصفقة، أو اضغط عليها لعرض التفاصيل</p>
      )}

      <SalesLeaderboard />

      {showAdd && (
        <Modal title="إضافة صفقة جديدة" onClose={() => setShowAdd(false)} wide>
          <AddDealForm
            onSave={(deal) => {
              addDeal(deal);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {openDeal && (
        <Modal title={openDeal.prospectName} onClose={() => setOpenDeal(null)} wide>
          <DealDetail deal={openDeal} onClose={() => setOpenDeal(null)} />
        </Modal>
      )}
    </div>
  );
};

const RANK_STYLES = [
  { ring: "ring-2 ring-amber-300", badge: "bg-amber-400 text-white", label: "المتصدّر" },
  { ring: "ring-1 ring-gray-300", badge: "bg-gray-300 text-gray-700", label: "الثاني" },
  { ring: "ring-1 ring-orange-300", badge: "bg-orange-300 text-orange-900", label: "الثالث" },
];

const SalesLeaderboard: React.FC = () => {
  const { deals, teamMembers } = useApp();

  const salesStaff = teamMembers.filter((m) => canOwnDeals(m));
  const personalTarget = companyInfo.annualSalesTarget / Math.max(1, salesStaff.length);

  const board = salesStaff
    .map((m) => {
      const won = deals.filter((d) => d.ownerId === m.id && d.stage === "won");
      const achieved = won.reduce((s, d) => s + d.value, 0);
      const openCount = deals.filter(
        (d) => d.ownerId === m.id && d.stage !== "won" && d.stage !== "lost",
      ).length;
      return {
        member: m,
        achieved,
        wonCount: won.length,
        openCount,
        progress: Math.min(100, Math.round((achieved / personalTarget) * 100)),
      };
    })
    .sort((a, b) => b.achieved - a.achieved);

  const leader = board[0];

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-blue-50/60 to-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" />
        <h2 className="text-base font-extrabold text-gray-900">لوحة موظفي المبيعات</h2>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        هدف كل موظف: {formatCurrency(personalTarget)} — الأقرب للهدف يتصدّر القائمة 🏆
      </p>

      {leader && leader.achieved > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
          <Crown size={22} className="shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {leader.member.name} هو الأقرب للهدف الآن!
            </p>
            <p className="text-xs text-amber-600">
              حقّق {formatCurrency(leader.achieved)} ({leader.progress}% من هدفه)
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {board.map((row, i) => {
          const style = RANK_STYLES[i];
          return (
            <div
              key={row.member.id}
              className={`flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ${
                style?.ring ?? "ring-1 ring-gray-100"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                  style?.badge ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {i < 3 ? <Medal size={16} /> : i + 1}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {row.member.avatar || row.member.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-gray-800">{row.member.name}</p>
                  <span className="shrink-0 text-xs font-semibold text-emerald-600">
                    {formatCurrency(row.achieved)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        i === 0 ? "bg-amber-400" : "bg-blue-500"
                      }`}
                      style={{ width: `${row.progress}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-left text-[11px] font-semibold text-gray-500">
                    {row.progress}%
                  </span>
                </div>
                <div className="mt-1 flex gap-3 text-[11px] text-gray-400">
                  <span>🏅 {row.wonCount} صفقة مغلقة</span>
                  <span>🔥 {row.openCount} صفقة مفتوحة</span>
                </div>
              </div>
            </div>
          );
        })}
        {board.length === 0 && (
          <p className="text-sm text-gray-400">لا يوجد موظفو مبيعات.</p>
        )}
      </div>
    </div>
  );
};

const DealDetail: React.FC<{ deal: Deal; onClose: () => void }> = ({ deal, onClose }) => {
  const { teamMembers, updateDeal } = useApp();
  const owner = teamMembers.find((m) => m.id === deal.ownerId);
  const [closeReason, setCloseReason] = useState(deal.closeReason);
  const closeReasonLabel =
    deal.stage === "won" ? "سبب الفوز بالصفقة" : deal.stage === "lost" ? "سبب الخسارة" : "ملاحظة الإغلاق (اختياري)";

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <StatusBadge status={deal.priority} />
        <StatusBadge status={deal.stage} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">جهة الاتصال</p>
          <p className="text-sm font-bold text-gray-900">{deal.contactName}</p>
          <p className="mt-1 text-xs text-gray-500">
            <Ltr>{deal.contactPhone}</Ltr>
          </p>
          <p className="text-xs text-gray-500">{deal.contactEmail}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">المسؤول عن الصفقة</p>
          <p className="text-sm font-bold text-gray-900">{owner?.name ?? "—"}</p>
          <p className="mt-1 text-xs text-gray-500">مصدر العميل: {deal.source}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">نوع الخدمة المطلوبة</p>
          <p className="text-sm font-bold text-gray-900">{deal.serviceType}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">القيمة المتوقعة</p>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(deal.value)}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs text-blue-600">نسبة احتمالية الإغلاق</p>
          <p className="text-sm font-bold text-blue-700">{deal.winProbability}%</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">آخر تواصل</p>
          <p className="text-sm font-bold text-gray-900">{formatDate(deal.lastContactDate)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">تاريخ الإنشاء</p>
          <p className="text-sm font-bold text-gray-900">{formatDate(deal.createdDate)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-500">تاريخ الإغلاق المتوقع</p>
          <p className="text-sm font-bold text-gray-900">{formatDate(deal.expectedCloseDate)}</p>
        </div>
      </div>

      {deal.notes && (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          "{deal.notes}"
        </div>
      )}

      {(deal.stage === "won" || deal.stage === "lost") && (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateDeal(deal.id, { closeReason });
            onClose();
          }}
        >
          <FormField label={closeReasonLabel}>
            <textarea
              className={inputClass}
              rows={2}
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              حفظ
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const AddDealForm: React.FC<{
  onSave: (deal: Omit<Deal, "id">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { clients, teamMembers, currentUser } = useApp();
  const ownerOptions = teamMembers.filter((m) => canOwnDeals(m));
  const [form, setForm] = useState({
    prospectName: "",
    clientId: "" as string,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    source: SOURCE_OPTIONS[0],
    ownerId: currentUser.id,
    serviceType: "",
    winProbability: 20,
    priority: "medium" as DealPriority,
    value: 0,
    createdDate: new Date().toISOString().slice(0, 10),
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    lastContactDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...form, clientId: form.clientId || null, stage: "lead", closeReason: "" });
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <FormField label="اسم العميل المحتمل / الشركة">
        <input
          required
          className={inputClass}
          value={form.prospectName}
          onChange={(e) => setForm({ ...form, prospectName: e.target.value })}
        />
      </FormField>
      <FormField label="ربط بعميل حالي (اختياري)">
        <select
          className={inputClass}
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        >
          <option value="">بدون ربط</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="اسم جهة الاتصال">
        <input
          required
          className={inputClass}
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
        />
      </FormField>
      <FormField label="رقم الجوال">
        <input
          required
          className={inputClass}
          value={form.contactPhone}
          onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
        />
      </FormField>
      <FormField label="البريد الإلكتروني">
        <input
          type="email"
          className={inputClass}
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
        />
      </FormField>
      <FormField label="مصدر العميل المحتمل">
        <select
          className={inputClass}
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
        >
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="المسؤول عن الصفقة">
        <select
          className={inputClass}
          value={form.ownerId}
          onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
        >
          {ownerOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="نوع الخدمة المطلوبة">
        <input
          required
          className={inputClass}
          value={form.serviceType}
          onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
          placeholder="مثال: هوية بصرية، حملة تسويقية..."
        />
      </FormField>
      <FormField label="القيمة المتوقعة (ر.س)">
        <input
          type="number"
          required
          className={inputClass}
          value={form.value}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
        />
      </FormField>
      <FormField label="نسبة احتمالية الإغلاق (%)">
        <input
          type="number"
          min={0}
          max={100}
          className={inputClass}
          value={form.winProbability}
          onChange={(e) => setForm({ ...form, winProbability: Number(e.target.value) })}
        />
      </FormField>
      <FormField label="الأولوية">
        <select
          className={inputClass}
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as DealPriority })}
        >
          <option value="high">عالية</option>
          <option value="medium">متوسطة</option>
          <option value="low">منخفضة</option>
        </select>
      </FormField>
      <FormField label="تاريخ الإنشاء">
        <input
          type="date"
          className={inputClass}
          value={form.createdDate}
          onChange={(e) => setForm({ ...form, createdDate: e.target.value })}
        />
      </FormField>
      <FormField label="تاريخ الإغلاق المتوقع">
        <input
          type="date"
          className={inputClass}
          value={form.expectedCloseDate}
          onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
        />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="ملاحظات">
          <textarea
            className={inputClass}
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          حفظ الصفقة
        </button>
      </div>
    </form>
  );
};
