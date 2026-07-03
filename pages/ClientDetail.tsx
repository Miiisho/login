import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Pencil, Plus, StickyNote, Wallet } from "lucide-react";
import { useApp } from "../state/AppContext";
import { canEditContent } from "../lib/permissions";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { Ltr } from "../components/Ltr";
import { formatCurrency, formatDate, daysBetween } from "../lib/format";
import type { Invoice, InvoiceType, ProjectLineItem, ProjectType } from "../types";

export const ClientDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, projects, invoices, contracts, addProject, addInvoice, currentUser } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [localNotes, setLocalNotes] = useState<string | null>(null);

  const client = clients.find((c) => c.id === id);
  if (!client) {
    return <p className="text-gray-500">لم يتم العثور على العميل.</p>;
  }

  const clientProjects = projects.filter((p) => p.clientId === client.id);
  const clientContracts = contracts.filter((c) => c.clientId === client.id);
  const clientInvoices = invoices.filter((i) => i.clientId === client.id);
  const contractInvoices = clientInvoices.filter((i) => i.type === "contract");
  const additionalInvoices = clientInvoices.filter((i) => i.type === "additional");
  const projectInvoices = clientInvoices.filter((i) => i.type === "project");
  const totalRevenue = clientInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = clientInvoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);
  const renewalDays = daysBetween(
    new Date().toISOString().slice(0, 10),
    client.contractEndDate,
  );
  const canEdit = canEditContent(currentUser);

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight size={16} /> العودة إلى العملاء
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{client.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{client.contactPerson}</p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
              <span>{client.email}</span>
              <Ltr>{client.phone}</Ltr>
              <span>{client.companyType}</span>
              {client.entityType && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  {client.entityType === "company" ? "شركة" : "فرد"}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={client.status} />
        </div>

        {client.entityType === "company" && client.official && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="mb-2 text-xs font-bold text-blue-700">البيانات الأساسية للشركة</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-600 sm:grid-cols-3">
              <p><span className="text-xs text-gray-400">السجل التجاري: </span>{client.official.crNumber}</p>
              <p><span className="text-xs text-gray-400">الرقم الضريبي: </span>{client.official.taxNumber}</p>
              <p><span className="text-xs text-gray-400">العنوان الوطني: </span>{client.official.nationalAddress}</p>
              <p><span className="text-xs text-gray-400">الممثل: </span>{client.official.repName}</p>
              <p><span className="text-xs text-gray-400">جواله: </span><Ltr>{client.official.repPhone}</Ltr></p>
              <p><span className="text-xs text-gray-400">بريده: </span>{client.official.repEmail}</p>
              {client.official.website && (
                <p><span className="text-xs text-gray-400">الموقع: </span>{client.official.website}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">القيمة الشهرية</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(client.contractValue)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">بداية العقد</p>
            <p className="text-lg font-bold text-gray-900">
              {formatDate(client.contractStartDate)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">تاريخ التجديد</p>
            <p className="text-lg font-bold text-gray-900">
              {formatDate(client.contractEndDate)}{" "}
              <span className="text-xs font-normal text-gray-400">
                ({renewalDays} يوم)
              </span>
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600">إجمالي الإيرادات</p>
            <p className="text-lg font-bold text-emerald-700">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {(client.notes || localNotes) && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            "{localNotes ?? client.notes}"
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
            <button
              onClick={() => setShowAddProject(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              <Plus size={14} /> إضافة مشروع
            </button>
            <button
              onClick={() => setShowAddNote(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <StickyNote size={14} /> إضافة ملاحظة
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">المشاريع مع هذا العميل</h2>
        <div className="space-y-2">
          {clientProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50"
            >
              <span className="font-medium text-gray-700">{p.name}</span>
              <StatusBadge status={p.status} />
            </div>
          ))}
          {clientProjects.length === 0 && (
            <p className="text-sm text-gray-400">لا توجد مشاريع بعد.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Wallet size={18} /> محفظة العميل المالية
          </h2>
          {canEdit && (
            <button
              onClick={() => setShowAddInvoice(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Plus size={14} /> فاتورة عقد / إضافية
            </button>
          )}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600">إجمالي المُحصّل</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs text-amber-600">مستحقات غير مسددة</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">عدد الفواتير</p>
            <p className="text-lg font-bold text-gray-900">{clientInvoices.length}</p>
          </div>
        </div>

        {clientContracts.length > 0 && (
          <div className="mb-4 border-b border-gray-100 pb-4">
            <p className="mb-2 text-sm font-semibold text-gray-600">العقود</p>
            <div className="space-y-1.5">
              {clientContracts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/contracts/${c.id}`)}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700">{c.title}</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(c.value)}</span>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        )}
        <InvoiceGroup
          title="فواتير العقد الأساسي"
          invoices={contractInvoices}
          onOpen={(inv) => navigate(`/invoices/${inv.id}`)}
        />
        <InvoiceGroup
          title="فواتير المشاريع"
          invoices={projectInvoices}
          onOpen={(inv) => navigate(`/invoices/${inv.id}`)}
        />
        <InvoiceGroup
          title="فواتير إضافية"
          invoices={additionalInvoices}
          onOpen={(inv) => navigate(`/invoices/${inv.id}`)}
          isLast
        />
      </div>

      {showAddInvoice && (
        <Modal title="إنشاء فاتورة للعميل" onClose={() => setShowAddInvoice(false)}>
          <ClientInvoiceForm
            onSave={(data) => {
              addInvoice({ ...data, projectId: null, clientId: client.id });
              setShowAddInvoice(false);
            }}
            onClose={() => setShowAddInvoice(false)}
          />
        </Modal>
      )}

      {showEdit && (
        <Modal title="تعديل بيانات العميل" onClose={() => setShowEdit(false)}>
          <p className="text-sm text-gray-500">
            نموذج التعديل متاح هنا في النسخة الكاملة. هذا عرض تفاعلي (Prototype) يوضح مسار الاستخدام.
          </p>
          <button
            onClick={() => setShowEdit(false)}
            className="mt-4 w-full rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            حسنًا
          </button>
        </Modal>
      )}

      {showAddNote && (
        <Modal title="إضافة ملاحظة" onClose={() => setShowAddNote(false)}>
          <NoteForm
            onSave={(note) => {
              setLocalNotes(note);
              setShowAddNote(false);
            }}
            onClose={() => setShowAddNote(false)}
          />
        </Modal>
      )}

      {showAddProject && (
        <Modal title={`إضافة مشروع لـ ${client.name}`} onClose={() => setShowAddProject(false)}>
          <QuickProjectForm
            defaultBillingEmail={client.email}
            onSave={(data) => {
              addProject({
                ...data,
                clientId: client.id,
                progress: 0,
                assignedTo: currentUser.id,
                keyTeamMembers: [],
              });
              setShowAddProject(false);
            }}
            onClose={() => setShowAddProject(false)}
          />
        </Modal>
      )}
    </div>
  );
};

const NoteForm: React.FC<{ onSave: (note: string) => void; onClose: () => void }> = ({
  onSave,
  onClose,
}) => {
  const [note, setNote] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(note);
      }}
    >
      <FormField label="الملاحظة">
        <textarea
          required
          rows={3}
          className={inputClass}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
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

export const QuickProjectForm: React.FC<{
  defaultBillingEmail?: string;
  onSave: (data: {
    name: string;
    description: string;
    budget: number;
    type: ProjectType;
    billingEmail: string;
    lineItems: ProjectLineItem[];
    status: "planning";
    startDate: string;
    endDate: string;
  }) => void;
  onClose: () => void;
}> = ({ defaultBillingEmail, onSave, onClose }) => {
  const { serviceCatalog } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(0);
  const [type, setType] = useState<ProjectType>("service");
  const [billingEmail, setBillingEmail] = useState(defaultBillingEmail ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [lineItems, setLineItems] = useState<{ name: string; quantity: number }[]>([
    { name: "", quantity: 1 },
  ]);

  const updateItem = (idx: number, patch: Partial<{ name: string; quantity: number }>) =>
    setLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const items: ProjectLineItem[] = lineItems
          .filter((it) => it.name.trim())
          .map((it, i) => ({
            id: `li-new-${Date.now()}-${i}`,
            name: it.name.trim(),
            quantity: it.quantity,
            status: "pending",
          }));
        onSave({
          name,
          description,
          budget,
          type,
          billingEmail,
          lineItems: items,
          status: "planning",
          startDate,
          endDate,
        });
      }}
    >
      <FormField label="اسم المشروع">
        <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="الوصف">
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <FormField label="تصنيف المشروع">
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as ProjectType)}>
          <option value="service">تقديم خدمة</option>
          <option value="supply">توريد</option>
          <option value="third_party">طرف ثالث</option>
        </select>
      </FormField>
      <FormField label="الميزانية (ر.س)">
        <input
          type="number"
          required
          className={inputClass}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
      </FormField>
      <FormField label="البريد الإلكتروني لإرسال الفواتير (يُسجَّل مرة واحدة)">
        <input
          type="email"
          required
          className={inputClass}
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
        />
      </FormField>
      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          بنود المشروع (من شجرة الخدمات، مع الكميات لتتبع حالتها)
        </span>
        <datalist id="project-service-items">
          {serviceCatalog
            .filter((s) => s.type === type)
            .map((s) => (
              <option key={s.id} value={s.name} />
            ))}
        </datalist>
        <div className="space-y-2">
          {lineItems.map((it, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                list="project-service-items"
                className={inputClass}
                placeholder="اسم البند (من شجرة الخدمات)"
                value={it.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
              />
              <input
                type="number"
                min={1}
                className={`${inputClass} w-24`}
                placeholder="الكمية"
                value={it.quantity}
                onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
              />
              <button
                type="button"
                onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                className="rounded-lg px-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLineItems((prev) => [...prev, { name: "", quantity: 1 }])}
          className="mt-2 text-sm font-medium text-blue-600 hover:underline"
        >
          + إضافة بند
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="تاريخ البداية">
          <input
            type="date"
            className={inputClass}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </FormField>
        <FormField label="تاريخ النهاية">
          <input
            type="date"
            className={inputClass}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </FormField>
      </div>
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
          حفظ المشروع
        </button>
      </div>
    </form>
  );
};

const InvoiceGroup: React.FC<{
  title: string;
  invoices: Invoice[];
  onOpen: (invoice: Invoice) => void;
  isLast?: boolean;
}> = ({ title, invoices, onOpen, isLast }) => (
  <div className={isLast ? "" : "mb-4 border-b border-gray-100 pb-4"}>
    <p className="mb-2 text-sm font-semibold text-gray-600">{title}</p>
    <div className="space-y-1.5">
      {invoices.map((inv) => (
        <div
          key={inv.id}
          onClick={() => onOpen(inv)}
          className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <span className="font-medium text-gray-700">{inv.invoiceNumber}</span>
          <span className="text-xs text-gray-400">{formatDate(inv.invoiceDate)}</span>
          <span className="font-semibold text-gray-800">{formatCurrency(inv.amount)}</span>
          <StatusBadge status={inv.status} />
        </div>
      ))}
      {invoices.length === 0 && (
        <p className="text-xs text-gray-400">لا توجد فواتير من هذا النوع.</p>
      )}
    </div>
  </div>
);

const ClientInvoiceForm: React.FC<{
  onSave: (data: Omit<Invoice, "id" | "projectId" | "clientId">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { currentUser } = useApp();
  const [type, setType] = useState<InvoiceType>("contract");
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          type,
          amount,
          dueDate,
          invoiceNumber: `INV-${Math.floor(Math.random() * 900 + 100)}`,
          invoiceDate: new Date().toISOString().slice(0, 10),
          status: "draft",
          paidDate: null,
          createdBy: currentUser.name,
          submittedBy: currentUser.name,
          approval: ["owner", "admin"].includes(currentUser.role)
            ? "approved"
            : "pending_approval",
        });
      }}
    >
      <FormField label="نوع الفاتورة">
        <select
          className={inputClass}
          value={type}
          onChange={(e) => setType(e.target.value as InvoiceType)}
        >
          <option value="contract">فاتورة عقد (اشتراك شهري)</option>
          <option value="additional">فاتورة إضافية</option>
        </select>
      </FormField>
      <FormField label="المبلغ (ر.س)">
        <input
          type="number"
          required
          className={inputClass}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </FormField>
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
          إنشاء الفاتورة
        </button>
      </div>
    </form>
  );
};
