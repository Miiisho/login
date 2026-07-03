import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CheckCircle2, Handshake, Truck, Wallet } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatCard } from "../components/StatCard";
import { formatCurrency, formatDate } from "../lib/format";

/** لوحة تحكم إدارة الموردين: ملخص سريع للموردين وإسناداتهم وتحديثاتهم */
export const VendorsDashboard: React.FC = () => {
  const { vendors, assignments, vendorNotes, projects } = useApp();
  const navigate = useNavigate();

  const active = vendors.filter((v) => v.paymentStatus === "active").length;
  const partners = vendors.filter((v) => v.vendorType === "strategic_partner").length;
  const totalPaid = assignments
    .filter((a) => a.status === "paid")
    .reduce((s, a) => s + a.cost, 0);
  const inProgress = assignments.filter((a) =>
    ["assigned", "in-progress"].includes(a.status),
  ).length;
  const awaitingPayment = assignments.filter((a) => a.status === "completed");

  const recentNotes = [...vendorNotes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <Truck className="text-blue-500" size={24} /> إدارة الموردين — لوحة التحكم
        </h1>
        <p className="text-sm text-gray-500">ملخص سريع للموردين وإسناداتهم ومستحقاتهم وآخر التحديثات</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="إجمالي الموردين" value={vendors.length} icon={Truck} tone="blue" />
        <StatCard label="شراكات استراتيجية" value={partners} icon={Handshake} tone="amber" />
        <StatCard label="تسليمات قيد التنفيذ" value={inProgress} icon={AlertTriangle} tone="red" />
        <StatCard label="إجمالي المدفوع" value={formatCurrency(totalPaid)} icon={Wallet} tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
            <AlertTriangle size={18} className="text-orange-500" /> تنبيهات الموردين
          </h2>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {awaitingPayment.map((a) => {
              const vendor = vendors.find((v) => v.id === a.vendorId);
              const project = projects.find((p) => p.id === a.projectId);
              return (
                <button
                  key={a.id}
                  onClick={() => vendor && navigate(`/vendors/${vendor.id}`)}
                  className="block w-full rounded-lg bg-amber-50 px-3 py-2 text-right text-xs text-amber-700 hover:bg-amber-100"
                >
                  مستحقات {vendor?.name} ({formatCurrency(a.cost)}) بانتظار الدفع — {project?.name}
                </button>
              );
            })}
            {vendors
              .filter((v) => v.paymentStatus !== "active")
              .map((v) => (
                <button
                  key={v.id}
                  onClick={() => navigate(`/vendors/${v.id}`)}
                  className="block w-full rounded-lg bg-gray-50 px-3 py-2 text-right text-xs text-gray-500 hover:bg-gray-100"
                >
                  المورد {v.name} غير نشط حاليًا
                </button>
              ))}
            {awaitingPayment.length === 0 && active === vendors.length && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle2 size={13} className="ml-1 inline" /> كل الموردين نشطون ولا توجد مستحقات معلقة
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
            <Bell size={18} className="text-blue-500" /> آخر تحديثات الموردين
          </h2>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {recentNotes.map((n) => {
              const vendor = vendors.find((v) => v.id === n.vendorId);
              return (
                <button
                  key={n.id}
                  onClick={() => vendor && navigate(`/vendors/${vendor.id}`)}
                  className="block w-full rounded-lg bg-gray-50 px-3 py-2 text-right text-xs text-gray-600 hover:bg-gray-100"
                >
                  <b>{vendor?.name}:</b> {n.text}
                  <span className="mr-2 text-[10px] text-gray-400">
                    {formatDate(n.createdAt.slice(0, 10))}
                  </span>
                </button>
              );
            })}
            {recentNotes.length === 0 && (
              <p className="text-xs text-gray-400">لا توجد تحديثات مسجلة بعد.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
