import type { Permission, Role } from "../types";

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_team: "إدارة فريق العمل وتعيين الصلاحيات",
  manage_clients: "إدارة العملاء",
  manage_projects: "إدارة المشاريع",
  manage_vendors: "إدارة الموردين",
  manage_invoices: "إدارة العقود والفواتير",
  view_financials: "عرض التقارير المالية",
  manage_tasks: "تحديث حالة المهام",
  upload_deliverables: "رفع ملفات التسليم",
};

export const ALL_PERMISSIONS: Permission[] = Object.keys(PERMISSION_LABELS) as Permission[];

export const JOB_TITLE_SUGGESTIONS = [
  "مصمم جرافيك",
  "مطوّر",
  "كاتب محتوى",
  "مشرف حسابات",
  "محاسب / فواتير وعقود",
  "مسؤول تقني",
];

export const defaultPermissionsForRole = (role: Role): Permission[] => {
  switch (role) {
    case "owner":
    case "admin":
      return ALL_PERMISSIONS;
    case "team_member":
    default:
      return ["manage_tasks", "upload_deliverables"];
  }
};

/* القوالب الوظيفية الجاهزة — مدير المشاريع صار قالبًا يُسند وليس نوع مستخدم */
export const TPL_PM = "pt-pm";
export const TPL_ADMIN_STAFF = "pt-admin";
export const TPL_SALES = "pt-sales";
export const TPL_FINANCE = "pt-finance";

export const PM_PERMISSIONS: Permission[] = [
  "manage_clients",
  "manage_projects",
  "manage_vendors",
  "manage_invoices",
  "view_financials",
  "manage_tasks",
];

type MemberLike = { role: Role; templateId?: string | null };

export const hasPermission = (
  member: { role: Role; permissions: Permission[] },
  permission: Permission,
) => member.role === "owner" || member.permissions.includes(permission);

export const isManager = (role: Role) => role === "owner" || role === "admin";

/** هل هذا العضو مسند له قالب مدير المشاريع؟ */
export const isProjectManager = (m: MemberLike) => m.templateId === TPL_PM;

/** صلاحية التحرير العامة (عملاء/مشاريع/مستندات): المالك والأدمن ومن يحمل قالب مدير المشاريع */
export const canEditContent = (m: MemberLike) => isManager(m.role) || isProjectManager(m);

/** من يمكنه امتلاك الصفقات: الإدارة + قالب مدير المشاريع + قالب موظف المبيعات */
export const canOwnDeals = (m: MemberLike) =>
  isManager(m.role) || m.templateId === TPL_PM || m.templateId === TPL_SALES;
