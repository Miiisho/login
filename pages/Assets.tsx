import React, { useRef, useState } from "react";
import { Box, Eye, EyeOff, FileText, Paperclip, Pencil, Plus, Upload } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency, formatDate, daysLeft } from "../lib/format";
import type {
  AssetCategory,
  AssetStatus,
  CompanyAsset,
  DocumentCategory,
  OfficialDocument,
} from "../types";

const CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: "equipment", label: "معدات" },
  { value: "software", label: "برمجيات" },
  { value: "license", label: "رخصة" },
  { value: "account", label: "حساب" },
  { value: "furniture", label: "أثاث" },
];

const DOC_CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "commercial_registration", label: "سجل تجاري" },
  { value: "tax_certificate", label: "شهادة ضريبة" },
  { value: "zakat_certificate", label: "شهادة زكاة" },
  { value: "chamber_membership", label: "عضوية الغرفة" },
  { value: "national_address", label: "العنوان الوطني" },
  { value: "trademark", label: "علامة تجارية" },
  { value: "other", label: "أخرى" },
];

const docStatus = (expiryDate: string): "valid" | "expiring_soon" | "expired" => {
  const days = daysLeft(expiryDate);
  if (days < 0) return "expired";
  if (days <= 60) return "expiring_soon";
  return "valid";
};

