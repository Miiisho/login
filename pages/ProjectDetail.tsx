import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  File as FileIcon,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  MessageSquarePlus,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useApp } from "../state/AppContext";
import { canEditContent, isProjectManager } from "../lib/permissions";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency, formatDate, daysLeft } from "../lib/format";
import { generateProjectReport, type ProjectReport } from "../lib/projectReport";
import type { PhaseStatus } from "../types";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
};

const PHASE_ICON: Record<PhaseStatus, string> = {
  completed: "✓",
  "in-progress": "⏳",
  pending: "○",
};

const nextPhaseStatus = (status: PhaseStatus): PhaseStatus =>
  status === "pending" ? "in-progress" : status === "in-progress" ? "completed" : "pending";

export const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    clients,
    phases: allPhases,
    tasks,
    assignments,
    vendors,
    vendorNotes,
    invoices,
    teamMembers,
    projectNotes,
    projectFiles,
    addInvoice,
    addProjectNote,
    addProjectFile,
    removeProjectFile,
    toggleProjectFileApproval,
    addVendorNote,
    addTask,
    updateLineItemStatus,
    updateProject,
    currentUser,
  } = useApp();
  const [phaseStatuses, setPhaseStatuses] = useState<Record<string, PhaseStatus>>({});
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [uploadPhaseId, setUploadPhaseId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [vendorNoteFor, setVendorNoteFor] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<ProjectReport | null>(null);

  const project = projects.find((p) => p.id === id);
  if (!project) return <p className="text-gray-500">لم يتم العثور على المشروع.</p>;

  const client = clients.find((c) => c.id === project.clientId);
  const phases = allPhases
    .filter((ph) => ph.projectId === project.id)
    .sort((a, b) => a.order - b.order)
    .map((ph) => ({ ...ph, status: phaseStatuses[ph.id] ?? ph.status }));
  const projectAssignments = assignments.filter((a) => a.projectId === project.id);
  const projectInvoices = invoices.filter((i) => i.projectId === project.id);
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const notes = projectNotes
    .filter((n) => n.projectId === project.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const files = projectFiles
    .filter((f) => f.projectId === project.id)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const sortedActivity = [...project.activity].sort((a, b) => b.date.localeCompare(a.date));

  const vendorCost = projectAssignments.reduce((sum, a) => sum + a.cost, 0);
  const clientInvoiceTotal = projectInvoices.reduce((sum, i) => sum + i.amount, 0);
  const profit = (clientInvoiceTotal || project.budget) - vendorCost;
  const canEdit = canEditContent(currentUser);
  const remaining = project.budget - vendorCost;
  const dLeft = daysLeft(project.endDate);
  const pm = teamMembers.find((m) => m.id === project.assignedTo);
  const keyMembers = teamMembers.filter((m) => project.keyTeamMembers.includes(m.id));

  const togglePhase = (phaseId: string, current: PhaseStatus) => {
    if (!canEdit) return;
    setPhaseStatuses((prev) => ({ ...prev, [phaseId]: nextPhaseStatus(current) }));
  };

  const handleFileUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((file) => {
      addProjectFile({
        projectId: project.id,
        phaseId: uploadPhaseId || null,
        name: file.name,
        size: file.size,
        fileType: file.type,
        url: URL.createObjectURL(file),
        uploadedBy: currentUser.id,
        uploadedAt: new Date().toISOString(),
      });
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateReport = () => {
    setShowReport(true);
    setReportLoading(true);
    setReport(null);
    setTimeout(() => {
      setReport(
        generateProjectReport({
          project,
          client,
          phases,
          tasks: projectTasks,
          vendorAssignments: projectAssignments,
          vendors,
          vendorNotes: vendorNotes.filter((n) => n.projectId === project.id),
          projectNotes: notes,
        }),
      );
      setReportLoading(false);
    }, 900);
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate("/projects")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight size={16} /> العودة إلى المشاريع
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">العميل: {client?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.type} className="text-sm" />
            <StatusBadge status={project.status} className="text-sm" />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm text-gray-500">
            <span>التقدم</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">البداية / النهاية</p>
            <p className="text-sm font-bold text-gray-900">
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </p>
            <p className={`mt-1 text-xs font-medium ${dLeft < 3 ? "text-red-500" : "text-emerald-600"}`}>
              {dLeft >= 0 ? `${dLeft} يوم متبقي` : "متأخر"}
              {" "}
              {dLeft >= 3 ? "(على المسار)" : dLeft >= 0 ? "(يقترب الموعد)" : "(متأخر)"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">الميزانية الكلية</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(project.budget)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">المصروف على الموردين</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(vendorCost)}</p>
          </div>
          <div className={`rounded-xl p-4 ${remaining >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className={`text-xs ${remaining >= 0 ? "text-emerald-600" : "text-red-600"}`}>المتبقي</p>
            <p className={`text-lg font-bold ${remaining >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setShowEditProject(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Pencil size={14} /> تعديل
            </button>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              <FileText size={14} /> إنشاء فاتورة
            </button>
            <button
              onClick={generateReport}
              className="flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100"
            >
              <Sparkles size={14} /> تقرير حالة المشروع (AI)
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">فريق العمل المسند</h2>
          {canEdit && (
            <button
              onClick={() => setShowTeamModal(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Users size={14} /> تعديل الفريق
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {pm && (
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 py-1.5 pr-1.5 pl-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {pm.avatar}
              </span>
              <span className="text-sm font-medium text-blue-700">{pm.name}</span>
              <span className="text-[10px] text-blue-400">مدير المشروع</span>
            </div>
          )}
          {keyMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pr-1.5 pl-3"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
                {m.avatar}
              </span>
              <span className="text-sm font-medium text-gray-700">{m.name}</span>
            </div>
          ))}
          {keyMembers.length === 0 && (
            <p className="text-sm text-gray-400">لم يتم إسناد أعضاء فريق رئيسيين بعد.</p>
          )}
        </div>
      </div>

      {project.lineItems.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">بنود المشروع</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-gray-400">
                <tr className="border-b border-gray-100">
                  <th className="pb-2 font-medium">البند</th>
                  <th className="pb-2 font-medium">الكمية</th>
                  <th className="pb-2 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {project.lineItems.map((li) => (
                  <tr key={li.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 font-medium text-gray-700">{li.name}</td>
                    <td className="py-2.5 text-gray-500">{li.quantity}</td>
                    <td className="py-2.5">
                      {canEdit ? (
                        <select
                          value={li.status}
                          onChange={(e) =>
                            updateLineItemStatus(
                              project.id,
                              li.id,
                              e.target.value as "pending" | "in-progress" | "completed",
                            )
                          }
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-500"
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="in-progress">قيد التنفيذ</option>
                          <option value="completed">مكتمل</option>
                        </select>
                      ) : (
                        <StatusBadge status={li.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">المراحل</h2>
          <div className="space-y-2">
            {phases.map((ph) => {
              const member = teamMembers.find((m) => m.id === ph.assignedTo);
              return (
                <button
                  key={ph.id}
                  onClick={() => togglePhase(ph.id, ph.status)}
                  disabled={!canEdit}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 text-right hover:bg-gray-50 disabled:cursor-default"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        ph.status === "completed"
                          ? "text-emerald-500"
                          : ph.status === "in-progress"
                            ? "text-blue-500"
                            : "text-gray-300"
                      }
                    >
                      {PHASE_ICON[ph.status]}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{ph.phaseName}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    {member?.name}
                    {canEdit && <RefreshCw size={12} />}
                  </span>
                </button>
              );
            })}
            {phases.length === 0 && <p className="text-sm text-gray-400">لا توجد مراحل مضافة.</p>}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            تذكير: عند اكتمال أي مرحلة يجب توثيقها ورفع إثباتات الإنجاز (صور، ملفات، تقارير) في قسم
            "ملفات المشروع" أدناه.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">الموردون</h2>
          <div className="space-y-3">
            {projectAssignments.map((a) => {
              const vendor = vendors.find((v) => v.id === a.vendorId);
              const relatedNotes = vendorNotes
                .filter((n) => n.vendorId === a.vendorId && n.projectId === project.id)
                .sort((n1, n2) => n2.createdAt.localeCompare(n1.createdAt));
              return (
                <div key={a.id} className="rounded-lg border border-gray-100 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/vendors/${vendor?.id}`)}
                    >
                      <p className="text-sm font-medium text-gray-700">
                        {a.role} ({vendor?.name})
                      </p>
                      <p className="text-xs text-gray-400">
                        التكلفة: {formatCurrency(a.cost)} | التقييم: {vendor?.reliabilityRating}★
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      {canEdit && (
                        <button
                          onClick={() => setVendorNoteFor(a.vendorId)}
                          title="إضافة تحديث"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <MessageSquarePlus size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  {relatedNotes.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-gray-50 pt-2">
                      {relatedNotes.map((n) => (
                        <p key={n.id} className="text-xs text-gray-500">
                          <span className="text-gray-400">{formatDate(n.createdAt.slice(0, 10))}:</span>{" "}
                          {n.text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {projectAssignments.length === 0 && (
              <p className="text-sm text-gray-400">لم يتم إسناد موردين بعد.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <FolderOpen size={18} /> ملفات المشروع
            {files.some((f) => f.approved) && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {files.filter((f) => f.approved).length} معتمد
              </span>
            )}
          </h2>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              {phases.length > 0 && (
                <select
                  className={`${inputClass} w-auto py-1.5 text-xs`}
                  value={uploadPhaseId}
                  onChange={(e) => setUploadPhaseId(e.target.value)}
                >
                  <option value="">بدون ربط بمرحلة</option>
                  {phases.map((ph) => (
                    <option key={ph.id} value={ph.id}>
                      إثبات مرحلة: {ph.phaseName}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
              >
                <Upload size={14} /> رفع ملف
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          {files.map((f) => {
            const uploader = teamMembers.find((m) => m.id === f.uploadedBy);
            const phase = phases.find((ph) => ph.id === f.phaseId);
            const isImage = f.fileType.startsWith("image/");
            return (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
              >
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-2 hover:text-blue-600"
                >
                  {isImage ? (
                    <ImageIcon size={16} className="shrink-0 text-gray-400" />
                  ) : (
                    <FileIcon size={16} className="shrink-0 text-gray-400" />
                  )}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-gray-700">
                      {f.name}
                      {f.approved && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          معتمد ✓
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(f.size)} | {uploader?.name} | {formatDate(f.uploadedAt.slice(0, 10))}
                      {phase && ` | إثبات مرحلة: ${phase.phaseName}`}
                    </p>
                  </div>
                </a>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleProjectFileApproval(f.id)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                        f.approved
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {f.approved ? "إلغاء الاعتماد" : "اعتماد"}
                    </button>
                    <button
                      onClick={() => removeProjectFile(f.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {files.length === 0 && (
            <p className="text-sm text-gray-400">
              لا توجد ملفات مرفوعة بعد. ارفع صور أو تقارير كإثبات لاكتمال أي مرحلة من المشروع.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">تتبع المهام</h2>
            {canEdit && (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <Plus size={14} /> إضافة مهمة
              </button>
            )}
          </div>
          <div className="space-y-2">
            {projectTasks.map((t) => {
              const assignee = teamMembers.find((m) => m.id === t.assignedTo);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-700">{t.title}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {assignee?.name} | استحقاق: {formatDate(t.dueDate)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              );
            })}
            {projectTasks.length === 0 && (
              <p className="text-sm text-gray-400">لا توجد مهام مرتبطة بهذا المشروع.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">آخر التحديثات</h2>
          <div className="mb-3 space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <p className="text-gray-700">{n.text}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {n.authorName} - {formatDate(n.createdAt.slice(0, 10))}
                </p>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-sm text-gray-400">لا يوجد تحديثات مسجلة بعد.</p>
            )}
          </div>
          {canEdit && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!noteDraft.trim()) return;
                addProjectNote(project.id, noteDraft.trim());
                setNoteDraft("");
              }}
            >
              <input
                className={inputClass}
                placeholder="أضف آخر تحديث على المشروع..."
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-lg bg-blue-500 px-3 text-white hover:bg-blue-600"
              >
                <Plus size={16} />
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">الفوترة</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">فاتورة العميل</span>
              <span className="font-semibold text-gray-800">
                {formatCurrency(clientInvoiceTotal || project.budget)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">تكاليف الموردين</span>
              <span className="font-semibold text-gray-800">{formatCurrency(vendorCost)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span className="font-semibold text-gray-700">الربح</span>
              <span className={`font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(profit)} {profit >= 0 ? "✓" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">سجل النشاط</h2>
          <ul className="space-y-2 text-sm">
            {sortedActivity.map((a, idx) => (
              <li key={idx} className="flex gap-2 text-gray-600">
                <span className="text-gray-400">{formatDate(a.date)}:</span> {a.text}
              </li>
            ))}
            {sortedActivity.length === 0 && (
              <p className="text-sm text-gray-400">لا يوجد نشاط مسجل.</p>
            )}
          </ul>
        </div>
      </div>

      {showInvoiceModal && (
        <Modal title="إنشاء فاتورة" onClose={() => setShowInvoiceModal(false)}>
          <GenerateInvoiceForm
            defaultAmount={project.budget}
            onSave={(amount, dueDate) => {
              addInvoice({
                projectId: project.id,
                clientId: project.clientId,
                invoiceNumber: `INV-${Math.floor(Math.random() * 900 + 100)}`,
                invoiceDate: new Date().toISOString().slice(0, 10),
                dueDate,
                amount,
                status: "draft",
                paidDate: null,
                type: "project",
                createdBy: currentUser.name,
                submittedBy: currentUser.name,
                approval: ["owner", "admin"].includes(currentUser.role)
                  ? "approved"
                  : "pending_approval",
              });
              setShowInvoiceModal(false);
              navigate("/invoices");
            }}
            onClose={() => setShowInvoiceModal(false)}
          />
        </Modal>
      )}

      {showTeamModal && (
        <Modal title="تعديل فريق العمل المسند" onClose={() => setShowTeamModal(false)}>
          <EditTeamForm project={project} onClose={() => setShowTeamModal(false)} />
        </Modal>
      )}

      {showEditProject && (
        <Modal title={`تعديل المشروع — ${project.name}`} onClose={() => setShowEditProject(false)} wide>
          <EditProjectForm
            project={project}
            onSave={(updates) => {
              updateProject(project.id, updates);
              setShowEditProject(false);
            }}
            onClose={() => setShowEditProject(false)}
          />
        </Modal>
      )}

      {vendorNoteFor && (
        <Modal title="إضافة تحديث عن المورد" onClose={() => setVendorNoteFor(null)}>
          <VendorNoteForm
            onSave={(text) => {
              addVendorNote(vendorNoteFor, text, project.id);
              setVendorNoteFor(null);
            }}
            onClose={() => setVendorNoteFor(null)}
          />
        </Modal>
      )}

      {showAddTask && (
        <Modal title="إضافة مهمة جديدة" onClose={() => setShowAddTask(false)} wide>
          <AddTaskForm
            phases={phases}
            teamMembers={teamMembers}
            onSave={(data) => {
              addTask({ ...data, projectId: project.id, status: "pending", progress: 0 });
              setShowAddTask(false);
            }}
            onClose={() => setShowAddTask(false)}
          />
        </Modal>
      )}

      {showReport && (
        <Modal
          title="تقرير حالة المشروع"
          onClose={() => setShowReport(false)}
          wide
        >
          {reportLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-500">
              <Sparkles className="animate-pulse text-purple-500" size={28} />
              <p className="text-sm">جارٍ تحليل بيانات المشروع وإعداد التقرير...</p>
            </div>
          ) : (
            report && (
              <div className="space-y-5 text-sm">
                <div className="rounded-lg bg-purple-50 p-4 text-purple-800">{report.summary}</div>
                <div>
                  <h3 className="mb-2 font-bold text-gray-900">نظرة عامة</h3>
                  <ul className="list-inside list-disc space-y-1 text-gray-600">
                    {report.overview.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-emerald-700">أبرز الإنجازات</h3>
                  <ul className="list-inside list-disc space-y-1 text-gray-600">
                    {report.achievements.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-red-700">التحديات</h3>
                  <ul className="list-inside list-disc space-y-1 text-gray-600">
                    {report.challenges.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-bold text-blue-700">الخطوات القادمة</h3>
                  <ul className="list-inside list-disc space-y-1 text-gray-600">
                    {report.nextSteps.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <p className="border-t border-gray-100 pt-3 text-xs text-gray-400">
                  تم إنشاء هذا التقرير تلقائيًا اعتمادًا على بيانات المشروع المسجّلة في النظام (المراحل،
                  المهام، الملاحظات، وتحديثات الموردين).
                </p>
              </div>
            )
          )}
        </Modal>
      )}
    </div>
  );
};

const EditTeamForm: React.FC<{
  project: { id: string; assignedTo: string; keyTeamMembers: string[] };
  onClose: () => void;
}> = ({ project, onClose }) => {
  const { teamMembers, updateProjectTeam } = useApp();
  const pmOptions = teamMembers.filter(
    (m) => m.role === "owner" || m.role === "admin" || isProjectManager(m),
  );
  const memberOptions = teamMembers.filter((m) => m.role === "team_member");
  const [pmId, setPmId] = useState(project.assignedTo);
  const [selected, setSelected] = useState<string[]>(project.keyTeamMembers);

  const toggleMember = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateProjectTeam(project.id, pmId, selected);
        onClose();
      }}
    >
      <FormField label="مدير المشروع">
        <select className={inputClass} value={pmId} onChange={(e) => setPmId(e.target.value)}>
          {pmOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>
      <div className="mb-4">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          أعضاء الفريق الرئيسيون (Key Members)
        </span>
        <div className="space-y-1.5 rounded-lg border border-gray-200 p-2">
          {memberOptions.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggleMember(m.id)}
                className="rounded border-gray-300"
              />
              {m.name}
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
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

const VendorNoteForm: React.FC<{
  onSave: (text: string) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSave(text.trim());
      }}
    >
      <FormField label="نص التحديث">
        <textarea
          required
          rows={3}
          className={inputClass}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="مثال: تأخر يوم واحد عن التسليم، أو التزم بالموعد بجودة ممتازة"
        />
      </FormField>
      <p className="mb-4 text-xs text-gray-400">
        هذا التحديث سيظهر في صفحة المورد وفي هذا المشروع معًا.
      </p>
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
          حفظ
        </button>
      </div>
    </form>
  );
};

export const TASK_CATEGORY_SUGGESTIONS = [
  "تصميم",
  "تطوير",
  "محتوى",
  "اجتماعات",
  "اختبار",
  "إدارية",
  "تسويق",
  "أخرى",
];

export const AddTaskForm: React.FC<{
  phases: { id: string; phaseName: string }[];
  teamMembers: { id: string; name: string; role: string }[];
  onSave: (data: {
    phaseId: string;
    category: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    assignedTo: string;
    dueDate: string;
  }) => void;
  onClose: () => void;
}> = ({ phases, teamMembers, onSave, onClose }) => {
  const assignableMembers = teamMembers.filter((m) => m.role === "team_member");
  const [form, setForm] = useState({
    phaseId: phases[0]?.id ?? "",
    category: "",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    assignedTo: assignableMembers[0]?.id ?? "",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <FormField label="عنوان المهمة">
        <input
          required
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </FormField>
      <FormField label="التصنيف">
        <input
          required
          list="task-category-suggestions"
          className={inputClass}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="مثال: تصميم، تطوير، محتوى..."
        />
        <datalist id="task-category-suggestions">
          {TASK_CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="الوصف / التعريف">
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
      </div>
      {phases.length > 0 && (
        <FormField label="المرحلة المرتبطة">
          <select
            className={inputClass}
            value={form.phaseId}
            onChange={(e) => setForm({ ...form, phaseId: e.target.value })}
          >
            {phases.map((ph) => (
              <option key={ph.id} value={ph.id}>
                {ph.phaseName}
              </option>
            ))}
          </select>
        </FormField>
      )}
      <FormField label="المسؤول عن التنفيذ">
        <select
          className={inputClass}
          value={form.assignedTo}
          onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
        >
          {assignableMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="الأولوية">
        <select
          className={inputClass}
          value={form.priority}
          onChange={(e) =>
            setForm({ ...form, priority: e.target.value as "low" | "medium" | "high" })
          }
        >
          <option value="high">عالية</option>
          <option value="medium">متوسطة</option>
          <option value="low">منخفضة</option>
        </select>
      </FormField>
      <FormField label="تاريخ الاستحقاق">
        <input
          type="date"
          className={inputClass}
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
      </FormField>
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
          حفظ المهمة
        </button>
      </div>
    </form>
  );
};

const GenerateInvoiceForm: React.FC<{
  defaultAmount: number;
  onSave: (amount: number, dueDate: string) => void;
  onClose: () => void;
}> = ({ defaultAmount, onSave, onClose }) => {
  const [amount, setAmount] = useState(defaultAmount);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(amount, dueDate);
      }}
    >
      <FormField label="المبلغ (ر.س)">
        <input
          type="number"
          required
          className={inputClass}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </FormField>
      <FormField label="تاريخ الاستحقاق">
        <input
          type="date"
          className={inputClass}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
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
          إنشاء الفاتورة
        </button>
      </div>
    </form>
  );
};

const EditProjectForm: React.FC<{
  project: import("../types").Project;
  onSave: (updates: Partial<import("../types").Project>) => void;
  onClose: () => void;
}> = ({ project, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description,
    budget: project.budget,
    type: project.type,
    billingEmail: project.billingEmail,
    startDate: project.startDate,
    endDate: project.endDate,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid grid-cols-1 gap-x-4 sm:grid-cols-2"
    >
      <FormField label="اسم المشروع">
        <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </FormField>
      <FormField label="تصنيف المشروع">
        <select
          className={inputClass}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as import("../types").ProjectType })}
        >
          <option value="service">تقديم خدمة</option>
          <option value="supply">توريد</option>
          <option value="third_party">طرف ثالث</option>
        </select>
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="الوصف">
          <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormField>
      </div>
      <FormField label="الميزانية (ر.س)">
        <input type="number" className={inputClass} value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
      </FormField>
      <FormField label="بريد الفوترة">
        <input type="email" className={inputClass} value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} />
      </FormField>
      <FormField label="تاريخ البداية">
        <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
      </FormField>
      <FormField label="تاريخ النهاية">
        <input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
      </FormField>
      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          إلغاء
        </button>
        <button type="submit" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
          حفظ التعديلات
        </button>
      </div>
    </form>
  );
};
