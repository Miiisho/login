import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  FileText,
  Receipt,
  ScrollText,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { formatCurrency, daysLeft, formatDate } from "../lib/format";

/** لوحة تحكم الإدارة المالية: ملخص كل ما يحدث — أرقام وحالات وتنبيهات وسجل نشاط */
export const FinanceDashboard: React.FC = () => {
  const { quotations, contracts, invoices, purchases, clients, auditLog, currentUser } = useApp();
  const navigate = useNavigate();
  const isApprover = ["owner", "admin"].includes(currentUser.role);

  // عروض الأسعار
  const qSent = quotations.filter((q) => q.status === "sent").length;
  const qAccepted = quotations.filter((q) => q.status === "accepted").length;
  const qDraft = quotations.filter((q) => q.status === "draft").length;
  // العقود
  const cActive = contracts.filter((c) => c.status === "active").length;
  const cDraft = contracts.filter((c) => c.status === "draft").length;
  const cEnded = contracts.filter((c) => ["expired", "terminated"].includes(c.status)).length;
  // الفواتير الصادرة
  const iInProgress = invoices.filter((i) => ["draft", "sent"].includes(i.status)).length;
  const iPaid = invoices.filter((i) => i.status === "paid").length;
  const iOverdue = invoices.filter((i) => i.status === "overdue").length;
  const revenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  // المشتريات
  const pInProgress = purchases.filter((p) => ["requested", "ordered"].includes(p.status)).length;
  const pDone = purchases.filter((p) => ["received", "paid"].includes(p.status)).length;
  const purchasesTotal = purchases.reduce((s, p) => s + p.quantity * p.unitPrice, 0);

  const pendingApprovals =
    invoices.filter((i) => i.approval === "pending_approval").length +
    quotations.filter((q) => q.approval === "pending_approval").length +
    contracts.filter((c) => c.approval === "pending_approval").length +
    purchases.filter((p) => p.approval === "pending_approval").length;

  type Alert = { text: string; to: string; tone: "red" | "amber" | "orange" };
  const alerts: Alert[] = [];
  if (isApprover && pendingApprovals > 0)
    alerts.push({ text: `${pendingApprovals} مستندات بانتظار الموافقة`, to: "/dashboard", tone: "orange" });
  invoices
    .filter((i) => i.status === "overdue")
    .forEach((i) =>
      alerts.push({ text: `فاتورة ${i.invoiceNumber} متأخرة عن السداد`, to: `/invoices/${i.id}`, tone: "red" }),
    );
  contracts
    .filter((c) => c.status === "active" && daysLeft(c.endDate) >= 0 && daysLeft(c.endDate) <= 30)
    .forEach((c) =>
      alerts.push({ text: `عقد "${c.title}" ينتهي خلال ${daysLeft(c.endDate)} يوم`, to: `/contracts/${c.id}`, tone: "amber" }),
    );
  clients
    .filter((c) => c.status === "active" && daysLeft(c.contractEndDate) >= 0 && daysLeft(c.contractEndDate) <= 30)
    .forEach((c) =>
      alerts.push({ text: `تجديد عقد العميل "${c.name}" خلال ${daysLeft(c.contractEndDate)} يوم`, to: `/clients/${c.id}`, tone: "orange" }),
    );

  const financeLog = auditLog
    .filter((e) =>
      ["الفاتورة", "عرض السعر", "العقد", "المشتريات", "سعر الخدمة", "الشراء"].some((k) =>
        e.action.includes(k),
      ),
    )
    .slice(0, 7);

  const TONES = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    orange: "bg-orange-50 text-orange-700",
  };

  const UnitCard: React.FC<{
    icon: React.ElementType;
    title: string;
    to: string;
    rows: { label: string; value: number | string; cls: string }[];
  }> = ({ icon: Icon, title, to, rows }) => (
    <button
      onClick={() => navigate(to)}
      className="rounded-2xl border border-gray-200 bg-white p-5 text-right shadow-sm transition-shadow hover:border-blue-200 hover:shadow-md"
    >
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icon size={17} className="text-blue-500" /> {title}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {rows.map((r) => (
          <div key={r.label} className={`rounded-lg p-2 ${r.cls}`}>
            <p className="text-lg font-extrabold">{r.value}</p>
            <p className="text-[10px]">{r.label}</p>
          </div>
        ))}
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <Wallet className="text-blue-500" size={24} /> الإدارة المالية — لوحة التحكم
        </h1>
        <p className="text-sm text-gray-500">
          ملخص كل ما يحدث ماليًا: عروض الأسعار، العقود، الفواتير الصادرة، والمشتريات بحالاتها
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">الإيرادات المحصلة</p>
          <p className="text-xl font-extrabold text-emerald-600">{formatCurrency(revenue)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">إجمالي المشتريات</p>
          <p className="text-xl font-extrabold text-gray-900">{formatCurrency(purchasesTotal)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">فواتير متأخرة</p>
          <p className="text-xl font-extrabold text-red-600">{iOverdue}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">بانتظار الموافقة</p>
          <p className="text-xl font-extrabold text-orange-600">{pendingApprovals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UnitCard
          icon={ScrollText}
          title="عروض الأسعار"
          to="/quotations"
          rows={[
            { label: "قيد التنفيذ", value: qDraft + qSent, cls: "bg-blue-50 text-blue-700" },
            { label: "مقبولة", value: qAccepted, cls: "bg-emerald-50 text-emerald-700" },
            { label: "الإجمالي", value: quotations.length, cls: "bg-gray-50 text-gray-700" },
          ]}
        />
        <UnitCard
          icon={FileText}
          title="العقود"
          to="/contracts-list"
          rows={[
            { label: "قيد التنفيذ", value: cDraft, cls: "bg-blue-50 text-blue-700" },
            { label: "نشطة", value: cActive, cls: "bg-emerald-50 text-emerald-700" },
            { label: "منتهية", value: cEnded, cls: "bg-gray-50 text-gray-700" },
          ]}
        />
        <UnitCard
          icon={Receipt}
          title="الفواتير الصادرة"
          to="/invoices"
          rows={[
            { label: "قيد التنفيذ", value: iInProgress, cls: "bg-blue-50 text-blue-700" },
            { label: "مكتملة (مدفوعة)", value: iPaid, cls: "bg-emerald-50 text-emerald-700" },
            { label: "متأخرة", value: iOverdue, cls: "bg-red-50 text-red-700" },
          ]}
        />
        <UnitCard
          icon={ShoppingCart}
          title="المشتريات"
          to="/purchases"
          rows={[
            { label: "قيد التنفيذ", value: pInProgress, cls: "bg-blue-50 text-blue-700" },
            { label: "مكتملة", value: pDone, cls: "bg-emerald-50 text-emerald-700" },
            { label: "الإجمالي", value: purchases.length, cls: "bg-gray-50 text-gray-700" },
          ]}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
            <AlertTriangle size={18} className="text-orange-500" /> التنبيهات المالية ({alerts.length})
          </h2>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {alerts.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.to)}
                className={`block w-full rounded-lg px-3 py-2 text-right text-xs ${TONES[a.tone]} hover:opacity-80`}
              >
                {a.text}
              </button>
            ))}
            {alerts.length === 0 && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ✓ لا توجد تنبيهات مالية حاليًا
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
            <Bell size={18} className="text-blue-500" /> سجل النشاط المالي
          </h2>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {financeLog.map((e) => (
              <p key={e.id} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <b>{e.userName}</b> — {e.action}
                <span className="mr-2 text-[10px] text-gray-400">
                  {formatDate(e.date.slice(0, 10))}
                </span>
              </p>
            ))}
            {financeLog.length === 0 && (
              <p className="text-xs text-gray-400">
                لا يوجد نشاط مالي بعد — أي تعديل أو اعتماد سيظهر هنا تلقائيًا.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
