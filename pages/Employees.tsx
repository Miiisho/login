import React, { useState } from "react";
import {
  Briefcase,
  FileText,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserCog,
  Wrench,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency, formatDate, daysLeft } from "../lib/format";
import { companyInfo } from "../data/mockData";
import { PERMISSION_LABELS, canOwnDeals } from "../lib/permissions";
import { Ltr } from "../components/Ltr";
import type { Deal, Project, ProjectTask, TeamMember } from "../types";
import { canOwnDeals as _canOwnDeals } from "../lib/permissions";

/** سياق البيانات اللازمة لحساب مؤشرات الأداء لحظيًا */
export type PerfCtx = {
  deals: Deal[];
  projects: Project[];
  tasks: ProjectTask[];
  teamMembers: TeamMember[];
};

/** مصدر واحد لمؤشرات الأداء يستخدمه كل أساليب العرض (بطاقات/جدول/ترتيب) */
export function perfMetrics(
  member: TeamMember,
  type: CardType,
  ctx: PerfCtx,
): { score: number; headline: string; details: { label: string; value: string }[] } {
  const { deals, projects, tasks, teamMembers } = ctx;
  if (type === "sales") {
    const salesStaff = teamMembers.filter((m) => _canOwnDeals(m));
    const quarterTarget = companyInfo.annualSalesTarget / 4 / Math.max(1, salesStaff.length);
    const myDeals = deals.filter((d) => d.ownerId === member.id);
    const won = myDeals.filter((d) => d.stage === "won");
    const achieved = won.reduce((s, d) => s + d.value, 0);
    const now = Date.now();
    const within7 = (dt: string) => dt && (now - new Date(dt).getTime()) / 86400000 <= 7;
    const newClients = myDeals.filter((d) => within7(d.createdDate)).length;
    const followups = myDeals.filter((d) => within7(d.lastContactDate)).length;
    const meetings = myDeals.filter(
      (d) => within7(d.lastContactDate) && ["contacted", "proposal", "negotiation"].includes(d.stage),
    ).length;
    const closings = won.filter((d) => within7(d.lastContactDate)).length;
    const score = Math.min(100, Math.round((achieved / quarterTarget) * 100));
    return {
      score,
      headline: "الأداء الفعلي (كل 3 أشهر)",
      details: [
        { label: "عملاء جدد/أسبوع", value: String(newClients) },
        { label: "متابعات/أسبوع", value: String(followups) },
        { label: "اجتماعات/أسبوع", value: String(meetings) },
        { label: "إغلاقات/أسبوع", value: String(closings) },
      ],
    };
  }
  if (type === "pm") {
    const myProjects = projects.filter((p) => p.assignedTo === member.id);
    const completed = myProjects.filter((p) => ["delivered", "invoiced", "closed"].includes(p.status));
    const completionRate = myProjects.length
      ? Math.round((completed.length / myProjects.length) * 100)
      : 0;
    const clientIds = [...new Set(myProjects.map((p) => p.clientId))];
    const returning = clientIds.filter(
      (cid) => projects.filter((p) => p.clientId === cid).length > 1,
    ).length;
    const returnRate = clientIds.length ? Math.round((returning / clientIds.length) * 100) : 0;
    return {
      score: completionRate,
      headline: "نسبة الإنجاز",
      details: [
        { label: "مشاريع مسندة", value: String(myProjects.length) },
        { label: "مكتملة", value: String(completed.length) },
        { label: "عودة العملاء", value: `${returnRate}%` },
        { label: "رضا العملاء", value: "4.6★" },
      ],
    };
  }
  const myTasks = tasks.filter((t) => t.assignedTo === member.id);
  const done = myTasks.filter((t) => t.status === "completed");
  const today = new Date().toISOString().slice(0, 10);
  const revisionRounds = myTasks.reduce((s, t) => s + (t.revisionRounds ?? 0), 0);
  const qualityScore = Math.max(1, 5 - revisionRounds * 0.4).toFixed(1);
  const before = done.filter((t) => t.dueDate > today).length;
  const onTime = done.filter((t) => t.dueDate === today).length;
  const late = done.filter((t) => t.dueDate < today || t.delayReason).length;
  const productivity = myTasks.length ? Math.round((done.length / myTasks.length) * 100) : 0;
  return {
    score: productivity,
    headline: "الإنتاجية",
    details: [
      { label: "جودة المخرجات", value: `${qualityScore}★` },
      { label: "قبل الموعد", value: String(before) },
      { label: "في الموعد", value: String(onTime) },
      { label: "بعد الموعد", value: String(late) },
    ],
  };
}

