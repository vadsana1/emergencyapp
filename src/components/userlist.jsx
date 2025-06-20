import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  doc,
  where,
} from 'firebase/firestore';

const PAGE_SIZE = 10;
const columnHeaders = [
  "#",
  "User ID",
  "ຮູບໂປຣໄຟລທ໌",
  "ຊື່ຜູ້ໃຊ້",
  "ອີເມວ",
  "ເບີໂທ",
  "ສິດທິ (Role)",
  "ຈັດການຂໍ້ມູນ"
];

function getProfileImgUrl(userId) {
  if (!userId) return '/default-profile.png';
  return `https://firebasestorage.googleapis.com/v0/b/emergencyapp.appspot.com/o/profile_images%2F${encodeURIComponent(userId)}.jpg?alt=media`;
}

function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-fadeIn">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl"
          onClick={onClose}
          aria-label="ປິດ"
        >&times;</button>
        {children}
      </div>
    </div>
  );
}

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);

  // Modal State
  const [editModal, setEditModal] = useState({ open: false, row: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, row: null });

  // Edit form state (เฉพาะ role)
  const [editForm, setEditForm] = useState({
    role: ''
  });

  useEffect(() => {
    const fetchCount = async () => {
      const snapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'user'))
      );
      setTotalUsers(snapshot.size);
    };
    fetchCount();
  }, [reload]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      let q = query(
        collection(db, 'users'),
        where('role', '==', 'user'),
        orderBy('userId'),
        limit(PAGE_SIZE)
      );
      if (page > 1 && lastDoc) {
        q = query(
          collection(db, 'users'),
          where('role', '==', 'user'),
          orderBy('userId'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }
      const snapshot = await getDocs(q);
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    };
    fetchUsers();
    // eslint-disable-next-line
  }, [page, editModal.open, deleteModal.open, reload]);

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  // Modal Handlers
  const openEditModal = (row) => {
    setEditForm({
      role: row?.role || 'user',
    });
    setEditModal({ open: true, row });
  };
  const closeEditModal = () => setEditModal({ open: false, row: null });
  const openDeleteModal = (row) => setDeleteModal({ open: true, row });
  const closeDeleteModal = () => setDeleteModal({ open: false, row: null });

  // Update / Delete logic
  const handleEditSave = async () => {
    if (!editModal.row) return;
    try {
      await updateDoc(doc(db, 'users', editModal.row.id), { role: editForm.role });
      closeEditModal();
      setReload(r => r + 1);
    } catch (e) {
      alert('ເກີດຂໍ້ຜິດພາດ');
    }
  };

  async function deleteUserAccount({ uid, userId }) {
    const response = await fetch('https://emergencyapp-production-45d8.up.railway.app/api/delete-user-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, userId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Delete failed');
    return data;
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.row) return;
    try {
      await deleteUserAccount({
        uid: deleteModal.row.uid,
        userId: deleteModal.row.userId,
      });
      closeDeleteModal();
      setReload(r => r + 1);
    } catch (e) {
      alert('ລຶບບໍ່ສຳເລັດ: ' + e.message);
    }
  };

  const defaultProfile = "https://ui-avatars.com/api/?name=U+&size=80&background=cccccc&color=ffffff&rounded=true";

  return (
    <div className="min-h-screen bg-[#181c2a] py-8 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto shadow-2xl rounded-2xl bg-[#23263b] p-2 sm:p-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-7 tracking-wide text-center sm:text-left">
          ລາຍຊື່ຜູ້ໃຊ້
        </h2>
        <div className="overflow-x-auto rounded-xl shadow ring-1 ring-[#232741]/70">
          <table className="min-w-[750px] w-full bg-[#21243a] rounded-xl text-[15px]">
            <thead>
              <tr className="bg-[#20243b]">
                {columnHeaders.map((col, idx) => (
                  <th
                    key={idx}
                    className={
                      "py-3 px-2 sm:px-4 font-semibold text-xs sm:text-base text-white text-center border-b border-[#282b4d]" +
                      (col === "ຮູບໂປຣໄຟລທ໌" ? " hidden xs:table-cell" : "")
                    }
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columnHeaders.length} className="text-center p-6 text-white/80">ກຳລັງໂຫຼດ...</td>
                </tr>
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={columnHeaders.length} className="text-center p-6 text-white/70">ບໍ່ມີຜູ້ໃຊ້</td>
                </tr>
              ) : (
                users.filter(Boolean).map((user, idx) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#23253c] border-b border-[#232741] last:border-0 transition"
                  >
                    <td className="py-2 px-2 sm:px-4 text-white text-center">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="py-2 px-2 sm:px-4 text-white text-center">{user?.userId || '-'}</td>
                    {/* ==== รูปโปรไฟล์ ==== */}
                    <td className="hidden xs:table-cell py-2 px-2 sm:px-4 text-center">
                      <img
                        src={
                          user?.profileImageUrl ||
                          user?.profileImage ||
                          getProfileImgUrl(user?.userId) ||
                          defaultProfile
                        }
                        alt={user?.name || "profile"}
                        className="w-11 h-11 rounded-full object-cover border border-gray-300 mx-auto bg-gray-200"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = defaultProfile;
                        }}
                      />
                    </td>
                    <td className="py-2 px-2 sm:px-4 text-white text-center">{user?.name || '-'}</td>
                    <td className="py-2 px-2 sm:px-4 text-white text-center">{user?.email || '-'}</td>
                    <td className="py-2 px-2 sm:px-4 text-white text-center">{user?.phone || '-'}</td>
                    <td className="py-2 px-2 sm:px-4 text-white text-center">
                      <span className="bg-blue-900/90 text-white px-2 py-1 rounded-lg text-xs sm:text-sm">{user?.role || '-'}</span>
                    </td>
                    <td className="py-2 px-2 sm:px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => openEditModal(user)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold shadow transition"
                        >
                          ແກ້ໄຂ
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold shadow transition"
                        >
                          ລຶບ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex flex-wrap justify-center mt-8 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-4 py-2 rounded-xl font-semibold text-base transition
                ${page === i + 1
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black scale-110'
                  : 'bg-[#232942] text-yellow-200 hover:bg-yellow-400/80 hover:text-black'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* ----- EDIT MODAL ----- */}
      <Modal show={editModal.open} onClose={closeEditModal}>
        <h3 className="text-2xl font-bold mb-4 text-gray-700 text-center">ແກ້ໄຂສິດທິ (Role)</h3>
        <div className="space-y-3">
          <div>
            <label className="block mb-1 text-gray-600">ສິດທິ (Role)</label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={editForm.role}
              onChange={e => setEditForm({ ...editForm, role: e.target.value })}
            >
              <option value="user">user</option>
              <option value="helper">helper</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={closeEditModal}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 transition"
            >
              ຍົກເລີກ
            </button>
            <button
              onClick={handleEditSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
            >
              ບັນທຶກ
            </button>
          </div>
        </div>
      </Modal>

      {/* ----- DELETE MODAL ----- */}
      <Modal show={deleteModal.open} onClose={closeDeleteModal}>
        <div className="text-center">
          <div className="text-2xl font-semibold mb-4 text-red-600">
            ຢືນຢັນການລຶບຂໍ້ມູນ
          </div>
          <div className="mb-6 text-gray-700">
            ຕ້ອງການລຶບຜູໃຊ້: <span className="font-bold">{deleteModal.row?.userId}</span> ຫຼືບໍ?
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 transition"
            >
              ຍົກເລີກ
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition"
            >
              ລຶບຂໍ້ມູນ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserList;
