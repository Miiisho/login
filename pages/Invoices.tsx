import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Search } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency, formatDate } from "../lib/format";
import type { Contract, Purchase, Quotation, QuotationItem } from "../types";

export type FinanceTab = "quotations" | "contracts" | "invoices" | "purchases";

export const Invoices: React.FC<{ initialTab?: FinanceTab }> = ({ initialTab }) => {
  const {
    invoices,
    contracts,
    quotations,
    purchases,
    clients,
    currentUser,
    addContract,
    addQuotation,
    addPurchase,
    updatePurchase,
  } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<FinanceTab>(initialTab ?? "quotations");
  const [statusFilter, setStatusFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddContract, setShowAddContract] = useState(false);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const canManage = currentUser.role !== "team_member";
  const searchQ = search.trim();

  const filteredPurchases = purchases.filter(
    (p) =>
      (statusFilter === "all" || p.status === statusFilter) &&
      (!searchQ ||
        p.item.includes(searchQ) ||
        p.vendorName.includes(searchQ) ||
        p.category.includes(searchQ)),
  );
  const purchaseTotal = (p: Purchase) => p.quantity * p.unitPrice;

  const creators = [...new Set(quotations.map((q) => q.createdBy).filter(Boolean))];

  const filteredInvoices = invoices.filter(
    (i) =>
      (statusFilter === "all" || i.status === statusFilter) &&
      (!searchQ ||
        i.invoiceNumber.includes(searchQ) ||
        (clients.find((c) => c.id === i.clientId)?.name ?? "").includes(searchQ)),
  );
  const filteredContracts = contracts.filter(
    (c) =>
      (statusFilter === "all" || c.status === statusFilter) &&
      (!searchQ ||
        c.title.includes(searchQ) ||
        (clients.find((cl) => cl.id === c.clientId)?.name ?? "").includes(searchQ)),
  );
  const filteredQuotations = quotations.filter(
    (q) =>
      (statusFilter === "all" || q.status === statusFilter) &&
      (creatorFilter === "all" || q.createdBy === creatorFilter) &&
      (!searchQ || q.quoteNumber.includes(searchQ) || q.clientName.includes(searchQ)),
  );
  const quoteTotal = (q: Quotation) =>
    q.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">العقود والفواتير</h1>
          <p className="text-xs text-gray-400">مالية ومحاسبة</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              if (tab === "contracts") setShowAddContract(true);
              else if (tab === "quotations") setShowAddQuote(true);
              else if (tab === "purchases") setShowAddPurchase(true);
              else navigate("/projects");
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
          >
            <Plus size={16} />{" "}
            {tab === "contracts"
              ? "إنشاء عقد جديد"
              : tab === "quotations"
                ? "إنشاء عرض سعر"
                : tab === "purchases"
                  ? "تسجيل عملية شراء"
                  : "إنشاء فاتورة من مشروع"}
          </button>
        )}
      </div>

      <div className="flex gap-2 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => {
            setTab("quotations");
            setStatusFilter("all");
          }}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "quotations" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
          }`}
        >
          عروض الأسعار ({quotations.length})
        </button>
        <button
          onClick={() => {
            setTab("contracts");
            setStatusFilter("all");
          }}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "contracts" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
          }`}
        >
          العقود ({contracts.length})
        </button>
        <button
          onClick={() => {
            setTab("invoices");
            setStatusFilter("all");
          }}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "invoices" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
          }`}
        >
          الفواتير ({invoices.length})
        </button>
        <button
          onClick={() => {
            setTab("purchases");
            setStatusFilter("all");
          }}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "purchases" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
          }`}
        >
          المشتريات ({purchases.length})
        </button>
      </div>

      {/* ملخص سريع للوحدة الحالية (لوحة تحكم مصغّرة) */}
      <div className="grid grid-cols-3 gap-3">
        {(tab === "quotations"
          ? [
              { label: "قيد التنفيذ", value: quotations.filter((q) => ["draft", "sent"].includes(q.status)).length, cls: "text-blue-600" },
              { label: "مقبولة", value: quotations.filter((q) => q.status === "accepted").length, cls: "text-emerald-600" },
              { label: "إجمالي القيمة", value: formatCurrency(quotations.reduce((s, q) => s + quoteTotal(q), 0)), cls: "text-gray-900" },
            ]
          : tab === "contracts"
            ? [
                { label: "نشطة", value: contracts.filter((c) => c.status === "active").length, cls: "text-emerald-600" },
                { label: "مسودة", value: contracts.filter((c) => c.status === "draft").length, cls: "text-blue-600" },
                { label: "منتهية / مفسوخة", value: contracts.filter((c) => ["expired", "terminated"].includes(c.status)).length, cls: "text-gray-500" },
              ]
            : tab === "purchases"
              ? [
                  { label: "قيد التنفيذ", value: purchases.filter((p) => ["requested", "ordered"].includes(p.status)).length, cls: "text-blue-600" },
                  { label: "مكتملة", value: purchases.filter((p) => ["received", "paid"].includes(p.status)).length, cls: "text-emerald-600" },
                  { label: "إجمالي المصروف", value: formatCurrency(purchases.reduce((s, p) => s + purchaseTotal(p), 0)), cls: "text-gray-900" },
                ]
              : [
                  { label: "قيد التنفيذ", value: invoices.filter((i) => ["draft", "sent"].includes(i.status)).length, cls: "text-blue-600" },
                  { label: "مدفوعة", value: invoices.filter((i) => i.status === "paid").length, cls: "text-emerald-600" },
                  { label: "متأخرة", value: invoices.filter((i) => i.status === "overdue").length, cls: "text-red-600" },
                ]
        ).map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <p className={`text-lg font-extrabold ${s.cls}`}>{s.value}</p>
            <p className="text-[11px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* فلاتر موحدة في سطر واحد: بحث ثم الحالة ثم المُنشئ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pr-9`}
            placeholder="بحث ذكي برقم المستند أو اسم العميل أو البند..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          {(tab === "quotations"
            ? [
                ["draft", "مسودة"],
                ["sent", "مرسلة"],
                ["accepted", "مقبول"],
                ["rejected", "مرفوض"],
              ]
            : tab === "contracts"
              ? [
                  ["draft", "مسودة"],
                  ["active", "نشط"],
                  ["expired", "منتهي"],
                  ["terminated", "مفسوخ"],
                ]
              : tab === "purchases"
                ? [
                    ["requested", "مطلوب"],
                    ["ordered", "تم الطلب"],
                    ["received", "تم الاستلام"],
                    ["paid", "مدفوع"],
                    ["cancelled", "ملغية"],
                  ]
                : [
                    ["draft", "مسودة"],
                    ["sent", "مرسلة"],
                    ["paid", "مدفوعة"],
                    ["overdue", "متأخرة"],
                    ["cancelled", "ملغية"],
                  ]
          ).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {tab === "quotations" && (
          <select
            className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            value={creatorFilter}
            onChange={(e) => setCreatorFilter(e.target.value)}
          >
            <option value="all">كل المُنشئين</option>
            {creators.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {tab === "quotations" ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">أنشأه</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">تاريخ الإصدار</th>
                  <th className="px-4 py-3 font-medium">القيمة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => navigate(`/quotations/${q.id}`)}
                    className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{q.quoteNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{q.clientName}</td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{q.createdBy}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                      {formatDate(q.issueDate)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {formatCurrency(quoteTotal(q))}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap items-center gap-1">
                        <StatusBadge status={q.status} />
                        {(q.approval === "pending_approval" || q.approval === "rejected") && (
                          <StatusBadge status={q.approval} className="text-[10px]" />
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredQuotations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      لا توجد عروض أسعار مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === "contracts" ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">العقد</th>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">القيمة</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">الفترة</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((c) => {
                  const client = clients.find((cl) => cl.id === c.clientId);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/contracts/${c.id}`)}
                      className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                      <td className="px-4 py-3 text-gray-600">{client?.name}</td>
                      <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                        {formatCurrency(c.value)}
                        {c.billingCycle === "monthly" ? " / شهريًا" : ""}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                        {formatDate(c.startDate)} - {formatDate(c.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  );
                })}
                {filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      لا توجد عقود مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : tab === "purchases" ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">البند</th>
                  <th className="px-4 py-3 font-medium">المورد / الجهة</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">الفئة</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">الكمية</th>
                  <th className="px-4 py-3 font-medium">الإجمالي</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">أنشأه</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.item}</p>
                      {p.notes && <p className="text-xs text-gray-400">{p.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.vendorName}</td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{p.category}</td>
                    <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{p.quantity}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {formatCurrency(purchaseTotal(p))}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{p.createdBy}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap items-center gap-1">
                        <StatusBadge status={p.status} />
                        {(p.approval === "pending_approval" || p.approval === "rejected") && (
                          <StatusBadge status={p.approval} className="text-[10px]" />
                        )}
                        {canManage && (
                          <button
                            onClick={() => setEditingPurchase(p)}
                            className="rounded p-1 text-gray-300 hover:bg-blue-50 hover:text-blue-500"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPurchases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      لا توجد مشتريات مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">تاريخ الاستحقاق</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const client = clients.find((c) => c.id === inv.clientId);
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{client?.name}</td>
                      <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex flex-wrap items-center gap-1">
                          <StatusBadge status={inv.status} />
                          {(inv.approval === "pending_approval" || inv.approval === "rejected") && (
                            <StatusBadge status={inv.approval} className="text-[10px]" />
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      لا توجد فواتير مطابقة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAddContract && (
        <Modal title="إنشاء عقد جديد" onClose={() => setShowAddContract(false)} wide>
          <AddContractForm
            onSave={(contract) => {
              addContract(contract);
              setShowAddContract(false);
            }}
            onClose={() => setShowAddContract(false)}
          />
        </Modal>
      )}

      {showAddQuote && (
        <Modal title="إنشاء عرض سعر" onClose={() => setShowAddQuote(false)} wide>
          <AddQuotationForm
            onSave={(quote) => {
              addQuotation(quote);
              setShowAddQuote(false);
            }}
            onClose={() => setShowAddQuote(false)}
          />
        </Modal>
      )}

      {showAddPurchase && (
        <Modal title="تسجيل عملية شراء" onClose={() => setShowAddPurchase(false)} wide>
          <AddPurchaseForm
            onSave={(purchase) => {
              addPurchase(purchase);
              setShowAddPurchase(false);
            }}
            onClose={() => setShowAddPurchase(false)}
          />
        </Modal>
      )}

      {editingPurchase && (
        <Modal title={`تعديل عملية الشراء — ${editingPurchase.item}`} onClose={() => setEditingPurchase(null)} wide>
          <AddPurchaseForm
            initial={editingPurchase}
            onSave={(purchase) => {
              updatePurchase(editingPurchase.id, purchase);
              setEditingPurchase(null);
            }}
            onClose={() => setEditingPurchase(null)}
          />
        </Modal>
      )}
    </div>
  );
};

const PURCHASE_CATEGORIES = ["توريد", "طرف ثالث", "برمجيات", "رخصة", "معدات", "خدمة", "أخرى"];

const AddPurchaseForm: React.FC<{
  initial?: Purchase;
  onSave: (purchase: Omit<Purchase, "id">) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const { vendors, projects, currentUser } = useApp();
  const [form, setForm] = useState({
    item: initial?.item ?? "",
    vendorId: initial?.vendorId ?? "",
    vendorName: initial?.vendorName ?? "",
    category: initial?.category ?? PURCHASE_CATEGORIES[0],
    quantity: initial?.quantity ?? 1,
    unitPrice: initial?.unitPrice ?? 0,
    status: (initial?.status ?? "requested") as Purchase["status"],
    orderDate: initial?.orderDate ?? new Date().toISOString().slice(0, 10),
    projectId: initial?.projectId ?? "",
    notes: initial?.notes ?? "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const vendor = vendors.find((v) => v.id === form.vendorId);
        onSave({
          item: form.item,
          vendorId: form.vendorId || null,
          vendorName: vendor?.name || form.vendorName,
          category: form.category,
          quantity: form.quantity,
          unitPrice: form.unitPrice,
          status: form.status,
          orderDate: form.orderDate,
          projectId: form.projectId || null,
          createdBy: initial?.createdBy ?? currentUser.name,
          notes: form.notes,
          approval: initial
            ? initial.approval
            : ["owner", "admin"].includes(currentUser.role)
              ? "approved"
              : "pending_approval",
        });
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <FormField label="البند / الوصف">
          <input
            required
            className={inputClass}
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
          />
        </FormField>
      </div>
      <FormField label="المورد (من القائمة)">
        <select
          className={inputClass}
          value={form.vendorId}
          onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
        >
          <option value="">— جهة خارجية (اكتب الاسم) —</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </FormField>
      {!form.vendorId && (
        <FormField label="اسم الجهة">
          <input
            className={inputClass}
            value={form.vendorName}
            onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
          />
        </FormField>
      )}
      <FormField label="الفئة">
        <select
          className={inputClass}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {PURCHASE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="الكمية">
        <input
          type="number"
          min={1}
          className={inputClass}
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
        />
      </FormField>
      <FormField label="سعر الوحدة (ر.س)">
        <input
          type="number"
          className={inputClass}
          value={form.unitPrice}
          onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
        />
      </FormField>
      <FormField label="الحالة">
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as Purchase["status"] })}
        >
          <option value="requested">مطلوب</option>
          <option value="ordered">تم الطلب</option>
          <option value="received">تم الاستلام</option>
          <option value="paid">مدفوع</option>
        </select>
      </FormField>
      <FormField label="مرتبط بمشروع (اختياري)">
        <select
          className={inputClass}
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
        >
          <option value="">مشترى داخلي / عام</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="تاريخ الطلب">
        <input
          type="date"
          className={inputClass}
          value={form.orderDate}
          onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
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
      <div className="flex items-center justify-between pt-2 sm:col-span-2">
        <span className="text-sm font-semibold text-gray-700">
          الإجمالي: {formatCurrency(form.quantity * form.unitPrice)}
        </span>
        <div className="flex gap-2">
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
            حفظ عملية الشراء
          </button>
        </div>
      </div>
    </form>
  );
};

const AddQuotationForm: React.FC<{
  onSave: (quote: Omit<Quotation, "id">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { clients, serviceCatalog, currentUser } = useApp();
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([{ name: "", quantity: 1, unitPrice: 0 }]);

  const updateItem = (idx: number, patch: Partial<QuotationItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const selectedClient = clients.find((c) => c.id === clientId);
        onSave({
          quoteNumber: `QT-${Math.floor(Math.random() * 900 + 100)}`,
          clientName: selectedClient?.name || clientName,
          clientId: clientId || null,
          dealId: null,
          issueDate: new Date().toISOString().slice(0, 10),
          validUntil,
          items: items.filter((it) => it.name.trim()),
          status: "draft",
          notes,
          createdBy: currentUser.name,
          createdById: currentUser.id,
          approval: ["owner", "admin"].includes(currentUser.role)
            ? "approved"
            : "pending_approval",
        });
      }}
    >
      <datalist id="quote-service-items">
        {serviceCatalog.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>
      <FormField label="العميل (من القائمة أو اسم جديد)">
        <select
          className={`${inputClass} mb-2`}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">— عميل محتمل جديد (اكتب الاسم) —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {!clientId && (
          <input
            className={inputClass}
            placeholder="اسم العميل المحتمل"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        )}
      </FormField>

      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">بنود العرض</span>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                list="quote-service-items"
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
          <span className="text-sm font-semibold text-gray-700">
            الإجمالي: {formatCurrency(total)}
          </span>
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
          حفظ العرض
        </button>
      </div>
    </form>
  );
};

const AddContractForm: React.FC<{
  onSave: (contract: Omit<Contract, "id">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { clients, projects, currentUser } = useApp();
  const [form, setForm] = useState({
    clientId: clients[0]?.id ?? "",
    projectId: "",
    title: "",
    value: 0,
    billingCycle: "monthly" as Contract["billingCycle"],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    scope: "",
    terms: "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          projectId: form.projectId || null,
          status: "draft",
          createdDate: new Date().toISOString().slice(0, 10),
          approval: ["owner", "admin"].includes(currentUser.role)
            ? "approved"
            : "pending_approval",
          submittedBy: currentUser.name,
        });
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <FormField label="عنوان العقد">
        <input
          required
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </FormField>
      <FormField label="العميل">
        <select
          className={inputClass}
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="مرتبط بمشروع (اختياري)">
        <select
          className={inputClass}
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
        >
          <option value="">بدون ربط</option>
          {projects
            .filter((p) => p.clientId === form.clientId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </FormField>
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
      <div className="grid grid-cols-2 gap-4">
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
      </div>
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
          حفظ العقد
        </button>
      </div>
    </form>
  );
};
