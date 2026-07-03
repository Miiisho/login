import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Briefcase, ImagePlus, Users, Wallet } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../lib/format";
import { companyInfo } from "../data/mockData";

const COMPLETED_STATUSES = ["delivered", "invoiced", "closed"];

export const Portfolio: React.FC = () => {
  const { projects, clients } = useApp();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("all");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const completedProjects = projects.filter((p) => COMPLETED_STATUSES.includes(p.status));
  const filtered = completedProjects.filter(
    (p) => typeFilter === "all" || p.type === typeFilter,
  );

  const uniqueClients = new Set(completedProjects.map((p) => p.clientId)).size;
  const totalValue = completedProjects.reduce((sum, p) => sum + p.budget, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <Award className="text-blue-500" size={26} /> ملف الأعمال (Portfolio)
        </h1>
        <p className="text-sm text-gray-500">
          مرجع سريع لجميع الأعمال المنجزة لبناء بروفايل الشركة والعروض التقديمية
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <button
          onClick={() => logoInputRef.current?.click()}
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-400"
          title="اضغط لرفع شعار الشركة"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="شعار الشركة" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-[11px]">
              <ImagePlus size={22} />
              الشعار
            </span>
          )}
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setLogoUrl(URL.createObjectURL(file));
          }}
        />
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-gray-900">{companyInfo.name}</h2>
          <p className="mt-1 text-sm text-gray-500">{companyInfo.address}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-500 sm:grid-cols-3">
            <p>
              <span className="text-xs text-gray-400">السجل التجاري: </span>
              {companyInfo.crNumber}
            </p>
            <p>
              <span className="text-xs text-gray-400">الرقم الضريبي: </span>
              {companyInfo.taxId}
            </p>
            <p>
              <span className="text-xs text-gray-400">العنوان الوطني: </span>
              {companyInfo.nationalAddress}
            </p>
            <p>
              <span className="text-xs text-gray-400">الممثل: </span>
              {companyInfo.repName}
            </p>
            <p>
              <span className="text-xs text-gray-400">جوال الممثل: </span>
              <span dir="ltr">{companyInfo.repPhone}</span>
            </p>
            <p>
              <span className="text-xs text-gray-400">بريد الممثل: </span>
              {companyInfo.repEmail}
            </p>
            {companyInfo.website && (
              <p>
                <span className="text-xs text-gray-400">الموقع: </span>
                {companyInfo.website}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="إجمالي المشاريع" value={projects.length} icon={Award} tone="gray" />
        <StatCard label="أعمال منجزة" value={completedProjects.length} icon={Briefcase} tone="blue" />
        <StatCard label="عملاء تم خدمتهم" value={uniqueClients} icon={Users} tone="green" />
        <StatCard label="إجمالي قيمة الأعمال" value={formatCurrency(totalValue)} icon={Wallet} tone="amber" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
          <Users size={18} className="text-blue-500" /> عملاؤنا
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {clients.map((c) => {
            const count = projects.filter((p) => p.clientId === c.id).length;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                className="cursor-pointer rounded-xl border border-gray-100 p-4 text-center hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                  {c.name.slice(0, 2)}
                </div>
                <p className="truncate text-sm font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">{count} مشاريع</p>
              </div>
            );
          })}
          {clients.length === 0 && (
            <p className="text-sm text-gray-400">لا يوجد عملاء بعد.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Briefcase size={18} className="text-blue-500" /> الأعمال المنجزة
        </h2>
        <select
          className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">كل التصنيفات</option>
          <option value="service">تقديم خدمة</option>
          <option value="supply">توريد</option>
          <option value="third_party">طرف ثالث</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const client = clients.find((c) => c.id === p.clientId);
          return (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-blue-200 hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="font-bold text-gray-900">{p.name}</p>
                <StatusBadge status={p.type} />
              </div>
              <p className="text-xs text-gray-400">{client?.name}</p>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{p.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{formatCurrency(p.budget)}</span>
                <span>{formatDate(p.startDate)} - {formatDate(p.endDate)}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400">لا توجد أعمال منجزة ضمن هذا التصنيف بعد.</p>
        )}
      </div>
    </div>
  );
};
