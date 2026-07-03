import React, { useState } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  CreditCard,
  Crown,
  Headphones,
  LayoutTemplate,
  Lock,
  Mail,
  Moon,
  Palette,
  Pencil,
  Phone,
  Plus,
  ScrollText,
  Send,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { companyInfo } from "../data/mockData";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  JOB_TITLE_SUGGESTIONS,
  defaultPermissionsForRole,
} from "../lib/permissions";
import type { Permission, PermissionTemplate, Role, TeamMember } from "../types";

const ROLE_OPTION_LABELS: Record<Role, string> = {
  owner: "مالك",
  admin: "أدمن (يدير الفريق والصلاحيات)",
  team_member: "عضو فريق",
};

export const Settings: React.FC = () => {
  const {
    teamMembers,
    currentUser,
    addTeamMember,
    updateTeamMemberPermissions,
    permissionTemplates,
    addPermissionTemplate,
    updatePermissionTemplate,
    deletePermissionTemplate,
  } = useApp();
  const [company, setCompany] = useState({
    name: companyInfo.name,
    address: companyInfo.address,
    taxId: companyInfo.taxId,
    crNumber: companyInfo.crNumber,
    repName: companyInfo.repName,
    repPhone: companyInfo.repPhone,
    repEmail: companyInfo.repEmail,
    nationalAddress: companyInfo.nationalAddress,
    website: companyInfo.website,
  });
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);
  const [permissionsFor, setPermissionsFor] = useState<TeamMember | null>(null);
  const [saved, setSaved] = useState(false);

  const visibleMembers = teamMembers.filter((m) => !removedIds.includes(m.id));
  const isOwner = currentUser.role === "owner";
  const isManager = isOwner || currentUser.role === "admin";

  // بوابات الإعدادات مصنّفة في مجموعات (أفضل ممارسة) — تختلف حسب الدور
  type Portal = { key: string; label: string; desc: string; icon: React.ElementType };
  const PORTAL_GROUPS: { group: string; items: Portal[] }[] = [
    {
      group: "شخصي",
      items: [
        { key: "account", label: "الحساب", desc: "الاسم والبريد وكلمة المرور", icon: User },
        { key: "notifications", label: "التنبيهات", desc: "تحكّم بما يصلك من إشعارات", icon: Bell },
        { key: "automation", label: "الأتمتة", desc: "أتمتة المهام المتكررة", icon: Zap },
        { key: "appearance", label: "المظهر", desc: "الألوان والوضع الفاتح/الغامق", icon: Palette },
        { key: "requests", label: "الطلبات الوظيفية", desc: "إجازة، سلفة، عهدة...", icon: Briefcase },
      ],
    },
    ...(isManager
      ? [
          {
            group: "إدارة",
            items: [
              { key: "company", label: "الشركة والفريق", desc: "بيانات الشركة والأعضاء", icon: Building2 },
              { key: "subscriptions", label: "الاشتراكات", desc: "خطة النظام والفوترة", icon: CreditCard },
              { key: "audit", label: "سجل التدقيق", desc: "من عدّل ماذا ومتى", icon: ScrollText },
            ] as Portal[],
          },
        ]
      : []),
    ...(isOwner
      ? [{ group: "المالك", items: [{ key: "ownerUnit", label: "وحدة المالك", desc: "أدوات حصرية للمالك", icon: Crown }] as Portal[] }]
      : []),
    { group: "الدعم", items: [{ key: "contact", label: "تواصل معنا", desc: "الدعم والمساعدة", icon: Headphones }] as Portal[] },
  ];
  const allPortals = PORTAL_GROUPS.flatMap((g) => g.items);
  const [portal, setPortal] = useState("account");
  const activePortal = allPortals.find((p) => p.key === portal);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">الإعدادات</h1>
        <p className="text-sm text-gray-500">أدر حسابك والنظام من بوابات منظّمة</p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* قائمة جانبية عمودية مصنّفة */}
        <aside className="lg:w-64 lg:shrink-0">
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:sticky lg:top-4">
            {PORTAL_GROUPS.map((g) => (
              <div key={g.group}>
                <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {g.group}
                </p>
                <div className="space-y-1">
                  {g.items.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPortal(p.key)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${
                        portal === p.key ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <p.icon
                        size={18}
                        className={`mt-0.5 shrink-0 ${portal === p.key ? "text-blue-600" : "text-gray-400"}`}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{p.label}</span>
                        <span className="block truncate text-[11px] text-gray-400">{p.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* محتوى البوابة */}
        <div className="min-w-0 flex-1 space-y-5">
          {activePortal && (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <activePortal.icon size={20} />
              </span>
              <div>
                <p className="text-base font-bold text-gray-900">{activePortal.label}</p>
                <p className="text-xs text-gray-400">{activePortal.desc}</p>
              </div>
            </div>
          )}

      {portal === "account" && <AccountSection />}
      {portal === "notifications" && <NotificationsSection />}
      {portal === "automation" && <AutomationSection />}
      {portal === "appearance" && <AppearanceSection />}
      {portal === "requests" && <JobRequestsSection />}
      {portal === "subscriptions" && isManager && <SubscriptionsSection />}
      {portal === "audit" && isManager && <AuditLogSection />}
      {portal === "ownerUnit" && isOwner && <OwnerSection />}
      {portal === "contact" && <ContactSection />}

      {portal === "company" && isManager && (
      <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">البيانات الأساسية للشركة</h2>
          {!isOwner && (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
              <Lock size={12} /> ثابتة — يعدّلها المالك فقط
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["name", "اسم الشركة"],
            ["crNumber", "السجل التجاري"],
            ["taxId", "الرقم الضريبي"],
            ["repName", "اسم الممثل"],
            ["repPhone", "جوال الممثل"],
            ["repEmail", "بريد الممثل"],
            ["nationalAddress", "العنوان الوطني"],
            ["website", "الموقع الإلكتروني (اختياري)"],
          ] as const).map(([key, label]) => (
            <FormField key={key} label={label}>
              <input
                className={`${inputClass} ${!isOwner ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""}`}
                value={(company as Record<string, string>)[key] ?? ""}
                disabled={!isOwner}
                onChange={(e) => setCompany({ ...company, [key]: e.target.value })}
              />
            </FormField>
          ))}
          <div className="sm:col-span-2">
            <FormField label="العنوان">
              <input
                className={`${inputClass} ${!isOwner ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""}`}
                value={company.address}
                disabled={!isOwner}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
              />
            </FormField>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">فريق العمل والصلاحيات</h2>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            <Plus size={14} /> إضافة عضو
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          يملك المالك والأدمن صلاحية إضافة الموظفين (بما فيهم مدراء المشاريع) وتحديد صلاحيات كل عضو على حدة.
        </p>
        <div className="space-y-2">
          {visibleMembers.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {m.avatar}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {m.name} {m.jobTitle && <span className="font-normal text-gray-400">- {m.jobTitle}</span>}
                  </p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={m.role} />
                {m.role !== "owner" && (
                  <button
                    onClick={() => setPermissionsFor(m)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <ShieldCheck size={14} /> الصلاحيات ({m.permissions.length})
                  </button>
                )}
                <button
                  onClick={() => setRemovedIds((prev) => [...prev, m.id])}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <LayoutTemplate size={18} /> قوالب الأدوار والصلاحيات
          </h2>
          <button
            onClick={() => setShowAddTemplate(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Plus size={14} /> إضافة قالب
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          جهّز قوالب صلاحيات جاهزة (مصمم، محاسب، مشرف...) لتطبيقها بضغطة واحدة عند إضافة عضو جديد، بدل تحديد
          الصلاحيات يدويًا كل مرة، لتقليل الأخطاء.
        </p>
        <div className="space-y-2">
          {permissionTemplates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-400">{t.permissions.length} صلاحيات مفعّلة</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingTemplate(t)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deletePermissionTemplate(t.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {permissionTemplates.length === 0 && (
            <p className="text-sm text-gray-400">لا توجد قوالب بعد.</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
        >
          حفظ التغييرات
        </button>
        {saved && <span className="text-sm text-emerald-600">تم الحفظ بنجاح ✓</span>}
      </div>
      </>
      )}

      {showAddMember && (
        <Modal title="إضافة عضو فريق" onClose={() => setShowAddMember(false)} wide>
          <AddMemberForm
            onSave={(member) => {
              addTeamMember(member);
              setShowAddMember(false);
            }}
            onClose={() => setShowAddMember(false)}
          />
        </Modal>
      )}

      {permissionsFor && (
        <Modal
          title={`صلاحيات ${permissionsFor.name}`}
          onClose={() => setPermissionsFor(null)}
        >
          <PermissionsForm
            member={permissionsFor}
            onSave={(permissions) => {
              updateTeamMemberPermissions(permissionsFor.id, permissions);
              setPermissionsFor(null);
            }}
            onClose={() => setPermissionsFor(null)}
          />
        </Modal>
      )}

      {showAddTemplate && (
        <Modal title="إضافة قالب صلاحيات" onClose={() => setShowAddTemplate(false)}>
          <AddTemplateForm
            onSave={(template) => {
              addPermissionTemplate(template);
              setShowAddTemplate(false);
            }}
            onClose={() => setShowAddTemplate(false)}
          />
        </Modal>
      )}

      {editingTemplate && (
        <Modal title="تعديل قالب الصلاحيات" onClose={() => setEditingTemplate(null)}>
          <AddTemplateForm
            initial={editingTemplate}
            onSave={(template) => {
              updatePermissionTemplate(editingTemplate.id, template);
              setEditingTemplate(null);
            }}
            onClose={() => setEditingTemplate(null)}
          />
        </Modal>
      )}
        </div>
      </div>
    </div>
  );
};

const AddTemplateForm: React.FC<{
  initial?: PermissionTemplate;
  onSave: (template: Omit<PermissionTemplate, "id">) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [permissions, setPermissions] = useState<Permission[]>(
    initial?.permissions ?? defaultPermissionsForRole("team_member"),
  );

  const togglePermission = (p: Permission) => {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name, permissions });
      }}
    >
      <FormField label="اسم القالب">
        <input
          required
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: مصمم، محاسب فواتير، مشرف مشاريع..."
        />
      </FormField>
      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">الصلاحيات</span>
        <div className="space-y-1.5 rounded-lg border border-gray-200 p-3">
          {ALL_PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={permissions.includes(p)}
                onChange={() => togglePermission(p)}
                className="rounded border-gray-300"
              />
              {PERMISSION_LABELS[p]}
            </label>
          ))}
        </div>
      </div>
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
          حفظ القالب
        </button>
      </div>
    </form>
  );
};

const PermissionsForm: React.FC<{
  member: TeamMember;
  onSave: (permissions: Permission[]) => void;
  onClose: () => void;
}> = ({ member, onSave, onClose }) => {
  const [selected, setSelected] = useState<Permission[]>(member.permissions);

  const toggle = (p: Permission) => {
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(selected);
      }}
    >
      <div className="mb-4 space-y-1.5 rounded-lg border border-gray-200 p-3">
        {ALL_PERMISSIONS.map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={selected.includes(p)}
              onChange={() => toggle(p)}
              className="rounded border-gray-300"
            />
            {PERMISSION_LABELS[p]}
          </label>
        ))}
      </div>
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
          حفظ الصلاحيات
        </button>
      </div>
    </form>
  );
};

