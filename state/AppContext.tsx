import React, { createContext, useContext, useMemo, useState } from "react";
import {
  agencies as initialAgencies,
  clients as initialClients,
  comments as initialComments,
  companyAssets as initialAssets,
  contracts as initialContracts,
  deals as initialDeals,
  invoices as initialInvoices,
  officialDocuments as initialDocuments,
  purchases as initialPurchases,
  permissionTemplates as initialPermissionTemplates,
  projectNotes as initialProjectNotes,
  projectPhases as initialPhases,
  projectTasks as initialTasks,
  projects as initialProjects,
  quotations as initialQuotations,
  serviceCatalog as initialServiceCatalog,
  teamMembers,
  vendorAssignments as initialAssignments,
  vendorNotes as initialVendorNotes,
  vendors as initialVendors,
} from "../data/mockData";
import type {
  Agency,
  ApprovalStatus,
  AuditEntry,
  Client,
  Comment,
  CompanyAsset,
  Contract,
  Deal,
  DealNote,
  Invoice,
  OfficialDocument,
  Permission,
  PermissionTemplate,
  Purchase,
  Project,
  ProjectFile,
  ProjectNote,
  ProjectPhase,
  ProjectTask,
  Quotation,
  ServiceItem,
  TaskStatus,
  TeamMember,
  Vendor,
  VendorAssignment,
  VendorNote,
} from "../types";
import { canEditContent } from "../lib/permissions";

/** طلب تغيير من عضو فريق: لا يُطبق فعليًا حتى يوافق الأدمن */
export interface ChangeRequest {
  id: string;
  date: string;
  userId: string;
  userName: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  apply: () => void;
}

