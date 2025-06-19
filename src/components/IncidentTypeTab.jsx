import React, { useEffect, useState } from 'react';
import { db, storage } from '../firebase';
import {
  collection, getDocs, setDoc, updateDoc, deleteDoc, doc, query
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const getNextIncidentTypeId = async () => {
  const q = query(collection(db, 'incident_types'));
  const querySnapshot = await getDocs(q);
  const ids = querySnapshot.docs
    .map(doc => doc.id)
    .filter(id => /^idt\d{3}$/.test(id));
  let maxNum = 0;
  ids.forEach(id => {
    const num = parseInt(id.substring(3), 10);
    if (num > maxNum) maxNum = num;
  });
  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  return `idt${nextNum}`;
};

const IncidentTypeTab = () => {
  const [incidentTypes, setIncidentTypes] = useState([]);
  // Modal state...
  const [showAddIncidentModal, setShowAddIncidentModal] = useState(false);
  const [newIncidentType, setNewIncidentType] = useState({ type: '', name: '', imageFile: null });
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [adding, setAdding] = useState(false);

  const [showEditIncidentModal, setShowEditIncidentModal] = useState(false);
  const [editIncident, setEditIncident] = useState(null);

  const [showDeleteIncidentModal, setShowDeleteIncidentModal] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState(null);

  useEffect(() => { fetchIncidentTypes(); }, []);

  const fetchIncidentTypes = async () => {
    const q = query(collection(db, 'incident_types'));
    const querySnapshot = await getDocs(q);
    setIncidentTypes(querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  };

  // ... (code ส่วนฟังก์ชัน modal, add, edit, delete ไม่เปลี่ยน)

  // ----- Modal, Add, Edit, Delete function as before -----
  // ... (skip code block, ไม่เปลี่ยน!)

  // ----- UI -----
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 max-w-3xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 text-center sm:text-left">
        ⚙️ ຈັດການປະເພດເຫດການ
      </h2>
      <button
        className="mb-4 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-base font-medium transition"
        onClick={() => {
          setShowAddIncidentModal(true);
          setNewIncidentType({ type: '', name: '', imageFile: null });
          setAddImagePreview(null);
        }}
      >
        + ເພີ່ມປະເພດເຫດການ
      </button>

      {/* Scrollable Table */}
      <div className="overflow-x-auto rounded">
        <table className="min-w-full border border-gray-300 text-xs sm:text-sm">
          <thead className="bg-green-100">
            <tr>
              <th className="px-2 sm:px-4 py-2 border text-left whitespace-nowrap">ID</th>
              <th className="px-2 sm:px-4 py-2 border text-left whitespace-nowrap">ລະຫັດ</th>
              <th className="px-2 sm:px-4 py-2 border text-left whitespace-nowrap">ຊື່ປະເພດ</th>
              <th className="px-2 sm:px-4 py-2 border text-left whitespace-nowrap">ຮູບ</th>
              <th className="px-2 sm:px-4 py-2 border text-center whitespace-nowrap">ຈັດການ</th>
            </tr>
          </thead>
          <tbody>
            {incidentTypes.map(incident => (
              <tr key={incident.id} className="hover:bg-green-50 transition">
                <td className="px-2 sm:px-4 py-2 border font-mono">{incident.id}</td>
                <td className="px-2 sm:px-4 py-2 border">{incident.type}</td>
                <td className="px-2 sm:px-4 py-2 border">{incident.name}</td>
                <td className="px-2 sm:px-4 py-2 border">
                  {incident.imageUrl
                    ? <img src={incident.imageUrl} alt={incident.name} className="w-10 h-10 object-cover rounded" />
                    : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-2 sm:px-4 py-2 border text-center space-x-1">
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs sm:text-sm"
                    onClick={() => {
                      setEditIncident({ ...incident, imageFile: null, imagePreview: incident.imageUrl || null });
                      setShowEditIncidentModal(true);
                    }}
                  >ແກ້ໄຂ</button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs sm:text-sm"
                    onClick={() => {
                      setIncidentToDelete(incident);
                      setShowDeleteIncidentModal(true);
                    }}
                  >ລົບ</button>
                </td>
              </tr>
            ))}
            {incidentTypes.length === 0 && (
              <tr>
                <td colSpan={5} className="text-gray-500 text-center py-4">ບໍ່ມີຂໍ້ມູນ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ------- Add Modal ------- */}
      {showAddIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-[95vw] max-w-xs sm:max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl"
              onClick={() => setShowAddIncidentModal(false)}
            >×</button>
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-center">ເພີ່ມປະເພດເຫດການ</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              // ...handleAddIncidentType logic...
              if (!newIncidentType.type.trim() || !newIncidentType.name.trim()) return;
              setAdding(true);
              const nextId = await getNextIncidentTypeId();

              let imageUrl = '';
              if (newIncidentType.imageFile) {
                const imageRef = ref(storage, `incident_type_images/${nextId}`);
                await uploadBytes(imageRef, newIncidentType.imageFile);
                imageUrl = await getDownloadURL(imageRef);
              }
              await setDoc(doc(db, 'incident_types', nextId), {
                id: nextId,
                type: newIncidentType.type.trim(),
                name: newIncidentType.name.trim(),
                imageUrl: imageUrl
              });
              setAdding(false);
              setShowAddIncidentModal(false);
              fetchIncidentTypes();
            }} className="space-y-3">
              <div>
                <label className="block text-gray-700 mb-1">ລະຫັດປະເພດ</label>
                <input className="border px-3 py-2 rounded w-full"
                  placeholder="ລະຫັດປະເພດ"
                  value={newIncidentType.type}
                  onChange={e => setNewIncidentType({ ...newIncidentType, type: e.target.value })}
                  required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຊື່ປະເພດທີມຊ່ວຍເຫຼືອ</label>
                <input className="border px-3 py-2 rounded w-full"
                  placeholder="ຊື່ປະເພດ"
                  value={newIncidentType.name}
                  onChange={e => setNewIncidentType({ ...newIncidentType, name: e.target.value })}
                  required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຮູບປະເພດ (ไม่บังคับ)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    setNewIncidentType(prev => ({ ...prev, imageFile: file }));
                    setAddImagePreview(file ? URL.createObjectURL(file) : null);
                  }}
                  className="w-full"
                />
                {addImagePreview &&
                  <img src={addImagePreview} alt="preview" className="w-16 h-16 mt-2 object-cover rounded" />}
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
                <button type="button"
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setShowAddIncidentModal(false)}>ຍົກເລີກ</button>
                <button type="submit"
                  className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded ${adding ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={adding}>
                  {adding ? 'ກຳລັງບັນທຶກ...' : 'ເພີ່ມ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------- Edit Modal ------- */}
      {showEditIncidentModal && editIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-[95vw] max-w-xs sm:max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl"
              onClick={() => setShowEditIncidentModal(false)}
            >×</button>
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-center">ແກ້ໄຂປະເພດເຫດການ</h3>
            <form onSubmit={async e => {
              e.preventDefault();
              // ...handleSaveEditIncidentModal logic...
              if (!editIncident) return;

              let imageUrl = editIncident.imageUrl || '';
              if (editIncident.imageFile) {
                const imageRef = ref(storage, `incident_type_images/${editIncident.id}`);
                await uploadBytes(imageRef, editIncident.imageFile);
                imageUrl = await getDownloadURL(imageRef);
              }
              await updateDoc(doc(db, 'incident_types', editIncident.id), {
                type: editIncident.type,
                name: editIncident.name,
                imageUrl: imageUrl
              });
              setShowEditIncidentModal(false);
              setEditIncident(null);
              fetchIncidentTypes();
            }} className="space-y-3">
              <div>
                <label className="block text-gray-700 mb-1">ID</label>
                <input className="border px-3 py-2 rounded w-full bg-gray-100" value={editIncident.id} readOnly />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ລະຫັດປະເພດ</label>
                <input className="border px-3 py-2 rounded w-full" value={editIncident.type}
                  onChange={e => setEditIncident({ ...editIncident, type: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຊື່ປະເພດທີມຊ່ວຍເຫຼືອ</label>
                <input className="border px-3 py-2 rounded w-full" value={editIncident.name}
                  onChange={e => setEditIncident({ ...editIncident, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຮູບປະເພດ (แก้ไข)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    setEditIncident(prev => ({ ...prev, imageFile: file, imagePreview: file ? URL.createObjectURL(file) : prev.imageUrl }));
                  }}
                  className="w-full"
                />
                {editIncident.imagePreview &&
                  <img src={editIncident.imagePreview} alt="preview" className="w-16 h-16 mt-2 object-cover rounded" />}
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
                <button type="button"
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setShowEditIncidentModal(false)}>ຍົກເລີກ</button>
                <button type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">ບັນທຶກ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------- Delete Modal ------- */}
      {showDeleteIncidentModal && incidentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-[95vw] max-w-xs sm:max-w-sm relative text-center">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-red-600">ຢືນຢັນການລົບ</h3>
            <p className="mb-6">ຕ້ອງການລົບ <b>{incidentToDelete.name}</b> ຫຼືບໍ?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <button className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowDeleteIncidentModal(false)}>ຍົກເລີກ</button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={async () => {
                  await deleteDoc(doc(db, 'incident_types', incidentToDelete.id));
                  setShowDeleteIncidentModal(false);
                  setIncidentToDelete(null);
                  fetchIncidentTypes();
                }}>ລົບ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentTypeTab;
