import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection, getDocs, query, where
} from 'firebase/firestore';

// generateUserId ฟังก์ชันเหมือนเดิม
const generateUserId = (helpers) => {
  const userIds = helpers
    .map(h => h.userId)
    .filter(Boolean)
    .map(uid => parseInt(uid.replace('u', ''), 10))
    .filter(num => !isNaN(num));
  const nextId = (userIds.length > 0 ? Math.max(...userIds) + 1 : 1).toString().padStart(3, '0');
  return `u${nextId}`;
};

const HelperTab = () => {
  const [allHelpers, setAllHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState(10);

  // Modal Add
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHelper, setNewHelper] = useState({ name: '', email: '', phone: '', helperType: '', userId: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Team Options (Dropdown)
  const [teamOptions, setTeamOptions] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // แสดงข้อมูลหลังสร้าง user
  const [showCreatedInfo, setShowCreatedInfo] = useState(false);
  const [createdHelperInfo, setCreatedHelperInfo] = useState({ email: '', password: '' });

  // Edit Modal/Delete Dialog
  const [showEditHelperModal, setShowEditHelperModal] = useState(false);
  const [editHelper, setEditHelper] = useState(null);
  const [showDeleteHelperModal, setShowDeleteHelperModal] = useState(false);
  const [helperToDelete, setHelperToDelete] = useState(null);

  useEffect(() => {
    fetchAllHelpers();
    fetchTeamOptions();
  }, []);

  useEffect(() => {
    setVisibleRows(10);
  }, [allHelpers.length]);

  // Fetch helpers
  const fetchAllHelpers = async () => {
    setLoading(true);
    const q = query(collection(db, 'users'), where('role', '==', 'helper'));
    const querySnapshot = await getDocs(q);
    setAllHelpers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  // Fetch ทีม
  const fetchTeamOptions = async () => {
    setLoadingTeams(true);
    const q = query(collection(db, 'helper_teams'));
    const querySnapshot = await getDocs(q);
    setTeamOptions(querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
    setLoadingTeams(false);
  };

  // ===== Modal Add =====
  const handleOpenAddModal = () => {
    setNewHelper({
      name: '',
      email: '',
      phone: '',
      helperType: '',
      userId: generateUserId(allHelpers),
      password: ''
    });
    setShowAddModal(true);
    setShowPassword(false);
  };
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewHelper({ name: '', email: '', phone: '', helperType: '', userId: '', password: '' });
    setShowPassword(false);
  };
  const handleChangeNewHelper = (e) => {
    setNewHelper({ ...newHelper, [e.target.name]: e.target.value });
  };

  const handleAddHelper = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      if (!newHelper.userId) {
        alert("ไม่สามารถสร้าง userId ได้ กรุณารอสักครู่แล้วลองใหม่");
        setAdding(false);
        return;
      }
      // เรียก backend API เพื่อสร้าง user (คุณต้องมี API นี้อยู่แล้ว)
      const res = await fetch('https://emergencyapp-production-45d8.up.railway.app/api/admin-create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newHelper.userId,
          email: newHelper.email,
          password: newHelper.password,
          name: newHelper.name,
          phone: newHelper.phone,
          helperType: newHelper.helperType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setShowCreatedInfo(true);
        setCreatedHelperInfo({ email: newHelper.email, password: newHelper.password });
        setNewHelper({ name: '', email: '', phone: '', helperType: '', userId: '', password: '' });
        fetchAllHelpers();
      } else {
        alert(data.error || 'ເກີດຂໍ້ຜິດພາດໃນການເພີ່ມຂໍ້ມູນ');
      }
    } catch (err) {
      alert('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມ API');
    }
    setAdding(false);
  };

  // ===== Edit Helper Modal =====
  const handleOpenEditHelperModal = (helper) => {
    setEditHelper({ ...helper });
    setShowEditHelperModal(true);
  };
  const handleCloseEditHelperModal = () => {
    setEditHelper(null);
    setShowEditHelperModal(false);
  };

  const handleSaveEditHelperModal = async (e) => {
    e.preventDefault();
    if (!editHelper || !editHelper.uid) {
      alert('ไม่พบ uid ของผู้ใช้นี้');
      return;
    }
    try {
      const res = await fetch('https://emergencyapp-production-45d8.up.railway.app/api/admin-edit-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: editHelper.uid,
          userId: editHelper.userId,
          email: editHelper.email,
          name: editHelper.name,
          phone: editHelper.phone,
          helperType: editHelper.helperType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowEditHelperModal(false);
        setEditHelper(null);
        fetchAllHelpers();
      } else {
        alert(data.error || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
      }
    } catch (err) {
      alert('ການເຊື່ອມ API ລົ້ມເຫຼວ');
    }
  };

  // Delete Helper Dialog
  const handleAskDeleteHelper = (helper) => {
    setHelperToDelete(helper);
    setShowDeleteHelperModal(true);
  };
  const handleCancelDeleteHelper = () => {
    setShowDeleteHelperModal(false);
    setHelperToDelete(null);
  };
  const handleConfirmDeleteHelper = async () => {
    if (!helperToDelete) return;
    try {
      const res = await fetch('https://emergencyapp-production-45d8.up.railway.app/api/delete-user-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: helperToDelete.uid,
          userId: helperToDelete.userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteHelperModal(false);
        setHelperToDelete(null);
        fetchAllHelpers();
      } else {
        alert(data.error || 'ລົບບໍສຳເລັດ');
      }
    } catch (err) {
      alert('ການເຊື່ອມ API ລົ້ມເຫຼວ');
    }
  };

  // ===== Reset Password =====
  const handleResetPassword = async (email) => {
    if (!window.confirm(`ต้องการส่งอีเมล reset password ไปที่\n${email} ใช่หรือไม่?`)) return;
    try {
      const res = await fetch('https://emergencyapp-production-45d8.up.railway.app/api/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        alert('ส่งอีเมล reset password สำเร็จแล้ว กรุณาแจ้งทีมช่วยเหลือให้เช็คอีเมล');
      } else {
        alert(data.error || 'ส่งอีเมลไม่สำเร็จ');
      }
    } catch (err) {
      alert('เชื่อมต่อ API ไม่สำเร็จ');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 relative">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">👥 ທີມຊ່ວຍເຫຼືອທັງຫມົດ</h2>
      <div className="absolute top-6 right-8">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
          onClick={handleOpenAddModal}
        >
          + ເພີ່ມທີມຊ່ວຍເຫຼືອ
        </button>
      </div>
      {loading ? (
        <p className="text-gray-500">ກຳລັງໂຫລດ...</p>
      ) : allHelpers.length === 0 ? (
        <p className="text-gray-500">ຍັງບໍ່ມີຜູ້ຊ່ວຍ</p>
      ) : (
        <div className="overflow-x-auto mt-8">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-green-100">
              <tr>
                <th className="px-4 py-2 border text-left">userId</th>
                <th className="px-4 py-2 border text-left">ຊື່</th>
                <th className="px-4 py-2 border text-left">ອີເມວ</th>
                <th className="px-4 py-2 border text-left">ເບີໂທ</th>
                <th className="px-4 py-2 border text-left">ປະເພດທີມ</th>
                <th className="px-4 py-2 border text-left">ຮູບພາບ</th>
                <th className="px-4 py-2 border text-center">ການດຳເນີນງານ</th>
              </tr>
            </thead>
            <tbody>
              {allHelpers.slice(0, visibleRows).map((helper) => {
                const teamObj = teamOptions.find(opt => opt.type === helper.helperType);
                const teamLabel = teamObj ? `${teamObj.name} (${teamObj.type})` : helper.helperType || '-';
                const imgUrl = helper.profileImageUrl || helper.profileImage || '/default-profile.png';
                return (
                  <tr key={helper.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{helper.userId}</td>
                    <td className="px-4 py-2 border">{helper.name}</td>
                    <td className="px-4 py-2 border">{helper.email}</td>
                    <td className="px-4 py-2 border">{helper.phone}</td>
                    <td className="px-4 py-2 border">{teamLabel}</td>
                    <td className="relative w-20 h-20">
                      <img
                        src={imgUrl}
                        alt="helper"
                        className="w-20 h-20 rounded-full object-cover border"
                        onError={e => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div
                        className="w-20 h-20 rounded-full border bg-white text-gray-400 text-base flex items-center justify-center absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        helper
                      </div>
                    </td>
                    <td className="px-4 py-2 border text-center space-x-1">
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                        onClick={() => handleOpenEditHelperModal(helper)}>
                        ແກ້ໄຂ
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handleAskDeleteHelper(helper)}>
                        ລົບ
                      </button>
                      <button
                        className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
                        onClick={() => handleResetPassword(helper.email)}>
                        Reset Password
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* ปุ่ม Load More */}
          {allHelpers.length > visibleRows && (
            <div className="flex justify-center my-4">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={() => setVisibleRows(v => v + 10)}
              >
                ສະແດງເພີ່ມເຕີມ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
              onClick={handleCloseAddModal}
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-center">ເພີ່ມທີມຊ່ວຍເຫຼືອ</h3>
            <form onSubmit={handleAddHelper} className="space-y-3">
              <div>
                <label className="block text-gray-700 mb-1">userId (auto)</label>
                <input className="border px-3 py-2 rounded w-full bg-gray-100"
                  name="userId" value={newHelper.userId} readOnly />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຊື່</label>
                <input className="border px-3 py-2 rounded w-full"
                  name="name" value={newHelper.name}
                  onChange={handleChangeNewHelper} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ອີເມວ</label>
                <input className="border px-3 py-2 rounded w-full"
                  name="email" type="email" value={newHelper.email}
                  onChange={handleChangeNewHelper} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ລະຫັດຜ່ານ</label>
                <div className="relative">
                  <input className="border px-3 py-2 rounded w-full pr-10"
                    name="password" type={showPassword ? "text" : "password"}
                    value={newHelper.password} onChange={handleChangeNewHelper} required />
                  <button type="button"
                    className="absolute right-2 top-2 text-gray-600"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ເບີໂທ</label>
                <input className="border px-3 py-2 rounded w-full"
                  name="phone" value={newHelper.phone}
                  onChange={handleChangeNewHelper} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ປະເພດທີມ</label>
                <select className="border px-3 py-2 rounded w-full"
                  name="helperType" value={newHelper.helperType}
                  onChange={handleChangeNewHelper} required disabled={loadingTeams}>
                  <option value="">ເລືອກປະເພດທີມ</option>
                  {teamOptions.map(opt => (
                    <option key={opt.id} value={opt.type}>
                      {opt.type} ({opt.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end pt-3">
                <button type="button"
                  className="mr-2 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={handleCloseAddModal} disabled={adding}>ຍົກເລີກ</button>
                <button type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  disabled={adding}>{adding ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Helper Modal */}
      {showEditHelperModal && editHelper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
              onClick={handleCloseEditHelperModal}
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-center">ແກ້ໄຂຂໍ້ມູນທີມຊ່ວຍເຫຼືອ</h3>
            <form onSubmit={handleSaveEditHelperModal} className="space-y-3">
              <div>
                <label className="block text-gray-700 mb-1">userId</label>
                <input className="border px-3 py-2 rounded w-full bg-gray-100"
                  value={editHelper.userId} readOnly />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຊື່</label>
                <input className="border px-3 py-2 rounded w-full"
                  value={editHelper.name}
                  onChange={e => setEditHelper({ ...editHelper, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ອີເມວ</label>
                <input className="border px-3 py-2 rounded w-full" type="email"
                  value={editHelper.email}
                  onChange={e => setEditHelper({ ...editHelper, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ເບີໂທ</label>
                <input className="border px-3 py-2 rounded w-full"
                  value={editHelper.phone}
                  onChange={e => setEditHelper({ ...editHelper, phone: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຮູບພາບ</label>
                {(editHelper?.profileImageUrl || editHelper?.profileImage) ? (
                  <img
                    src={editHelper.profileImageUrl || editHelper.profileImage}
                    alt="profile"
                    className="w-16 h-16 rounded-full border object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border bg-gray-100 flex items-center justify-center text-gray-400">
                    -
                  </div>
                )}
                <div className="text-xs text-gray-400 pt-2">
                  * ຜູ້ໃຊ້ຈະຈັດການຮູບເອງຜ່ານໜ້າແອັບ
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ປະເພດທີມ</label>
                <select className="border px-3 py-2 rounded w-full"
                  value={editHelper.helperType}
                  onChange={e => setEditHelper({ ...editHelper, helperType: e.target.value })} required>
                  <option value="">ເລືອກປະເພດທີມ</option>
                  {teamOptions.map(opt => (
                    <option key={opt.id} value={opt.type}>
                      {opt.name} ({opt.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end pt-3">
                <button type="button"
                  className="mr-2 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={handleCloseEditHelperModal}>ຍົກເລີກ</button>
                <button type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >ບັນທຶກ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Helper Modal */}
      {showDeleteHelperModal && helperToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm relative text-center">
            <h3 className="text-xl font-bold mb-4 text-red-600">ຢືນຢັນການລົບ</h3>
            <p className="mb-6">ຕ້ອງການລົບ <b>{helperToDelete.name}</b> ຫຼືບໍ?</p>
            <div className="flex justify-center gap-3">
              <button className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={handleCancelDeleteHelper}>ຍົກເລີກ</button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={handleConfirmDeleteHelper}>ລົບ</button>
            </div>
          </div>
        </div>
      )}

      {/* Show Created Info */}
      {showCreatedInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm relative text-center">
            <h4 className="font-bold text-lg mb-4 text-green-600">ສ້າງບັນຊີສຳເລັດ!</h4>
            <div className="mb-2"><b>Email:</b> {createdHelperInfo.email}</div>
            <div className="mb-4"><b>Password:</b> {createdHelperInfo.password}</div>
            <p className="text-sm text-gray-500 mb-4">ກະລຸນາຄັດລອກ/ແຈ້ງໃຫ້ທີມງານນຳໄປໃຊ້ login </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setShowCreatedInfo(false)}>ປິດ</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelperTab;
