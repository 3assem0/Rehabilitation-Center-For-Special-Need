import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "../../context/AppContext";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText, 
  type = "danger" 
}) => {
  const { language } = useTranslation();
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (language === 'ar' ? "تأكيد الإجراء" : "Confirm Action")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelText || (language === 'ar' ? "إلغاء" : "Cancel")}
          </Button>
          <Button variant={type} onClick={onConfirm}>
            {confirmText || (language === 'ar' ? "تأكيد الحذف" : "Confirm Delete")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce-subtle ${type === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
          <AlertTriangle size={40} />
        </div>
        <h3 className="text-xl font-bold text-primary mb-3">
          {message || (language === 'ar' ? "هل أنت متأكد؟" : "Are you sure?")}
        </h3>
        <p className="text-text-muted text-sm max-w-[350px] leading-relaxed">
          {language === 'ar' 
            ? "هذا الإجراء سيقوم بحذف البيانات نهائياً من النظام، ولا يمكن استعادتها مرة أخرى." 
            : "This action will permanently delete the data from the system and cannot be undone."}
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
