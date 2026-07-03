import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Download, Pencil, Send, XCircle } from "lucide-react";
import { useApp } from "../state/AppContext";
import { canEditContent } from "../lib/permissions";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency, formatDate } from "../lib/format";
import { companyInfo } from "../data/mockData";
import type { Quotation, QuotationItem } from "../types";

const TAX_RATE = 0.15;

export const QuotationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotations, updateQuotationStatus, setApproval, currentUser } = useApp();
  const [showEdit, setShowEdit] = useState(false);

  const quote = quotations.find((q) => q.id === id);
  if (!quote) return <p className="text-gray-500">لم يتم العثور على العرض.</p>;

  const subtotal = quote.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;
  const canEdit = canEditContent(currentUser);
  const isEditable = quote.status === "draft" || quote.status === "sent";
  const pendingApproval = quote.approval === "pending_approval";
  const rejectedApproval = quote.approval === "rejected";
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
          <span>⏳ هذا العرض بانتظار موافقة الأدمن قبل إرساله للعميل — قدّمه: {quote.createdBy}</span>
          {isApprover && (
            <div className="flex gap-2">
              <button
                onClick={() => setApproval("quotation", quote.id, "approved")}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                اعتماد
              </button>
              <button
                onClick={() => setApproval("quotation", quote.id, "rejected")}
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
          ❌ رفض الأدمن هذا العرض — عدّله ثم أعد تقديمه للموافقة
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">عرض سعر</p>
            <h1 className="text-2xl font-extrabold text-gray-900">{quote.quoteNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">تاريخ الإصدار: {formatDate(quote.issueDate)}</p>
            <p className="text-sm text-gray-500">صالح حتى: {formatDate(quote.validUntil)}</p>
            {quote.createdBy && (
              <p className="text-sm text-gray-500">أنشأه: {quote.createdBy}</p>
            )}
          </div>
          <StatusBadge status={quote.status} className="text-sm" />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-gray-400">من</p>
            <p className="font-semibold text-gray-800">{companyInfo.name}</p>
            <p className="text-sm text-gray-500">{companyInfo.address}</p>
            <p className="text-sm text-gray-500">السجل التجاري: {companyInfo.crNumber}</p>
            <p className="text-sm text-gray-500">الرقم الضريبي: {companyInfo.taxId}</p>
            <p className="text-sm text-gray-500">العنوان الوطني: {companyInfo.nationalAddress}</p>
            <p className="text-sm text-gray-500">
              الممثل: {companyInfo.repName} · <span dir="ltr">{companyInfo.repPhone}</span> · {companyInfo.repEmail}
            </p>
            {companyInfo.website && (
              <p className="text-sm text-gray-500">الموقع: {companyInfo.website}</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-gray-400">إلى</p>
            <p className="font-semibold text-gray-800">{quote.clientName}</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">البند</th>
                <th className="px-4 py-2 font-medium">الكمية</th>
                <th className="px-4 py-2 font-medium">سعر الوحدة</th>
                <th className="px-4 py-2 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((it, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-700">{it.name}</td>
                  <td className="px-4 py-3 text-gray-500">{it.quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{formatCurrency(it.unitPrice)}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">
                    {formatCurrency(it.quantity * it.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-500" colSpan={3}>الإجمالي</td>
                <td className="px-4 py-2 font-medium text-gray-700">{formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-500" colSpan={3}>الضريبة (15%)</td>
                <td className="px-4 py-2 font-medium text-gray-700">{formatCurrency(tax)}</td>
              </tr>
              <tr className="border-t border-gray-100 bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900" colSpan={3}>
                  الإجمالي مع الضريبة 15%
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {quote.notes && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            ملاحظات: {quote.notes}
          </p>
        )}

        {canEdit && (
          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            {quote.status === "draft" && !pendingApproval && !rejectedApproval && (
              <button
                onClick={() => updateQuotationStatus(quote.id, "sent")}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                <Send size={14} /> إرسال للعميل
              </button>
            )}
            {quote.status === "draft" && (pendingApproval || rejectedApproval) && (
              <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-400"
              >
                <Send size={14} /> الإرسال معلّق حتى الموافقة
              </button>
            )}
            {quote.status === "sent" && (
              <>
                <button
                  onClick={() => updateQuotationStatus(quote.id, "accepted")}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  <CheckCircle2 size={14} /> تسجيل القبول
                </button>
                <button
                  onClick={() => updateQuotationStatus(quote.id, "rejected")}
                  className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <XCircle size={14} /> تسجيل الرفض
                </button>
              </>
            )}
            {isEditable && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Pencil size={14} /> تعديل العرض
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
        <Modal title={`تعديل العرض ${quote.quoteNumber}`} onClose={() => setShowEdit(false)} wide>
          <EditQuotationForm quote={quote} onClose={() => setShowEdit(false)} />
        </Modal>
      )}
    </div>
  );
};

const EditQuotationForm: React.FC<{ quote: Quotation; onClose: () => void }> = ({
  quote,
  onClose,
}) => {
  const { serviceCatalog, updateQuotation, currentUser } = useApp();
  const [clientName, setClientName] = useState(quote.clientName);
  const [validUntil, setValidUntil] = useState(quote.validUntil);
  const [notes, setNotes] = useState(quote.notes);
  const [items, setItems] = useState<QuotationItem[]>(quote.items);

  const updateItem = (idx: number, patch: Partial<QuotationItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateQuotation(quote.id, {
          clientName,
          validUntil,
          notes,
          items: items.filter((it) => it.name.trim()),
          // Re-submit a rejected quote for approval when edited by non-approver
          ...(quote.approval === "rejected" &&
          !["owner", "admin"].includes(currentUser.role)
            ? { approval: "pending_approval" as const }
            : {}),
        });
        onClose();
      }}
    >
      <datalist id="edit-quote-service-items">
        {serviceCatalog.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>

      <FormField label="اسم العميل">
        <input
          className={inputClass}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      </FormField>

      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">بنود العرض</span>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                list="edit-quote-service-items"
                className={inputClass}
                placeholder="اسم البند (من شجرة الخدمات)"
                value={it.name}
                onChange={(e) => {
                  const svc = serviceCatalog.find((s) => s.name === e.target.value);
                  updateItem(idx, {
                    name: e.target.value,
                    ...(svc?.price ? { unitPrice: svc.price } : {}),
                  });
                }}
              />
              <input
                type="number"
                min={1}
                className={`${inputClass} w-20`}
                placeholder="كمية"
                value={it.quantity}
                onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
              />
              <input
                type="number"
                className={`${inputClass} w-28`}
                placeholder="سعر الوحدة"
                value={it.unitPrice}
                onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
              />
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                className="rounded-lg px-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { name: "", quantity: 1, unitPrice: 0 }])}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            + إضافة بند
          </button>
          <span className="text-sm font-semibold text-gray-700">الإجمالي: {formatCurrency(total)}</span>
        </div>
      </div>

      <FormField label="صالح حتى">
        <input
          type="date"
          className={inputClass}
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
      </FormField>
      <FormField label="ملاحظات">
        <textarea
          className={inputClass}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
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
          حفظ التعديلات
        </button>
      </div>
    </form>
  );
};
