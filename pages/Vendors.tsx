import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, MapPin, Plus, Search, Table2 } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency } from "../lib/format";
import { usePersistedState } from "../lib/usePersistedState";
import { OfficialInfoFields, emptyOfficial } from "./Clients";
import type { EntityType, OfficialEntityInfo, Vendor } from "../types";

export const Vendors: React.FC = () => {
  const { vendors, addVendor, currentUser } = useApp();
  const navigate = useNavigate();
  const [serviceFilter, setServiceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = usePersistedState<"table" | "board">("vendors-view", "table");
  const [section, setSection] = usePersistedState<"all" | "logistics">("vendors-section", "all");
  const services = [...new Set(vendors.map((v) => v.serviceType))];
  const creators = [...new Set(vendors.map((v) => v.createdBy).filter(Boolean))];

  // القسم اللوجستي: الموردون المتعلقون بالشحن/النقل/التوصيل/التخزين
  const LOGISTICS_KEYWORDS = ["شحن", "نقل", "توصيل", "لوجست", "تخزين", "مستودع", "توريد"];
  const isLogistics = (v: Vendor) =>
    LOGISTICS_KEYWORDS.some((k) => v.serviceType.includes(k));

  const filtered = vendors.filter(
    (v) =>
      (section === "all" || isLogistics(v)) &&
      (serviceFilter === "all" || v.serviceType === serviceFilter) &&
      (typeFilter === "all" || v.vendorType === typeFilter) &&
      (creatorFilter === "all" || v.createdBy === creatorFilter) &&
      (!search.trim() ||
        v.name.includes(search.trim()) ||
        v.serviceType.includes(search.trim()) ||
        v.city.includes(search.trim())),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">الموردون</h1>
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
          {currentUser.role !== "team_member" && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
            >
              <Plus size={16} /> إضافة مورد
            </button>
          )}
        </div>
      </div>

      {/* تبديل بين كل الموردين والقسم اللوجستي */}
      <div className="flex gap-2 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setSection("all")}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            section === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
          }`}
        >
          كل الموردين ({vendors.length})
        </button>
        <button
          onClick={() => setSection("logistics")}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
            section === "logistics" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
          }`}
        >
          القسم اللوجستي ({vendors.filter(isLogistics).length})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pr-9`}
            placeholder="بحث ذكي عن مورد أو خدمة أو مدينة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">كل التصنيفات</option>
          <option value="service_provider">مقدم خدمة</option>
          <option value="strategic_partner">شراكة استراتيجية</option>
        </select>
        <select
          className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
        >
          <option value="all">كل الخدمات</option>
          {services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              { key: "service_provider", label: "مقدم خدمة" },
              { key: "strategic_partner", label: "شراكة استراتيجية" },
            ] as const
          ).map((col) => {
            const items = filtered.filter((v) => v.vendorType === col.key);
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
                  {items.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => navigate(`/vendors/${v.id}`)}
                      className="cursor-pointer rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-800">{v.name}</p>
                        <StatusBadge status={v.paymentStatus} className="text-[10px]" />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{v.serviceType}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={11} /> {v.city}، {v.country}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-amber-500">
                        {"★".repeat(Math.round(v.reliabilityRating))}{" "}
                        <span className="text-gray-400">{v.reliabilityRating}/5</span>
                      </p>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-xs text-gray-300">لا يوجد موردون</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">اسم المورد</th>
              <th className="px-4 py-3 font-medium">نوع الخدمة</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">التصنيف</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">الموقع</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">سعر المشروع</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">أضافه</th>
              <th className="px-4 py-3 font-medium">التقييم</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr
                key={v.id}
                onClick={() => navigate(`/vendors/${v.id}`)}
                className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/40"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-800">{v.name}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{v.serviceType}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <StatusBadge status={v.vendorType} className="text-[10px]" />
                </td>
                <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {v.city}، {v.country}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                  {v.projectRate ? formatCurrency(v.projectRate) : "—"}
                </td>
                <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                  {v.createdBy ?? "—"}
                </td>
                <td className="px-4 py-3 font-semibold text-amber-500">
                  {"★".repeat(Math.round(v.reliabilityRating))}
                  <span className="text-xs text-gray-400"> {v.reliabilityRating}/5</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={v.paymentStatus} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  لا يوجد موردون مطابقون.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {showAdd && (
        <Modal title="إضافة مورد جديد" onClose={() => setShowAdd(false)} wide>
          <AddVendorForm
            onSave={(v) => {
              addVendor(v);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}
    </div>
  );
};

const AddVendorForm: React.FC<{
  onSave: (vendor: Omit<Vendor, "id">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { currentUser } = useApp();
  // القائمة المنسدلة "شركة أو فرد" تظهر أولًا قبل تعبئة بيانات الجهة
  const [entityType, setEntityType] = useState<EntityType>("individual");
  const [official, setOfficial] = useState<OfficialEntityInfo>(emptyOfficial);
  const [form, setForm] = useState({
    name: "",
    serviceType: "",
    vendorType: "service_provider" as Vendor["vendorType"],
    email: "",
    phone: "",
    city: "",
    country: "السعودية",
    hourlyRate: 0,
    projectRate: 0,
    reliabilityRating: 5,
    paymentStatus: "active" as Vendor["paymentStatus"],
    notes: "",
    onTimeRate: 100,
    qualityRating: 5,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          createdBy: currentUser.name,
          entityType,
          ...(entityType === "company" ? { official } : {}),
        });
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <FormField label="نوع الجهة (حدده أولًا)">
          <select
            className={inputClass}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as EntityType)}
          >
            <option value="individual">فرد</option>
            <option value="company">شركة</option>
          </select>
        </FormField>
      </div>
      <FormField label="اسم المورد">
        <input
          required
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </FormField>
      <FormField label="نوع الخدمة">
        <input
          required
          className={inputClass}
          value={form.serviceType}
          onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
        />
      </FormField>
      <FormField label="تصنيف المورد">
        <select
          className={inputClass}
          value={form.vendorType}
          onChange={(e) =>
            setForm({ ...form, vendorType: e.target.value as Vendor["vendorType"] })
          }
        >
          <option value="service_provider">مقدم خدمة</option>
          <option value="strategic_partner">شراكة استراتيجية</option>
        </select>
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
      <FormField label="المدينة">
        <input
          required
          className={inputClass}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
      </FormField>
      <FormField label="الدولة">
        <input
          required
          className={inputClass}
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
        />
      </FormField>
      <FormField label="السعر بالساعة (ر.س)">
        <input
          type="number"
          className={inputClass}
          value={form.hourlyRate}
          onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
        />
      </FormField>
      <FormField label="سعر المشروع (ر.س)">
        <input
          type="number"
          className={inputClass}
          value={form.projectRate}
          onChange={(e) => setForm({ ...form, projectRate: Number(e.target.value) })}
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
          حفظ المورد
        </button>
      </div>
    </form>
  );
};
