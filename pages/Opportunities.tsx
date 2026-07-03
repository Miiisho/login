import React, { useState } from "react";
import { Sparkles, Plus, CheckCircle2, FileText, Calendar, Upload, AlertTriangle } from "lucide-react";
import { useApp } from "../state/AppContext";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency } from "../lib/format";
import { isProjectManager } from "../lib/permissions";

/** مرحلة ما قبل التعميد: خط أنابيب الفرص (Lead & Sales Pipeline) على شكل كانبان */
type Stage = "new" | "meeting" | "quote" | "approved";

const STAGES: { key: Stage; label: string; hint: string }[] = [
  { key: "new", label: "فرصة جديدة", hint: "تسجيل البيانات الأساسية" },
  { key: "meeting", label: "اجتماع", hint: "سجل الاجتماع ومخرجاته" },
  { key: "quote", label: "عرض سعر", hint: "رفع العرض والقيمة المالية" },
  { key: "approved", label: "معتمد ← تنفيذ", hint: "يتحول تلقائيًا لمشروع" },
];

type Opportunity = {
  id: string;
  name: string;
  clientName: string;
  value: number;
  stage: Stage;
  meetingDate: string;
  meetingOutcome: string;
  hasBrief: boolean;
  hasGuidelines: boolean;
  preferences: string;
  hasQuoteFile: boolean;
  assignedTo: string; // مُسند إليه من مدراء المشاريع
  converted?: boolean;
};

const seed: Opportunity[] = [
  {
    id: "op-1", name: "هوية بصرية لمطعم", clientName: "مطاعم النخبة", value: 45000, stage: "meeting",
    meetingDate: "2026-06-20", meetingOutcome: "العميل يريد طابعًا عصريًا بألوان دافئة",
    hasBrief: true, hasGuidelines: false, preferences: "يفضل الأخضر والذهبي", hasQuoteFile: false,
    assignedTo: "u-pm",
  },
  {
    id: "op-2", name: "حملة إطلاق تطبيق", clientName: "تِك سعودي", value: 120000, stage: "quote",
    meetingDate: "2026-06-15", meetingOutcome: "تم الاتفاق على النطاق، بانتظار اعتماد العرض",
    hasBrief: true, hasGuidelines: true, preferences: "لغة شبابية", hasQuoteFile: true,
    assignedTo: "u-pm",
  },
  {
    id: "op-3", name: "تصوير منتجات", clientName: "متجر لمسة", value: 18000, stage: "new",
    meetingDate: "", meetingOutcome: "", hasBrief: false, hasGuidelines: false, preferences: "", hasQuoteFile: false,
    assignedTo: "u-pm",
  },
];

/** التحقق من اكتمال المستندات قبل التحويل للتنفيذ */
const isReadyForExecution = (o: Opportunity) => o.hasBrief && o.hasGuidelines && o.hasQuoteFile;

