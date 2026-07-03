import React, { useState } from "react";
import { LayoutGrid, Plus, Star, Table2, Trophy } from "lucide-react";
import { useApp } from "../state/AppContext";
import { Modal } from "../components/Modal";
import { usePersistedState } from "../lib/usePersistedState";
import {
  AddCardForm,
  PerformanceCard,
  perfMetrics,
  defaultCardType,
  CARD_TYPE_LABELS,
  type CardType,
} from "./Employees";

type PerfCard = { id: string; memberId: string; type: CardType };
type ViewMode = "cards" | "table" | "leaderboard";

/** بطاقات الأداء — ثلاثة أساليب عرض: بطاقات، قاعدة بيانات، ولوحة الترتيب (منافسة) */
export const EmployeesPerformance: React.FC = () => {
  const { teamMembers, deals, projects, tasks } = useApp();
  const [cards, setCards] = useState<PerfCard[]>(() =>
    teamMembers.slice(0, 4).map((m, i) => ({
      id: `pc-${i}`,
      memberId: m.id,
      type: defaultCardType(m),
    })),
  );
  const [showAddCard, setShowAddCard] = useState(false);
  const [view, setView] = usePersistedState<ViewMode>("perf-view", "cards");

  const ctx = { deals, projects, tasks, teamMembers };
  const rows = cards
    .map((card) => {
      const member = teamMembers.find((m) => m.id === card.memberId);
      if (!member) return null;
      return { card, member, metrics: perfMetrics(member, card.type, ctx) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const ranked = [...rows].sort((a, b) => b.metrics.score - a.metrics.score);

  const VIEWS: { key: ViewMode; label: string; icon: React.ElementType }[] = [
    { key: "cards", label: "بطاقات", icon: LayoutGrid },
    { key: "table", label: "قاعدة بيانات", icon: Table2 },
    { key: "leaderboard", label: "لوحة الترتيب", icon: Trophy },
  ];

  const scoreCls = (s: number) =>
    s >= 100 ? "text-emerald-600" : s >= 60 ? "text-blue-600" : "text-amber-600";
  const barCls = (s: number) =>
    s >= 100 ? "bg-emerald-500" : s >= 60 ? "bg-blue-500" : "bg-amber-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            <Star className="text-amber-400" size={24} /> بطاقات الأداء
          </h1>
          <p className="text-sm text-gray-500">
            تُحسب لحظيًا من إنجاز المهام والصفقات والمشاريع — ليست إدخالًا يدويًا
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                  view === v.key ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <v.icon size={14} /> {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddCard(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
          >
            <Plus size={16} /> إضافة بطاقة
          </button>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-gray-400">لا توجد بطاقات — أضف بطاقة أداء لأي موظف من الزر أعلاه.</p>
      )}

      {/* عرض البطاقات */}
      {view === "cards" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ card, member }) => (
            <PerformanceCard
              key={card.id}
              member={member}
              type={card.type}
              onRemove={() => setCards((prev) => prev.filter((c) => c.id !== card.id))}
            />
          ))}
        </div>
      )}

      {/* عرض قاعدة البيانات (جدول) */}
      {view === "table" && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">الموظف</th>
                <th className="px-4 py-3 font-medium">نوع البطاقة</th>
                <th className="px-4 py-3 font-medium">المؤشر</th>
                <th className="px-4 py-3 font-medium">النتيجة</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ card, member, metrics }) => (
                <tr key={card.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {member.avatar}
                      </span>
                      <span className="font-semibold text-gray-800">{member.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{CARD_TYPE_LABELS[card.type]}</td>
                  <td className="px-4 py-3 text-gray-500">{metrics.headline}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${barCls(metrics.score)}`}
                          style={{ width: `${metrics.score}%` }}
                        />
                      </div>
                      <span className={`text-sm font-extrabold ${scoreCls(metrics.score)}`}>
                        {metrics.score}%
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="flex flex-wrap gap-1">
                      {metrics.details.map((d) => (
                        <span
                          key={d.label}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                        >
                          {d.label}: <b>{d.value}</b>
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* لوحة الترتيب (أفضل ممارسة): ترتيب تنافسي بالنتيجة */}
      {view === "leaderboard" && rows.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs text-gray-400">
            ترتيب تنافسي محسوب لحظيًا — المتصدّر هو الأعلى إنجازًا لهدفه. يُحسم الفائز بعد استمرار المنافسة 3 أشهر.
          </p>
          <div className="space-y-2.5">
            {ranked.map((r, i) => {
              const medal = ["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`;
              return (
                <div
                  key={r.card.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    i === 0 ? "border-amber-200 bg-amber-50/50" : "border-gray-100"
                  }`}
                >
                  <span className="w-8 shrink-0 text-center text-lg font-extrabold">{medal}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {r.member.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-bold text-gray-800">{r.member.name}</p>
                      <span className={`text-sm font-extrabold ${scoreCls(r.metrics.score)}`}>
                        {r.metrics.score}%
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {CARD_TYPE_LABELS[r.card.type]} · {r.metrics.headline}
                    </p>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${barCls(r.metrics.score)}`}
                        style={{ width: `${r.metrics.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAddCard && (
        <Modal title="إضافة بطاقة أداء" onClose={() => setShowAddCard(false)}>
          <AddCardForm
            onSave={(memberId, type) => {
              setCards((prev) => [...prev, { id: `pc-${Date.now()}`, memberId, type }]);
              setShowAddCard(false);
            }}
            onClose={() => setShowAddCard(false)}
          />
        </Modal>
      )}
    </div>
  );
};
