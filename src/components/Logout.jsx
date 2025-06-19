import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";

const Logout = ({ onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    setLoading(true);
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        localStorage.removeItem("user");
        onLogout && onLogout();
        navigate("/login");
      })
      .catch((err) => {
        alert("ອອກຈາກລະບົບຜິດພາດ: " + err.message);
        setLoading(false);
      });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-80">
        <div className="text-xl font-bold mb-4 text-center">ຢືນຢັນການອອກຈາກລະບົບ</div>
        <div className="mb-6 text-center">ເຈົ້າແນ່ໃຈບໍວ່າຕ້ອງການອອກຈາກລະບົບ?</div>
        <div className="flex justify-between space-x-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 w-1/2"
            onClick={handleCancel}
            disabled={loading}
          >
            ຍົກເລີກ
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-1/2"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? "ກຳລັງອອກ..." : "ອອກຈາກລະບົບ"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
