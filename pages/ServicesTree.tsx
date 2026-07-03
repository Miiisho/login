import React, { useState } from "react";
import { ChevronDown, ChevronLeft, Layers, Pencil, Plus } from "lucide-react";
import { useApp } from "../state/AppContext";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency } from "../lib/format";
import type { ProjectType, ServiceItem } from "../types";

const CATEGORIES: { key: ProjectType; label: string; hint: string }[] = [
  { key: "service", label: "تقديم خدمة", hint: "خدمات تُنفَّذ داخليًا عبر فريق الوكالة" },
  { key: "supply", label: "توريد", hint: "توريد منتجات أو أنظمة جاهزة للعميل" },
  { key: "third_party", label: "طرف ثالث", hint: "تُنفَّذ عبر موردين أو مستقلين خارجيين" },
];

export const ServicesTree: React.FC = () => {
  const { serviceCatalog, addService } = useApp();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    service: true,
    supply: true,
    third_party: true,
  });
  const [addFor, setAddFor] = useState<ProjectType | null>(null);
  const [editing, setEditing] = useState<ServiceItem | null>(null);

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <Layers className="text-blue-500" size={24} /> شجرة الخدمات والمنتجات
        </h1>
        <p className="text-sm text-gray-500">
          التصنيف والتسعير الموحد — الأسعار هنا تُقترح تلقائيًا في الفواتير وعروض الأسعار
        </p>
      </div>

      {/* ملخص سريع للوحدة */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-sm">
          <p className="text-lg font-extrabold text-blue-600">{serviceCatalog.length}</p>
          <p className="text-[11px] text-gray-400">إجمالي الخدمات</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-sm">
          <p className="text-lg font-extrabold text-emerald-600">
            {serviceCatalog.filter((s) => s.price).length}
          </p>
          <p className="text-[11px] text-gray-400">خدمات مسعّرة</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-sm">
          <p className="text-lg font-extrabold text-gray-900">
            {formatCurrency(serviceCatalog.reduce((s, it) => s + (it.price ?? 0), 0))}
          </p>
          <p className="text-[11px] text-gray-400">مجموع أسعار الكتالوج</p>
        </div>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const items = serviceCatalog.filter((s) => s.type === cat.key);
          return (
            <div key={cat.key} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <button
                onClick={() => toggle(cat.key)}
                className="flex w-full items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-2">
                  {expanded[cat.key] ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">{cat.label}</p>
                    <p className="text-xs text-gray-400">{cat.hint}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                  {items.length} خدمة
                </span>
              </button>

              {expanded[cat.key] && (
                <div className="border-t border-gray-100 px-6 py-4">
                  <div className="space-y-2">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{s.name}</p>
                          {s.description && (
                            <p className="mt-0.5 text-xs text-gray-400">{s.description}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            {s.price ? formatCurrency(s.price) : "بدون سعر"}
                          </span>
                          <button
                            onClick={() => setEditing(s)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-sm text-gray-400">لا توجد خدمات مضافة بعد.</p>
                    )}
                  </div>
                  <button
                    onClick={() => setAddFor(cat.key)}
                    className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                  >
                    <Plus size={14} /> إضافة خدمة ضمن "{cat.label}"
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addFor && (
        <Modal
          title={`إضافة خدمة ضمن "${CATEGORIES.find((c) => c.key === addFor)?.label}"`}
          onClose={() => setAddFor(null)}
        >
          <AddServiceForm
            type={addFor}
            onSave={(service) => {
              addService(service);
              setAddFor(null);
            }}
            onClose={() => setAddFor(null)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={`تعديل الخدمة — ${editing.name}`} onClose={() => setEditing(null)}>
          <EditServiceForm service={editing} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
};

const AddServiceForm: React.FC<{
  type: ProjectType;
  onSave: (service: Omit<ServiceItem, "id">) => void;
  onClose: () => void;
}> = ({ type, onSave, onClose }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ type, name, description, price });
      }}
    >
      <FormField label="اسم الخدمة">
        <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="السعر (ر.س) — يُقترح تلقائيًا في الفواتير وعروض الأسعار">
        <input
          type="number"
          className={inputClass}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </FormField>
      <FormField label="الوصف (اختياري)">
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          حفظ
        </button>
      </div>
    </form>
  );
};

/** تعديل الخدمة مع الربط الديناميكي: عند تغيير السعر يسأل النظام عن تحديث المستندات المفتوحة */
const EditServiceForm: React.FC<{ service: ServiceItem; onClose: () => void }> = ({
  service,
  onClose,
}) => {
  const { quotations, invoices, updateService, updateQuotation, updateInvoice } = useApp();
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description);
  const [price, setPrice] = useState(service.price ?? 0);
  const [askPropagate, setAskPropagate] = useState(false);

  // المستندات المفتوحة (غير المُغلقة نهائيًا) التي تحتوي هذا البند
  const openQuotes = quotations.filter(
    (q) => ["draft", "sent"].includes(q.status) && q.items.some((it) => it.name === service.name),
  );
  const openInvoices = invoices.filter(
    (i) => i.status === "draft" && (i.items ?? []).some((it) => it.name === service.name),
  );
  const openCount = openQuotes.length + openInvoices.length;

  const saveService = () => updateService(service.id, { name, description, price });

  const propagate = () => {
    openQuotes.forEach((q) =>
      updateQuotation(q.id, {
        items: q.items.map((it) => (it.name === service.name ? { ...it, unitPrice: price } : it)),
      }),
    );
    openInvoices.forEach((i) => {
      const items = (i.items ?? []).map((it) =>
        it.name === service.name ? { ...it, unitPrice: price } : it,
      );
      updateInvoice(i.id, {
        items,
        amount: items.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
      });
    });
  };

  if (askPropagate)
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          تغيّر سعر "{service.name}" من {formatCurrency(service.price ?? 0)} إلى{" "}
          {formatCurrency(price)}.
          <br />
          يوجد <b>{openCount}</b> مستند مفتوح (عروض أسعار / فواتير مسودة) يحتوي هذا البند.
          <br />
          <b>هل تريد تحديث السعر في المستندات المفتوحة أم الإبقاء على السعر القديم فيها؟</b>
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              saveService();
              onClose();
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            الإبقاء على السعر القديم
          </button>
          <button
            onClick={() => {
              saveService();
              propagate();
              onClose();
            }}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            تحديث المستندات المفتوحة ({openCount})
          </button>
        </div>
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const priceChanged = price !== (service.price ?? 0);
        if (priceChanged && openCount > 0) {
          setAskPropagate(true);
        } else {
          saveService();
          onClose();
        }
      }}
    >
      <FormField label="اسم الخدمة">
        <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="السعر (ر.س)">
        <input
          type="number"
          className={inputClass}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </FormField>
      <FormField label="الوصف">
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
