export const formatCurrency = (value: number) =>
  `${value.toLocaleString("ar-SA")} ر.س`;

export const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const daysBetween = (from: string, to: string) => {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

export const daysLeft = (endDate: string) => daysBetween(
  new Date().toISOString().slice(0, 10),
  endDate,
);