interface AppState {
  isAuthenticated: boolean;
  currentUser: TeamMember;
  clients: Client[];
  projects: Project[];
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  vendors: Vendor[];
  assignments: VendorAssignment[];
  invoices: Invoice[];
  comments: Comment[];
  teamMembers: TeamMember[];
  deals: Deal[];
  dealNotes: DealNote[];
  projectNotes: ProjectNote[];
  projectFiles: ProjectFile[];
  vendorNotes: VendorNote[];
  serviceCatalog: ServiceItem[];
  contracts: Contract[];
  quotations: Quotation[];
  companyAssets: CompanyAsset[];
  officialDocuments: OfficialDocument[];
  purchases: Purchase[];
  permissionTemplates: PermissionTemplate[];
  agencies: Agency[];
  currentAgencyId: string;
  addAgency: (name: string) => void;
  switchAgency: (agencyId: string) => void;
  notificationPrefs: Record<string, boolean>;
  toggleNotificationPref: (key: string) => void;
  auditLog: AuditEntry[];
  updateService: (serviceId: string, updates: Partial<Omit<ServiceItem, "id">>) => void;
  updateProject: (projectId: string, updates: Partial<Omit<Project, "id">>) => void;
  updateVendor: (vendorId: string, updates: Partial<Omit<Vendor, "id">>) => void;
  updateTask: (taskId: string, updates: Partial<Omit<ProjectTask, "id">>) => void;
  updateAsset: (assetId: string, updates: Partial<Omit<CompanyAsset, "id">>) => void;
  updatePurchase: (purchaseId: string, updates: Partial<Omit<Purchase, "id">>) => void;
  updateTeamMember: (memberId: string, updates: Partial<Omit<TeamMember, "id">>) => void;
  updateClient: (clientId: string, updates: Partial<Omit<Client, "id">>) => void;
  login: (memberId: string) => void;
  logout: () => void;
  switchUser: (memberId: string) => void;
  changeRequests: ChangeRequest[];
  resolveChangeRequest: (requestId: string, approve: boolean) => void;
  addClient: (client: Omit<Client, "id">) => void;
  addProject: (project: Omit<Project, "id" | "activity">) => void;
  updateProjectStatus: (projectId: string, status: Project["status"]) => void;
  updateProjectTeam: (
    projectId: string,
    assignedTo: string,
    keyTeamMembers: string[],
  ) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addComment: (taskId: string, text: string) => void;
  addVendor: (vendor: Omit<Vendor, "id">) => void;
  addInvoice: (invoice: Omit<Invoice, "id">) => void;
  updateInvoiceStatus: (invoiceId: string, status: Invoice["status"]) => void;
  updateAssignmentStatus: (
    assignmentId: string,
    status: VendorAssignment["status"],
  ) => void;
  addTeamMember: (member: Omit<TeamMember, "id">) => void;
  updateTeamMemberPermissions: (memberId: string, permissions: Permission[]) => void;
  addDeal: (deal: Omit<Deal, "id">) => void;
  updateDealStage: (dealId: string, stage: Deal["stage"]) => void;
  updateDeal: (dealId: string, updates: Partial<Omit<Deal, "id">>) => void;
  addDealNote: (dealId: string, text: string) => void;
  addProjectNote: (projectId: string, text: string) => void;
  addProjectFile: (file: Omit<ProjectFile, "id">) => void;
  removeProjectFile: (fileId: string) => void;
  toggleProjectFileApproval: (fileId: string) => void;
  addVendorNote: (vendorId: string, text: string, projectId: string | null) => void;
  setTaskDelayReason: (taskId: string, reason: string) => void;
  addService: (service: Omit<ServiceItem, "id">) => void;
  addContract: (contract: Omit<Contract, "id">) => void;
  updateContractStatus: (contractId: string, status: Contract["status"]) => void;
  updateContract: (contractId: string, updates: Partial<Omit<Contract, "id">>) => void;
  addPermissionTemplate: (template: Omit<PermissionTemplate, "id">) => void;
  updatePermissionTemplate: (templateId: string, updates: Partial<Omit<PermissionTemplate, "id">>) => void;
  deletePermissionTemplate: (templateId: string) => void;
  addTask: (task: Omit<ProjectTask, "id">) => void;
  addQuotation: (quotation: Omit<Quotation, "id">) => void;
  updateQuotationStatus: (quotationId: string, status: Quotation["status"]) => void;
  updateQuotation: (quotationId: string, updates: Partial<Omit<Quotation, "id">>) => void;
  updateInvoice: (invoiceId: string, updates: Partial<Omit<Invoice, "id">>) => void;
  addAsset: (asset: Omit<CompanyAsset, "id">) => void;
  toggleAssetVisibility: (assetId: string) => void;
  toggleDocumentVisibility: (docId: string) => void;
  addDocument: (doc: Omit<OfficialDocument, "id">) => void;
  updateDocument: (docId: string, updates: Partial<Omit<OfficialDocument, "id">>) => void;
  addPurchase: (purchase: Omit<Purchase, "id">) => void;
  updatePurchaseStatus: (purchaseId: string, status: Purchase["status"]) => void;
  setApproval: (
    kind: "invoice" | "quotation" | "contract" | "purchase",
    id: string,
    status: ApprovalStatus,
  ) => void;
  updateLineItemStatus: (
    projectId: string,
    lineItemId: string,
    status: "pending" | "in-progress" | "completed",
  ) => void;
  // اعتماد المخرجات: العضو يرفع، ومدير المشروع/الأدمن يعتمد أو يطلب دورة تعديل أو يرفض
  submitDeliverable: (taskId: string) => void;
  reviewDeliverable: (
    taskId: string,
    action: "approved" | "revision" | "rejected",
    notes?: string,
  ) => void;
}

