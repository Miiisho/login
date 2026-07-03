import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, LayoutGrid, Plus, Search, Table2, UserCheck, Users, Wallet } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency, daysLeft } from "../lib/format";
import { usePersistedState } from "../lib/usePersistedState";
import type { Client, EntityType, OfficialEntityInfo } from "../types";

/** حقول البيانات الأساسية للشركة (سجل تجاري، ضريبي، ممثل، عنوان وطني، موقع اختياري) */
export const OfficialInfoFields: React.FC<{
  value: OfficialEntityInfo;
  onChange: (v: OfficialEntityInfo) => void;
}> = ({ value, onChange }) => (
  <div className="sm:col-span-2 grid grid-cols-1 gap-x-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:grid-cols-2">
    <p className="mb-2 text-xs font-bold text-blue-700 sm:col-span-2">البيانات الأساسية للشركة</p>
    <FormField label="السجل التجاري">
      <input
        required
        className={inputClass}
        value={value.crNumber}
        onChange={(e) => onChange({ ...value, crNumber: e.target.value })}
      />
    </FormField>
    <FormField label="الرقم الضريبي">
      <input
        required
        className={inputClass}
        value={value.taxNumber}
        onChange={(e) => onChange({ ...value, taxNumber: e.target.value })}
      />
    </FormField>
    <FormField label="اسم الممثل">
      <input
        required
        className={inputClass}
        value={value.repName}
        onChange={(e) => onChange({ ...value, repName: e.target.value })}
      />
    </FormField>
    <FormField label="جوال الممثل">
      <input
        required
        className={inputClass}
        value={value.repPhone}
        onChange={(e) => onChange({ ...value, repPhone: e.target.value })}
      />
    </FormField>
    <FormField label="بريد الممثل">
      <input
        type="email"
        required
        className={inputClass}
        value={value.repEmail}
        onChange={(e) => onChange({ ...value, repEmail: e.target.value })}
      />
    </FormField>
    <FormField label="العنوان الوطني">
      <input
        required
        className={inputClass}
        value={value.nationalAddress}
        onChange={(e) => onChange({ ...value, nationalAddress: e.target.value })}
      />
    </FormField>
    <FormField label="الموقع الإلكتروني (اختياري)">
      <input
        className={inputClass}
        value={value.website ?? ""}
        onChange={(e) => onChange({ ...value, website: e.target.value })}
      />
    </FormField>
  </div>
);

export const emptyOfficial: OfficialEntityInfo = {
  crNumber: "",
  taxNumber: "",
  repName: "",
  repPhone: "",
  repEmail: "",
  nationalAddress: "",
  website: "",
};

