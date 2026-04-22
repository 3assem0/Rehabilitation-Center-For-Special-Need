import React, { useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import DataTable from "../../components/ui/DataTable";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import { useFirestore } from "../../hooks/useFirestore";
import { useTranslation } from "../../context/AppContext";
import { 
  UserCog, 
  ShieldCheck, 
  Globe, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Building2 
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const Settings = () => {
  const { t, language } = useTranslation();
  const { data: users, addDocument, deleteDocument } = useFirestore("users");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "accountant" });

  const columns = [
    { header: "الاسم", key: "name" },
    { header: "البريد الإلكتروني", key: "email" },
    { 
      header: "الصلاحية", 
      key: "role",
      render: (val) => (
        <Badge variant={val === 'admin' ? 'blue' : 'gray'}>
          {val === 'admin' ? "مدير نظام" : "محاسب / مدخل بيانات"}
        </Badge>
      )
    },
    { 
      header: "الإجراءات", 
      key: "id",
      render: (id) => (
        <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(id)}>
          <Trash2 size={16} />
        </Button>
      )
    }
  ];

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      await deleteDocument(id);
      toast.success("تم حذف المستخدم بنجاح");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await addDocument(formData);
      toast.success("تمت إضافة المستخدم بنجاح");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", role: "accountant" });
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <PageWrapper title={t("settings")}>
      <Toaster position="top-center" />
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-primary">{t("settings")}</h1>
        <p className="text-text-muted mt-1">إدارة المستخدمين وإعدادات النظام المتقدمة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* User Management */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <UserCog size={20} />
                إدارة المستخدمين
              </h3>
              <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus size={16} />
                إضافة مستخدم
              </Button>
            </div>
            <DataTable columns={columns} data={users} searchPlaceholder="بحث في المستخدمين..." />
          </div>

          {/* System Config Placeholder */}
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-primary text-white border-none shadow-primary/20">
            <ShieldCheck size={40} className="mb-4 opacity-50" />
            <h4 className="font-bold text-lg mb-2">أمن البيانات</h4>
            <p className="text-sm opacity-80 leading-relaxed">
              جميع التغييرات التي تجريها على المستخدمين تؤثر فوراً على صلاحيات الدخول. يرجى مراجعة الصلاحيات بعناية.
            </p>
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="إضافة مستخدم جديد"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleAddUser}>{t("save")}</Button>
          </>
        }
      >
        <form onSubmit={handleAddUser} className="space-y-6">
          <Input 
            label="الاسم الكامل" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <Input 
            label="البريد الإلكتروني" 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
          <div className="w-full">
            <label className="block text-sm font-semibold mb-2">الدور / الصلاحية</label>
            <select 
              className="input" 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="admin">مدير نظام (Admin)</option>
              <option value="accountant">محاسب (Accountant)</option>
            </select>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Settings;
