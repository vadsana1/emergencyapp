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
  deleteDoc,
} from 'firebase/firestore';

const PAGE_SIZE = 10;

const columnHeaders = [
  "ລຳດັບ",
  "Incident ID",
  "ຊື່",
  "ອາຍຸ",
  "ເພດ",
  "ລາຍລະອຽດການບາດເຈັບ",
  "ເບີໂທ",
  "ສະຖານະ",
  "ວັນເວລາ",
  "ຈັດການຂໍ້ມູນ"
];

// Modal component
function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
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

const IncidentVictimsTable = () => {
  const [victims, setVictims] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal State
  const [editModal, setEditModal] = useState({ open: false, row: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, row: null });
  // Edit form state (เพิ่ม victimStatus)
  const [editForm, setEditForm] = useState({
    name: '', age: '', gender: '', injuryDetail: '', victimStatus: ''
  });
  // Search/filter
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchTotal = async () => {
      const snapshot = await getDocs(collection(db, 'incident_victims'));
      setTotal(snapshot.size);
    };
    fetchTotal();
  }, []);

  useEffect(() => {
    const fetchVictims = async () => {
      let q = query(
        collection(db, 'incident_victims'),
        orderBy('incidentId'),
        limit(PAGE_SIZE)
      );
      if (page > 1 && lastDoc) {
        q = query(
          collection(db, 'incident_victims'),
          orderBy('incidentId'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }
      const snapshot = await getDocs(q);
      let rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (searchText.trim()) {
        rows = rows.filter(
          row =>
            (row.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (row.incidentId || '').toLowerCase().includes(searchText.toLowerCase())
        );
      }
      setVictims(rows);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    };
    fetchVictims();
    // eslint-disable-next-line
  }, [page, editModal.open, deleteModal.open, searchText]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ------- Modal Handlers -------
  const openEditModal = (row) => {
    setEditForm({
      name: row.name || '',
      age: row.age || '',
      gender: row.gender || '',
      injuryDetail: row.injuryDetail || '',
      victimStatus: row.victimStatus || '',
    });
    setEditModal({ open: true, row });
  };
  const closeEditModal = () => setEditModal({ open: false, row: null });
  const openDeleteModal = (row) => setDeleteModal({ open: true, row });
  const closeDeleteModal = () => setDeleteModal({ open: false, row: null });

  // ------- Update / Delete logic -------
  const handleEditSave = async () => {
    if (!editModal.row) return;
    try {
      await updateDoc(doc(db, 'incident_victims', editModal.row.id), {
        name: editForm.name,
        age: editForm.age,
        gender: editForm.gender,
        injuryDetail: editForm.injuryDetail,
        victimStatus: editForm.victimStatus,
      });
      closeEditModal();
    } catch (e) {
      alert('ເກີດຂໍ້ຜິດພາດ');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.row) return;
    try {
      await deleteDoc(doc(db, 'incident_victims', deleteModal.row.id));
      closeDeleteModal();
    } catch (e) {
      alert('ເກີດຂໍ້ຜິດພາດ');
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-8">
      <div className="bg-[#22263a] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-6 sm:py-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 text-center">
            ຂໍ້ມູນຜູ້ເກີດອຸບັດເຫດ
          </h2>
          <div className="mb-5 flex flex-col md:flex-row gap-3 md:gap-6 md:items-center md:justify-between">
            <input
              className="bg-[#1a1d2e] border border-[#30344d] px-4 py-2 rounded-xl w-full md:w-80 text-white text-lg focus:outline-none placeholder-gray-400 shadow"
              placeholder="ຄົ້ນຫາຊື່ ຫຼື Incident ID"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
          <div className="rounded-xl overflow-x-auto bg-[#23263a] shadow-inner ring-1 ring-[#31344e]/50">
            <table className="min-w-[900px] w-full text-base">
              <thead>
                <tr className="bg-[#29304b]">
                  {columnHeaders.map((col, idx) => (
                    <th
                      key={idx}
                      className="py-3 px-4 text-base font-bold text-white text-center whitespace-nowrap border-b border-[#2b304b]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {victims.length === 0 ? (
                  <tr>
                    <td colSpan={columnHeaders.length} className="text-center py-8 text-white/60">
                      ບໍ່ພົບຂໍ້ມູນ
                    </td>
                  </tr>
                ) : (
                  victims.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#171828]/80 border-b border-[#23263a] last:border-0 transition"
                    >
                      <td className="py-2 px-4 text-center text-white">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="py-2 px-4 text-center text-white">{row.incidentId}</td>
                      <td className="py-2 px-4 text-center text-white">{row.name}</td>
                      <td className="py-2 px-4 text-center text-white">{row.age}</td>
                      <td className="py-2 px-4 text-center text-white">{row.gender}</td>
                      <td className="py-2 px-4 text-center text-white">{row.injuryDetail}</td>
                      <td className="py-2 px-4 text-center text-white">{row.phone || '-'}</td>
                      <td className="py-2 px-4 text-center text-white">{row.victimStatus || '-'}</td>
                      <td className="py-2 px-4 text-center text-white">
                        {row.timestamp
                          ? typeof row.timestamp === 'object' && row.timestamp.seconds
                            ? new Date(row.timestamp.seconds * 1000).toLocaleString('lo-LA')
                            : new Date(row.timestamp).toLocaleString('lo-LA')
                          : '-'}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEditModal(row)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl px-3 py-1 text-sm font-semibold shadow transition"
                          >
                            ແກ້ໄຂ
                          </button>
                          <button
                            onClick={() => openDeleteModal(row)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-3 py-1 text-sm font-semibold shadow transition"
                          >
                            ລົບ
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
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#282c46] text-blue-200 hover:bg-blue-800/80 hover:text-white'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ----- EDIT MODAL ----- */}
      <Modal show={editModal.open} onClose={closeEditModal}>
        <h3 className="text-2xl font-bold mb-4 text-gray-700 text-center">ແກ້ໄຂຂໍ້ມູນ</h3>
        <div className="space-y-3">
          <div>
            <label className="block mb-1 text-gray-600">ຊື່</label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600">ອາຍຸ</label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              type="number"
              value={editForm.age}
              onChange={e => setEditForm({ ...editForm, age: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600">ເພດ</label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded-xl focus:outline-none"
              value={editForm.gender}
              onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
            >
              <option value="">ເລືອກເພດ</option>
              <option value="ຊາຍ">ຊາຍ</option>
              <option value="ຍິງ">ຍິງ</option>
              <option value="ອື່ນໆ">ອື່ນໆ</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600">ລາຍລະອຽດການບາດເຈັບ</label>
            <input
              className="w-full border border-gray-300 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={editForm.injuryDetail}
              onChange={e => setEditForm({ ...editForm, injuryDetail: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600">ສະຖານະ</label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded-xl focus:outline-none"
              value={editForm.victimStatus}
              onChange={e => setEditForm({ ...editForm, victimStatus: e.target.value })}
            >
              <option value="">ເລືອກສະຖານະ</option>
              <option value="ເສຍຊີວິດ">ເສຍຊີວິດ</option>
              <option value="ບາດເຈັບ">ບາດເຈັບ</option>
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
            ຢືນຢັນການລົບຂໍ້ມູນ
          </div>
          <div className="mb-6 text-gray-700">
            ທ່ານຕ້ອງການລົບ Incident ID: <span className="font-bold">{deleteModal.row?.incidentId}</span> ຫຼືບໍ່?
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
              ລົບຂໍ້ມູນ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IncidentVictimsTable;
