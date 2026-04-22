import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation, useApp } from "../../context/AppContext";
import { toast, Toaster } from "react-hot-toast";
import { LogIn, Mail, Lock, Languages } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, language } = useTranslation();
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(language === "ar" ? "تم تسجيل الدخول بنجاح" : "Logged in successfully");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(
        language === "ar" 
        ? "خطأ في تسجيل الدخول. يرجى التحقق من البيانات" 
        : "Failed to login. Please check your credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    dispatch({ actionType: "SET_LANGUAGE", payload: language === "ar" ? "en" : "ar" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative px-4">
      <Toaster position="top-center" />
      
      {/* Floating Language Toggle */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-sm hover:shadow-md transition-all text-sm font-medium border border-border"
      >
        <Languages size={18} />
        <span>{language === "ar" ? "English" : "العربية"}</span>
      </button>

      <div className="w-full max-w-md">
        <div className="card shadow-2xl border-t-4 border-yellow-500 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="text-primary" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-primary">{t("login")}</h1>
            <p className="text-text-muted mt-2">
              {language === "ar" 
                ? "نظام الحسابات - مركز تأهيل الاحتياجات الخاصة" 
                : "Accounting System - Special Needs Rehab Center"}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">{t("email")}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="admin@rehab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t("password")}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  className="input pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>{t("login")}</span>
                </>
              )}
            </button>
          </form>

          
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-text-muted uppercase tracking-widest leading-relaxed">
              &copy; 2026 {language === "ar" ? "مركز التأهيل الخاص" : "Special Rehab Center"}
              <br />
              All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
