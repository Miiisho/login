import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  IdCard,
  ShieldCheck,
  Star,
  UserCog,
  Users,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatCard } from "../components/StatCard";
import { daysLeft, formatDate } from "../lib/format";

/** لوحة تحكم إدارة الموظفين: مختصر أهم ما يجب أن يراه المدير */
export const HRDashboard: React.FC = () => {
  const { teamMembers, tasks, auditLog } = useApp();
  const navigate = useNavigate();

  const total = teamMembers.length;
  const fullTime = teamMembers.filter((m) => (m.employmentType ?? "full_time") === "full_time").length;
  const flexible = total - fullTime;
  const available = teamMembers.filter(
    (m) =>
      m.role === "team_member" &&
      tasks.filter((t) => t.assignedTo === m.id && t.status !== "completed").length === 0,
  ).length;

  const today = new Date().toISOString().slice(0, 10);
  const overdueByMember = teamMembers
    .map((m) => ({
      member: m,
      overdue: tasks.filter(
        (t) => t.assignedTo === m.id && t.status !== "completed" && t.dueDate < today,
      ).length,
    }))
    .filter((x) => x.overdue > 0);

  type Alert = { text: string; tone: "red" | "amber" | "orange" };
  const alerts: Alert[] = [];
  teamMembers.forEach((m) => {
    const f = m.employeeFile;
    if (!f) return;
    const cd = daysLeft(f.contractEnd);
    if (cd < 0) alerts.push({ text: `عقد ${m.name} منتهٍ — قرار تجديد أو إنهاء فوري`, tone: "red" });
    else if (cd <= 90)
      alerts.push({ text: `عقد ${m.name} ينتهي خلال ${cd} يوم — تجديد أو إنهاء`, tone: "orange" });
    f.docs.forEach((doc) => {
      const dd = daysLeft(doc.expiryDate);
      if (dd >= 0 && dd <= 90 && doc.name !== "عقد العمل")
        alerts.push({ text: `${doc.name} للموظف ${m.name} ينتهي خلال ${dd} يوم`, tone: "amber" });
    });
  });
  overdueByMember.forEach(({ member, overdue }) =>
    alerts.push({ text: `${member.name} لديه ${overdue} مهام متأخرة`, tone: "red" }),
  );

  const topPerformer = teamMembers
    .filter((m) => m.role === "team_member")
    .map((m) => ({
      member: m,
      done: tasks.filter((t) => t.assignedTo === m.id && t.status === "completed").length,
    }))
    .sort((a, b) => b.done - a.done)[0];

  const hrLog = auditLog.filter((e) => e.action.includes("الموظف")).slice(0, 6);

  const TONES = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <UserCog className="text-blue-500" size={24} /> إدارة الموظفين — لوحة التحكم
        </h1>
        <p className="text-sm text-gray-500">مختصر أهم ما يخص الموظفين: تنبيهات، سجل نشاط، وأبرز الأرقام</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="إجمالي الموظفين" value={total} icon={Users} tone="blue" />
        <StatCard label="دوام كامل" value={fullTime} icon={IdCard} tone="green" />
        <StatCard label="جزئي / ساعة / عن بعد" value={flexible} icon={Clock} tone="amber" />
        <StatCard label="متاحون الآن" value={available} icon={CheckCircle2} tone="gray" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
            <AlertTriangle size={18} className="text-orange-500" /> تنبيهات الموظفين ({alerts.length})
          </h2>
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {alerts.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate("/employees")}
                className={`block w-full rounded-lg px-3 py-2 text-right text-xs ${TONES[a.tone]} hover:opacity-80`}
              >
                {a.text}
              </button>
            ))}
            {alerts.length === 0 && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ✓ لا توجد تنبيهات — كل العقود والأوراق سارية والمهام في وقتها
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
              <Star size={18} className="text-amber-400" /> أبرز الأشياء
            </h2>
            <div className="space-y-2 text-sm">
              {topPerformer && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                  🏅 الأعلى إنجازًا: <b>{topPerformer.member.name}</b> ({topPerformer.done} مهام مكتملة)
                </p>
              )}
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
                📋 مهام نشطة على الفريق:{" "}
                <b>{tasks.filter((t) => t.status !== "completed").length}</b>
              </p>
              <button
                onClick={() => navigate("/employees-roles")}
                className="flex w-full items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-right text-gray-600 hover:bg-gray-100"
              >
                <ShieldCheck size={15} className="text-gray-400" /> مراجعة الأدوار والصلاحيات ←
              </button>
              <button
                onClick={() => navigate("/employees-performance")}
                className="flex w-full items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-right text-gray-600 hover:bg-gray-100"
              >
                <Star size={15} className="text-gray-400" /> عرض بطاقات الأداء ←
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
              <Bell size={18} className="text-blue-500" /> سجل النشاط
            </h2>
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {hrLog.map((e) => (
                <p key={e.id} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <b>{e.userName}</b> — {e.action}
                  <span className="mr-2 text-[10px] text-gray-400">
                    {formatDate(e.date.slice(0, 10))}
                  </span>
                </p>
              ))}
              {hrLog.length === 0 && (
                <p className="text-xs text-gray-400">
                  لا يوجد نشاط بعد — أي تعديل على الموظفين سيظهر هنا.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