export const Opportunities: React.FC = () => {
  const { addProject, clients, currentUser, teamMembers } = useApp();
  const [items, setItems] = useState<Opportunity[]>(seed);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // إضافة الفرص متاحة للمالك والأدمن ولأي عضو فريق يملك صلاحية إدارة المشاريع/العملاء
  const canAdd =
    currentUser.role === "owner" ||
    currentUser.role === "admin" ||
    currentUser.permissions.includes("manage_projects") ||
    currentUser.permissions.includes("manage_clients");

  // خيارات الإسناد: مدراء المشاريع (وإن لم يوجد، الإدارة)
  const pmOptions = teamMembers.filter(
    (m) => isProjectManager(m) || m.role === "owner" || m.role === "admin",
  );

  const move = (o: Opportunity, stage: Stage) => {
    // Data Validation: لا يُسمح بالانتقال لمرحلة "معتمد/تنفيذ" قبل اكتمال المستندات
    if (stage === "approved" && !isReadyForExecution(o)) {
      alert("لا يمكن التحويل للتنفيذ قبل رفع: البريف + دليل الهوية + العرض المالي");
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === o.id ? { ...x, stage } : x)));
    // Automation Trigger: عند الاعتماد يُنشأ مشروع تنفيذ تلقائيًا
    if (stage === "approved" && !o.converted) {
      const client = clients.find((c) => c.name === o.clientName);
      addProject({
        clientId: client?.id ?? clients[0]?.id ?? "",
        name: o.name,
        description: `مشروع مُحوّل تلقائيًا من فرصة معتمدة — ${o.meetingOutcome}`,
        budget: o.value,
        type: "service",
        status: "planning",
        progress: 0,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        assignedTo: o.assignedTo,
        keyTeamMembers: [],
        billingEmail: "",
        lineItems: [],
      });
      setItems((prev) => prev.map((x) => (x.id === o.id ? { ...x, converted: true } : x)));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            <Sparkles className="text-blue-500" size={24} /> الفرص
          </h1>
          <p className="text-sm text-gray-500">
            مرحلة ما قبل التعميد — سجل الاجتماع، وثائق العميل، والعرض المالي. عند الاعتماد يتحول تلقائيًا لمشروع تنفيذ.
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
          >
            <Plus size={16} /> فرصة جديدة
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((col) => {
          const cards = items.filter((o) => o.stage === col.key);
          return (
            <div key={col.key} className="min-h-[200px] rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-3 px-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700">{col.label}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{cards.length}</span>
                </div>
                <p className="text-[10px] text-gray-400">{col.hint}</p>
              </div>
              <div className="space-y-2">
                {cards.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => setEditing(o)}
                    className="cursor-pointer rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <p className="font-semibold text-gray-800">{o.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{o.clientName}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-600">{formatCurrency(o.value)}</p>
                    {o.assignedTo && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        مُسند إلى: {teamMembers.find((m) => m.id === o.assignedTo)?.name ?? "—"}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Chip ok={o.hasBrief} label="بريف" />
                      <Chip ok={o.hasGuidelines} label="جايدلاين" />
                      <Chip ok={o.hasQuoteFile} label="عرض" />
                    </div>
                    {col.key !== "approved" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = STAGES[STAGES.findIndex((s) => s.key === col.key) + 1].key;
                          move(o, next);
                        }}
                        className="mt-2 w-full rounded-lg bg-blue-500 py-1 text-[11px] font-semibold text-white hover:bg-blue-600"
                      >
                        نقل للمرحلة التالية ←
                      </button>
                    )}
                    {o.converted && (
                      <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600">
                        <CheckCircle2 size={11} /> حُوّل إلى مشروع تنفيذ
                      </p>
                    )}
                  </div>
                ))}
                {cards.length === 0 && <p className="py-6 text-center text-xs text-gray-300">لا توجد فرص</p>}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={`الفرصة — ${editing.name}`} onClose={() => setEditing(null)} wide>
          <OpportunityForm
            opportunity={editing}
            pmOptions={pmOptions}
            onSave={(updated) => {
              setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
      {showAdd && (
        <Modal title="فرصة جديدة" onClose={() => setShowAdd(false)}>
          <OpportunityForm
            opportunity={{
              id: `op-${Date.now()}`, name: "", clientName: "", value: 0, stage: "new",
              meetingDate: "", meetingOutcome: "", hasBrief: false, hasGuidelines: false, preferences: "", hasQuoteFile: false,
              assignedTo: pmOptions[0]?.id ?? "",
            }}
            pmOptions={pmOptions}
            onSave={(o) => {
              setItems((prev) => [...prev, o]);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}
    </div>
  );
};

const Chip: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      ok ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-400"
    }`}
  >
    {ok ? "✓" : "○"} {label}
  </span>
);

const OpportunityForm: React.FC<{
  opportunity: Opportunity;
  pmOptions: { id: string; name: string }[];
  onSave: (o: Opportunity) => void;
  onClose: () => void;
}> = ({ opportunity, pmOptions, onSave, onClose }) => {
  const [form, setForm] = useState<Opportunity>(opportunity);
  const ready = isReadyForExecution(form);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <FormField label="اسم الفرصة">
        <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </FormField>
      <FormField label="العميل">
        <input required className={inputClass} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
      </FormField>

      {/* إسناد الفرصة إلى أحد مدراء المشاريع (إلزامي) */}
      <div className="sm:col-span-2">
        <FormField label="إسناد إلى (مدير مشروع)">
          <select
            required
            className={inputClass}
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
          >
            <option value="" disabled>
              اختر مدير المشروع المسؤول...
            </option>
            {pmOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="sm:col-span-2 mt-2 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <p className="mb-2 flex items-center gap-1 text-xs font-bold text-blue-700"><Calendar size={13} /> سجل الاجتماع</p>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField label="تاريخ الاجتماع">
            <input type="date" className={inputClass} value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} />
          </FormField>
          <FormField label="تفضيلات العميل">
            <input className={inputClass} value={form.preferences} onChange={(e) => setForm({ ...form, preferences: e.target.value })} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="مخرجات الاجتماع">
              <textarea rows={2} className={inputClass} value={form.meetingOutcome} onChange={(e) => setForm({ ...form, meetingOutcome: e.target.value })} />
            </FormField>
          </div>
        </div>
      </div>

      <div className="sm:col-span-2 mt-2 rounded-xl border border-gray-200 p-4">
        <p className="mb-2 flex items-center gap-1 text-xs font-bold text-gray-700"><FileText size={13} /> وثائق العميل والعرض المالي</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <UploadToggle label="البريف" on={form.hasBrief} onToggle={() => setForm({ ...form, hasBrief: !form.hasBrief })} />
          <UploadToggle label="دليل الهوية" on={form.hasGuidelines} onToggle={() => setForm({ ...form, hasGuidelines: !form.hasGuidelines })} />
          <UploadToggle label="ملف عرض السعر" on={form.hasQuoteFile} onToggle={() => setForm({ ...form, hasQuoteFile: !form.hasQuoteFile })} />
        </div>
        <div className="mt-3">
          <FormField label="القيمة المالية (ر.س)">
            <input type="number" className={inputClass} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </FormField>
        </div>
        <p className={`mt-2 flex items-center gap-1 text-[11px] ${ready ? "text-emerald-600" : "text-amber-600"}`}>
          {ready ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
          {ready ? "المستندات مكتملة — جاهزة للتحويل للتنفيذ" : "أكمل رفع البريف والجايدلاين والعرض للسماح بالتنفيذ"}
        </p>
      </div>

      <div className="sm:col-span-2 flex justify-end gap-2 pt-3">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
        <button type="submit" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">حفظ</button>
      </div>
    </form>
  );
};

const UploadToggle: React.FC<{ label: string; on: boolean; onToggle: () => void }> = ({ label, on, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
      on ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-dashed border-gray-300 text-gray-400 hover:bg-gray-50"
    }`}
  >
    <Upload size={13} /> {on ? `${label} ✓` : `رفع ${label}`}
  </button>
);
