import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { inputClass } from "../components/Modal";

// قائمة الإيميلات لاختيار الحساب الذي أُسجّل الدخول به (بدون إظهار أنواع المستخدمين)
const ACCOUNT_EMAILS: { id: string; email: string }[] = [
  { id: "u-owner", email: "khaled@agency.sa" },
  { id: "u-admin", email: "abdullah@agency.sa" },
  { id: "u-pm", email: "mona@agency.sa" },
  { id: "u-team-1", email: "mohammad@agency.sa" },
];

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState(ACCOUNT_EMAILS[0].id);
  const [email, setEmail] = useState(ACCOUNT_EMAILS[0].email);
  const [password, setPassword] = useState("••••••••");
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // نستنتج الحساب من الإيميل المختار (أو المكتوب) ثم ندخل
    const match = ACCOUNT_EMAILS.find((a) => a.email === email);
    login(match?.id ?? accountId);
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen w-full flex-col-reverse lg:flex-row">
      {/* الجزء الأيسر: لوحة تسجيل الدخول */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-2xl font-extrabold text-gray-900">WORK HUB</h1>
          </div>
          <h2 className="mb-1 text-2xl font-extrabold text-gray-900">تسجيل الدخول</h2>
          <p className="mb-6 text-sm text-gray-500">أدخل بياناتك للوصول إلى مساحة عملك</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                اسم المستخدم (البريد الإلكتروني)
              </span>
              {/* قائمة منسدلة بالإيميلات لاختيار الحساب */}
              <select
                className={inputClass}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  const m = ACCOUNT_EMAILS.find((a) => a.email === e.target.value);
                  if (m) setAccountId(m.id);
                }}
              >
                {ACCOUNT_EMAILS.map((a) => (
                  <option key={a.id} value={a.email}>
                    {a.email}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">كلمة المرور</span>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300"
                />
                تذكرني
              </label>
              <button type="button" className="text-blue-600 hover:underline">
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-500 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-600"
            >
              تسجيل الدخول
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ليس لديك حساب؟{" "}
            <button className="font-semibold text-blue-600 hover:underline">إنشاء حساب جديد</button>
          </p>
        </div>
      </div>

      {/* الجزء الأيمن: ترحيبي — الشعار واسم المنصة ووصف الخدمة */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 px-8 py-16 text-white">
        {/* زخارف خلفية */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />

        <div className="relative max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold shadow-lg backdrop-blur">
            WH
          </div>
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight">WORK HUB</h1>
          <p className="text-lg font-medium text-blue-100">
            منصة موحّدة لإدارة مشاريع وعملاء ومالية وكالتك في مكان واحد.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs text-blue-50">
            {["إدارة المشاريع والفرص", "المالية والفواتير", "أداء الفريق اللحظي"].map((f) => (
              <span key={f} className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
