import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, ListChecks, Plus, Search, Table2 } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import { formatCurrency, formatDate } from "../lib/format";
import { companyInfo } from "../data/mockData";
import { usePersistedState } from "../lib/usePersistedState";
import { QuickProjectForm } from "./ClientDetail";
import { TASK_CATEGORY_SUGGESTIONS } from "./ProjectDetail";
import type { Project, ProjectStatus, TaskPriority, TaskStatus } from "../types";

type Column = { key: ProjectStatus | "done"; label: string; statuses: ProjectStatus[] };

const COLUMNS: Column[] = [
  { key: "planning", label: "تخطيط", statuses: ["planning"] },
  { key: "in-progress", label: "قيد التنفيذ", statuses: ["in-progress"] },
  { key: "review", label: "مراجعة", statuses: ["review"] },
  { key: "done", label: "مكتمل", statuses: ["delivered", "invoiced", "closed"] },
];

// أعمدة كانبان للمهام (لعرض المهام بنفس أسلوب الكانبان)
const TASK_COLUMNS: { key: string; label: string; statuses: TaskStatus[] }[] = [
  { key: "pending", label: "قيد الانتظار", statuses: ["pending"] },
  { key: "in-progress", label: "قيد التنفيذ", statuses: ["in-progress"] },
  { key: "on-hold", label: "معلّقة", statuses: ["on-hold"] },
  { key: "completed", label: "مكتملة", statuses: ["completed"] },
];

