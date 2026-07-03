// "مدير المشاريع" لم يعد نوع مستخدم — أصبح قالب صلاحيات جاهزًا يُسند لعضو الفريق
export type Role = "owner" | "admin" | "team_member";

export type Permission =
  | "manage_team"
  | "manage_clients"
  | "manage_projects"
  | "manage_vendors"
  | "manage_invoices"
  | "view_financials"
  | "manage_tasks"
  | "upload_deliverables";

/** قالب وظيفي جاهز (مدير مشاريع، موظف إدارة، موظف مبيعات، موظف مالية...) يُسند لعضو الفريق */
export interface PermissionTemplate {
  id: string;
  name: string;
  permissions: Permission[];
}

export type ClientStatus = "active" | "inactive" | "paused";
export type ProjectType = "service" | "supply" | "third_party";
export type ProjectStatus =
  | "planning"
  | "in-progress"
  | "review"
  | "delivered"
  | "invoiced"
  | "closed";
export type PhaseStatus = "pending" | "in-progress" | "completed";
export type TaskStatus = "pending" | "in-progress" | "completed" | "on-hold";
export type TaskPriority = "low" | "medium" | "high";
export type VendorAssignmentStatus =
  | "pending"
  | "assigned"
  | "in-progress"
  | "completed"
  | "paid";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type InvoiceType = "contract" | "project" | "additional";
export type DealStage =
  | "lead"
  | "contacted"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type EntityType = "company" | "individual";

/** البيانات الأساسية للشركة: سجل تجاري، رقم ضريبي، ممثل (اسم/جوال/بريد)، عنوان وطني، موقع اختياري */
export interface OfficialEntityInfo {
  crNumber: string;
  taxNumber: string;
  repName: string;
  repPhone: string;
  repEmail: string;
  nationalAddress: string;
  website?: string;
}

export interface EmployeeDoc {
  name: string;
  number: string;
  expiryDate: string;
}

export interface EmployeeFile {
  nationalId: string;
  nationality: string;
  birthDate: string;
  address: string;
  contractStart: string;
  contractEnd: string;
  salary: number;
  docs: EmployeeDoc[];
}

export interface Agency {
  id: string;
  name: string;
}

export type EmploymentType = "full_time" | "part_time" | "hourly" | "remote";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  jobTitle?: string;
  permissions: Permission[];
  avatar: string;
  status: "active" | "inactive";
  employeeFile?: EmployeeFile;
  employmentType?: EmploymentType;
  /** القالب الوظيفي المسند (مثل مدير المشاريع) — بدون قالب = عضو فريق عام */
  templateId?: string | null;
  /** الفريق التنظيمي (فريق التصميم، المحتوى، التطوير...) */
  team?: string;
  /** الوكالات التي أُسند إليها الموظف — يظهر مبدّل الوكالة فقط عند أكثر من وكالة */
  agencyIds?: string[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyType: "B2B" | "B2C";
  contactPerson: string;
  contractValue: number;
  contractStartDate: string;
  contractEndDate: string;
  status: ClientStatus;
  notes: string;
  createdBy?: string;
  entityType?: EntityType;
  official?: OfficialEntityInfo;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  phaseName: string;
  order: number;
  description: string;
  status: PhaseStatus;
  startDate: string;
  endDate: string;
  assignedTo: string;
}

export interface ProjectTask {
  id: string;
  projectId: string | null;
  phaseId: string;
  category: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string;
  requirements?: string[];
  progress?: number;
  delayReason?: string;
  /** حالة اعتماد المخرَج المرفوع: بانتظار اعتماد مدير المشروع، أو دورة تعديل، أو معتمد/مرفوض */
  deliverableStatus?: "none" | "submitted" | "revision" | "approved" | "rejected";
  /** ملاحظات مدير المشروع عند طلب دورة تعديل أو الرفض */
  reviewNotes?: string;
  /** عدد دورات التعديل قبل الاعتماد — يغذّي مؤشر جودة المخرجات */
  revisionRounds?: number;
}