export type CardType = "sales" | "pm" | "tech";

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  sales: "أداء مبيعات",
  pm: "أداء مدير مشاريع",
  tech: "أداء موظف فني",
};

export const defaultCardType = (m: TeamMember): CardType =>
  m.templateId === "pt-pm"
    ? "pm"
    : m.templateId === "pt-sales"
      ? "sales"
      : m.role === "owner" || m.role === "admin"
        ? "sales"
        : "tech";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "دوام كامل",
  part_time: "دوام جزئي",
  hourly: "دوام بالساعة",
  remote: "دوام عن بعد",
};

export const Employees: React.FC = () => {
  const { teamMembers, updateTeamMember } = useApp();
  const [fileFor, setFileFor] = useState<TeamMember | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <UserCog className="text-blue-500" size={24} /> إدارة الموظفين
        </h1>
        <p className="text-sm text-gray-500">قاعدة بيانات الموظفين — ملف كامل لكل موظف</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-base font-bold text-gray-900">قاعدة بيانات الموظفين</h2>
        <p className="mb-4 text-xs text-gray-400">اضغط على أي موظف لفتح ملفه الكامل (بيانات شخصية + أوراق رسمية + مهام إدارية مقترحة)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">الموظف</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">المسمى الوظيفي</th>
                <th className="px-4 py-3 font-medium">الدور</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">الصلاحيات</th>
                <th className="px-4 py-3 font-medium">نوع التوظيف</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setFileFor(m)}
                  className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/40"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {m.avatar}
                      </span>
                      <span className="font-semibold text-gray-800">{m.name}</span>
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                    {m.jobTitle ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.role} />
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="flex flex-wrap gap-1">
                      {m.permissions.slice(0, 3).map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                        >
                          {PERMISSION_LABELS[p]}
                        </span>
                      ))}
                      {m.permissions.length > 3 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">
                          +{m.permissions.length - 3}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none focus:border-blue-500"
                      value={m.employmentType ?? "full_time"}
                      onChange={(e) =>
                        updateTeamMember(m.id, {
                          employmentType: e.target.value as import("../types").EmploymentType,
                        })
                      }
                    >
                      {Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {fileFor && (
        <Modal title={`ملف الموظف — ${fileFor.name}`} onClose={() => setFileFor(null)} wide>
          <EmployeeFileView member={fileFor} onClose={() => setFileFor(null)} />
        </Modal>
      )}
    </div>
  );
};

