import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Paperclip, Plus, Send } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatDate } from "../lib/format";
import { companyInfo } from "../data/mockData";
import { TASK_CATEGORY_SUGGESTIONS } from "./ProjectDetail";
import type { TaskPriority, TaskStatus } from "../types";

const STATUS_OPTIONS: TaskStatus[] = ["pending", "in-progress", "completed", "on-hold"];
const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "قيد الانتظار",
  "in-progress": "قيد التنفيذ",
  completed: "مكتمل",
  "on-hold": "معلّق",
};

export const Tasks: React.FC = () => {
  const { tasks, projects, comments, currentUser, updateTaskStatus, addComment, addTask } =
    useApp();
  const location = useLocation();
  const myTasks = tasks.filter((t) => t.assignedTo === currentUser.id);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"due" | "priority">("due");
  const [selectedId, setSelectedId] = useState<string | null>(
    (location.state as { taskId?: string })?.taskId ?? myTasks[0]?.id ?? null,
  );
  const [commentText, setCommentText] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    const stateId = (location.state as { taskId?: string })?.taskId;
    if (stateId) setSelectedId(stateId);
  }, [location.state]);

  const filtered = myTasks
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "due") return a.dueDate.localeCompare(b.dueDate);
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  const selected = myTasks.find((t) => t.id === selectedId) ?? filtered[0];
  const project = selected ? projects.find((p) => p.id === selected.projectId) : null;
  const taskComments = selected ? comments.filter((c) => c.taskId === selected.id) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">مهامي</h1>
        <div className="flex flex-wrap gap-2">
          <select
            className={`${inputClass} w-auto`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className={`${inputClass} w-auto`}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "due" | "priority")}
          >
            <option value="due">ترتيب حسب: الاستحقاق</option>
            <option value="priority">ترتيب حسب: الأولوية</option>
          </select>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            <Plus size={16} /> إضافة مهمة
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full rounded-xl border p-3 text-right transition-colors ${
                selected?.id === t.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <StatusBadge status={t.status} />
                <StatusBadge status={t.priority} />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  {t.category}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {t.projectId ? "" : "مهمة داخلية | "}استحقاق: {formatDate(t.dueDate)}
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400">لا توجد مهام مطابقة.</p>
          )}
        </div>

        {selected ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-gray-400">
              {selected.projectId
                ? `المشروع: ${project?.name}`
                : `مهمة داخلية | ${companyInfo.name}`}{" "}
              · التصنيف: {selected.category}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-gray-900">{selected.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.priority} />
              <span className="text-xs text-gray-400">
                تاريخ الاستحقاق: {formatDate(selected.dueDate)}
              </span>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-sm text-gray-500">
                <span>الحالة: </span>
                <span>{selected.progress ?? 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${selected.progress ?? 0}%` }}
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600">{selected.description}</p>

            {selected.requirements && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">المتطلبات:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                  {selected.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => updateTaskStatus(selected.id, "completed")}
                disabled={selected.status === "completed"}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                تعليم كمكتمل
              </button>
              <select
                className={`${inputClass} w-auto`}
                value={selected.status}
                onChange={(e) => updateTaskStatus(selected.id, e.target.value as TaskStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    تحديث الحالة: {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Paperclip size={14} /> رفع ملف التسليم
              </button>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="mb-3 text-sm font-semibold text-gray-700">التعليقات</p>
              <div className="mb-3 space-y-2">
                {taskComments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-semibold text-gray-700">{c.userName}: </span>
                    <span className="text-gray-600">{c.text}</span>
                  </div>
                ))}
                {taskComments.length === 0 && (
                  <p className="text-xs text-gray-400">لا توجد تعليقات بعد.</p>
                )}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  addComment(selected.id, commentText.trim());
                  setCommentText("");
                }}
              >
                <input
                  className={inputClass}
                  placeholder="أضف تعليقًا..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  type="submit"
                  className="flex items-center justify-center rounded-lg bg-blue-500 px-3 text-white hover:bg-blue-600"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 p-10 text-gray-400">
            اختر مهمة لعرض التفاصيل
          </div>
        )}
      </div>

      {showAddTask && (
        <Modal title="إضافة مهمة جديدة" onClose={() => setShowAddTask(false)} wide>
          <SelfTaskForm
            onSave={(data) => {
              const { projectId, ...rest } = data;
              addTask({
                ...rest,
                projectId: projectId || null,
                phaseId: "",
                assignedTo: currentUser.id,
                status: "pending",
                progress: 0,
              });
              setShowAddTask(false);
            }}
            onClose={() => setShowAddTask(false)}
          />
        </Modal>
      )}
    </div>
  );
};

const SelfTaskForm: React.FC<{
  onSave: (data: {
    projectId: string;
    category: string;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
  }) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { projects } = useApp();
  const [form, setForm] = useState({
    projectId: "",
    category: "",
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
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
          list="self-task-categories"
          className={inputClass}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="مثال: تصميم، إدارية، تسويق..."
        />
        <datalist id="self-task-categories">
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