const AddMemberForm: React.FC<{
  onSave: (member: Omit<TeamMember, "id">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { permissionTemplates } = useApp();
  const [templateId, setTemplateId] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "team_member" as Role,
    jobTitle: "",
  });
  const [permissions, setPermissions] = useState<Permission[]>(
    defaultPermissionsForRole("team_member"),
  );

  const handleRoleChange = (role: Role) => {
    setForm({ ...form, role });
    setPermissions(defaultPermissionsForRole(role));
    setTemplateId("");
  };

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const template = permissionTemplates.find((t) => t.id === id);
    if (template) {
      // القالب يُسند لعضو الفريق ويطبّق صلاحياته دون تغيير نوع المستخدم
      setForm({ ...form, role: "team_member", jobTitle: template.name });
      setPermissions(template.permissions);
    }
  };

  const togglePermission = (p: Permission) => {
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          jobTitle: form.jobTitle || undefined,
          templateId: templateId || null,
          permissions,
          avatar: form.name.slice(0, 1) || "؟",
          status: "active",
        });
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      {permissionTemplates.length > 0 && (
        <div className="sm:col-span-2">
          <FormField label="استخدام قالب صلاحيات جاهز (اختياري، لتقليل الأخطاء اليدوية)">
            <select
              className={inputClass}
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
            >
              <option value="">بدون قالب (تحديد يدوي)</option>
              {permissionTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )}
      <FormField label="الاسم">
        <input
          required
          className={inputClass}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
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
      <FormField label="الدور">
        <select
          className={inputClass}
          value={form.role}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
        >
          {(Object.keys(ROLE_OPTION_LABELS) as Role[])
            .filter((r) => r !== "owner")
            .map((r) => (
              <option key={r} value={r}>
                {ROLE_OPTION_LABELS[r]}
              </option>
            ))}
        </select>
      </FormField>
      {form.role === "team_member" && (
        <div className="sm:col-span-2">
          <FormField label="المسمى الوظيفي (اختياري)">
            <input
              className={inputClass}
              list="job-title-suggestions"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              placeholder="مثال: مصمم جرافيك، كاتب محتوى، محاسب..."
            />
            <datalist id="job-title-suggestions">
              {JOB_TITLE_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </FormField>
        </div>
      )}
      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">الصلاحيات</span>
        <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-gray-200 p-3 sm:grid-cols-2">
          {ALL_PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={permissions.includes(p)}
                onChange={() => togglePermission(p)}
                className="rounded border-gray-300"
              />
              {PERMISSION_LABELS[p]}
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 sm:col-span-2">
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

/* ---------- الأقسام الجديدة للإعدادات ---------- */

const PLANS = [
  {
    name: "الأساسية",
    price: 199,
    features: ["حتى 5 موظفين", "إدارة العملاء والمشاريع", "فواتير أساسية", "دعم عبر البريد"],
  },
  {
    name: "خطة النمو (Growth Plan)",
    price: 399,
    features: [
      "موظفون غير محدودين",
      "الصفقات وأهداف المبيعات",
      "موافقات الأدمن والتقارير",
      "العقود وعروض الأسعار والمشتريات",
    ],
  },
  {
    name: "الاحترافية",
    price: 799,
    features: [
      "كل مزايا النمو",
      "بطاقات أداء الموظفين",
      "تخصيص كامل للواجهة والتقارير",
      "مدير حساب مخصص ودعم فوري",
    ],
  },
];

const SubscriptionsSection: React.FC = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="mb-1 text-base font-bold text-gray-900">الاشتراكات</h2>
    <p className="mb-4 text-xs text-gray-400">قارن بين الخطط الثلاث — خطتك الحالية مميزة بالأزرق</p>
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((plan) => {
        const current = plan.name === companyInfo.plan;
        return (
          <div
            key={plan.name}
            className={`rounded-2xl border p-5 ${
              current ? "border-blue-400 bg-blue-50/60 ring-1 ring-blue-200" : "border-gray-200"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">{plan.name}</p>
              {current && (
                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  خطتك الحالية
                </span>
              )}
            </div>
            <p className="mb-3 text-2xl font-extrabold text-gray-900">
              {plan.price} <span className="text-xs font-normal text-gray-400">ر.س / شهريًا</span>
            </p>
            <ul className="mb-4 space-y-1.5 text-xs text-gray-600">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              disabled={current}
              className={`w-full rounded-lg px-4 py-2 text-sm font-semibold ${
                current
                  ? "cursor-default bg-gray-100 text-gray-400"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {current ? "مفعّلة" : "التبديل إلى هذه الخطة"}
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

const ACCENTS = [
  { key: "blue", label: "أزرق", color: "#3b82f6" },
  { key: "emerald", label: "زمردي", color: "#10b981" },
  { key: "violet", label: "بنفسجي", color: "#8b5cf6" },
];

const readAccent = () => {
  const cl = document.documentElement.classList;
  if (cl.contains("theme-emerald")) return "emerald";
  if (cl.contains("theme-violet")) return "violet";
  return "blue";
};

export const AppearanceSection: React.FC = () => {
  const [accent, setAccent] = useState(readAccent());
  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark-mode"),
  );

  const applyAccent = (key: string) => {
    document.documentElement.classList.remove("theme-emerald", "theme-violet");
    if (key !== "blue") document.documentElement.classList.add(`theme-${key}`);
    setAccent(key);
  };

  const toggleDark = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark-mode", next);
    setDark(next);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-900">
        <Palette size={18} className="text-blue-500" /> تخصيص الواجهة
      </h2>
      <p className="mb-4 text-xs text-gray-400">لون الواجهة الأساسي والمود الفاتح أو الغامق</p>
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">اللون الأساسي</p>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                onClick={() => applyAccent(a.key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  accent === a.key
                    ? "border-gray-800 font-semibold text-gray-900"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full"
                  style={{ backgroundColor: a.color }}
                />
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">المود</p>
          <button
            onClick={toggleDark}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "التبديل إلى الفاتح" : "التبديل إلى الغامق"}
          </button>
        </div>
      </div>
    </div>
  );
};

const NOTIFICATION_OPTIONS = [
  { key: "deadlines", label: "تنبيهات مواعيد الاستحقاق والانتهاء (فواتير ومشاريع)" },
  { key: "approvals", label: "تنبيهات طلبات الموافقة" },
  { key: "renewals", label: "تنبيهات تجديد العقود" },
  { key: "documents", label: "تنبيهات انتهاء الأوراق الرسمية وعقود الموظفين" },
  { key: "tasks", label: "تنبيهات المهام المتأخرة" },
  { key: "activity", label: "سجل النشاط (تحديثات الحالة غير المهمة)" },
];

export const NotificationsSection: React.FC = () => {
  // مربوطة مباشرة بمركز التذكيرات (الجرس أعلى الشاشة)
  const { notificationPrefs, toggleNotificationPref } = useApp();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-900">
        <Bell size={18} className="text-blue-500" /> التنبيهات وخياراتها
      </h2>
      <p className="mb-4 text-xs text-gray-400">
        تتحكم هذه الخيارات مباشرة بما يظهر لك في جرس التذكيرات أعلى الشاشة
      </p>
      <div className="space-y-2">
        {NOTIFICATION_OPTIONS.map((opt) => (
          <label
            key={opt.key}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            {opt.label}
            <input
              type="checkbox"
              checked={!!notificationPrefs[opt.key]}
              onChange={() => toggleNotificationPref(opt.key)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

const REQUEST_TYPES = [
  "إجازة",
  "سلفة",
  "شهادة تعريف",
  "تعديل بيانات",
  "عهدة / أدوات عمل",
  "عهدة بعد السفر",
  "أخرى",
];

/** رفع الطلبات الوظيفية — متاح لكل المستخدمين */
export const JobRequestsSection: React.FC = () => {
  const { currentUser } = useApp();
  const [requests, setRequests] = useState<
    { id: number; type: string; details: string; date: string }[]
  >([]);
  const [type, setType] = useState(REQUEST_TYPES[0]);
  const [details, setDetails] = useState("");
  // حقول إضافية لطلب العهدة بعد السفر
  const [travel, setTravel] = useState({ destination: "", returnDate: "", items: "" });
  const isTravelCustody = type === "عهدة بعد السفر";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-900">
        <Send size={18} className="text-blue-500" /> الطلبات الوظيفية
      </h2>
      <p className="mb-4 text-xs text-gray-400">
        ارفع طلباتك الخاصة بوظيفتك (إجازة، سلفة، شهادة، عهدة بعد السفر...) وتُرسل للمسؤول الإداري
      </p>
      <form
        className="mb-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fullDetails = isTravelCustody
            ? `الوجهة: ${travel.destination} · العودة: ${travel.returnDate} · تفاصيل العهدة: ${travel.items}${details.trim() ? ` · ${details.trim()}` : ""}`
            : details.trim();
          setRequests((prev) => [
            {
              id: Date.now(),
              type,
              details: fullDetails,
              date: new Date().toISOString().slice(0, 10),
            },
            ...prev,
          ]);
          setDetails("");
          setTravel({ destination: "", returnDate: "", items: "" });
        }}
      >
        <div className="flex flex-wrap gap-2">
          <select
            className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            required={!isTravelCustody}
            className="min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="تفاصيل الطلب..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            رفع الطلب
          </button>
        </div>
        {isTravelCustody && (
          <div className="grid gap-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3 sm:grid-cols-3">
            <input
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="وجهة السفر"
              value={travel.destination}
              onChange={(e) => setTravel({ ...travel, destination: e.target.value })}
            />
            <input
              required
              type="date"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={travel.returnDate}
              onChange={(e) => setTravel({ ...travel, returnDate: e.target.value })}
            />
            <input
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="تفاصيل العهدة المطلوبة"
              value={travel.items}
              onChange={(e) => setTravel({ ...travel, items: e.target.value })}
            />
          </div>
        )}
      </form>
      <div className="space-y-2">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-4 py-2.5 text-sm"
          >
            <div>
              <p className="font-medium text-gray-800">
                {r.type} — {r.details}
              </p>
              <p className="text-[11px] text-gray-400">
                {currentUser.name} · {r.date}
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              قيد المراجعة
            </span>
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-xs text-gray-400">لا توجد طلبات مرفوعة بعد.</p>
        )}
      </div>
    </div>
  );
};

/** الحساب الشخصي — لكل المستخدمين */
export const AccountSection: React.FC = () => {
  const { currentUser, updateTeamMember } = useApp();
  const [email, setEmail] = useState(currentUser.email);
  const [saved, setSaved] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-gray-900">الحساب الشخصي</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="الاسم">
          <input className={inputClass} value={currentUser.name} readOnly />
        </FormField>
        <FormField label="البريد الإلكتروني الشخصي">
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label="كلمة المرور الجديدة">
          <input type="password" className={inputClass} placeholder="********" />
        </FormField>
        <FormField label="تأكيد كلمة المرور">
          <input type="password" className={inputClass} placeholder="********" />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            updateTeamMember(currentUser.id, { email });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          حفظ التغييرات
        </button>
        {saved && <span className="text-sm text-emerald-600">تم الحفظ ✓</span>}
      </div>
    </div>
  );
};

/** سجل التدقيق: من عدّل ماذا ومتى وبأي قيمة — للقراءة فقط */
const AuditLogSection: React.FC = () => {
  const { auditLog } = useApp();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-base font-bold text-gray-900">سجل التدقيق (Audit Log)</h2>
      <p className="mb-4 text-xs text-gray-400">
        يسجل النظام تلقائيًا: من عدّل الفاتورة؟ متى تغيّرت حالة المشروع؟ وبأي قيمة؟ — للقراءة فقط
      </p>
      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {auditLog.map((e) => (
          <div key={e.id} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">{e.userName}</span> — {e.action}
            <span className="mr-2 text-[10px] text-gray-400">
              {new Date(e.date).toLocaleString("ar-SA-u-ca-gregory-nu-latn")}
            </span>
          </div>
        ))}
        {auditLog.length === 0 && (
          <p className="text-xs text-gray-400">
            لا توجد عمليات مسجّلة بعد — أي تعديل مالي أو تغيير حالة سيظهر هنا تلقائيًا.
          </p>
        )}
      </div>
    </div>
  );
};

export const ContactSection: React.FC = () => {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-gray-900">
        <Mail size={18} className="text-blue-500" /> تواصل معنا
      </h2>
      <p className="mb-4 text-xs text-gray-400">فريق دعم Work Hub جاهز لمساعدتك</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <Mail size={15} className="text-gray-400" /> support@workhub.sa
        </p>
        <p className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <Phone size={15} className="text-gray-400" /> 920000000
        </p>
      </div>
      {sent ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ تم إرسال رسالتك — سنعود إليك خلال يوم عمل.
        </p>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!message.trim()) return;
            setSent(true);
          }}
        >
          <input
            className={inputClass}
            placeholder="اكتب رسالتك أو مشكلتك..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white hover:bg-blue-600"
          >
            <Send size={14} /> إرسال
          </button>
        </form>
      )}
    </div>
  );
};