export const Assets: React.FC = () => {
  const {
    companyAssets,
    officialDocuments,
    teamMembers,
    addAsset,
    updateAsset,
    toggleAssetVisibility,
    toggleDocumentVisibility,
    currentUser,
  } = useApp();
  const [tab, setTab] = useState<"assets" | "documents">("assets");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [editingDoc, setEditingDoc] = useState<OfficialDocument | null>(null);
  const [editingAsset, setEditingAsset] = useState<CompanyAsset | null>(null);

  const isOwner = currentUser.role === "owner";
  // Admin sees only what the owner explicitly shared
  const visibleAssets = isOwner
    ? companyAssets
    : companyAssets.filter((a) => a.visibleToAdmin);
  const visibleDocuments = isOwner
    ? officialDocuments
    : officialDocuments.filter((d) => d.visibleToAdmin);

  const filtered = visibleAssets.filter(
    (a) => categoryFilter === "all" || a.category === categoryFilter,
  );
  const totalValue = visibleAssets.reduce((sum, a) => sum + a.value, 0);
  const inUse = visibleAssets.filter((a) => a.status === "in_use").length;
  const expiringDocs = visibleDocuments.filter(
    (d) => docStatus(d.expiryDate) !== "valid",
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            <Box className="text-blue-500" size={24} /> أصول الشركة
          </h1>
          <p className="text-sm text-gray-500">مرجع كامل لأصول ومعدات وأوراق الوكالة الرسمية</p>
        </div>
        {isOwner && (
          <button
            onClick={() => (tab === "assets" ? setShowAdd(true) : setShowAddDoc(true))}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
          >
            <Plus size={16} /> {tab === "assets" ? "إضافة أصل" : "إضافة مستند"}
          </button>
        )}
      </div>

      {!isOwner && (
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
          👁️ تُعرض لك الأصول والمستندات التي حدّدها المالك فقط.
        </p>
      )}

      <div className="flex gap-2 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setTab("assets")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "assets" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
          }`}
        >
          <Box size={15} /> الأصول ({visibleAssets.length})
        </button>
        <button
          onClick={() => setTab("documents")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "documents" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
          }`}
        >
          <FileText size={15} /> الأوراق والتراخيص ({visibleDocuments.length})
        </button>
      </div>

      {tab === "documents" ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="عدد المستندات" value={visibleDocuments.length} icon={FileText} tone="blue" />
            <StatCard label="بحاجة تجديد قريب" value={expiringDocs} icon={FileText} tone="amber" />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">المستند</th>
                  <th className="px-4 py-3 font-medium">الفئة</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">الرقم</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">جهة الإصدار</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">تاريخ الانتهاء</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">المرفق</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  {isOwner && <th className="px-4 py-3 font-medium">ظهور للأدمن</th>}
                  {isOwner && <th className="px-4 py-3 font-medium">تعديل</th>}
                </tr>
              </thead>
              <tbody>
                {visibleDocuments.map((d) => (
                  <tr key={d.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{d.name}</p>
                      {d.notes && <p className="text-xs text-gray-400">{d.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.category} />
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{d.number}</td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{d.issuer}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                      {formatDate(d.expiryDate)}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {d.fileName ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Paperclip size={12} /> {d.fileName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">لا يوجد</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={docStatus(d.expiryDate)} />
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleDocumentVisibility(d.id)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            d.visibleToAdmin
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {d.visibleToAdmin ? <Eye size={12} /> : <EyeOff size={12} />}
                          {d.visibleToAdmin ? "ظاهر" : "مخفي"}
                        </button>
                      </td>
                    )}
                    {isOwner && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingDoc(d)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                        >
                          <Pencil size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {visibleDocuments.length === 0 && (
                  <tr>
                    <td colSpan={isOwner ? 9 : 7} className="px-4 py-8 text-center text-gray-400">
                      لا توجد مستندات مسجّلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {showAddDoc && (
            <Modal title="إضافة مستند رسمي" onClose={() => setShowAddDoc(false)} wide>
              <AddDocumentForm onClose={() => setShowAddDoc(false)} />
            </Modal>
          )}
          {editingDoc && (
            <Modal title={`تعديل المستند — ${editingDoc.name}`} onClose={() => setEditingDoc(null)} wide>
              <AddDocumentForm initial={editingDoc} onClose={() => setEditingDoc(null)} />
            </Modal>
          )}
        </>
      ) : (
      <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="عدد الأصول" value={visibleAssets.length} icon={Box} tone="blue" />
        <StatCard label="القيمة الإجمالية" value={formatCurrency(totalValue)} icon={Box} tone="amber" />
        <StatCard label="قيد الاستخدام" value={inUse} icon={Box} tone="green" />
        <StatCard label="بحاجة تجديد قريب" value={expiringDocs} icon={FileText} tone="red" />
      </div>

      <select
        className={`${inputClass} w-auto`}
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="all">كل الفئات</option>
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">الأصل</th>
              <th className="px-4 py-3 font-medium">الفئة</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">القيمة</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">مُسند إلى</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              {isOwner && <th className="px-4 py-3 font-medium">ظهور للأدمن</th>}
              {isOwner && <th className="px-4 py-3 font-medium">تعديل</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const holder = teamMembers.find((m) => m.id === a.assignedTo);
              return (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{a.name}</p>
                    {a.notes && <p className="text-xs text-gray-400">{a.notes}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.category} />
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    {formatCurrency(a.value)}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                    {holder?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAssetVisibility(a.id)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          a.visibleToAdmin
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {a.visibleToAdmin ? <Eye size={12} /> : <EyeOff size={12} />}
                        {a.visibleToAdmin ? "ظاهر" : "مخفي"}
                      </button>
                    </td>
                  )}
                  {isOwner && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditingAsset(a)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isOwner ? 7 : 5} className="px-4 py-8 text-center text-gray-400">
                  لا توجد أصول مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="إضافة أصل جديد" onClose={() => setShowAdd(false)} wide>
          <AddAssetForm
            onSave={(a) => {
              addAsset(a);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}
      {editingAsset && (
        <Modal title={`تعديل الأصل — ${editingAsset.name}`} onClose={() => setEditingAsset(null)} wide>
          <AddAssetForm
            initial={editingAsset}
            onSave={(a) => {
              updateAsset(editingAsset.id, a);
              setEditingAsset(null);
            }}
            onClose={() => setEditingAsset(null)}
          />
        </Modal>
      )}
      </>
      )}
    </div>
  );
};

const AddDocumentForm: React.FC<{ initial?: OfficialDocument; onClose: () => void }> = ({
  initial,
  onClose,
}) => {
  const { addDocument, updateDocument } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    category: (initial?.category ?? "commercial_registration") as DocumentCategory,
    number: initial?.number ?? "",
    issuer: initial?.issuer ?? "",
    issueDate: initial?.issueDate ?? new Date().toISOString().slice(0, 10),
    expiryDate:
      initial?.expiryDate ?? new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    notes: initial?.notes ?? "",
    fileName: initial?.fileName ?? "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (initial) updateDocument(initial.id, form);
        else addDocument(form);
        onClose();
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-4 flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-5 text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-500"
        >
          <Upload size={22} />
          <span className="text-sm font-medium">
            {form.fileName ? `📎 ${form.fileName}` : "اضغط لرفع ملف المستند (PDF أو صورة)"}
          </span>
          {form.fileName && <span className="text-[11px]">اضغط لاستبدال الملف</span>}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setForm({ ...form, fileName: file.name });
          }}
        />
      </div>
      <FormField label="اسم المستند">
        <input
          required
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </FormField>
      <FormField label="الفئة">
        <select
          className={inputClass}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as DocumentCategory })}
        >
          {DOC_CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="رقم المستند">
        <input
          className={inputClass}
          value={form.number}
          onChange={(e) => setForm({ ...form, number: e.target.value })}
        />
      </FormField>
      <FormField label="جهة الإصدار">
        <input
          className={inputClass}
          value={form.issuer}
          onChange={(e) => setForm({ ...form, issuer: e.target.value })}
        />
      </FormField>
      <FormField label="تاريخ الإصدار">
        <input
          type="date"
          className={inputClass}
          value={form.issueDate}
          onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
        />
      </FormField>
      <FormField label="تاريخ الانتهاء">
        <input
          type="date"
          className={inputClass}
          value={form.expiryDate}
          onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
        />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="ملاحظات">
          <input
            className={inputClass}
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
          حفظ المستند
        </button>
      </div>
    </form>
  );
};

const AddAssetForm: React.FC<{
  initial?: CompanyAsset;
  onSave: (asset: Omit<CompanyAsset, "id">) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const { teamMembers } = useApp();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    category: (initial?.category ?? "equipment") as AssetCategory,
    value: initial?.value ?? 0,
    status: (initial?.status ?? "available") as AssetStatus,
    assignedTo: initial?.assignedTo ?? "",
    acquiredDate: initial?.acquiredDate ?? new Date().toISOString().slice(0, 10),
    notes: initial?.notes ?? "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...form, assignedTo: form.assignedTo || null });
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <FormField label="اسم الأصل">
        <input
          required
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </FormField>
      <FormField label="الفئة">
        <select
          className={inputClass}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as AssetCategory })}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="القيمة (ر.س)">
        <input
          type="number"
          className={inputClass}
          value={form.value}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
        />
      </FormField>
      <FormField label="الحالة">
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as AssetStatus })}
        >
          <option value="available">متاح</option>
          <option value="in_use">قيد الاستخدام</option>
          <option value="maintenance">صيانة</option>
        </select>
      </FormField>
      <FormField label="مُسند إلى (اختياري)">
        <select
          className={inputClass}
          value={form.assignedTo}
          onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
        >
          <option value="">غير مُسند</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="تاريخ الاقتناء">
        <input
          type="date"
          className={inputClass}
          value={form.acquiredDate}
          onChange={(e) => setForm({ ...form, acquiredDate: e.target.value })}
        />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="ملاحظات">
          <input
            className={inputClass}
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
          حفظ الأصل
        </button>
      </div>
    </form>
  );
};
