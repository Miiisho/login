import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { inputClass } from "../components/Modal";
import { formatCurrency, formatDate, daysLeft } from "../lib/format";
import {
  Users,
  Briefcase,
  Wallet,
  Truck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Handshake,
  RefreshCw,
  ListTodo,
  Clock,
  Bell,
} from "lucide-react";

const OwnerDashboard: React.FC = () => {
  const {
    clients,
    projects,
    vendors,
    assignments,
    invoices,
    quotations,
    contracts,
    purchases,
    setApproval,
  } = useApp();
  const navigate = useNavigate();

  const revenue = invoices
    .filter((i) => i.status === "paid" || i.status === "sent")
    .reduce((sum, i) => sum + i.amount, 0);
  const costs = assignments.reduce((sum, a) => sum + a.cost, 0);
  const profit = revenue - costs;

  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const behindSchedule = projects.filter(
    (p) => p.status === "in-progress" && daysLeft(p.endDate) < 3,
  );
  const pendingVendorPayments = assignments.filter(
    (a) => a.status === "completed" || a.status === "in-progress",
  );

  type ApprovalItem = {
    kind: "invoice" | "quotation" | "contract" | "purchase";
    kindLabel: string;
    id: string;
    title: string;
    submitter: string;
    amount: number;
    link: string | null;
  };
  const approvalQueue: ApprovalItem[] = [
    ...invoices
      .filter((i) => i.approval === "pending_approval")
      .map((i) => ({
        kind: "invoice" as const,
        kindLabel: "فاتورة",
        id: i.id,
        title: i.invoiceNumber,
        submitter: i.submittedBy ?? "—",
        amount: i.amount,
        link: `/invoices/${i.id}`,
      })),
    ...quotations
      .filter((q) => q.approval === "pending_approval")
      .map((q) => ({
        kind: "quotation" as const,
        kindLabel: "عرض سعر",
        id: q.id,
        title: `${q.quoteNumber} — ${q.clientName}`,
        submitter: q.createdBy,
        amount: q.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
        link: `/quotations/${q.id}`,
      })),
    ...contracts
      .filter((c) => c.approval === "pending_approval")
      .map((c) => ({
        kind: "contract" as const,
        kindLabel: "عقد",
        id: c.id,
        title: c.title,
        submitter: c.submittedBy ?? "—",
        amount: c.value,
        link: `/contracts/${c.id}`,
      })),
    ...purchases
      .filter((p) => p.approval === "pending_approval")
      .map((p) => ({
        kind: "purchase" as const,
        kindLabel: "مشتريات",
        id: p.id,
        title: p.item,
        submitter: p.createdBy,
        amount: p.quantity * p.unitPrice,
        link: null,
      })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">لوحة تحكم المالك</h1>
        <p className="text-sm text-gray-500">نظرة شاملة على أداء الوكالة</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="العملاء" value={clients.length} icon={Users} tone="blue" />
        <StatCard label="المشاريع" value={projects.length} icon={Briefcase} tone="blue" />
        <StatCard label="الإيرادات" value={formatCurrency(revenue)} icon={TrendingUp} tone="green" />
        <StatCard label="الموردون" value={vendors.length} icon={Truck} tone="amber" />
        <StatCard label="التكاليف" value={formatCurrency(costs)} icon={TrendingDown} tone="red" />
        <StatCard label="الأرباح" value={formatCurrency(profit)} icon={Wallet} tone="green" />
      </div>

      {approvalQueue.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-orange-800">
            <FileWarning size={18} /> طلبات بانتظار موافقتك ({approvalQueue.length})
          </h2>
          <p className="mb-4 text-xs text-orange-600">
            فواتير وعروض وعقود ومشتريات أنشأها الفريق ولن تُرسل أو تُعتمد قبل موافقتك
          </p>
          <div className="space-y-2">
            {approvalQueue.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm"
              >
                <div
                  className={item.link ? "cursor-pointer" : ""}
                  onClick={() => item.link && navigate(item.link)}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                      {item.kindLabel}
                    </span>
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    قدّمها: {item.submitter} · {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setApproval(item.kind, item.id, "approved")}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                  >
                    اعتماد
                  </button>
                  <button
                    onClick={() => setApproval(item.kind, item.id, "rejected")}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">أحدث المشاريع</h2>
            <button
              onClick={() => navigate("/projects")}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              عرض الكل
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="pb-2 font-medium">المشروع</th>
                  <th className="pb-2 font-medium">العميل</th>
                  <th className="pb-2 font-medium">الحالة</th>
                  <th className="pb-2 font-medium">التقدم</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <td className="py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="py-3 text-gray-500">{client?.name}</td>
                      <td className="py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{p.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gray-900">التنبيهات</h2>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {overdueInvoices.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                <AlertTriangle size={14} className="shrink-0" />
                {overdueInvoices.length} فواتير/عقود متأخرة عن السداد
              </div>
            )}
            {behindSchedule.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700"
              >
                <AlertTriangle size={14} className="shrink-0" />
                مشروع "{p.name}" متأخر عن الجدول
              </div>
            ))}
            {pendingVendorPayments.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700">
                <AlertTriangle size={14} className="shrink-0" />
                {pendingVendorPayments.length} مستحقات موردين قيد الانتظار
              </div>
            )}
            {overdueInvoices.length === 0 &&
              behindSchedule.length === 0 &&
              pendingVendorPayments.length === 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
                  <CheckCircle2 size={14} className="shrink-0" />
                  لا توجد تنبيهات حاليًا
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PMDashboard: React.FC = () => {
  const { projects, clients, phases, assignments, tasks, teamMembers, invoices, deals } = useApp();
  const navigate = useNavigate();
  const myProjects = projects.filter((p) => p.status !== "closed");

  const vendorCounts = {
    active: assignments.filter((a) => a.status === "in-progress" || a.status === "assigned").length,
    pending: assignments.filter((a) => a.status === "pending").length,
    delivered: assignments.filter((a) => a.status === "completed").length,
  };

  const dueInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const upcomingRenewals = clients.filter(
    (c) => c.status === "active" && daysLeft(c.contractEndDate) >= 0 && daysLeft(c.contractEndDate) <= 30,
  );

  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const dueSoonInvoices = invoices.filter(
    (i) => i.status === "sent" && daysLeft(i.dueDate) >= 0 && daysLeft(i.dueDate) <= 5,
  );
  const projectsNearingDeadline = myProjects.filter(
    (p) => (p.status === "in-progress" || p.status === "review") && daysLeft(p.endDate) >= 0 && daysLeft(p.endDate) < 5,
  );
  const overdueProjects = myProjects.filter(
    (p) => (p.status === "in-progress" || p.status === "review") && daysLeft(p.endDate) < 0,
  );
  const phasesNearingDeadline = phases.filter(
    (ph) =>
      ph.status === "in-progress" &&
      myProjects.some((p) => p.id === ph.projectId) &&
      daysLeft(ph.endDate) >= 0 &&
      daysLeft(ph.endDate) < 3,
  );
  const hasAlerts =
    overdueInvoices.length > 0 ||
    dueSoonInvoices.length > 0 ||
    overdueProjects.length > 0 ||
    projectsNearingDeadline.length > 0 ||
    phasesNearingDeadline.length > 0;

  const workload = teamMembers
    .filter((m) => m.role === "team_member")
    .map((m) => ({
      member: m,
      count: tasks.filter((t) => t.assignedTo === m.id && t.status !== "completed").length,
    }));
  const availableMembers = workload.filter(({ count }) => count === 0);

  const activityLog = projects
    .flatMap((p) =>
      (p.activity ?? []).map((a) => ({ ...a, projectName: p.name, projectId: p.id })),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">لوحة تحكم مدير المشاريع</h1>
        <p className="text-sm text-gray-500">مشاريعي: {myProjects.length}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="مشاريع نشطة" value={myProjects.length} icon={Briefcase} tone="blue" />
        <StatCard label="فواتير مستحقة" value={dueInvoices.length} icon={FileWarning} tone="amber" />
        <StatCard label="صفقات مفتوحة" value={openDeals.length} icon={Handshake} tone="green" />
        <StatCard
          label="تجديد عقود خلال 30 يوم"
          value={upcomingRenewals.length}
          icon={RefreshCw}
          tone="red"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-gray-900">التنبيهات</h2>
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {overdueProjects.map((p) => (
              <div
                key={`od-${p.id}`}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-100"
              >
                <AlertTriangle size={14} className="shrink-0" /> مشروع "{p.name}" تجاوز موعد التسليم
              </div>
            ))}
            {projectsNearingDeadline.map((p) => (
              <div
                key={`nd-${p.id}`}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-100"
              >
                <Clock size={14} className="shrink-0" /> مشروع "{p.name}" يقترب تسليمه ({daysLeft(p.endDate)} يوم)
              </div>
            ))}
            {phasesNearingDeadline.map((ph) => {
              const project = projects.find((p) => p.id === ph.projectId);
              return (
                <div
                  key={`ph-${ph.id}`}
                  onClick={() => project && navigate(`/projects/${project.id}`)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-100"
                >
                  <Clock size={14} className="shrink-0" /> مرحلة "{ph.phaseName}" ({project?.name}) تقترب من الاستحقاق
                </div>
              );
            })}
            {overdueInvoices.length > 0 && (
              <div
                onClick={() => navigate("/invoices")}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-100"
              >
                <FileWarning size={14} className="shrink-0" /> {overdueInvoices.length} عقود/فواتير متأخرة
              </div>
            )}
            {dueSoonInvoices.length > 0 && (
              <div
                onClick={() => navigate("/invoices")}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
              >
                <FileWarning size={14} className="shrink-0" /> {dueSoonInvoices.length} فواتير تستحق خلال 5 أيام
              </div>
            )}
            {upcomingRenewals.map((c) => (
              <div
                key={`rn-${c.id}`}
                onClick={() => navigate(`/clients/${c.id}`)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw size={14} className="shrink-0" /> عقد "{c.name}" يحتاج تجديد خلال {daysLeft(c.contractEndDate)} يوم
              </div>
            ))}
            {availableMembers.map(({ member }) => (
              <div
                key={`av-${member.id}`}
                className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs text-teal-700"
              >
                <CheckCircle2 size={14} className="shrink-0" /> {member.name} متاح الآن (لا توجد مهام حالية)
              </div>
            ))}
            {!hasAlerts && availableMembers.length === 0 && upcomingRenewals.length === 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
                <CheckCircle2 size={14} className="shrink-0" /> لا توجد تنبيهات حاليًا
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">مشاريعي</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {myProjects.map((p) => {
              const client = clients.find((c) => c.id === p.clientId);
              const currentPhase = phases.find(
                (ph) => ph.projectId === p.id && ph.status === "in-progress",
              );
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="cursor-pointer rounded-xl border border-gray-100 p-3 hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {p.name} <span className="font-normal text-gray-400">| {client?.name}</span>
                    </p>
                    <span className="whitespace-nowrap text-xs font-medium text-gray-500">
                      {p.progress}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentPhase && (
                      <span className="whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        {currentPhase.phaseName}
                      </span>
                    )}
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-[11px] text-gray-400">
                      {daysLeft(p.endDate)} يوم
                    </span>
                  </div>
                </div>
              );
            })}
            {myProjects.length === 0 && (
              <p className="text-sm text-gray-400">لا توجد مشاريع نشطة حاليًا.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">حالة الموردين (بحسب التسليم)</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-xl font-extrabold text-blue-700">{vendorCounts.active}</p>
              <p className="text-xs text-blue-600">قيد التنفيذ</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xl font-extrabold text-amber-700">{vendorCounts.pending}</p>
              <p className="text-xs text-amber-600">قيد الانتظار</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-xl font-extrabold text-emerald-700">{vendorCounts.delivered}</p>
              <p className="text-xs text-emerald-600">مكتمل التسليم</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">مهام الفريق الحالية</h2>
          <div className="space-y-2">
            {workload.map(({ member, count }) => (
              <div key={member.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{member.name}</span>
                {count === 0 ? (
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                    متاح
                  </span>
                ) : (
                  <span className="font-semibold text-gray-800">{count} مهمة</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
            <Bell size={18} className="text-blue-500" /> سجل النشاط
          </h2>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {upcomingRenewals.map((c) => (
              <div
                key={`log-rn-${c.id}`}
                onClick={() => navigate(`/clients/${c.id}`)}
                className="flex cursor-pointer items-start gap-2 rounded-lg bg-orange-50 px-2.5 py-2 text-xs text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw size={14} className="mt-0.5 shrink-0" />
                <span>
                  تجديد عقد "{c.name}" خلال {daysLeft(c.contractEndDate)} يوم
                </span>
              </div>
            ))}
            {activityLog.map((a, i) => (
              <div
                key={`log-act-${i}`}
                onClick={() => navigate(`/projects/${a.projectId}`)}
                className="flex cursor-pointer items-start gap-2 rounded-lg bg-gray-50 px-2.5 py-2 text-xs text-gray-600 hover:bg-gray-100"
              >
                <Bell size={13} className="mt-0.5 shrink-0 text-gray-400" />
                <span>
                  <span className="font-medium text-gray-700">{a.projectName}:</span> {a.text}
                  <span className="mr-1 text-gray-400"> — {formatDate(a.date)}</span>
                </span>
              </div>
            ))}
            {upcomingRenewals.length === 0 && activityLog.length === 0 && (
              <p className="text-sm text-gray-400">لا يوجد نشاط حديث.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PRIORITY_BORDER: Record<string, string> = {
  high: "border-r-4 border-r-red-400",
  medium: "border-r-4 border-r-amber-400",
  low: "border-r-4 border-r-gray-300",
};

const TeamDashboard: React.FC = () => {
  const { tasks, projects, currentUser, setTaskDelayReason } = useApp();
  const navigate = useNavigate();
  const [reasonForTask, setReasonForTask] = useState<string | null>(null);
  const [reasonDraft, setReasonDraft] = useState("");
  const myTasks = tasks.filter((t) => t.assignedTo === currentUser.id);
  const activeTasks = myTasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = activeTasks.filter((t) => t.dueDate < today);
  const completedTasks = myTasks.filter((t) => t.status === "completed");
  const byPriority = {
    high: myTasks.filter((t) => t.priority === "high" && t.status !== "completed").length,
    medium: myTasks.filter((t) => t.priority === "medium" && t.status !== "completed").length,
    low: myTasks.filter((t) => t.priority === "low" && t.status !== "completed").length,
  };
  const myProjectIds = [...new Set(myTasks.map((t) => t.projectId))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">مهامي</h1>
        <p className="text-sm text-gray-500">مرحبًا {currentUser.name.split(" ")[0]}، هذه خلاصة يومك</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="مهام معلقة" value={activeTasks.length} icon={ListTodo} tone="blue" />
        <StatCard label="متأخرة" value={overdueTasks.length} icon={Clock} tone="red" />
        <StatCard label="مكتملة" value={completedTasks.length} icon={CheckCircle2} tone="green" />
        <StatCard label="مشاريعي" value={myProjectIds.length} icon={Briefcase} tone="amber" />
      </div>

      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-red-700">
            <Clock size={18} /> تنبيهات التأخير
          </h2>
          <div className="space-y-2">
            {overdueTasks.map((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              return (
                <div key={t.id} className="rounded-lg bg-white px-3 py-2.5 text-sm shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-800">
                      {t.title} <span className="font-normal text-gray-400">| {project?.name}</span>
                    </p>
                    <span className="font-semibold text-red-600">
                      متأخرة منذ {Math.abs(daysLeft(t.dueDate))} يوم
                    </span>
                  </div>
                  {t.delayReason ? (
                    <p className="mt-1 text-xs text-gray-500">سبب التأخير: {t.delayReason}</p>
                  ) : reasonForTask === t.id ? (
                    <form
                      className="mt-2 flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!reasonDraft.trim()) return;
                        setTaskDelayReason(t.id, reasonDraft.trim());
                        setReasonForTask(null);
                        setReasonDraft("");
                      }}
                    >
                      <input
                        autoFocus
                        className={`${inputClass} py-1.5 text-xs`}
                        placeholder="اكتب سبب التأخير..."
                        value={reasonDraft}
                        onChange={(e) => setReasonDraft(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                      >
                        حفظ
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setReasonForTask(t.id)}
                      className="mt-1 text-xs font-medium text-red-500 hover:underline"
                    >
                      + أضف سبب التأخير
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">مهامي المعلقة (مرتّبة حسب الاستحقاق)</h2>
        <div className="space-y-2">
          {activeTasks.map((t) => {
            const project = projects.find((p) => p.id === t.projectId);
            const isOverdue = t.dueDate < today;
            return (
              <div
                key={t.id}
                onClick={() => navigate("/tasks", { state: { taskId: t.id } })}
                className={`cursor-pointer rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 hover:border-blue-200 hover:bg-blue-50/40 ${PRIORITY_BORDER[t.priority]}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-800">{t.title}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-400">المشروع: {project?.name}</p>
                  <p className={`text-xs font-semibold ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
                    {isOverdue ? "متأخرة — " : "الاستحقاق: "}
                    {formatDate(t.dueDate)}
                  </p>
                </div>
              </div>
            );
          })}
          {activeTasks.length === 0 && (
            <p className="text-sm text-gray-400">لا توجد مهام معلقة، أحسنت! 🎉</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">توزيع المهام حسب الأولوية</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-xl font-extrabold text-red-700">{byPriority.high}</p>
              <p className="text-xs text-red-600">عالية</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xl font-extrabold text-amber-700">{byPriority.medium}</p>
              <p className="text-xs text-amber-600">متوسطة</p>
            </div>
            <div className="rounded-xl bg-gray-100 p-3">
              <p className="text-xl font-extrabold text-gray-700">{byPriority.low}</p>
              <p className="text-xs text-gray-600">منخفضة</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">المشاريع المسندة</h2>
          <div className="space-y-2">
            {myProjectIds.map((pid) => {
              const project = projects.find((p) => p.id === pid);
              const count = myTasks.filter((t) => t.projectId === pid).length;
              return (
                <div
                  key={pid}
                  onClick={() => project && navigate(`/projects/${project.id}`)}
                  className="flex cursor-pointer items-center justify-between text-sm hover:text-blue-600"
                >
                  <span className="text-gray-600">{project?.name}</span>
                  <span className="font-semibold text-gray-800">{count} مهام</span>
                </div>
              );
            })}
            {myProjectIds.length === 0 && (
              <p className="text-sm text-gray-400">لا توجد مشاريع مسندة حاليًا.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { currentUser } = useApp();
  if (currentUser.role === "owner" || currentUser.role === "admin") return <OwnerDashboard />;
  // عضو الفريق المسند له قالب مدير مشاريع يرى لوحة مدير المشاريع
  if (currentUser.templateId === "pt-pm") return <PMDashboard />;
  return <TeamDashboard />;
};
