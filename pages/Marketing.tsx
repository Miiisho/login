import React, { useState } from "react";
import { Megaphone, Plus, TrendingUp, Users2, Target } from "lucide-react";
import { useApp } from "../state/AppContext";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency } from "../lib/format";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  budget: number;
  status: "planning" | "active" | "done";
  reach: number;
  leads: number;
};

const CHANNELS = ["إنستغرام", "تيك توك", "سناب شات", "إعلانات جوجل", "X (تويتر)", "بريد إلكتروني"];
const STATUS_LABEL: Record<Campaign["status"], string> = {
  planning: "قيد التخطيط",
  active: "نشطة",
  done: "منتهية",
};
const STATUS_CLS: Record<Campaign["status"], string> = {
  planning: "bg-blue-50 text-blue-600",
  active: "bg-emerald-50 text-emerald-600",
  done: "bg-gray-100 text-gray-500",
};

/** التسويق: حملات تسويقية مبسطة تغذّي الفرص والصفقات */
export const Marketing: React.FC = () => {
  const { currentUser } = useApp();
  const canManage = ["owner", "admin"].includes(currentUser.role) ||
    currentUser.permissions.includes("manage_clients");
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: "cm-1", name: "إطلاق الهوية الجديدة", channel: "إنستغرام", budget: 25000, status: "active", reach: 82000, leads: 46 },
    { id: "cm-2", name: "عروض الموسم", channel: "تيك توك", budget: 18000, status: "active", reach: 120000, leads: 73 },
    { id: "cm-3", name: "حملة توعية بالعلامة", channel: "إعلانات جوجل", budget: 12000, status: "planning", reach: 0, leads: 0 },
  ]);
  const [showAdd, setShowAdd] = useState(false);

  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalReach = campaigns.reduce((s, c) => s + c.reach, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            <Megaphone className="text-blue-500" size={24} /> التسويق
          </h1>
          <p className="text-sm text-gray-500">الحملات التسويقية ومؤشراتها — تغذّي الفرص والصفقات</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
          >
            <Plus size={16} /> حملة جديدة
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">الحملات النشطة</p>
          <p className="text-xl font-extrabold text-emerald-600">
            {campaigns.filter((c) => c.status === "active").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1 text-xs text-gray-400"><Target size={12} /> الميزانية</p>
          <p className="text-xl font-extrabold text-gray-900">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1 text-xs text-gray-400"><Users2 size={12} /> الوصول</p>
          <p className="text-xl font-extrabold text-gray-900">{totalReach.toLocaleString("ar")}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1 text-xs text-gray-400"><TrendingUp size={12} /> فرص محتملة</p>
          <p className="text-xl font-extrabold text-blue-600">{totalLeads}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">الحملة</th>
              <th className="px-4 py-3 font-medium">القناة</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">الميزانية</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">الوصول</th>
              <th className="px-4 py-3 font-medium">فرص</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.channel}</td>
                <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{formatCurrency(c.budget)}</td>
                <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{c.reach.toLocaleString("ar")}</td>
                <td className="px-4 py-3 font-semibold text-blue-600">{c.leads}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="حملة تسويقية جديدة" onClose={() => setShowAdd(false)}>
          <AddCampaignForm
            onSave={(c) => {
              setCampaigns((prev) => [...prev, { ...c, id: `cm-${Date.now()}`, reach: 0, leads: 0 }]);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}
    </div>
  );
};

const AddCampaignForm: React.FC<{
  onSave: (c: Omit<Campaign, "id" | "reach" | "leads">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [form, setForm] = useState({
    name: "",
    channel: CHANNELS[0],
    budget: 0,
    status: "planning" as Campaign["status"],
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <FormField label="اسم الحملة">
        <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </FormField>
      <FormField label="القناة">
        <select className={inputClass} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </FormField>
      <FormField label="الميزانية (ر.س)">
        <input type="number" required className={inputClass} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
      </FormField>
      <FormField label="الحالة">
        <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Campaign["status"] })}>
          <option value="planning">قيد التخطيط</option>
          <option value="active">نشطة</option>
          <option value="done">منتهية</option>
        </select>
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">إلغاء</button>
        <button type="submit" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">حفظ</button>
      </div>
    </form>
  );
};
