import React, { useState } from "react";
import { LayoutTemplate, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { useApp } from "../state/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal, FormField, inputClass } from "../components/Modal";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  defaultPermissionsForRole,
} from "../lib/permissions";
import type { Permission, PermissionTemplate, TeamMember } from "../types";

const TEAMS = ["فريق التصميم", "فريق المحتوى", "فريق التطوير", "فريق المبيعات", "فريق الحسابات", "بدون فريق"];

/** إدارة الأدوار والصلاحيات — منفصلة عن قاعدة بيانات الموظفين وبطاقات الأداء */
export const EmployeesRoles: React.FC = () => {
  const {
    teamMembers,
    updateTeamMemberPermissions,
    updateTeamMember,
    permissionTemplates,
    addPermissionTemplate,
    updatePermissionTemplate,
    deletePermissionTemplate,
  } = useApp();
  const [permissionsFor, setPermissionsFor] = useState<TeamMember | null>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-gray-900">
          <ShieldCheck className="text-blue-500" size={24} /> إدارة الأدوار والصلاحيات
        </h1>
        <p className="text-sm text-gray-500">أدوار الموظفين وصلاحياتهم وقوالب الأدوار الجاهزة</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-gray-900">الأدوار والصلاحيات لكل موظف</h2>
        <div className="space-y-2">
          {teamMembers.map((m) => (
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
                    {m.name}{" "}
                    {m.jobTitle && <span className="font-normal text-gray-400">- {m.jobTitle}</span>}
                  </p>
                  <span className="flex flex-wrap gap-1 pt-1">
                    {m.permissions.slice(0, 4).map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
                      >
                        {PERMISSION_LABELS[p]}
                      </span>
                    ))}
                    {m.permissions.length > 4 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">
                        +{m.permissions.length - 4}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={m.role} />
                {/* الفريق التنظيمي */}
                <select
                  value={m.team ?? "بدون فريق"}
                  onChange={(e) =>
                    updateTeamMember(m.id, {
                      team: e.target.value === "بدون فريق" ? undefined : e.target.value,
                    })
                  }
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600"
                >
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {/* إسناد قالب وظيفي جاهز (مدير مشاريع، موظف إدارة...) لعضو الفريق */}
                {m.role === "team_member" && (
                  <select
                    value={m.templateId ?? ""}
                    onChange={(e) => {
                      const tplId = e.target.value || null;
                      const tpl = permissionTemplates.find((t) => t.id === tplId);
                      updateTeamMember(m.id, {
                        templateId: tplId,
                        ...(tpl ? { permissions: tpl.permissions } : {}),
                      });
                    }}
                    className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600"
                  >
                    <option value="">عضو فريق (بدون قالب)</option>
                    {permissionTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
                {m.role !== "owner" && (
                  <button
                    onClick={() => setPermissionsFor(m)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <ShieldCheck size={14} /> تعديل الصلاحيات ({m.permissions.length})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
          <Users size={18} /> الفرق
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEAMS.filter((t) => t !== "بدون فريق").map((team) => {
            const members = teamMembers.filter((m) => m.team === team);
            return (
              <div key={team} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">{team}</p>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                    {members.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600 shadow-sm"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                        {m.avatar}
                      </span>
                      {m.name.split(" ")[0]}
                    </span>
                  ))}
                  {members.length === 0 && <span className="text-[11px] text-gray-300">لا أعضاء</span>}
                </div>
              </div>
            );
          })}
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
          قوالب جاهزة تُطبق بضغطة واحدة عند إضافة عضو جديد
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

      {permissionsFor && (
        <Modal title={`صلاحيات ${permissionsFor.name}`} onClose={() => setPermissionsFor(null)}>
          <RolePermissionsForm
            member={permissionsFor}
            onSave={(perms) => {
              updateTeamMemberPermissions(permissionsFor.id, perms);
              setPermissionsFor(null);
            }}
            onClose={() => setPermissionsFor(null)}
          />
        </Modal>
      )}

      {showAddTemplate && (
        <Modal title="إضافة قالب صلاحيات" onClose={() => setShowAddTemplate(false)}>
          <RoleTemplateForm
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
          <RoleTemplateForm
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
  );
};

const RolePermissionsForm: React.FC<{
  member: TeamMember;
  onSave: (permissions: Permission[]) => void;
  onClose: () => void;
}> = ({ member, onSave, onClose }) => {
  const [selected, setSelected] = useState<Permission[]>(member.permissions);
  const toggle = (p: Permission) =>
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

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

const RoleTemplateForm: React.FC<{
  initial?: PermissionTemplate;
  onSave: (template: Omit<PermissionTemplate, "id">) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [permissions, setPermissions] = useState<Permission[]>(
    initial?.permissions ?? defaultPermissionsForRole("team_member"),
  );
  const toggle = (p: Permission) =>
    setPermissions((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

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
        />
      </FormField>
      <div className="mb-4 space-y-1.5 rounded-lg border border-gray-200 p-3">
        {ALL_PERMISSIONS.map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={permissions.includes(p)}
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
          حفظ القالب
        </button>
      </div>
    </form>
  );
};