const AppContext = createContext<AppState | null>(null);

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<TeamMember>(teamMembers[0]);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [phases] = useState<ProjectPhase[]>(initialPhases);
  const [tasks, setTasks] = useState<ProjectTask[]>(initialTasks);
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [assignments, setAssignments] = useState<VendorAssignment[]>(initialAssignments);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [members, setMembers] = useState<TeamMember[]>(teamMembers);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [dealNotes, setDealNotes] = useState<DealNote[]>([]);
  const [projectNotes, setProjectNotes] = useState<ProjectNote[]>(initialProjectNotes);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [vendorNotes, setVendorNotes] = useState<VendorNote[]>(initialVendorNotes);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceItem[]>(initialServiceCatalog);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [permissionTemplates, setPermissionTemplates] = useState<PermissionTemplate[]>(
    initialPermissionTemplates,
  );
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>(initialAssets);
  const [officialDocuments, setOfficialDocuments] =
    useState<OfficialDocument[]>(initialDocuments);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies);
  const [currentAgencyId, setCurrentAgencyId] = useState(initialAgencies[0].id);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({
    deadlines: true, // مواعيد الاستحقاق والانتهاء
    approvals: true, // طلبات الموافقة
    renewals: true, // تجديد العقود
    documents: true, // انتهاء الأوراق الرسمية
    tasks: true, // المهام المتأخرة
    activity: true, // تحديثات الحالة غير المهمة (سجل النشاط)
  });

  const login = (memberId: string) => {
    const user = members.find((m) => m.id === memberId) ?? members[0];
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => setIsAuthenticated(false);

  const switchUser = (memberId: string) => {
    const user = members.find((m) => m.id === memberId) ?? members[0];
    setCurrentUser(user);
  };

  // سجل التدقيق: من فعل ماذا ومتى وبأي قيمة (حماية قانونية للنظام المالي)
  const logAudit = (action: string) => {
    setAuditLog((prev) => [
      {
        id: nextId("log"),
        date: new Date().toISOString(),
        userName: currentUser.name,
        action,
      },
      ...prev,
    ]);
  };

  // أعضاء الفريق يصلون للصفحات حسب صلاحياتهم، لكن أي تغيير فعلي على بطاقة
  // لا يُطبق إلا بعد إشعار الأدمن وموافقته
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  const guardChange = (description: string, apply: () => void) => {
    if (canEditContent(currentUser)) {
      apply();
      return;
    }
    setChangeRequests((prev) => [
      {
        id: nextId("cr"),
        date: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        description,
        status: "pending" as const,
        apply,
      },
      ...prev,
    ]);
    logAudit(`رفع طلب تغيير بانتظار موافقة الأدمن: ${description}`);
  };

  const resolveChangeRequest: AppState["resolveChangeRequest"] = (requestId, approve) => {
    const req = changeRequests.find((r) => r.id === requestId);
    if (!req || req.status !== "pending") return;
    if (approve) req.apply();
    setChangeRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: approve ? "approved" : "rejected" } : r,
      ),
    );
    logAudit(`${approve ? "وافق على" : "رفض"} طلب التغيير: ${req.description} (طلبه ${req.userName})`);
  };

  const addClient: AppState["addClient"] = (client) => {
    setClients((prev) => [...prev, { ...client, id: nextId("c") }]);
    logAudit(`أضاف عميلًا جديدًا: ${client.name}`);
  };

  const addProject: AppState["addProject"] = (project) => {
    setProjects((prev) => [
      ...prev,
      { ...project, id: nextId("p"), activity: [] },
    ]);
  };

  const updateProjectStatus: AppState["updateProjectStatus"] = (
    projectId,
    status,
  ) => {
    const prevProject = projects.find((p) => p.id === projectId);
    guardChange(`تغيير حالة المشروع "${prevProject?.name}" إلى "${status}"`, () => {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status } : p)),
      );
      if (prevProject && prevProject.status !== status)
        logAudit(
          `غيّر حالة المشروع "${prevProject.name}" من "${prevProject.status}" إلى "${status}"`,
        );
    });
  };

  const updateProjectTeam: AppState["updateProjectTeam"] = (
    projectId,
    assignedTo,
    keyTeamMembers,
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, assignedTo, keyTeamMembers } : p,
      ),
    );
  };

  const updateTaskStatus: AppState["updateTaskStatus"] = (
    taskId,
    status,
  ) => {
    const prevT = tasks.find((t) => t.id === taskId);
    guardChange(`تغيير حالة المهمة "${prevT?.title}" إلى "${status}"`, () => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status, progress: status === "completed" ? 100 : t.progress }
            : t,
        ),
      );
    });
  };

  const addComment: AppState["addComment"] = (taskId, text) => {
    setComments((prev) => [
      ...prev,
      {
        id: nextId("cm"),
        taskId,
        userId: currentUser.id,
        userName: currentUser.name,
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const addVendor: AppState["addVendor"] = (vendor) => {
    setVendors((prev) => [...prev, { ...vendor, id: nextId("v") }]);
  };

  const addInvoice: AppState["addInvoice"] = (invoice) => {
    setInvoices((prev) => [...prev, { ...invoice, id: nextId("inv") }]);
  };

  const updateInvoiceStatus: AppState["updateInvoiceStatus"] = (
    invoiceId,
    status,
  ) => {
    guardChange(`تغيير حالة الفاتورة إلى "${status}"`, () =>
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              status,
              paidDate:
                status === "paid"
                  ? new Date().toISOString().slice(0, 10)
                  : i.paidDate,
            }
          : i,
      ),
    ));
  };

  const updateAssignmentStatus: AppState["updateAssignmentStatus"] = (
    assignmentId,
    status,
  ) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              status,
              paymentDate:
                status === "paid"
                  ? new Date().toISOString().slice(0, 10)
                  : a.paymentDate,
            }
          : a,
      ),
    );
  };

  const addTeamMember: AppState["addTeamMember"] = (member) => {
    setMembers((prev) => [...prev, { ...member, id: nextId("u") }]);
  };

  const updateTeamMemberPermissions: AppState["updateTeamMemberPermissions"] = (
    memberId,
    permissions,
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, permissions } : m)),
    );
  };

  const addDeal: AppState["addDeal"] = (deal) => {
    setDeals((prev) => [...prev, { ...deal, id: nextId("d") }]);
  };

  const updateDealStage: AppState["updateDealStage"] = (dealId, stage) => {
    const prevD = deals.find((d) => d.id === dealId);
    guardChange(`نقل الصفقة "${prevD?.prospectName}" إلى مرحلة "${stage}"`, () => {
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage } : d)));
    });
  };

  const updateDeal: AppState["updateDeal"] = (dealId, updates) => {
    const prevD = deals.find((d) => d.id === dealId);
    guardChange(`تعديل بيانات الصفقة "${prevD?.prospectName}"`, () => {
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...updates } : d)));
    });
  };

  const addDealNote: AppState["addDealNote"] = (dealId, text) => {
    setDealNotes((prev) => [
      ...prev,
      {
        id: nextId("dn"),
        dealId,
        text,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const addProjectNote: AppState["addProjectNote"] = (projectId, text) => {
    setProjectNotes((prev) => [
      ...prev,
      {
        id: nextId("pn"),
        projectId,
        text,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const addProjectFile: AppState["addProjectFile"] = (file) => {
    setProjectFiles((prev) => [...prev, { ...file, id: nextId("pf") }]);
  };

  const removeProjectFile: AppState["removeProjectFile"] = (fileId) => {
    setProjectFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const toggleProjectFileApproval: AppState["toggleProjectFileApproval"] = (fileId) => {
    setProjectFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, approved: !f.approved } : f)),
    );
    const f = projectFiles.find((x) => x.id === fileId);
    if (f) logAudit(`${f.approved ? "ألغى اعتماد" : "اعتمد"} الملف "${f.name}"`);
  };

  const addVendorNote: AppState["addVendorNote"] = (vendorId, text, projectId) => {
    setVendorNotes((prev) => [
      ...prev,
      {
        id: nextId("vn"),
        vendorId,
        projectId,
        text,
        authorId: currentUser.id,
        authorName: currentUser.name,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const setTaskDelayReason: AppState["setTaskDelayReason"] = (taskId, reason) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, delayReason: reason } : t)),
    );
  };

  const addService: AppState["addService"] = (service) => {
    setServiceCatalog((prev) => [...prev, { ...service, id: nextId("sv") }]);
  };

  const addContract: AppState["addContract"] = (contract) => {
    setContracts((prev) => [...prev, { ...contract, id: nextId("ct") }]);
  };

  const updateContractStatus: AppState["updateContractStatus"] = (contractId, status) => {
    guardChange(`تغيير حالة العقد إلى "${status}"`, () =>
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, status } : c)),
      ),
    );
  };

  const updateContract: AppState["updateContract"] = (contractId, updates) => {
    guardChange(`تعديل العقد`, () =>
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, ...updates } : c)),
      ),
    );
  };

  const addPermissionTemplate: AppState["addPermissionTemplate"] = (template) => {
    setPermissionTemplates((prev) => [...prev, { ...template, id: nextId("pt") }]);
  };

  const updatePermissionTemplate: AppState["updatePermissionTemplate"] = (templateId, updates) => {
    setPermissionTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, ...updates } : t)),
    );
  };

  const deletePermissionTemplate: AppState["deletePermissionTemplate"] = (templateId) => {
    setPermissionTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const addTask: AppState["addTask"] = (task) => {
    setTasks((prev) => [...prev, { ...task, id: nextId("t") }]);
  };

  const addQuotation: AppState["addQuotation"] = (quotation) => {
    setQuotations((prev) => [...prev, { ...quotation, id: nextId("q") }]);
  };

  const updateQuotationStatus: AppState["updateQuotationStatus"] = (quotationId, status) => {
    guardChange(`تغيير حالة عرض السعر إلى "${status}"`, () =>
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationId ? { ...q, status } : q)),
      ),
    );
  };

  const updateQuotation: AppState["updateQuotation"] = (quotationId, updates) => {
    guardChange(`تعديل عرض السعر`, () =>
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationId ? { ...q, ...updates } : q)),
      ),
    );
  };

  const updateInvoice: AppState["updateInvoice"] = (invoiceId, updates) => {
    const prevInv = invoices.find((i) => i.id === invoiceId);
    guardChange(`تعديل الفاتورة ${prevInv?.invoiceNumber}`, () => {
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, ...updates } : i)),
      );
      if (prevInv)
        logAudit(
          `عدّل الفاتورة ${prevInv.invoiceNumber}` +
            (updates.amount !== undefined && updates.amount !== prevInv.amount
              ? ` — المبلغ من ${prevInv.amount} إلى ${updates.amount} ر.س`
              : ""),
        );
    });
  };

  const addAsset: AppState["addAsset"] = (asset) => {
    setCompanyAssets((prev) => [...prev, { ...asset, id: nextId("as") }]);
  };

  const toggleAssetVisibility: AppState["toggleAssetVisibility"] = (assetId) => {
    setCompanyAssets((prev) =>
      prev.map((a) =>
        a.id === assetId ? { ...a, visibleToAdmin: !a.visibleToAdmin } : a,
      ),
    );
  };

  const toggleDocumentVisibility: AppState["toggleDocumentVisibility"] = (docId) => {
    setOfficialDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, visibleToAdmin: !d.visibleToAdmin } : d,
      ),
    );
  };

  const addDocument: AppState["addDocument"] = (doc) => {
    setOfficialDocuments((prev) => [...prev, { ...doc, id: nextId("doc") }]);
  };

  const updateDocument: AppState["updateDocument"] = (docId, updates) => {
    setOfficialDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, ...updates } : d)),
    );
  };

  const addPurchase: AppState["addPurchase"] = (purchase) => {
    setPurchases((prev) => [...prev, { ...purchase, id: nextId("pur") }]);
  };

  const updatePurchaseStatus: AppState["updatePurchaseStatus"] = (purchaseId, status) => {
    guardChange(`تغيير حالة الشراء إلى "${status}"`, () =>
      setPurchases((prev) =>
        prev.map((p) => (p.id === purchaseId ? { ...p, status } : p)),
      ),
    );
  };

  const updateService: AppState["updateService"] = (serviceId, updates) => {
    const prevSv = serviceCatalog.find((s) => s.id === serviceId);
    setServiceCatalog((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s)),
    );
    if (prevSv && updates.price !== undefined && updates.price !== prevSv.price)
      logAudit(
        `عدّل سعر الخدمة "${prevSv.name}" من ${prevSv.price ?? 0} إلى ${updates.price} ر.س`,
      );
  };

  const updateProject: AppState["updateProject"] = (projectId, updates) => {
    const prevP = projects.find((p) => p.id === projectId);
    guardChange(`تعديل بيانات المشروع "${prevP?.name}"`, () => {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
      );
      if (prevP)
        logAudit(
          `عدّل بيانات المشروع "${prevP.name}"` +
            (updates.budget !== undefined && updates.budget !== prevP.budget
              ? ` — الميزانية من ${prevP.budget} إلى ${updates.budget} ر.س`
              : ""),
        );
    });
  };

  const updateVendor: AppState["updateVendor"] = (vendorId, updates) => {
    const prevV = vendors.find((v) => v.id === vendorId);
    guardChange(`تعديل بيانات المورد "${prevV?.name}"`, () => {
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, ...updates } : v)),
      );
      if (prevV) logAudit(`عدّل بيانات المورد "${prevV.name}"`);
    });
  };

  const updateTask: AppState["updateTask"] = (taskId, updates) => {
    const prevT = tasks.find((t) => t.id === taskId);
    guardChange(`تعديل المهمة "${prevT?.title}"`, () => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      );
      if (prevT) logAudit(`عدّل المهمة "${prevT.title}"`);
    });
  };

  const updateAsset: AppState["updateAsset"] = (assetId, updates) => {
    const prevA = companyAssets.find((a) => a.id === assetId);
    setCompanyAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, ...updates } : a)),
    );
    if (prevA) logAudit(`عدّل الأصل "${prevA.name}"`);
  };

  const updatePurchase: AppState["updatePurchase"] = (purchaseId, updates) => {
    const prevP = purchases.find((p) => p.id === purchaseId);
    guardChange(`تعديل عملية الشراء "${prevP?.item}"`, () => {
      setPurchases((prev) =>
        prev.map((p) => (p.id === purchaseId ? { ...p, ...updates } : p)),
      );
      if (prevP) logAudit(`عدّل عملية الشراء "${prevP.item}"`);
    });
  };

  const updateTeamMember: AppState["updateTeamMember"] = (memberId, updates) => {
    const prevM = members.find((m) => m.id === memberId);
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...updates } : m)),
    );
    if (prevM) logAudit(`عدّل بيانات الموظف "${prevM.name}"`);
  };

  const updateClient: AppState["updateClient"] = (clientId, updates) => {
    const prevC = clients.find((c) => c.id === clientId);
    guardChange(`تعديل بيانات العميل "${prevC?.name}"`, () => {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c)),
      );
      if (prevC) logAudit(`عدّل بيانات العميل "${prevC.name}"`);
    });
  };

  const addAgency: AppState["addAgency"] = (name) => {
    const id = nextId("ag");
    setAgencies((prev) => [...prev, { id, name }]);
    setCurrentAgencyId(id);
  };

  const switchAgency: AppState["switchAgency"] = (agencyId) => {
    setCurrentAgencyId(agencyId);
  };

  const toggleNotificationPref: AppState["toggleNotificationPref"] = (key) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setApproval: AppState["setApproval"] = (kind, id, status) => {
    const kindLabels = { invoice: "الفاتورة", quotation: "عرض السعر", contract: "العقد", purchase: "المشتريات" };
    logAudit(
      `${status === "approved" ? "اعتمد" : status === "rejected" ? "رفض" : "أعاد للموافقة"} ${kindLabels[kind]} (${id})`,
    );
    if (kind === "invoice")
      setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, approval: status } : i)));
    else if (kind === "quotation")
      setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, approval: status } : q)));
    else if (kind === "contract")
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, approval: status } : c)));
    else
      setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, approval: status } : p)));
  };

  const updateLineItemStatus: AppState["updateLineItemStatus"] = (
    projectId,
    lineItemId,
    status,
  ) => {
    guardChange(`تغيير حالة بند في المشروع إلى "${status}"`, () =>
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              lineItems: p.lineItems.map((li) =>
                li.id === lineItemId ? { ...li, status } : li,
              ),
            }
          : p,
      ),
    ));
  };

  const submitDeliverable: AppState["submitDeliverable"] = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, deliverableStatus: "submitted" } : t)),
    );
    const t = tasks.find((x) => x.id === taskId);
    if (t) logAudit(`رفع مخرَج المهمة "${t.title}" لاعتماد مدير المشروع`);
  };

  const reviewDeliverable: AppState["reviewDeliverable"] = (taskId, action, notes) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              deliverableStatus: action,
              reviewNotes: notes ?? t.reviewNotes,
              revisionRounds: action === "revision" ? (t.revisionRounds ?? 0) + 1 : t.revisionRounds,
              status: action === "approved" ? "completed" : t.status,
            }
          : t,
      ),
    );
    const t = tasks.find((x) => x.id === taskId);
    const label = action === "approved" ? "اعتمد" : action === "revision" ? "طلب دورة تعديل على" : "رفض";
    if (t) logAudit(`${label} مخرَج المهمة "${t.title}"${notes ? ` — ${notes}` : ""}`);
  };

  const value = useMemo<AppState>(
    () => ({
      isAuthenticated,
      currentUser,
      clients,
      projects,
      phases,
      tasks,
      vendors,
      assignments,
      invoices,
      comments,
      teamMembers: members,
      deals,
      dealNotes,
      projectNotes,
      projectFiles,
      vendorNotes,
      serviceCatalog,
      contracts,
      quotations,
      companyAssets,
      officialDocuments,
      purchases,
      permissionTemplates,
      agencies,
      currentAgencyId,
      addAgency,
      switchAgency,
      notificationPrefs,
      toggleNotificationPref,
      auditLog,
      updateService,
      updateProject,
      updateVendor,
      updateTask,
      updateAsset,
      updatePurchase,
      updateTeamMember,
      updateClient,
      login,
      logout,
      switchUser,
      changeRequests,
      resolveChangeRequest,
      addClient,
      addProject,
      updateProjectStatus,
      updateProjectTeam,
      updateTaskStatus,
      addComment,
      addVendor,
      addInvoice,
      updateInvoiceStatus,
      updateAssignmentStatus,
      addTeamMember,
      updateTeamMemberPermissions,
      addDeal,
      updateDealStage,
      updateDeal,
      addDealNote,
      addProjectNote,
      addProjectFile,
      removeProjectFile,
      toggleProjectFileApproval,
      addVendorNote,
      setTaskDelayReason,
      addService,
      addContract,
      updateContractStatus,
      updateContract,
      addPermissionTemplate,
      updatePermissionTemplate,
      deletePermissionTemplate,
      addTask,
      addQuotation,
      updateQuotationStatus,
      updateQuotation,
      updateInvoice,
      addAsset,
      toggleAssetVisibility,
      toggleDocumentVisibility,
      addDocument,
      updateDocument,
      addPurchase,
      updatePurchaseStatus,
      setApproval,
      updateLineItemStatus,
      submitDeliverable,
      reviewDeliverable,
    }),
    [
      isAuthenticated,
      currentUser,
      clients,
      projects,
      phases,
      tasks,
      vendors,
      assignments,
      invoices,
      comments,
      members,
      deals,
      dealNotes,
      projectNotes,
      projectFiles,
      vendorNotes,
      serviceCatalog,
      contracts,
      quotations,
      companyAssets,
      officialDocuments,
      purchases,
      permissionTemplates,
      agencies,
      currentAgencyId,
      notificationPrefs,
      auditLog,
      changeRequests,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
