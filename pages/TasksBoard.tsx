import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, ListChecks, Pencil, Plus, Search, Table2 } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatDate } from "../lib/format";
import { companyInfo } from "../data/mockData";
import { usePersistedState } from "../lib/usePersistedState";
import { AssignTaskForm } from "./Projects";
import { TASK_CATEGORY_SUGGESTIONS } from "./ProjectDetail";
import type { ProjectTask, TaskPriority, TaskStatus } from "../types";

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "pending", label: "قيد الانتظار" },
  { key: "in-progress", label: "قيد التنفيذ" },
  { key: "completed", label: "مكتمل" },
  { key: "on-hold", label: "معلّق" },
];

export const TasksBoard: React.FC = () => {
  const { tasks, projects, teamMembers, updateTaskStatus, updateTask, addTask } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [view, setView] = usePersistedState<"board" | "table">("tasks-view", "board");
  const [groupBy, setGroupBy] = usePersistedState<"status" | "category">("tasks-groupby", "status");
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const categories = [...new Set(tasks.map((t) => t.category))];
  const columns: { key: string; label: string }[] =
    groupBy === "status" ? STATUS_COLUMNS : categories.map((c) => ({ key: c, label: c }));

  const filtered = tasks.filter((t) => {
    if (assigneeFilter !== "all" && t.assignedTo !== assigneeFilter) return false;
    if (search.trim()) {
      const proj = projects.find((p) => p.id === t.projectId);
      if (
        !t.title.includes(search.trim()) &&
        !t.category.includes(search.trim()) &&
        !(proj?.name ?? "").includes(search.trim())
      )
        return false;
    }
    return true;
  });

  const handleDrop = (colKey: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (groupBy === "status") updateTaskStatus(taskId, colKey as TaskStatus);
    else updateTask(taskId, { category: colKey });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <ListChecks className="text-blue-500" size={24} /> لوحة المهام
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                view === "board" ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid size={14} /> كانبان
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                view === "table" ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Table2 size={14} /> قاعدة بيانات
            </button>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
          >
            <Plus size={16} /> إضافة مهمة
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pr-9`}
            placeholder="بحث ذكي في المهام..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="all">كل الموظفين</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as "status" | "category")}
        >
          <option value="status">تجميع الكانبان: الحالة</option>
          <option value="category">تجميع الكانبان: التصنيف</option>
        </select>
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">المهمة</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">المشروع</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">المسند إليه</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">التصنيف</th>
                <th className="px-4 py-3 font-medium">الأولوية</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">الاستحقاق</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const proj = projects.find((p) => p.id === t.projectId);
                const assignee = teamMembers.find((m) => m.id === t.assignedTo);
                return (
                  <tr
                    key={t.id}
                    onClick={() => proj && navigate(`/projects/${proj.id}`)}
                    className={`border-t border-gray-100 ${proj ? "cursor-pointer hover:bg-blue-50/40" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">{t.title}</td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {proj?.name ?? "مهمة داخلية"}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                      {assignee?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{t.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                      <span className="flex items-center gap-2">
                        {formatDate(t.dueDate)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(t);
                          }}
                          className="rounded p-1 text-gray-300 hover:bg-blue-50 hover:text-blue-500"
                        >
                          <Pencil size={13} />
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    لا توجد مهام مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((col) => {
              const items = filtered.filter((t) =>
                groupBy === "status" ? t.status === col.key : t.category === col.key,
              );
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(col.key);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => handleDrop(col.key, e)}
                  className={`kanban-column min-h-[200px] rounded-2xl border border-gray-200 bg-white p-3 shadow-sm ${
                    dragOverCol === col.key ? "drag-over" : ""
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-gray-700">{col.label}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((t) => {
                      const proj = projects.find((p) => p.id === t.projectId);
                      const assignee = teamMembers.find((m) => m.id === t.assignedTo);
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                          onClick={() => proj && navigate(`/projects/${proj.id}`)}
                          className="group/task cursor-grab rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm hover:border-blue-200 hover:bg-blue-50/40 active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-gray-800">{t.title}</p>
                            <span className="flex shrink-0 items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTask(t);
                                }}
                                className="rounded p-0.5 text-gray-300 hover:bg-blue-100 hover:text-blue-500 group-hover/task:text-gray-400"
                              >
                                <Pencil size={12} />
                              </button>
                              <StatusBadge status={t.priority} className="text-[10px]" />
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {proj?.name ?? "مهمة داخلية"}
                            {groupBy === "category" && (
                              <StatusBadge status={t.status} className="mr-1 text-[9px]" />
                            )}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                            <span>{assignee?.name}</span>
                            <span>{formatDate(t.dueDate)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <p className="py-6 text-center text-xs text-gray-300">لا توجد مهام</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-gray-400">
            اسحب المهمة إلى عمود آخر لتغيير {groupBy === "status" ? "حالتها" : "تصنيفها"}
          </p>
        </>
      )}

      {showAddTask && (
        <Modal title="إضافة مهمة جديدة" onClose={() => setShowAddTask(false)} wide>
          <AssignTaskForm
            onSave={(data) => {
              addTask({
                ...data,
                projectId: data.projectId || null,
                phaseId: "",
                status: "pending",
                progress: 0,
              });
              setShowAddTask(false);
            }}
            onClose={() => setShowAddTask(false)}
          />
        </Modal>
      )}

      {editingTask && (
        <Modal title={`تعديل المهمة — ${editingTask.title}`} onClose={() => setEditingTask(null)} wide>
          <EditTaskForm task={editingTask} onClose={() => setEditingTask(null)} />
        </Modal>
      )}
    </div>
  );
};

const EditTaskForm: React.FC<{ task: ProjectTask; onClose: () => void }> = ({
  task,
  onClose,
}) => {
  const { projects, teamMembers, updateTask, currentUser, submitDeliverable, reviewDeliverable } =
    useApp();
  const [form, setForm] = useState({
    title: task.title,
    category: task.category,
    description: task.description,
    projectId: task.projectId ?? "",
    assignedTo: task.assignedTo,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
  });
  const [reviewNote, setReviewNote] = useState("");

  // مدير المشروع للمهمة = المسؤول عن المشروع المرتبط
  const linkedProject = projects.find((p) => p.id === task.projectId);
  const isReviewer =
    currentUser.role === "owner" ||
    currentUser.role === "admin" ||
    (linkedProject && linkedProject.assignedTo === currentUser.id);
  const isAssignee = task.assignedTo === currentUser.id;
  const dStatus = task.deliverableStatus ?? "none";
  const DSTATUS_LABEL: Record<string, string> = {
    none: "لم يُرفع مخرَج بعد",
    submitted: "بانتظار اعتماد مدير المشروع",
    revision: "دورة تعديل مطلوبة",
    approved: "معتمد ✓",
    rejected: "مرفوض",
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateTask(task.id, { ...form, projectId: form.projectId || null });
        onClose();
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
          list="edit-task-categories"
          className={inputClass}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <datalist id="edit-task-categories">
          {TASK_CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="الوصف">
          <textarea
            className={inputClass}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
      </div>
      <FormField label="ربط المهمة بـ">
        <select
          className={inputClass}
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value="">🏢 مهمة داخلية — {companyInfo.name}</option>
        </select>
      </FormField>
      <FormField label="إسناد إلى">
        <select
          className={inputClass}
          value={form.assignedTo}
          onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
        >
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="الحالة">
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
        >
          <option value="pending">قيد الانتظار</option>
          <option value="in-progress">قيد التنفيذ</option>
          <option value="completed">مكتمل</option>
          <option value="on-hold">معلّق</option>
        </select>
      </FormField>
      <FormField label="الأولوية">
        <select
          className={inputClass}
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
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
      {/* اعتماد المخرجات: رفع من المنفّذ، واعتماد/دورة تعديل/رفض من مدير المشروع */}
      <div className="sm:col-span-2 mt-2 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-700">اعتماد المخرَج</p>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              dStatus === "approved"
                ? "bg-emerald-100 text-emerald-700"
                : dStatus === "revision" || dStatus === "rejected"
                  ? "bg-amber-100 text-amber-700"
                  : dStatus === "submitted"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-200 text-gray-500"
            }`}
          >
            {DSTATUS_LABEL[dStatus]}
          </span>
        </div>
        {task.reviewNotes && (dStatus === "revision" || dStatus === "rejected") && (
          <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            ملاحظات المراجعة: {task.reviewNotes}
          </p>
        )}
        {task.revisionRounds ? (
          <p className="mb-2 text-[11px] text-gray-400">عدد دورات التعديل: {task.revisionRounds}</p>
        ) : null}

        {/* المنفّذ يرفع المخرَج */}
        {isAssignee && (dStatus === "none" || dStatus === "revision" || dStatus === "rejected") && (
          <button
            type="button"
            onClick={() => {
              submitDeliverable(task.id);
              onClose();
            }}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
          >
            رفع المخرَج للاعتماد
          </button>
        )}

        {/* مدير المشروع يعتمد / يطلب تعديلًا / يرفض */}
        {isReviewer && dStatus === "submitted" && (
          <div className="space-y-2">
            <input
              className={inputClass}
              placeholder="ملاحظات (لدورة التعديل أو الرفض)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  reviewDeliverable(task.id, "approved");
                  onClose();
                }}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                اعتماد
              </button>
              <button
                type="button"
                onClick={() => {
                  reviewDeliverable(task.id, "revision", reviewNote);
                  onClose();
                }}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
              >
                طلب دورة تعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  reviewDeliverable(task.id, "rejected", reviewNote);
                  onClose();
                }}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
              >
                رفض
              </button>
            </div>
          </div>
        )}
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
          حفظ التعديلات
        </button>
      </div>
    </form>
  );
};
