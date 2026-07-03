import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, MapPin, Pencil, StickyNote, Wallet } from "lucide-react";
import { useApp } from "../state/AppContext";
import { canEditContent } from "../lib/permissions";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { Ltr } from "../components/Ltr";
import { formatCurrency, formatDate } from "../lib/format";

export const VendorDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    vendors,
    assignments,
    projects,
    vendorNotes,
    updateAssignmentStatus,
    updateVendor,
    addVendorNote,
    currentUser,
  } = useApp();
  const [showNote, setShowNote] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const vendor = vendors.find((v) => v.id === id);
  if (!vendor) return <p className="text-gray-500">لم يتم العثور على المورد.</p>;

  const vendorAssignments = assignments.filter((a) => a.vendorId === vendor.id);
  const totalPaid = vendorAssignments
    .filter((a) => a.status === "paid")
    .reduce((sum, a) => sum + a.cost, 0);
  const canEdit = canEditContent(currentUser);
  const pendingAssignment = vendorAssignments.find(
    (a) => a.status === "completed" || a.status === "in-progress",
  );
  const notes = vendorNotes
    .filter((n) => n.vendorId === vendor.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate("/vendors")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight size={16} /> العودة إلى الموردين
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {vendor.name} <span className="text-base font-normal text-gray-400">({vendor.serviceType})</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {vendor.email} | <Ltr>{vendor.phone}</Ltr>
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={14} /> {vendor.city}، {vendor.country}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={vendor.vendorType} />
            <StatusBadge status={vendor.paymentStatus} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">السعر بالساعة</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(vendor.hourlyRate)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">متوسط سعر المشروع</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(vendor.projectRate)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">الالتزام بالمواعيد</p>
            <p className="text-lg font-bold text-gray-900">{vendor.onTimeRate}%</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs text-amber-600">التقييم العام</p>
            <p className="text-lg font-bold text-amber-600">
              {"★".repeat(Math.round(vendor.reliabilityRating))} {vendor.reliabilityRating}/5
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-blue-600">استُخدم في</p>
            <p className="text-lg font-bold text-blue-700">{vendorAssignments.length} مشاريع</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600">إجمالي المدفوع</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">تقييم الجودة</p>
            <p className="text-lg font-bold text-gray-900">{vendor.qualityRating}/5</p>
          </div>
        </div>

        {vendor.entityType === "company" && vendor.official && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="mb-2 text-xs font-bold text-blue-700">البيانات الأساسية للشركة</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-600 sm:grid-cols-3">
              <p><span className="text-xs text-gray-400">السجل التجاري: </span>{vendor.official.crNumber}</p>
              <p><span className="text-xs text-gray-400">الرقم الضريبي: </span>{vendor.official.taxNumber}</p>
              <p><span className="text-xs text-gray-400">العنوان الوطني: </span>{vendor.official.nationalAddress}</p>
              <p><span className="text-xs text-gray-400">الممثل: </span>{vendor.official.repName}</p>
              <p><span className="text-xs text-gray-400">جواله: </span><Ltr>{vendor.official.repPhone}</Ltr></p>
              <p><span className="text-xs text-gray-400">بريده: </span>{vendor.official.repEmail}</p>
              {vendor.official.website && (
                <p><span className="text-xs text-gray-400">الموقع: </span>{vendor.official.website}</p>
              )}
            </div>
          </div>
        )}

        {canEdit && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Pencil size={14} /> تعديل
            </button>
            {pendingAssignment && (
              <button
                onClick={() => updateAssignmentStatus(pendingAssignment.id, "paid")}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <Wallet size={14} /> دفع الفاتورة
              </button>
            )}
            <button
              onClick={() => setShowNote(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <StickyNote size={14} /> إضافة تحديث
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">آخر التحديثات في التعامل معه</h2>
        <div className="space-y-2">
          {notes.map((n) => {
            const project = projects.find((p) => p.id === n.projectId);
            return (
              <div key={n.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <p className="text-gray-700">{n.text}</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {n.authorName} - {formatDate(n.createdAt.slice(0, 10))}
                  {project && (
                    <>
                      {" "}
                      | مشروع:{" "}
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-blue-500 hover:underline"
                      >
                        {project.name}
                      </button>
                    </>
                  )}
                </p>
              </div>
            );
          })}
          {notes.length === 0 && (
            <p className="text-sm text-gray-400">لا توجد تحديثات مسجلة بعد.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">المشاريع الأخيرة</h2>
        <div className="space-y-2">
          {vendorAssignments.map((a) => {
            const project = projects.find((p) => p.id === a.projectId);
            return (
              <div
                key={a.id}
                onClick={() => navigate(`/projects/${a.projectId}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-700">{project?.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(a.cost)} {a.paymentDate ? `- ${formatDate(a.paymentDate)}` : ""}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            );
          })}
          {vendorAssignments.length === 0 && (
            <p className="text-sm text-gray-400">لا توجد مشاريع مسجلة لهذا المورد.</p>
          )}
        </div>
      </div>

      {showNote && (
        <Modal title="إضافة تحديث عن المورد" onClose={() => setShowNote(false)}>
          <VendorNoteForm
            projects={vendorAssignments
              .map((a) => projects.find((p) => p.id === a.projectId))
              .filter((p): p is NonNullable<typeof p> => Boolean(p))}
            onSave={(text, projectId) => {
              addVendorNote(vendor.id, text, projectId);
              setShowNote(false);
            }}
            onClose={() => setShowNote(false)}
          />
        </Modal>
      )}

      {showEdit && (
        <Modal title={`تعديل بيانات المورد — ${vendor.name}`} onClose={() => setShowEdit(false)} wide>
          <EditVendorForm
            vendor={vendor}
            onSave={(updates) => {
              updateVendor(vendor.id, updates);
              setShowEdit(false);
            }}
            onClose={() => setShowEdit(false)}
          />
        </Modal>
      )}
    </div>
  );
};

const EditVendorForm: React.FC<{
  vendor: import("../types").Vendor;
  onSave: (updates: Partial<import("../types").Vendor>) => void;
  onClose: () => void;
}> = ({ vendor, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: vendor.name,
    serviceType: vendor.serviceType,
    vendorType: vendor.vendorType,
    email: vendor.email,
    phone: vendor.phone,
    city: vendor.city,
    country: vendor.country,
    hourlyRate: vendor.hourlyRate,
    projectRate: vendor.projectRate,
    notes: vendor.notes,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <FormField label="اسم المورد">
        <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </FormField>
      <FormField label="نوع الخدمة">
        <input required className={inputClass} value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} />
      </FormField>
      <FormField label="تصنيف المورد">
        <select
          className={inputClass}
          value={form.vendorType}
          onChange={(e) => setForm({ ...form, vendorType: e.target.value as import("../types").VendorType })}
        >
          <option value="service_provider">مقدم خدمة</option>
          <option value="strategic_partner">شراكة استراتيجية</option>
        </select>
      </FormField>
      <FormField label="البريد الإلكتروني">
        <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </FormField>
      <FormField label="رقم الجوال">
        <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </FormField>
      <FormField label="المدينة">
        <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      </FormField>
      <FormField label="الدولة">
        <input className={inputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
      </FormField>
      <FormField label="السعر بالساعة (ر.س)">
        <input type="number" className={inputClass} value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} />
      </FormField>
      <FormField label="سعر المشروع (ر.س)">
        <input type="number" className={inputClass} value={form.projectRate} onChange={(e) => setForm({ ...form, projectRate: Number(e.target.value) })} />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="ملاحظات">
          <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          إلغاء
        </button>
        <button type="submit" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
          حفظ التعديلات
        </button>
      </div>
    </form>
  );
};

const VendorNoteForm: React.FC<{
  projects: { id: string; name: string }[];
  onSave: (text: string, projectId: string | null) => void;
  onClose: () => void;
}> = ({ projects, onSave, onClose }) => {
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState<string>("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSave(text.trim(), projectId || null);
      }}
    >
      <FormField label="نص التحديث">
        <textarea
          required
          rows={3}
          className={inputClass}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </FormField>
      <FormField label="مرتبط بمشروع (اختياري)">
        <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">بدون ربط بمشروع</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </FormField>
      <div className="flex justify-end gap-2">
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
          حفظ
        </button>
      </div>
    </form>
  );
};