/** ملف الموظف: بيانات شخصية + أوراق رسمية + مهام إدارية مولدة تلقائيًا (AI) من تواريخ الانتهاء */
const EmployeeFileView: React.FC<{ member: TeamMember; onClose: () => void }> = ({
  member,
  onClose,
}) => {
  const { addTask, teamMembers } = useApp();
  const [addedTasks, setAddedTasks] = useState<string[]>([]);
  const file = member.employeeFile;
  const admin = teamMembers.find((m) => m.role === "admin") ?? teamMembers[0];

  const docState = (expiry: string) => {
    const d = daysLeft(expiry);
    if (d < 0) return { label: "منتهي", cls: "bg-red-100 text-red-700" };
    if (d <= 90) return { label: `ينتهي خلال ${d} يوم`, cls: "bg-amber-100 text-amber-700" };
    return { label: "ساري", cls: "bg-emerald-100 text-emerald-700" };
  };

  // AI: يترجم تواريخ الانتهاء إلى مهام إدارية (تجديد عقد / إنهاء / تجديد أوراق)
  type Suggestion = { key: string; title: string; dueDate: string };
  const suggestions: Suggestion[] = [];
  if (file) {
    const contractDays = daysLeft(file.contractEnd);
    if (contractDays <= 90)
      suggestions.push({
        key: "contract",
        title:
          contractDays < 0
            ? `عقد الموظف ${member.name} منتهٍ — قرار تجديد أو إنهاء فوري`
            : `تجديد أو إنهاء عقد الموظف ${member.name} (ينتهي خلال ${contractDays} يوم)`,
        dueDate: file.contractEnd,
      });
    file.docs.forEach((doc) => {
      const d = daysLeft(doc.expiryDate);
      if (d <= 90 && doc.name !== "عقد العمل")
        suggestions.push({
          key: `doc-${doc.number}`,
          title: `تجديد ${doc.name} للموظف ${member.name}`,
          dueDate: doc.expiryDate,
        });
    });
  }

  const convertToTask = (s: Suggestion) => {
    addTask({
      projectId: null,
      phaseId: "",
      category: "إدارية",
      title: s.title,
      description: `مهمة إدارية مولدة تلقائيًا من ملف الموظف ${member.name}`,
      status: "pending",
      priority: "high",
      assignedTo: admin.id,
      dueDate: s.dueDate,
      progress: 0,
    });
    setAddedTasks((prev) => [...prev, s.key]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
          {member.avatar}
        </span>
        <div>
          <p className="font-bold text-gray-900">{member.name}</p>
          <p className="text-xs text-gray-400">
            {member.jobTitle ?? "—"} · <StatusBadge status={member.role} className="text-[10px]" />
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-gray-800">البيانات الشخصية</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["البريد الإلكتروني", member.email],
            ["الجوال", member.phone],
            ["رقم الهوية", file?.nationalId ?? "—"],
            ["الجنسية", file?.nationality ?? "—"],
            ["تاريخ الميلاد", file ? formatDate(file.birthDate) : "—"],
            ["العنوان", file?.address ?? "—"],
            ["بداية العقد", file ? formatDate(file.contractStart) : "—"],
            ["نهاية العقد", file ? formatDate(file.contractEnd) : "—"],
            ["الراتب", file && file.salary > 0 ? formatCurrency(file.salary) : "—"],
            ["نوع التوظيف", EMPLOYMENT_LABELS[member.employmentType ?? "full_time"]],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg bg-gray-50 p-3">
              <p className="text-[11px] text-gray-400">{label}</p>
              <p className="text-sm font-semibold text-gray-800">
                {String(value).startsWith("+") ? <Ltr>{value}</Ltr> : value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-800">
          <FileText size={15} className="text-blue-500" /> الأوراق الرسمية
        </p>
        {file && file.docs.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">المستند</th>
                  <th className="px-3 py-2 font-medium">الرقم</th>
                  <th className="px-3 py-2 font-medium">تاريخ الانتهاء</th>
                  <th className="px-3 py-2 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {file.docs.map((doc) => {
                  const st = docState(doc.expiryDate);
                  return (
                    <tr key={doc.number} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-800">{doc.name}</td>
                      <td className="px-3 py-2 text-gray-500">{doc.number}</td>
                      <td className="px-3 py-2 text-gray-500">{formatDate(doc.expiryDate)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">لا توجد أوراق مسجّلة لهذا الموظف بعد.</p>
        )}
      </div>

      <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
        <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-violet-800">
          <Sparkles size={15} /> مهام إدارية مقترحة (مولدة تلقائيًا)
        </p>
        <p className="mb-3 text-[11px] text-violet-500">
          يترجم النظام تواريخ العقد والأوراق إلى مهام تجديد أو إنهاء تُسند للمسؤول الإداري
        </p>
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div
              key={s.key}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm shadow-sm"
            >
              <div>
                <p className="font-medium text-gray-800">{s.title}</p>
                <p className="text-[11px] text-gray-400">استحقاق: {formatDate(s.dueDate)}</p>
              </div>
              {addedTasks.includes(s.key) ? (
                <span className="text-xs font-semibold text-emerald-600">✓ أُضيفت كمهمة</span>
              ) : (
                <button
                  onClick={() => convertToTask(s)}
                  className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-600"
                >
                  تحويل لمهمة
                </button>
              )}
            </div>
          ))}
          {suggestions.length === 0 && (
            <p className="text-xs text-gray-400">
              ✓ لا توجد مهام مقترحة — كل أوراق وعقد الموظف سارية لفترة كافية.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

export const PerformanceCard: React.FC<{
  member: TeamMember;
  type: CardType;
  onRemove: () => void;
}> = ({ member, type, onRemove }) => {
  const { deals, projects, tasks, teamMembers } = useApp();

  const header = (
    <div className="mb-3 flex items-start justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {member.avatar}
        </span>
        <div>
          <p className="text-sm font-bold text-gray-900">{member.name}</p>
          <p className="text-[11px] text-gray-400">{CARD_TYPE_LABELS[type]}</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  if (type === "sales") {
    const salesStaff = teamMembers.filter((m) => canOwnDeals(m));
    const quarterTarget = companyInfo.annualSalesTarget / 4 / Math.max(1, salesStaff.length);
    const myDeals = deals.filter((d) => d.ownerId === member.id);
    const won = myDeals.filter((d) => d.stage === "won");
    const achieved = won.reduce((s, d) => s + d.value, 0);
    // النشاط الأسبوعي (مقاييس المتابعة): عملاء جدد، متابعات، اجتماعات، إغلاقات
    const now = Date.now();
    const within7 = (dt: string) => dt && (now - new Date(dt).getTime()) / 86400000 <= 7;
    const newClients = myDeals.filter((d) => within7(d.createdDate)).length;
    const followups = myDeals.filter((d) => within7(d.lastContactDate)).length;
    const meetings = myDeals.filter(
      (d) => within7(d.lastContactDate) && ["contacted", "proposal", "negotiation"].includes(d.stage),
    ).length;
    const closings = won.filter((d) => within7(d.lastContactDate)).length;
    // الأداء الفعلي يُحتسب كل 3 أشهر (ربع): تحقيق الهدف مع استمرارية المنافسة
    const quarterPerf = Math.min(100, Math.round((achieved / quarterTarget) * 100));
    const isWinner = quarterPerf >= 100;

    const Mini: React.FC<{ label: string; value: number; cls: string }> = ({ label, value, cls }) => (
      <div className={`rounded-lg p-2 text-center ${cls}`}>
        <p className="text-lg font-extrabold">{value}</p>
        <p className="text-[10px]">{label}</p>
      </div>
    );

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {header}
        <p className="mb-1 text-[11px] font-semibold text-gray-500">النشاط الأسبوعي</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <Mini label="عملاء جدد" value={newClients} cls="bg-blue-50 text-blue-700" />
          <Mini label="متابعات" value={followups} cls="bg-indigo-50 text-indigo-700" />
          <Mini label="اجتماعات" value={meetings} cls="bg-violet-50 text-violet-700" />
          <Mini label="إغلاقات" value={closings} cls="bg-emerald-50 text-emerald-700" />
        </div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
          <Target size={13} /> الأداء الفعلي (كل 3 أشهر)
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full ${isWinner ? "bg-emerald-500" : "bg-blue-500"}`}
            style={{ width: `${quarterPerf}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-lg font-extrabold ${isWinner ? "text-emerald-600" : "text-blue-600"}`}>
            {quarterPerf}%
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isWinner ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isWinner ? "🏆 حقّق الهدف" : "المنافسة مستمرة"}
          </span>
        </div>
      </div>
    );
  }

  if (type === "pm") {
    const myProjects = projects.filter((p) => p.assignedTo === member.id);
    const completed = myProjects.filter((p) =>
      ["delivered", "invoiced", "closed"].includes(p.status),
    );
    const completionRate = myProjects.length
      ? Math.round((completed.length / myProjects.length) * 100)
      : 0;
    const clientIds = [...new Set(myProjects.map((p) => p.clientId))];
    const returning = clientIds.filter(
      (cid) => projects.filter((p) => p.clientId === cid).length > 1,
    ).length;
    const returnRate = clientIds.length ? Math.round((returning / clientIds.length) * 100) : 0;
    const satisfaction = 4.6;
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {header}
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-indigo-600">
          <Briefcase size={14} /> {myProjects.length} مشاريع مسندة
        </div>
        <p className="text-2xl font-extrabold text-gray-900">{completionRate}%</p>
        <p className="mb-2 text-xs text-gray-400">نسبة الإنجاز ({completed.length} مكتمل)</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-teal-50 p-2">
            <p className="text-lg font-extrabold text-teal-700">{returnRate}%</p>
            <p className="text-[11px] text-teal-500">عودة العملاء</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-2">
            <p className="flex items-center justify-center gap-1 text-lg font-extrabold text-amber-600">
              {satisfaction} <Star size={13} className="fill-amber-400 text-amber-400" />
            </p>
            <p className="text-[11px] text-amber-500">رضا العملاء</p>
          </div>
        </div>
      </div>
    );
  }

  // تقييم الموظف الفني على 3 محاور: جودة المخرجات، سرعة الإنجاز، الإنتاجية
  const myTasks = tasks.filter((t) => t.assignedTo === member.id);
  const done = myTasks.filter((t) => t.status === "completed");
  const today = new Date().toISOString().slice(0, 10);

  // جودة المخرجات: كلما قلّت دورات التعديل قبل الاعتماد ارتفعت الجودة
  const revisionRounds = myTasks.reduce((s, t) => s + (t.revisionRounds ?? 0), 0);
  const qualityScore = Math.max(1, 5 - revisionRounds * 0.4).toFixed(1);

  // سرعة الإنجاز: قبل الموعد / في الموعد / بعد الموعد
  const before = done.filter((t) => t.dueDate > today).length;
  const onTime = done.filter((t) => t.dueDate === today).length;
  const late = done.filter((t) => t.dueDate < today || t.delayReason).length;

  // الإنتاجية: عدد المهام المنجزة من إجمالي المسندة خلال المدة
  const productivity = myTasks.length ? Math.round((done.length / myTasks.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {header}
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-emerald-600">
        <Wrench size={14} /> {myTasks.length} مهمة مسندة · {done.length} منجزة
      </div>

      {/* جودة المخرجات */}
      <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
        <span className="text-xs text-amber-700">جودة المخرجات (دورات تعديل: {revisionRounds})</span>
        <span className="flex items-center gap-1 text-sm font-extrabold text-amber-600">
          {qualityScore} <Star size={13} className="fill-amber-400 text-amber-400" />
        </span>
      </div>

      {/* سرعة الإنجاز */}
      <p className="mb-1 text-[11px] font-semibold text-gray-500">سرعة الإنجاز</p>
      <div className="mb-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-emerald-50 p-2">
          <p className="text-lg font-extrabold text-emerald-700">{before}</p>
          <p className="text-[10px] text-emerald-500">قبل الموعد</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-2">
          <p className="text-lg font-extrabold text-blue-700">{onTime}</p>
          <p className="text-[10px] text-blue-500">في الموعد</p>
        </div>
        <div className="rounded-lg bg-red-50 p-2">
          <p className="text-lg font-extrabold text-red-600">{late}</p>
          <p className="text-[10px] text-red-400">بعد الموعد</p>
        </div>
      </div>

      {/* الإنتاجية */}
      <p className="mb-1 text-[11px] font-semibold text-gray-500">الإنتاجية (منجز من المسند)</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${productivity}%` }} />
      </div>
      <p className="mt-1 text-left text-xs font-bold text-emerald-600">{productivity}%</p>
    </div>
  );
};

export const AddCardForm: React.FC<{
  onSave: (memberId: string, type: CardType) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { teamMembers } = useApp();
  const [memberId, setMemberId] = useState(teamMembers[0]?.id ?? "");
  const member = teamMembers.find((m) => m.id === memberId);
  const [type, setType] = useState<CardType>(member ? defaultCardType(member) : "tech");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(memberId, type);
      }}
    >
      <FormField label="الموظف">
        <select
          className={inputClass}
          value={memberId}
          onChange={(e) => {
            setMemberId(e.target.value);
            const m = teamMembers.find((x) => x.id === e.target.value);
            if (m) setType(defaultCardType(m));
          }}
        >
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.jobTitle ?? m.role}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="نوع بطاقة الأداء (تلقائي حسب الدور، ويمكن تغييره)">
        <select
          className={inputClass}
          value={type}
          onChange={(e) => setType(e.target.value as CardType)}
        >
          <option value="sales">مبيعات — الهدف والمحقق</option>
          <option value="pm">مدير مشاريع — الإنجاز وعودة العملاء ورضاهم</option>
          <option value="tech">موظف فني — إنجاز الأعمال بكفاءة وجودة</option>
        </select>
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
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
          إضافة البطاقة
        </button>
      </div>
    </form>
  );
};
