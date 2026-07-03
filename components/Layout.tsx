import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Truck,
  FileText,
  Settings,
  CheckSquare,
  LogOut,
  ChevronDown,
  Menu,
  Handshake,
  Award,
  Layers,
  Box,
  Wallet,
  UserCog,
  Search,
  ListChecks,
  Bell,
  Plus,
  Building2,
  User,
  Megaphone,
  Sparkles,
  Boxes,
  ScrollText,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import type { Role, TeamMember } from "../types";

const ROLE_LABELS: Record<Role, string> = {
  owner: "المالك",
  admin: "المسؤول (أدمن)",
  team_member: "عضو الفريق",
};

type NavItem = { to: string; label: string; icon: React.ElementType };
type NavGroup = { group: string; to: string; icon: React.ElementType; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

const isGroup = (e: NavEntry): e is NavGroup => "group" in e;

/* الهيكلة الأساسية: إدارة العملاء والتسويق ← إدارة المشاريع ← إدارة الموردين
   ← إدارة الموظفين ← الإدارة المالية ← إدارة الشركة ← وأخيرًا الإعدادات */

const crmGroup: NavGroup = {
  group: "إدارة العملاء والتسويق",
  to: "/deals",
  icon: Handshake,
  items: [
    { to: "/deals", label: "الصفقات", icon: Handshake },
    { to: "/clients", label: "العملاء", icon: Users },
    { to: "/marketing", label: "التسويق", icon: Megaphone },
  ],
};

// الرئيسي يعرض المهام والمشاريع معًا؛ ويضم الفرص وسلاسل الإمداد والموردين كتصنيفات ثانوية
const projectsGroup: NavGroup = {
  group: "المشاريع والفرص",
  to: "/projects",
  icon: Briefcase,
  items: [
    { to: "/projects-list", label: "المشاريع", icon: Briefcase },
    { to: "/opportunities", label: "الفرص", icon: Sparkles },
    { to: "/tasks-board", label: "لوحة المهام", icon: ListChecks },
    { to: "/supply-chains", label: "سلاسل الإمداد", icon: Boxes },
    { to: "/vendors", label: "الموردون", icon: Truck },
  ],
};

const hrGroup: NavGroup = {
  group: "إدارة الموظفين",
  to: "/hr",
  icon: UserCog,
  items: [
    { to: "/employees", label: "إدارة الموظفين", icon: UserCog },
    { to: "/employees-roles", label: "إدارة الأدوار والصلاحيات", icon: Users },
    { to: "/employees-performance", label: "بطاقات الأداء", icon: Award },
  ],
};

// التصنيفات الثانوية للمالية والمحاسبة (عروض/عقود/فواتير/مشتريات)
const FINANCE_ITEMS: NavItem[] = [
  { to: "/quotations", label: "عروض الأسعار", icon: ScrollText },
  { to: "/contracts-list", label: "العقود", icon: FileText },
  { to: "/invoices", label: "الفواتير", icon: Receipt },
  { to: "/purchases", label: "المشتريات", icon: ShoppingCart },
];

const financeGroup = (extra: NavItem[] = []): NavGroup => ({
  group: "الإدارة المالية",
  to: "/finance",
  icon: Wallet,
  items: [...FINANCE_ITEMS, ...extra],
});

const companyGroup = (items: NavItem[]): NavGroup => ({
  group: "إدارة الشركة",
  to: "/portfolio",
  icon: Building2,
  items,
});

/* المالك والأدمن يشوفون كل شيء؛ أعضاء الفريق تظهر لهم التصنيفات الرئيسية
   والفرعية حسب الصلاحيات/القالب المسند لهم من إدارة الأدوار والصلاحيات */
const navFor = (user: TeamMember): NavEntry[] => {
  if (user.role === "owner")
    return [
      { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
      crmGroup,
      projectsGroup,
      hrGroup,
      financeGroup([{ to: "/services-tree", label: "شجرة الخدمات", icon: Layers }]),
      companyGroup([
        { to: "/portfolio", label: "ملف الأعمال", icon: Award },
        { to: "/assets", label: "أصول الشركة", icon: Box },
      ]),
      { to: "/settings", label: "الإعدادات", icon: Settings },
    ];
  if (user.role === "admin")
    return [
      { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
      crmGroup,
      projectsGroup,
      hrGroup,
      financeGroup(),
      companyGroup([
        { to: "/portfolio", label: "ملف الأعمال", icon: Award },
        { to: "/assets", label: "أصول الشركة", icon: Box },
      ]),
      { to: "/settings", label: "الإعدادات", icon: Settings },
    ];
  // عضو فريق: التصنيفات حسب الإسناد — والوصول للصفحات لا يعني تطبيق التغيير
  // (أي تعديل يُرفع للأدمن للموافقة)
  const p = user.permissions;
  const entries: NavEntry[] = [
    { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { to: "/tasks", label: "مهامي", icon: CheckSquare },
  ];
  if (p.includes("manage_clients")) entries.push(crmGroup);
  if (p.includes("manage_projects") || p.includes("manage_tasks") || p.includes("manage_vendors"))
    entries.push(projectsGroup);
  if (p.includes("manage_invoices") || p.includes("view_financials"))
    entries.push(financeGroup());
  entries.push({ to: "/settings", label: "الإعدادات", icon: Settings });
  return entries;
};

const GlobalSearch: React.FC = () => {
  const {
    currentUser,
    clients,
    projects,
    vendors,
    deals,
    quotations,
    contracts,
    invoices,
    tasks,
    teamMembers,
    companyAssets,
    officialDocuments,
    purchases,
    serviceCatalog,
  } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const isManager = ["owner", "admin"].includes(currentUser.role);

  type Result = { label: string; sub: string; to: string };
  const results: Result[] = [];
  if (query.trim()) {
    const q = query.trim();
    const flat = navFor(currentUser).flatMap((e) =>
      isGroup(e) ? e.items : [e],
    );
    flat
      .filter((i) => i.label.includes(q))
      .forEach((i) => results.push({ label: i.label, sub: "صفحة", to: i.to }));
    clients
      .filter((c) => c.name.includes(q) || c.contactPerson.includes(q))
      .forEach((c) => results.push({ label: c.name, sub: "عميل", to: `/clients/${c.id}` }));
    projects
      .filter((p) => p.name.includes(q) || p.description.includes(q))
      .forEach((p) => results.push({ label: p.name, sub: "مشروع", to: `/projects/${p.id}` }));
    tasks
      .filter((t) => t.title.includes(q) || t.category.includes(q))
      .forEach((t) => results.push({ label: t.title, sub: "مهمة", to: "/tasks-board" }));
    vendors
      .filter((v) => v.name.includes(q) || v.serviceType.includes(q) || v.city.includes(q))
      .forEach((v) => results.push({ label: v.name, sub: "مورد", to: `/vendors/${v.id}` }));
    deals
      .filter((d) => d.prospectName.includes(q) || d.contactName.includes(q))
      .forEach((d) => results.push({ label: d.prospectName, sub: "صفقة", to: "/deals" }));
    quotations
      .filter((x) => x.quoteNumber.includes(q) || x.clientName.includes(q))
      .forEach((x) =>
        results.push({ label: `${x.quoteNumber} — ${x.clientName}`, sub: "عرض سعر", to: `/quotations/${x.id}` }),
      );
    contracts
      .filter((c) => c.title.includes(q))
      .forEach((c) => results.push({ label: c.title, sub: "عقد", to: `/contracts/${c.id}` }));
    invoices
      .filter((i) => i.invoiceNumber.includes(q))
      .forEach((i) =>
        results.push({ label: i.invoiceNumber, sub: "فاتورة", to: `/invoices/${i.id}` }),
      );
    purchases
      .filter((p) => p.item.includes(q) || p.vendorName.includes(q))
      .forEach((p) => results.push({ label: p.item, sub: "مشتريات", to: "/invoices" }));
    serviceCatalog
      .filter((s) => s.name.includes(q))
      .forEach((s) =>
        results.push({
          label: s.name,
          sub: "خدمة",
          to: currentUser.role === "owner" ? "/services-tree" : "/invoices",
        }),
      );
    if (isManager) {
      teamMembers
        .filter((m) => m.name.includes(q) || (m.jobTitle ?? "").includes(q))
        .forEach((m) => results.push({ label: m.name, sub: "موظف", to: "/employees" }));
      companyAssets
        .filter((a) => a.name.includes(q))
        .forEach((a) => results.push({ label: a.name, sub: "أصل", to: "/assets" }));
      officialDocuments
        .filter((d) => d.name.includes(q) || d.number.includes(q))
        .forEach((d) => results.push({ label: d.name, sub: "مستند رسمي", to: "/assets" }));
    }
  }

  return (
    <div className="relative w-full max-w-xs">
      <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pr-9 pl-3 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white"
        placeholder="بحث سريع عن أي ميزة أو سجل..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && query.trim() && (
        <div className="absolute top-11 right-0 z-40 max-h-80 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
          {results.slice(0, 10).map((r, i) => (
            <button
              key={i}
              onMouseDown={() => {
                navigate(r.to);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm hover:bg-blue-50"
            >
              <span className="truncate font-medium text-gray-700">{r.label}</span>
              <span className="mr-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                {r.sub}
              </span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-3 py-3 text-center text-xs text-gray-400">لا توجد نتائج مطابقة</p>
          )}
        </div>
      )}
    </div>
  );
};

/** مركز التذكيرات: كل ما له استحقاق/انتهاء/موافقة = تنبيه مهم، وتحديثات الحالة العادية = سجل نشاط */
const NotificationCenter: React.FC = () => {
  const {
    currentUser,
    invoices,
    contracts,
    clients,
    projects,
    tasks,
    quotations,
    purchases,
    officialDocuments,
    teamMembers,
    notificationPrefs,
    changeRequests,
    resolveChangeRequest,
  } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const daysLeft = (d: string) =>
    Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  const isApprover = ["owner", "admin"].includes(currentUser.role);
  const pendingChanges = changeRequests.filter((r) => r.status === "pending");

  type Item = { text: string; to: string; tone: "red" | "amber" | "blue" | "orange" };
  const important: Item[] = [];

  if (notificationPrefs.approvals && isApprover) {
    const pending =
      invoices.filter((i) => i.approval === "pending_approval").length +
      quotations.filter((q) => q.approval === "pending_approval").length +
      contracts.filter((c) => c.approval === "pending_approval").length +
      purchases.filter((p) => p.approval === "pending_approval").length;
    if (pending > 0)
      important.push({ text: `${pending} طلبات بانتظار موافقتك`, to: "/dashboard", tone: "orange" });
  }
  if (notificationPrefs.deadlines) {
    invoices
      .filter((i) => i.status === "overdue")
      .forEach((i) =>
        important.push({ text: `فاتورة ${i.invoiceNumber} متأخرة عن السداد`, to: `/invoices/${i.id}`, tone: "red" }),
      );
    invoices
      .filter((i) => i.status === "sent" && daysLeft(i.dueDate) >= 0 && daysLeft(i.dueDate) <= 5)
      .forEach((i) =>
        important.push({ text: `فاتورة ${i.invoiceNumber} تستحق خلال ${daysLeft(i.dueDate)} يوم`, to: `/invoices/${i.id}`, tone: "amber" }),
      );
    projects
      .filter((p) => ["in-progress", "review"].includes(p.status) && daysLeft(p.endDate) >= 0 && daysLeft(p.endDate) <= 5)
      .forEach((p) =>
        important.push({ text: `مشروع "${p.name}" يقترب تسليمه (${daysLeft(p.endDate)} يوم)`, to: `/projects/${p.id}`, tone: "amber" }),
      );
  }
  if (notificationPrefs.renewals) {
    clients
      .filter((c) => c.status === "active" && daysLeft(c.contractEndDate) >= 0 && daysLeft(c.contractEndDate) <= 30)
      .forEach((c) =>
        important.push({ text: `عقد "${c.name}" يحتاج تجديد خلال ${daysLeft(c.contractEndDate)} يوم`, to: `/clients/${c.id}`, tone: "orange" }),
      );
    contracts
      .filter((c) => c.status === "active" && daysLeft(c.endDate) >= 0 && daysLeft(c.endDate) <= 30)
      .forEach((c) =>
        important.push({ text: `عقد "${c.title}" ينتهي خلال ${daysLeft(c.endDate)} يوم`, to: `/contracts/${c.id}`, tone: "orange" }),
      );
  }
  if (notificationPrefs.documents && isApprover) {
    officialDocuments
      .filter((d) => daysLeft(d.expiryDate) <= 60)
      .forEach((d) =>
        important.push({
          text: daysLeft(d.expiryDate) < 0 ? `"${d.name}" منتهي — يحتاج تجديدًا فوريًا` : `"${d.name}" ينتهي خلال ${daysLeft(d.expiryDate)} يوم`,
          to: "/assets",
          tone: daysLeft(d.expiryDate) < 0 ? "red" : "amber",
        }),
      );
    teamMembers
      .filter((m) => m.employeeFile && daysLeft(m.employeeFile.contractEnd) >= 0 && daysLeft(m.employeeFile.contractEnd) <= 90)
      .forEach((m) =>
        important.push({ text: `عقد الموظف ${m.name} ينتهي خلال ${daysLeft(m.employeeFile!.contractEnd)} يوم — تجديد أو إنهاء`, to: "/employees", tone: "orange" }),
      );
  }
  if (notificationPrefs.tasks) {
    const today = new Date().toISOString().slice(0, 10);
    tasks
      .filter((t) => t.status !== "completed" && t.dueDate < today)
      .filter((t) => isApprover || t.assignedTo === currentUser.id)
      .forEach((t) =>
        important.push({ text: `مهمة "${t.title}" متأخرة`, to: currentUser.role === "team_member" ? "/tasks" : "/tasks-board", tone: "red" }),
      );
  }

  // غير المهم → سجل النشاط
  const activity = notificationPrefs.activity
    ? projects
        .flatMap((p) => (p.activity ?? []).map((a) => ({ ...a, name: p.name, id: p.id })))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6)
    : [];

  const TONES: Record<Item["tone"], string> = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
      >
        <Bell size={18} />
        {important.length + (isApprover ? pendingChanges.length : 0) > 0 && (
          <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {important.length + (isApprover ? pendingChanges.length : 0)}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-40 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          {/* طلبات تغيير من الفريق بانتظار موافقة الأدمن */}
          {isApprover && pendingChanges.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-bold text-orange-600">
                طلبات تغيير بانتظار موافقتك ({pendingChanges.length})
              </p>
              <div className="space-y-1.5">
                {pendingChanges.slice(0, 8).map((r) => (
                  <div key={r.id} className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
                    <p>
                      <b>{r.userName}:</b> {r.description}
                    </p>
                    <div className="mt-1.5 flex gap-1.5">
                      <button
                        onClick={() => resolveChangeRequest(r.id, true)}
                        className="rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-600"
                      >
                        موافقة
                      </button>
                      <button
                        onClick={() => resolveChangeRequest(r.id, false)}
                        className="rounded-md bg-red-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-600"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="my-2 border-t border-gray-100" />
            </div>
          )}
          <p className="mb-2 text-xs font-bold text-gray-500">التذكيرات المهمة ({important.length})</p>
          <div className="space-y-1.5">
            {important.slice(0, 12).map((n, i) => (
              <button
                key={i}
                onClick={() => {
                  navigate(n.to);
                  setOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-right text-xs ${TONES[n.tone]} hover:opacity-80`}
              >
                {n.text}
              </button>
            ))}
            {important.length === 0 && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                ✓ لا توجد تذكيرات مهمة حاليًا
              </p>
            )}
          </div>
          {activity.length > 0 && (
            <>
              <p className="mb-2 mt-3 border-t border-gray-100 pt-3 text-xs font-bold text-gray-500">
                سجل النشاط (غير مهم)
              </p>
              <div className="space-y-1">
                {activity.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(`/projects/${a.id}`);
                      setOpen(false);
                    }}
                    className="block w-full rounded-lg bg-gray-50 px-3 py-1.5 text-right text-[11px] text-gray-500 hover:bg-gray-100"
                  >
                    {a.name}: {a.text}
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="mt-3 border-t border-gray-100 pt-2 text-center text-[11px] text-gray-400">
            تحكم بهذه التذكيرات من الإعدادات ← التنبيهات
          </p>
        </div>
      )}
    </div>
  );
};

/** تبديل الوكالة متاح للجميع لكنه يظهر فقط عند إسناد المستخدم لأكثر من وكالة */
const AgencySwitcher: React.FC = () => {
  const { currentUser, agencies, currentAgencyId, switchAgency, addAgency } = useApp();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const current = agencies.find((a) => a.id === currentAgencyId);

  // الوكالات التي أُسند إليها المستخدم فقط (المالك يرى الجميع)
  const myAgencies =
    currentUser.role === "owner"
      ? agencies
      : agencies.filter((a) => (currentUser.agencyIds ?? []).includes(a.id));

  const canAdd = currentUser.role === "owner";

  // لا يظهر المبدّل إلا لمن أُسند لأكثر من وكالة (أو المالك الذي يمكنه الإضافة)
  if (myAgencies.length <= 1 && !canAdd)
    return (
      <p className="truncate px-5 pb-3 text-xs font-semibold text-gray-500">{current?.name}</p>
    );

  return (
    <div className="relative px-4 pb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Building2 size={14} className="shrink-0 text-blue-500" />
          {current?.name}
        </span>
        <ChevronDown size={14} className="shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-4 left-4 z-40 mt-1 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          {myAgencies.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                switchAgency(a.id);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-right text-xs ${
                a.id === currentAgencyId
                  ? "bg-blue-50 font-bold text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {a.name}
            </button>
          ))}
          <form
            className="mt-1 flex gap-1 border-t border-gray-100 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              addAgency(newName.trim());
              setNewName("");
              setOpen(false);
            }}
          >
            <input
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
              placeholder="اسم وكالة جديدة..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-500 px-2 text-white hover:bg-blue-600"
            >
              <Plus size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser, teamMembers, switchUser, logout } = useApp();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // كل المجموعات مفتوحة افتراضيًا وقابلة للطي
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const navItems = navFor(currentUser);

  const toggleGroup = (name: string) =>
    setOpenGroups((prev) => ({ ...prev, [name]: !(prev[name] ?? true) }));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">
          WH
        </div>
        <div>
          <p className="text-sm font-extrabold text-gray-900">WORK HUB</p>
          <p className="text-xs text-gray-400">إدارة المشاريع الموحدة</p>
        </div>
      </div>
      <AgencySwitcher />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((entry) => {
          if (isGroup(entry)) {
            const isOpen = openGroups[entry.group] ?? true;
            return (
              <div key={entry.group} className="pt-1">
                <div className="flex items-center">
                  {/* التصنيف الرئيسي قابل للضغط — يفتح لوحة التحكم الخاصة به */}
                  <NavLink
                    to={entry.to}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`
                    }
                  >
                    <entry.icon size={18} />
                    {entry.group}
                  </NavLink>
                  <button
                    onClick={() => toggleGroup(entry.group)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isOpen ? "" : "rotate-90"}`}
                    />
                  </button>
                </div>
                {isOpen && (
                  <div className="mt-1 space-y-1 border-r-2 border-gray-100 mr-4 pr-2">
                    {entry.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileNavOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-blue-500 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-100"
                          }`
                        }
                      >
                        <item.icon size={17} />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <entry.icon size={18} />
              {entry.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      <aside className="hidden w-64 shrink-0 flex-col border-l border-gray-200 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 flex bg-black/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="flex h-full w-64 flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
          <button
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden items-center gap-4 lg:flex lg:flex-1">
            <span className="shrink-0 text-sm text-gray-500">
              مرحبًا، {currentUser.name.split(" ")[0]} 👋
            </span>
            <GlobalSearch />
          </div>
          <div className="flex-1 px-2 lg:hidden">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2">
          <NotificationCenter />
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pr-1.5 pl-3 text-sm hover:bg-gray-50"
            >
              <span className="text-gray-600">{ROLE_LABELS[currentUser.role]}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {currentUser.avatar}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {roleMenuOpen && (
              <div className="absolute left-0 z-30 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                {/* بيانات المستخدم الحالي */}
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {currentUser.avatar}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-800">{currentUser.name}</p>
                    <p className="truncate text-[11px] text-gray-400">
                      {currentUser.templateId
                        ? currentUser.jobTitle ?? ROLE_LABELS[currentUser.role]
                        : ROLE_LABELS[currentUser.role]}
                    </p>
                  </div>
                </div>

                {/* إجراءات الحساب */}
                <div className="mt-1 border-t border-gray-100 pt-1">
                  <button
                    onClick={() => {
                      navigate("/settings?portal=account");
                      setRoleMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User size={15} className="text-gray-400" /> تعديل بيانات الحساب
                  </button>
                  <button
                    onClick={() => {
                      navigate("/settings");
                      setRoleMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings size={15} className="text-gray-400" /> الإعدادات
                  </button>
                </div>

                {/* تبديل الحساب / الدور (للعرض التجريبي) */}
                <div className="mt-1 border-t border-gray-100 pt-1">
                  <p className="px-2 py-1 text-[11px] font-semibold text-gray-400">
                    تبديل الحساب (للعرض التجريبي)
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    {teamMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          switchUser(m.id);
                          setRoleMenuOpen(false);
                          navigate("/dashboard");
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-gray-50 ${
                          currentUser.id === m.id
                            ? "font-semibold text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="truncate">{m.name}</span>
                        <span className="mr-2 shrink-0 text-[10px] text-gray-400">
                          {m.templateId ? m.jobTitle ?? ROLE_LABELS[m.role] : ROLE_LABELS[m.role]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* تسجيل الخروج */}
                <div className="mt-1 border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};
