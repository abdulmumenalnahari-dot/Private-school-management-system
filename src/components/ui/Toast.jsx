// src/components/ui/Toast.jsx
import React, { useEffect } from 'react';
import '../../styles/components/toast.css';

const Toast = ({ message, show }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        // لا حاجة لإغلاق التوست يدويًا إذا تم التعامل معه من خلال الحالة في المكون الأصل
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className={`toast ${show ? 'show' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;