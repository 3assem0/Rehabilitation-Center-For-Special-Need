import React from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useApp, useTranslation } from "../../context/AppContext";
import { ShieldCheck, HelpCircle, Building2, ImagePlus, X, Trash2 } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useFirestore } from "../../hooks/useFirestore";

const Settings = () => {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const { data: advances, deleteDocument: deleteAdvance } = useFirestore("advances");

  const handleClearAdvances = async () => {
    if (window.confirm("هل أنت متأكد من حذف جميع بيانات السلف؟ لا يمكن التراجع عن هذه الخطوة.")) {
      try {
        for (const advance of advances) {
          await deleteAdvance(advance.id);
        }
        toast.success("تم حذف جميع بيانات السلف بنجاح");
      } catch (error) {
        toast.error("حدث خطأ أثناء الحذف");
      }
    }
  };
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        return toast.error("حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch({ actionType: "SET_LOGO", payload: reader.result });
        toast.success("تم تحديث الشعار بنجاح");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    dispatch({ actionType: "SET_LOGO", payload: null });
    toast.success("تم إزالة الشعار");
  };

  return (
    <PageWrapper title={t("settings")}>
      <Toaster position="top-center" />
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-primary">{t("settings")}</h1>
        <p className="text-text-muted mt-1">إعدادات النظام والمركز</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <h3 className="font-bold text-primary flex items-center gap-2 mb-6">
              <Building2 size={20} />
              إعدادات المركز
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="اسم المركز" defaultValue="مركز تأهيل الاحتياجات الخاصة" />
              <Input label="ساعات الدوام الافتراضية" type="number" defaultValue="8" />
              <div className="w-full">
                <label className="block text-sm font-semibold mb-2">العملة الافتراضية</label>
                <select className="input" defaultValue="EGP">
                  <option value="EGP">جنيه مصري (EGP)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                </select>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="mt-8 border-t border-border pt-6">
              <label className="block text-sm font-semibold mb-4">شعار المركز (Logo)</label>
              <div className="flex items-center gap-6">
                <div className="relative group w-24 h-24 rounded-xl border-2 border-dashed border-border bg-bg/50 flex flex-col items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
                  {state.logo ? (
                    <>
                      <img src={state.logo} alt="Center Logo" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); removeLogo(); }} className="text-white hover:bg-danger/20 hover:text-red-300">
                          <X size={20} />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-text-muted">
                      <ImagePlus size={24} className="mx-auto mb-1 opacity-50" />
                      <span className="text-[10px] uppercase font-bold">رفع صورة</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={!!state.logo}
                  />
                </div>
                <div className="text-xs text-text-muted space-y-1">
                  <p>• يُفضل رفع صورة بخلفية شفافة (PNG).</p>
                  <p>• أقصى حجم للصورة: 2MB.</p>
                  <p>• سيظهر هذا الشعار في القائمة الجانبية والتقارير.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-danger flex items-center gap-2 mb-4">
              <Trash2 size={20} />
              إدارة البيانات
            </h3>
            <p className="text-xs text-text-muted mb-4">
              استخدم هذا الخيار بحذر. سيتم حذف جميع بيانات السلف المسجلة في النظام (بما في ذلك السلف المعلقة للموظفين المحذوفين).
            </p>
            <Button variant="danger" className="w-full justify-center" onClick={handleClearAdvances}>
              حذف جميع بيانات السلف
            </Button>
          </div>
          
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-bg rounded-xl flex items-center justify-center text-primary font-black">?</div>
            <div>
              <p className="text-sm font-bold">المساعدة والدعم</p>
              <p className="text-xs text-text-muted">تواصل مع قسم الدعم التقني</p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Settings;
