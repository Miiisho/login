import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Download, Mail, Pencil, Send, XCircle } from "lucide-react";
import { useApp } from "../state/AppContext";
import { canEditContent } from "../lib/permissions";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { Ltr } from "../components/Ltr";
import { formatCurrency, formatDate } from "../lib/format";
import { companyInfo } from "../data/mockData";
import type { Invoice, InvoiceItem } from "../types";

const TAX_RATE = 0.15;

const INVOICE_TYPE_ITEM_LABEL: Record<string, string> = {
  contract: "اشتراك العقد الشهري",
  additional: "فاتورة إضافية",
};

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, clients, projects, teamMembers, updateInvoiceStatus, setApproval, currentUser } =
    useApp();
  const [showSendModal, setShowSendModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [justSentTo, setJustSentTo] = useState<string | null>(null);

  const invoice = invoices.find((i) => i.id === id);
  if (!invoice) return <p className="text-gray-500">لم يتم العثور على الفاتورة.</p>;

  const client = clients.find((c) => c.id === invoice.clientId);
  const project = projects.find((p) => p.id === invoice.projectId);
  const displayItems: InvoiceItem[] =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            name: project?.name ?? INVOICE_TYPE_ITEM_LABEL[invoice.type] ?? "بند الفاتورة",
            quantity: 1,
            unitPrice: invoice.amount,
          },
        ];
  const subtotal = displayItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;
  const canEdit = canEditContent(currentUser);
  const isEditable = invoice.status === "draft" || invoice.status === "sent";
  const pendingApproval = invoice.approval === "pending_approval";
  const rejectedApproval = invoice.approval === "rejected";
  const isApprover = ["owner", "admin"].includes(currentUser.role);

  const projectManager = project
    ? teamMembers.find((m) => m.id === project.assignedTo)
    : teamMembers.find((m) => m.templateId === "pt-pm");
  const fromEmail = projectManager?.email ?? currentUser.email;
  const toEmail = project?.billingEmail || client?.email || "";

  const confirmSend = () => {
    updateInvoiceStatus(invoice.id, "sent");
    setShowSendModal(false);
    setJustSentTo(toEmail);
    setTimeout(() => setJustSentTo(null), 4000);
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate("/invoices")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 print:hidden"
      >
        <ArrowRight size={16} /> العودة إلى العقود والفواتير
      </button>

      {justSentTo && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 print:hidden">
          <CheckCircle2 size={16} /> تم إرسال الفاتورة تلقائيًا إلى <Ltr>{justSentTo}</Ltr> بنجاح
        </div>
      )}

      {pendingApproval && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 print:hidden">
          <span>
            ⏳ هذه الفاتورة بانتظار موافقة الأدمن قبل إرسالها للعميل
            {invoice.submittedBy && ` — قدّمها: ${invoice.submittedBy}`}
          </span>
          {isApprover && (
            <div className="flex gap-2">
              <button
                onClick={() => setApproval("invoice", invoice.id, "approved")}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                اعتماد
              </button>
              <button
                onClick={() => setApproval("invoice", invoice.id, "rejected")}
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
          ❌ رفض الأدمن هذه الفاتورة — عدّلها ثم أعد تقديمها للموافقة
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">فاتورة {invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">تاريخ الإصدار: {formatDate(invoice.invoiceDate)}</p>
            <p className="text-sm text-gray-500">تاريخ الاستحقاق: {formatDate(invoice.dueDate)}</p>
            {invoice.paidDate && (
              <p className="text-sm text-emerald-600">تاريخ السداد: {formatDate(invoice.paidDate)}</p>
            )}
          </div>
          <StatusBadge status={invoice.status} className="text-sm" />
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
            <p className="font-semibold text-gray-800">{client?.name}</p>
            <p className="text-sm text-gray-500">{client?.contactPerson}</p>
            <p className="text-sm text-gray-500">{client?.email}</p>
            {client?.official && (
              <>
                <p className="text-sm text-gray-500">السجل التجاري: {client.official.crNumber}</p>
                <p className="text-sm text-gray-500">الرقم الضريبي: {client.official.taxNumber}</p>
                <p className="text-sm text-gray-500">العنوان الوطني: {client.official.nationalAddress}</p>
              </>
            )}
          </div>
        </div>

        {invoice.createdBy && (
          <p className="mt-4 text-xs text-gray-400">أنشأ الفاتورة: {invoice.createdBy}</p>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100">
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
              {displayItems.map((it, i) => (
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
                <td className="px-4 py-2 font-medium text-gray-700">
                  {formatCurrency(subtotal)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-500" colSpan={3}>الضريبة (15%)</td>
                <td className="px-4 py-2 font-medium text-gray-700">{formatCurrency(tax)}</td>
              </tr>
              <tr className="border-t border-gray-100 bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900" colSpan={3}>
                  الإجمالي مع الضريبة 15%
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {canEdit && (
          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            {invoice.status === "draft" && !pendingApproval && !rejectedApproval && (
              <button
                onClick={() => setShowSendModal(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                <Send size={14} /> إرسال للعميل
              </button>
            )}
            {invoice.status === "draft" && (pendingApproval || rejectedApproval) && (
              <button
                disabled
                className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-400"
              >
                <Send size={14} /> الإرسال معلّق حتى الموافقة
              </button>
            )}
            {(invoice.status === "sent" || invoice.status === "overdue") && (
              <button
                onClick={() => updateInvoiceStatus(invoice.id, "paid")}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <CheckCircle2 size={14} /> تأكيد الدفع
              </button>
            )}
            {isEditable && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Pencil size={14} /> تعديل الفاتورة
              </button>
            )}
            {(invoice.status === "draft" || invoice.status === "sent" || invoice.status === "overdue") && (
              <button
                onClick={() => updateInvoiceStatus(invoice.id, "cancelled")}
                className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <XCircle size={14} /> إلغاء الفاتورة
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

      {showSendModal && (
        <Modal title="إرسال الفاتورة تلقائيًا بالبريد" onClose={() => setShowSendModal(false)}>
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">من (بريد مدير المشروع)</p>
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Mail size={14} className="text-gray-400" />
                <Ltr>{fromEmail}</Ltr>
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">إلى (البريد المسجّل للفوترة عند بدء المشروع)</p>
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Mail size={14} className="text-gray-400" />
                <Ltr>{toEmail || "لا يوجد بريد مسجّل"}</Ltr>
              </p>
            </div>
            <p className="text-xs text-gray-400">
              سيتم إرسال الفاتورة تلقائيًا من بريد مدير المشروع إلى البريد المسجّل عند إنشاء المشروع، فور
              الضغط على تأكيد الإرسال.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSendModal(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={!toEmail}
              onClick={confirmSend}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={14} /> تأكيد الإرسال
            </button>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal title={`تعديل الفاتورة ${invoice.invoiceNumber}`} onClose={() => setShowEdit(false)} wide>
          <EditInvoiceForm invoice={invoice} onClose={() => setShowEdit(false)} />
        </Modal>
      )}
    </div>
  );
};

const EditInvoiceForm: React.FC<{ invoice: Invoice; onClose: () => void }> = ({
  invoice,
  onClose,
}) => {
  const { serviceCatalog, updateInvoice, currentUser } = useApp();
  const [dueDate, setDueDate] = useState(invoice.dueDate);
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [{ name: "بند الفاتورة", quantity: 1, unitPrice: invoice.amount }],
  );

  const updateItem = (idx: number, patch: Partial<InvoiceItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const cleaned = items.filter((it) => it.name.trim());
        updateInvoice(invoice.id, {
          items: cleaned,
          amount: cleaned.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
          dueDate,
          // Re-submit a rejected invoice for approval when edited by non-approver
          ...(invoice.approval === "rejected" &&
          !["owner", "admin"].includes(currentUser.role)
            ? { approval: "pending_approval" as const }
            : {}),
        });
        onClose();
      }}
    >
      <datalist id="invoice-service-items">
        {serviceCatalog.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>

      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">بنود الفاتورة</span>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                list="invoice-service-items"
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

      <FormField label="تاريخ الاستحقاق">
        <input
          type="date"
          className={inputClass}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
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
