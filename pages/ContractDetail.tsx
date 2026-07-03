import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Download, FileSignature, Pencil } from "lucide-react";
import { useApp } from "../state/AppContext";
import { canEditContent } from "../lib/permissions";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency, formatDate } from "../lib/format";
import { companyInfo } from "../data/mockData";
import type { Contract } from "../types";

export const ContractDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contracts, clients, projects, updateContractStatus, setApproval, currentUser } =
    useApp();
  const [showEdit, setShowEdit] = useState(false);

  const contract = contracts.find((c) => c.id === id);
  if (!contract) return <p className="text-gray-500">لم يتم العثور على العقد.</p>;

  const client = clients.find((c) => c.id === contract.clientId);
  const project = projects.find((p) => p.id === contract.projectId);
  const canEdit = canEditContent(currentUser);
  const isEditable = contract.status === "draft" || contract.status === "active";
  const pendingApproval = contract.approval === "pending_approval";
  const rejectedApproval = contract.approval === "rejected";
  const isApprover = ["owner", "admin"].includes(currentUser.role);

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate("/invoices")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 print:hidden"
      >
        <ArrowRight size={16} /> العودة إلى العقود والفواتير
      </button>

      {pendingApproval && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 print:hidden">
          <span>
            ⏳ هذا العقد بانتظار موافقة الأدمن قبل اعتماده
            {contract.submittedBy && ` — قدّمه: ${contract.submittedBy}`}
          </span>
          {isApprover && (
            <div className="flex gap-2">
              <button
                onClick={() => setApproval("contract", contract.id, "approved")}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                اعتماد
              </button>
              <button
                onClick={() => setApproval("contract", contract.id, "rejected")}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                رفض
              </button>
            </div>
          )}
        </div>
      )}
      {rejectedApproval && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
          ❌ رفض الأدمن هذا العقد — عدّله ثم أعد تقديمه للموافقة
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6 text-center">
          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">نموذج عقد</p>
            <h1 className="mt-1 text-2xl font-extrabold text-gray-900">{contract.title}</h1>
            <div className="mt-2 flex justify-center">
              <StatusBadge status={contract.status} className="text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-gray-400">الطرف الأول (الوكالة)</p>
            <p className="font-semibold text-gray-800">{companyInfo.name}</p>
            <p className="text-sm text-gray-500">{companyInfo.address}</p>
            <p className="text-sm text-gray-500">السجل التجاري: {companyInfo.crNumber}</p>
            <p className="text-sm text-gray-500">الرقم الضريبي: {companyInfo.taxId}</p>
            <p className="text-sm text-gray-500">العنوان الوطني: {companyInfo.nationalAddress}</p>
            <p className="text-sm text-gray-500">
              الممثل: {companyInfo.repName} · <span dir="ltr">{companyInfo.repPhone}</span>
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-gray-400">الطرف الثاني (العميل)</p>
            <p className="font-semibold text-gray-800">{client?.name}</p>
            <p className="text-sm text-gray-500">{client?.contactPerson}</p>
            <p className="text-sm text-gray-500">{client?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">قيمة العقد</p>
            <p className="text-sm font-bold text-gray-900">
              {formatCurrency(contract.value)}
              {contract.billingCycle === "monthly" && (
                <span className="font-normal text-gray-400"> / شهريًا</span>
              )}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">تاريخ البداية</p>
            <p className="text-sm font-bold text-gray-900">{formatDate(contract.startDate)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">تاريخ النهاية</p>
            <p className="text-sm font-bold text-gray-900">{formatDate(contract.endDate)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">المشروع المرتبط</p>
            <p className="text-sm font-bold text-gray-900">{project?.name ?? "غير مرتبط"}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-1 text-sm font-bold text-gray-900">أولًا: نطاق العمل</p>
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            {contract.scope || "يُحدَّد نطاق العمل بالتفصيل حسب اتفاق الطرفين."}
          </p>
        </div>

        <div className="mt-4">
          <p className="mb-1 text-sm font-bold text-gray-900">ثانيًا: الشروط والأحكام</p>
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            {contract.terms || "تخضع هذه الاتفاقية لأحكام النظام السعودي، ويلتزم الطرفان بالسرية التامة لأي معلومات يتم تبادلها خلال فترة العقد."}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-gray-100 pt-6 sm:grid-cols-2">
          <div className="text-center">
            <p className="mb-8 text-sm font-semibold text-gray-700">توقيع الطرف الأول</p>
            <div className="border-t border-gray-300 pt-1 text-xs text-gray-400">{companyInfo.name}</div>
          </div>
          <div className="text-center">
            <p className="mb-8 text-sm font-semibold text-gray-700">توقيع الطرف الثاني</p>
            <div className="border-t border-gray-300 pt-1 text-xs text-gray-400">{client?.name}</div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-8 flex flex-wrap gap-2 print:hidden">
            {contract.status === "draft" && !pendingApproval && !rejectedApproval && (
              <button
                onClick={() => updateContractStatus(contract.id, "active")}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                <FileSignature size={14} /> تفعيل العقد (موقّع)
              </button>
            )}
            {contract.status === "draft" && (pendingApproval || rejectedApproval) && (
              <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-400"
              >
                <FileSignature size={14} /> التفعيل معلّق حتى الموافقة
              </button>
            )}
            {contract.status === "active" && (
              <button
                onClick={() => updateContractStatus(contract.id, "terminated")}
                className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                فسخ العقد
              </button>
            )}
            {isEditable && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Pencil size={14} /> تعديل العقد
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Download size={14} /> تحميل PDF
            </button>
          </div>
        )}
      </div>

      {showEdit && (
        <Modal title={`تعديل العقد`} onClose={() => setShowEdit(false)} wide>
          <EditContractForm contract={contract} onClose={() => setShowEdit(false)} />
        </Modal>
      )}
    </div>
  );
};

const EditContractForm: React.FC<{ contract: Contract; onClose: () => void }> = ({
  contract,
  onClose,
}) => {
  const { updateContract } = useApp();
  const [form, setForm] = useState({
    title: contract.title,
    value: contract.value,
    billingCycle: contract.billingCycle,
    startDate: contract.startDate,
    endDate: contract.endDate,
    scope: contract.scope,
    terms: contract.terms,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateContract(contract.id, form);
        onClose();
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <FormField label="عنوان العقد">
          <input
            required
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </FormField>
      </div>
      <FormField label="نوع الفوترة">
        <select
          className={inputClass}
          value={form.billingCycle}
          onChange={(e) =>
            setForm({ ...form, billingCycle: e.target.value as Contract["billingCycle"] })
          }
        >
          <option value="monthly">اشتراك شهري متكرر</option>
          <option value="one-time">دفعة واحدة</option>
        </select>
      </FormField>
      <FormField label="قيمة العقد (ر.س)">
        <input
          type="number"
          required
          className={inputClass}
          value={form.value}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
        />
      </FormField>
      <FormField label="تاريخ البداية">
        <input
          type="date"
          className={inputClass}
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
      </FormField>
      <FormField label="تاريخ النهاية">
        <input
          type="date"
          className={inputClass}
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="نطاق العمل">
          <textarea
            className={inputClass}
            rows={2}
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
          />
        </FormField>
      </div>
      <div className="sm:col-span-2">
        <FormField label="الشروط والأحكام">
          <textarea
            className={inputClass}
            rows={2}
            value={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.value })}
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
          حفظ التعديلات
        </button>
      </div>
    </form>
  );
};
