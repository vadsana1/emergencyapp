import React from "react";

const NotificationPopup = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="bg-black bg-opacity-50 absolute inset-0"
        onClick={onClose}
      />
      <div className="bg-white rounded-xl shadow-xl px-8 py-6 z-60 relative max-w-md w-full flex flex-col items-center">
        <span className="text-2xl font-bold text-blue-700 mb-2">ແຈ້ງເຕືອນ</span>
        <div className="text-gray-700 text-lg mb-4">{message}</div>
        <button
          className="mt-2 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={onClose}
        >
          ປິດ
        </button>
      </div>
    </div>
  );
};
export default NotificationPopup;
