import type {
  Client,
  Project,
  ProjectNote,
  ProjectPhase,
  ProjectTask,
  Vendor,
  VendorAssignment,
  VendorNote,
} from "../types";
import { formatCurrency, formatDate, daysLeft } from "./format";

export interface ProjectReport {
  overview: string[];
  achievements: string[];
  challenges: string[];
  nextSteps: string[];
  summary: string;
}

const NEGATIVE_KEYWORDS = ["تأخر", "مشكلة", "غير راضٍ", "غير راض", "اعتراض", "تعثر", "خلل"];
const POSITIVE_KEYWORDS = ["التزم", "ممتاز", "جودة عالية", "أشاد", "سلّم", "وافق"];

export const generateProjectReport = ({
  project,
  client,
  phases,
  tasks,
  vendorAssignments,
  vendors,
  vendorNotes,
  projectNotes,
}: {
  project: Project;
  client: Client | undefined;
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  vendorAssignments: VendorAssignment[];
  vendors: Vendor[];
  vendorNotes: VendorNote[];
  projectNotes: ProjectNote[];
}): ProjectReport => {
  const vendorCost = vendorAssignments.reduce((sum, a) => sum + a.cost, 0);
  const remaining = project.budget - vendorCost;
  const remainingDays = daysLeft(project.endDate);

  const overview = [
    `المشروع "${project.name}" لصالح العميل "${client?.name ?? "غير محدد"}"، بحالة تعاقدية: ${
      client?.status === "active" ? "نشط" : client?.status === "paused" ? "متوقف" : "غير نشط"
    }.`,
    `نسبة الإنجاز الحالية: ${project.progress}%، والحالة العامة: ${project.status}.`,
    `الميزانية الكلية ${formatCurrency(project.budget)}، تم صرف ${formatCurrency(vendorCost)} على الموردين، والمتبقي ${formatCurrency(remaining)}.`,
    remainingDays >= 0
      ? `متبقٍ ${remainingDays} يوم على موعد التسليم (${formatDate(project.endDate)}).`
      : `تجاوز المشروع موعد التسليم المحدد (${formatDate(project.endDate)}) بـ ${Math.abs(remainingDays)} يوم.`,
  ];
  if (client?.notes) {
    overview.push(`ملاحظة على العميل: "${client.notes}".`);
  }
  projectNotes.slice(0, 2).forEach((n) => overview.push(`آخر تحديث (${formatDate(n.createdAt.slice(0, 10))}): ${n.text}`));

  const completedPhases = phases.filter((p) => p.status === "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const positiveVendorNotes = vendorNotes.filter((n) =>
    POSITIVE_KEYWORDS.some((k) => n.text.includes(k)),
  );

  const achievements: string[] = [];
  completedPhases.forEach((p) => achievements.push(`تم إنجاز مرحلة "${p.phaseName}".`));
  completedTasks.forEach((t) => achievements.push(`تم إنجاز مهمة "${t.title}".`));
  positiveVendorNotes.forEach((n) => {
    const vendor = vendors.find((v) => v.id === n.vendorId);
    achievements.push(`تحديث إيجابي عن المورد "${vendor?.name ?? ""}": ${n.text}`);
  });
  project.activity.slice(0, 3).forEach((a) => achievements.push(`${formatDate(a.date)}: ${a.text}`));
  if (achievements.length === 0) achievements.push("لا توجد إنجازات موثقة بعد.");

  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate < new Date().toISOString().slice(0, 10),
  );
  const behindPhases = phases.filter(
    (p) => p.status !== "completed" && daysLeft(p.endDate) < 0,
  );
  const negativeVendorNotes = vendorNotes.filter((n) =>
    NEGATIVE_KEYWORDS.some((k) => n.text.includes(k)),
  );

  const challenges: string[] = [];
  overdueTasks.forEach((t) =>
    challenges.push(
      `مهمة "${t.title}" متأخرة عن موعدها${t.delayReason ? ` — السبب: ${t.delayReason}` : " (بدون سبب مسجّل)"}.`,
    ),
  );
  behindPhases.forEach((p) => challenges.push(`مرحلة "${p.phaseName}" تجاوزت الموعد المخطط له.`));
  negativeVendorNotes.forEach((n) => {
    const vendor = vendors.find((v) => v.id === n.vendorId);
    challenges.push(`تحدٍّ مع المورد "${vendor?.name ?? ""}": ${n.text}`);
  });
  if (remaining < 0) {
    challenges.push(`تجاوزت تكاليف الموردين الميزانية المخصصة بمقدار ${formatCurrency(Math.abs(remaining))}.`);
  }
  if (challenges.length === 0) challenges.push("لا توجد تحديات مسجّلة حاليًا — المشروع يسير حسب الخطة.");

  const nextSteps: string[] = [];
  phases
    .filter((p) => p.status !== "completed")
    .forEach((p) => nextSteps.push(`استكمال مرحلة "${p.phaseName}" (الحالة: ${p.status}).`));
  tasks
    .filter((t) => t.status !== "completed")
    .slice(0, 5)
    .forEach((t) => nextSteps.push(`متابعة مهمة "${t.title}" (استحقاق ${formatDate(t.dueDate)}).`));
  if (nextSteps.length === 0) nextSteps.push("لا توجد خطوات متبقية — المشروع جاهز للتسليم أو مكتمل.");

  const summary =
    `بشكل عام، مشروع "${project.name}" لعميل "${client?.name ?? ""}" منجز بنسبة ${project.progress}%. ` +
    `تم تسجيل ${achievements.length} إنجاز و${challenges.length === 1 && challenges[0].startsWith("لا توجد") ? 0 : challenges.length} تحدٍّ حتى الآن. ` +
    (remainingDays >= 0
      ? `المشروع على المسار الزمني المحدد بمتبقي ${remainingDays} يوم.`
      : `المشروع متأخر عن الجدول الزمني ويحتاج متابعة عاجلة.`);

  return { overview, achievements, challenges, nextSteps, summary };
};
