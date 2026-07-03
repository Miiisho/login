import React, { useState } from "react";
import { Boxes, Plus, Truck, MapPin, PackageCheck } from "lucide-react";
import { useApp } from "../state/AppContext";
import { Modal, FormField, inputClass } from "../components/Modal";

/** سلاسل الإمداد: متابعة الشحن والتسليم للمشاريع (توريد/طرف ثالث) */
type Stage = "preparing" | "shipping" | "delivered";
const STAGE_LABEL: Record<Stage, string> = {
  preparing: "قيد التجهيز",
  shipping: "قيد الشحن",
  delivered: "تم التسليم",
};
const STAGE_CLS: Record<Stage, string> = {
  preparing: "bg-blue-50 text-blue-600",
  shipping: "bg-amber-50 text-amber-600",
  delivered: "bg-emerald-50 text-emerald-600",
};
const SHIP_TYPES = ["شحن بري", "شحن جوي", "شحن بحري", "توصيل محلي", "استلام من المقر"];

type Shipment = {
  id: string;
  project: string;
  shipType: string;
  responsible: string;
  deliveryLocation: string;
  receiver: string;
  stage: Stage;
};

const seed: Shipment[] = [
  { id: "sc-1", project: "توريد أجهزة عرض", shipType: "شحن بري", responsible: "محمد العتيبي", deliveryLocation: "الرياض — حي العليا", receiver: "أ. سعد", stage: "shipping" },
  { id: "sc-2", project: "هدايا نهاية العام", shipType: "توصيل محلي", responsible: "سارة الدوسري", deliveryLocation: "جدة — حي الروضة", receiver: "م. هند", stage: "preparing" },
  { id: "sc-3", project: "طباعة مطبوعات فعالية", shipType: "استلام من المقر", responsible: "أحمد الحربي", deliveryLocation: "المقر الرئيسي", receiver: "فريق التنفيذ", stage: "delivered" },
];

export const SupplyChains: React.FC = () => {
  const { currentUser } = useApp();
  const canManage = ["owner", "admin"].includes(currentUser.role) ||
    currentUser.permissions.includes("manage_projects") ||
    currentUser.permissions.includes("manage_vendors");
  const [items, setItems] = useState<Shipment[]>(seed);
  const [showAdd, setShowAdd] = useState(false);
  const [noteFor, setNoteFor] = useState<Shipment | null>(null);

  const advance = (s: Shipment) => {
    const order: Stage[] = ["preparing", "shipping", "delivered"];
    const next = order[Math.min(order.indexOf(s.stage) + 1, order.length - 1)];
    setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, stage: next } : x)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            <Boxes className="text-blue-500" size={24} /> سلاسل الإمداد
          </h1>
          <p className="text-sm text-gray-500">متابعة الشحن والتسليم — بيانات الشحن والمسؤول وموقع التسليم والمستلم</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
          >
            <Plus size={16} /> شحنة جديدة
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["preparing", "shipping", "delivered"] as Stage[]).map((st) => (
          <div key={st} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <p className="text-lg font-extrabold text-gray-900">{items.filter((i) => i.stage === st).length}</p>
            <p className="text-[11px] text-gray-400">{STAGE_LABEL[st]}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">المشروع</th>
              <th className="px-4 py-3 font-medium">نوع الشحن</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">المسؤول</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">موقع التسليم</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">المستلم</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{s.project}</td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="flex items-center gap-1"><Truck size={13} className="text-gray-400" /> {s.shipType}</span>
                </td>
                <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{s.responsible}</td>
                <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                  <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" /> {s.deliveryLocation}</span>
                </td>
                <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{s.receiver}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_CLS[s.stage]}`}>{STAGE_LABEL[s.stage]}</span>
                </td>
                <td className="px-4 py-3">
                  {s.stage === "delivered" ? (
                    <button
                      onClick={() => setNoteFor(s)}
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50"
                    >
                      <PackageCheck size={13} /> سند تسليم
                    </button>
                  ) : (
                    canManage && (
                      <button
                        onClick={() => advance(s)}
                        className="rounded-lg bg-blue-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-600"
                      >
                        تقدّم ←
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="شحنة جديدة" onClose={() => setShowAdd(false)}>
          <ShipmentForm
            onSave={(s) => {
              setItems((prev) => [...prev, { ...s, id: `sc-${Date.now()}`, stage: "preparing" }]);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {noteFor && (
        <Modal title="سند تسليم (Delivery Note)" onClose={() => setNoteFor(null)}>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="mb-2 text-center text-base font-extrabold text-gray-900">سند تسليم</p>
              <Row label="المشروع" value={noteFor.project} />
              <Row label="نوع الشحن" value={noteFor.shipType} />
              <Row label="المسؤول عن التنفيذ" value={noteFor.responsible} />
              <Row label="موقع التسليم" value={noteFor.deliveryLocation} />
              <Row label="المستلم النهائي" value={noteFor.receiver} />
              <Row label="التاريخ" value={new Date().toLocaleDateString("ar-SA")} />
            </div>
            <p className="text-center text-xs text-gray-400">
              (نموذج توضيحي — في النسخة الفعلية يُصدَّر PDF قابل للطباعة والتوقيع)
            </p>
            <button
              onClick={() => window.print()}
              className="w-full rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              طباعة / حفظ PDF
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between border-b border-gray-100 py-1.5 last:border-0">
    <span className="text-gray-400">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

const ShipmentForm: React.FC<{
  onSave: (s: Omit<Shipment, "id" | "stage">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [form, setForm] = useState({
    project: "",
    shipType: SHIP_TYPES[0],
    responsible: "",
    deliveryLocation: "",
    receiver: "",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <FormField label="المشروع">
        <input required className={inputClass} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
      </FormField>
      <FormField label="نوع الشحن">
        <select className={inputClass} value={form.shipType} onChange={(e) => setForm({ ...form, shipType: e.target.value })}>
          {SHIP_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
      </FormField>
      <FormField label="المسؤول عن التنفيذ">
        <input required className={inputClass} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
      </FormField>
      <FormField label="موقع التسليم">
        <input required className={inputClass} value={form.deliveryLocation} onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })} />
      </FormField>
      <FormField label="المستلم النهائي">
        <input required className={inputClass} value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
        <button type="submit" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">حفظ</button>
      </div>
    </form>
  );
};