export interface Comment {
  id: string;
  taskId?: string;
  projectId?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export type VendorType = "service_provider" | "strategic_partner";

export interface Vendor {
  id: string;
  name: string;
  serviceType: string;
  vendorType: VendorType;
  email: string;
  phone: string;
  city: string;
  country: string;
  hourlyRate: number;
  projectRate: number;
  reliabilityRating: number;
  paymentStatus: "active" | "inactive";
  notes: string;
  onTimeRate: number;
  qualityRating: number;
  createdBy?: string;
  entityType?: EntityType;
  official?: OfficialEntityInfo;
}

export interface VendorAssignment {
  id: string;
  projectId: string;
  vendorId: string;
  role: string;
  cost: number;
  status: VendorAssignmentStatus;
  paymentDate: string | null;
}

export type LineItemStatus = "pending" | "in-progress" | "completed";

export interface ProjectLineItem {
  id: string;
  name: string;
  quantity: number;
  status: LineItemStatus;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  budget: number;
  type: ProjectType;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  assignedTo: string;
  keyTeamMembers: string[];
  billingEmail: string;
  lineItems: ProjectLineItem[];
  activity: { date: string; text: string }[];
}

export type ApprovalStatus = "pending_approval" | "approved" | "rejected";

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  projectId: string | null;
  clientId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  paidDate: string | null;
  type: InvoiceType;
  items?: InvoiceItem[];
  createdBy?: string;
  approval?: ApprovalStatus;
  submittedBy?: string;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  phaseId: string | null;
  name: string;
  size: number;
  fileType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  /** ملف معتمد من مدير المشروع/الأدمن — يظهر في قسم الملفات المعتمدة */
  approved?: boolean;
}

export interface VendorNote {
  id: string;
  vendorId: string;
  projectId: string | null;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export type DealPriority = "high" | "medium" | "low";

export interface Deal {
  id: string;
  clientId: string | null;
  prospectName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  source: string;
  ownerId: string;
  serviceType: string;
  winProbability: number;
  priority: DealPriority;
  value: number;
  stage: DealStage;
  createdDate: string;
  expectedCloseDate: string;
  lastContactDate: string;
  closeReason: string;
  notes: string;
}

export interface DealNote {
  id: string;
  dealId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  type: ProjectType;
  name: string;
  description: string;
  price?: number;
}

/** سجل التدقيق: من فعل ماذا ومتى وبأي قيمة — حماية قانونية للنظام المالي */
export interface AuditEntry {
  id: string;
  date: string;
  userName: string;
  action: string;
}

export type AssetCategory = "equipment" | "software" | "license" | "account" | "furniture";
export type AssetStatus = "in_use" | "available" | "maintenance";

export interface CompanyAsset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  status: AssetStatus;
  assignedTo: string | null;
  acquiredDate: string;
  notes: string;
  visibleToAdmin?: boolean;
}

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected";

export interface QuotationItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientId: string | null;
  dealId: string | null;
  issueDate: string;
  validUntil: string;
  items: QuotationItem[];
  status: QuotationStatus;
  notes: string;
  createdBy: string;
  createdById: string;
  approval?: ApprovalStatus;
}

export type DocumentCategory =
  | "commercial_registration"
  | "tax_certificate"
  | "zakat_certificate"
  | "chamber_membership"
  | "national_address"
  | "trademark"
  | "other";

export type DocumentStatus = "valid" | "expiring_soon" | "expired";

export interface OfficialDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  number: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  visibleToAdmin?: boolean;
  fileName?: string;
}

export type PurchaseStatus = "requested" | "ordered" | "received" | "paid" | "cancelled";

export interface Purchase {
  id: string;
  item: string;
  vendorId: string | null;
  vendorName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  status: PurchaseStatus;
  orderDate: string;
  projectId: string | null;
  createdBy: string;
  notes: string;
  approval?: ApprovalStatus;
}

export type ContractStatus = "draft" | "active" | "expired" | "terminated";

export interface Contract {
  id: string;
  clientId: string;
  projectId: string | null;
  title: string;
  value: number;
  billingCycle: "monthly" | "one-time";
  startDate: string;
  endDate: string;
  status: ContractStatus;
  scope: string;
  terms: string;
  createdDate: string;
  approval?: ApprovalStatus;
  submittedBy?: string;
}