const OwnerSection: React.FC = () => (
  <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/70 to-white p-6 shadow-sm">
    <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-amber-800">
      <Crown size={18} className="text-amber-500" /> وحدة المالك
    </h2>
    <p className="mb-4 text-xs text-amber-600">
      صلاحيات حصرية للمالك فقط — لا تظهر لبقية الأدوار
    </p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <button className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-amber-50">
        إدارة الاشتراك والفوترة
      </button>
      <button className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-amber-50">
        تصدير كامل بيانات الوكالة
      </button>
      <button className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-amber-50">
        نقل ملكية الحساب
      </button>
      <button className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
        حذف الحساب نهائيًا
      </button>
    </div>
  </div>
);

/** بوابة الأتمتة: أتمتات جاهزة + مربع AI يشرح فيه الموظف الأتمتة التي يحتاجها والنظام ينشئها */
const DEFAULT_AUTOMATIONS = [
  { id: 1, text: "إرسال الفاتورة للعميل تلقائيًا فور اعتماد الأدمن", enabled: true },
  { id: 2, text: "تذكير قبل 30 يومًا من انتهاء عقود العملاء", enabled: true },
  { id: 3, text: "توليد مهام تجديد أوراق وعقود الموظفين تلقائيًا", enabled: true },
  { id: 4, text: "تحويل عرض السعر المقبول إلى مشروع تلقائيًا", enabled: false },
  { id: 5, text: "إشعار مدير المشروع عند اكتمال كل مهام مرحلة", enabled: false },
];