export const Clients: React.FC = () => {
  const { clients, addClient, currentUser } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = usePersistedState<"table" | "board">("clients-view", "table");
  const creators = [...new Set(clients.map((c) => c.createdBy).filter(Boolean))];

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.includes(search) || c.contactPerson.includes(search);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesCreator = creatorFilter === "all" || c.createdBy === creatorFilter;
    return matchesSearch && matchesStatus && matchesCreator;
  });

  const handleAdd = (client: Omit<Client, "id">) => {
    addClient({ ...client, createdBy: currentUser.name });
    setShowAdd(false);
  };

  const activeCount = clients.filter((c) => c.status === "active").length;
  const monthlyTotal = clients
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + c.contractValue, 0);
  const renewingSoon = clients.filter(
    (c) => c.status === "active" && daysLeft(c.contractEndDate) >= 0 && daysLeft(c.contractEndDate) <= 30,
  ).length;

  // ألوان ثابتة للحرف الأول من اسم العميل (أفاتار)
  const AVATAR_COLORS = [
    "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600",
    "bg-violet-100 text-violet-600",
    "bg-amber-100 text-amber-600",
    "bg-rose-100 text-rose-600",
  ];
  const avatarCls = (name: string) =>
    AVATAR_COLORS[(name.codePointAt(0) ?? 0) % AVATAR_COLORS.length];

  const RenewChip: React.FC<{ client: Client }> = ({ client }) => {
    const d = daysLeft(client.contractEndDate);
    if (client.status !== "active" || d < 0 || d > 30) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
        <CalendarClock size={11} /> تجديد خلال {d} يوم
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">العملاء</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                view === "table" ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Table2 size={14} /> قاعدة بيانات
            </button>
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                view === "board" ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid size={14} /> كانبان
            </button>
          </div>
          {(currentUser.role === "owner" || currentUser.role === "admin") && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
            >
              <Plus size={16} /> إضافة عميل
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="إجمالي العملاء" value={clients.length} icon={Users} tone="blue" />
        <StatCard label="عملاء نشطون" value={activeCount} icon={UserCheck} tone="green" />
        <StatCard label="الإيراد الشهري (نشط)" value={formatCurrency(monthlyTotal)} icon={Wallet} tone="amber" />
        <StatCard label="تجديد خلال 30 يوم" value={renewingSoon} icon={CalendarClock} tone="red" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pr-9`}
            placeholder="ابحث عن عميل..."
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
          <option value="active">نشط</option>
          <option value="paused">متوقف</option>
          <option value="inactive">غير نشط</option>
        </select>
        <select
          className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
        >
          <option value="all">كل من أضافهم</option>
          {creators.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              { key: "active", label: "نشط" },
              { key: "paused", label: "متوقف" },
              { key: "inactive", label: "غير نشط" },
            ] as const
          ).map((col) => {
            const items = filtered.filter((c) => c.status === col.key);
            return (
              <div
                key={col.key}
                className="min-h-[180px] rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-gray-700">{col.label}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/clients/${c.id}`)}
                      className="cursor-pointer rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarCls(c.name)}`}
                        >
                          {c.name.trim().charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-800">{c.name}</p>
                          <p className="truncate text-xs text-gray-400">{c.contactPerson}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-emerald-600">
                          {formatCurrency(c.contractValue)} / شهريًا
                        </p>
                        <RenewChip client={c} />
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-xs text-gray-300">لا يوجد عملاء</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">اسم الشركة</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">جهة الاتصال</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">القيمة الشهرية</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">أضافه</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarCls(c.name)}`}
                    >
                      {c.name.trim().charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium text-gray-800">
                        {c.name} <RenewChip client={c} />
                      </p>
                      <p className="text-xs text-gray-400 sm:hidden">{c.contactPerson}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{c.contactPerson}</td>
                <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                  {formatCurrency(c.contractValue)}
                </td>
                <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                  {c.createdBy ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  لا يوجد عملاء مطابقون للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {showAdd && (
        <AddClientModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
    </div>
  );
};

const AddClientModal: React.FC<{
  onClose: () => void;
  onSave: (client: Omit<Client, "id">) => void;
}> = ({ onClose, onSave }) => {
  // القائمة المنسدلة "شركة أو فرد" تظهر أولًا قبل تعبئة بيانات الجهة
  const [entityType, setEntityType] = useState<EntityType>("company");
  const [official, setOfficial] = useState<OfficialEntityInfo>(emptyOfficial);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyType: "B2B" as Client["companyType"],
    contactPerson: "",
    contractValue: 0,
    contractStartDate: new Date().toISOString().slice(0, 10),
    contractEndDate: new Date().toISOString().slice(0, 10),
    status: "active" as Client["status"],
    notes: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      entityType,
      ...(entityType === "company" ? { official } : {}),
    });
  };

  return (
    <Modal title="إضافة عميل جديد" onClose={onClose} wide>
      <form onSubmit={submit} className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField label="نوع الجهة (حدده أولًا)">
            <select
              className={inputClass}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
            >
              <option value="company">شركة</option>
              <option value="individual">فرد</option>
            </select>
          </FormField>
        </div>
        <FormField label={entityType === "company" ? "اسم الشركة" : "اسم العميل"}>
          <input
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <FormField label="جهة الاتصال">
          <input
            required
            className={inputClass}
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
          />
        </FormField>
        <FormField label="البريد الإلكتروني">
          <input
            type="email"
            required
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormField>
        <FormField label="رقم الجوال">
          <input
            required
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </FormField>
        <FormField label="نوع الشركة">
          <select
            className={inputClass}
            value={form.companyType}
            onChange={(e) =>
              setForm({ ...form, companyType: e.target.value as Client["companyType"] })
            }
          >
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
          </select>
        </FormField>
        <FormField label="القيمة الشهرية (ر.س)">
          <input
            type="number"
            required
            className={inputClass}
            value={form.contractValue}
            onChange={(e) => setForm({ ...form, contractValue: Number(e.target.value) })}
          />
        </FormField>
        <FormField label="تاريخ بداية العقد">
          <input
            type="date"
            className={inputClass}
            value={form.contractStartDate}
            onChange={(e) => setForm({ ...form, contractStartDate: e.target.value })}
          />
        </FormField>
        <FormField label="تاريخ نهاية العقد">
          <input
            type="date"
            className={inputClass}
            value={form.contractEndDate}
            onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })}
          />
        </FormField>
        {entityType === "company" && (
          <OfficialInfoFields value={official} onChange={setOfficial} />
        )}
        <div className="sm:col-span-2">
          <FormField label="ملاحظات">
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormField>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
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
            حفظ العميل
          </button>
        </div>
      </form>
    </Modal>
  );
};