/** showTasks=true (التصنيف الرئيسي): المهام والمشاريع معًا · showTasks=false (التصنيف الثانوي "المشاريع"): المشاريع فقط */
export const Projects: React.FC<{ showTasks?: boolean }> = ({ showTasks = true }) => {
  const {
    projects,
    clients,
    tasks,
    teamMembers,
    projectNotes,
    updateProjectStatus,
    addProject,
    addTask,
    currentUser,
  } = useApp();
  const navigate = useNavigate();
  const [clientFilter, setClientFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [view, setView] = usePersistedState<"board" | "table">("projects-view", "board");

  const filtered = projects.filter(
    (p) =>
      (clientFilter === "all" || p.clientId === clientFilter) &&
      (typeFilter === "all" || p.type === typeFilter) &&
      (!search.trim() || p.name.includes(search.trim()) || p.description.includes(search.trim())),
  );

  const filteredTasks = tasks.filter((t) => {
    const p = projects.find((pr) => pr.id === t.projectId);
    if (clientFilter !== "all" && (!p || p.clientId !== clientFilter)) return false;
    if (typeFilter !== "all" && (!p || p.type !== typeFilter)) return false;
    if (search.trim() && !t.title.includes(search.trim()) && !(p?.name ?? "").includes(search.trim()))
      return false;
    return true;
  });

  const handleDrop = (col: Column, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    const projectId = e.dataTransfer.getData("text/plain");
    updateProjectStatus(projectId, col.statuses[0]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900">
          {showTasks ? "المشاريع والمهام" : "المشاريع"}
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
            className="flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
          >
            <Plus size={16} /> إضافة مهمة
          </button>
          {currentUser.role !== "team_member" && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
            >
              <Plus size={16} /> إضافة مشروع
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputClass} pr-9`}
            placeholder="بحث ذكي في المشاريع والمهام..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
        >
          <option value="all">كل العملاء</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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

      {showTasks && (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <ListChecks size={18} className="text-blue-500" /> المهام ({filteredTasks.length})
          </h2>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            <Plus size={14} /> إضافة مهمة
          </button>
        </div>

        {/* المهام تتبع نفس أسلوب العرض المختار: قاعدة بيانات (جدول) أو كانبان */}
        {view === "table" ? (
        <div className="max-h-72 overflow-y-auto overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-right text-sm">
            <thead className="sticky top-0 bg-gray-50 text-gray-500">
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
              {filteredTasks.map((t) => {
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
                      {formatDate(t.dueDate)}
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TASK_COLUMNS.map((col) => {
            const items = filteredTasks.filter((t) => col.statuses.includes(t.status));
            return (
              <div key={col.key} className="min-h-[140px] rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-gray-700">{col.label}</h3>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-500">
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
                        onClick={() => proj && navigate(`/projects/${proj.id}`)}
                        className={`rounded-xl border border-gray-100 bg-white p-3 text-sm shadow-sm ${
                          proj ? "cursor-pointer hover:border-blue-200 hover:bg-blue-50/40" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-800">{t.title}</p>
                          <StatusBadge status={t.priority} className="shrink-0 text-[10px]" />
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">{proj?.name ?? "مهمة داخلية"}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                          <span>{assignee?.name ?? "—"}</span>
                          <span>{formatDate(t.dueDate)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <p className="py-4 text-center text-xs text-gray-300">لا مهام</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
      )}

      {showTasks && (
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <LayoutGrid size={18} className="text-blue-500" /> المشاريع ({filtered.length})
        </h2>
      )}

      {view === "table" ? (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">المشروع</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">العميل</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">التصنيف</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">الميزانية</th>
                <th className="px-4 py-3 font-medium">التقدم</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/40"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">{p.name}</td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{client?.name}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <StatusBadge status={p.type} className="text-[10px]" />
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                      {formatCurrency(p.budget)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                          <span
                            className="block h-full rounded-full bg-blue-500"
                            style={{ width: `${p.progress}%` }}
                          />
                        </span>
                        <span className="text-xs text-gray-400">{p.progress}%</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    لا توجد مشاريع مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = filtered.filter((p) => col.statuses.includes(p.status));
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.key);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(col, e)}
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
                {items.map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  const lastUpdates = projectNotes
                    .filter((n) => n.projectId === p.id)
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .slice(0, 3)
                    .map((n) => n.text)
                    .join(" • ");
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="cursor-grab rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm hover:border-blue-200 hover:bg-blue-50/40 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <StatusBadge status={p.type} className="shrink-0 text-[10px]" />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{client?.name}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">{p.progress}%</span>
                      </div>
                      <p className="mt-2 truncate text-xs text-gray-500">
                        {lastUpdates || "لا توجد تحديثات"}
                      </p>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="py-6 text-center text-xs text-gray-300">لا توجد مشاريع</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
      {view === "board" && (
        <p className="text-center text-xs text-gray-400">اسحب البطاقة إلى عمود آخر لتغيير حالتها</p>
      )}

      {showAdd && (
        <Modal title="إضافة مشروع جديد" onClose={() => setShowAdd(false)} wide>
          <AddProjectFullForm
            onSave={(data) => {
              addProject(data);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
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
    </div>
  );
};

export const AssignTaskForm: React.FC<{
  onSave: (data: {
    projectId: string;
    category: string;
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriority;
    dueDate: string;
  }) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { projects, teamMembers, currentUser } = useApp();
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? "",
    category: "",
    title: "",
    description: "",
    assignedTo: currentUser.id,
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
          list="assign-task-categories"
          className={inputClass}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="مثال: تصميم، تطوير، إدارية..."
        />
        <datalist id="assign-task-categories">
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

const AddProjectFullForm: React.FC<{
  onSave: (data: Omit<Project, "id" | "activity">) => void;
  onClose: () => void;
}> = ({ onSave, onClose }) => {
  const { clients, currentUser } = useApp();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");

  return (
    <div>
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">العميل</label>
        <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <QuickProjectForm
        key={clientId}
        defaultBillingEmail={clients.find((c) => c.id === clientId)?.email}
        onSave={(data) =>
          onSave({
            ...data,
            clientId,
            progress: 0,
            assignedTo: currentUser.id,
            keyTeamMembers: [],
          })
        }
        onClose={onClose}
      />
    </div>
  );
};