const AutomationSection: React.FC = () => {
  const [automations, setAutomations] = useState(DEFAULT_AUTOMATIONS);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReply, setAiReply] = useState<string | null>(null);

  const createFromAI = () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiReply(null);
    setTimeout(() => {
      setAutomations((prev) => [
        ...prev,
        { id: Date.now(), text: aiText.trim(), enabled: true },
      ]);
      setAiReply(
        `فهمت طلبك ✓ أنشأت لك أتمتة جديدة: "${aiText.trim()}" — مفعّلة الآن ويمكنك إيقافها في أي وقت.`,
      );
      setAiText("");
      setAiLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/70 to-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-violet-800">
          ✨ مساعد الأتمتة الذكي (AI)
        </h2>
        <p className="mb-3 text-xs text-violet-500">
          اشرح للنظام الأتمتة التي تحتاجها في عملك وسيقوم بإنشائها لك
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            className="flex-1 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
            rows={2}
            placeholder='مثال: "أبي كل ما يتأخر مورد عن التسليم يوصلني تنبيه ويتسجل تحديث في ملفه"'
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
          />
          <button
            onClick={createFromAI}
            disabled={aiLoading || !aiText.trim()}
            className="rounded-xl bg-violet-500 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-50"
          >
            {aiLoading ? "جارٍ الإنشاء..." : "إنشاء الأتمتة"}
          </button>
        </div>
        {aiReply && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {aiReply}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-bold text-gray-900">خصخصة الأتمتة</h2>
        <p className="mb-4 text-xs text-gray-400">
          فعّل أو أوقف أي أتمتة — تشمل الجاهزة وما أنشأته عبر المساعد الذكي
        </p>
        <div className="space-y-2">
          {automations.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>{a.text}</span>
              <input
                type="checkbox"
                checked={a.enabled}
                onChange={() =>
                  setAutomations((prev) =>
                    prev.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)),
                  )
                }
                className="h-4 w-4 shrink-0 rounded border-gray-300"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
