import { useState } from "react";

/** يثبّت آخر اختيار للمستخدم (مثل أسلوب عرض البيانات: قاعدة بيانات أو لوحة) عبر localStorage */
export function usePersistedState<T extends string>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return (localStorage.getItem(`workhub:${key}`) as T) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(`workhub:${key}`, next);
    } catch {
      /* ignore */
    }
  };

  return [value, set] as const;
}
