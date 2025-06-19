import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection, getDocs, setDoc, updateDoc, deleteDoc, doc, query
} from 'firebase/firestore';

const getNextTeamTypeId = async () => {
  const q = query(collection(db, 'helper_teams'));
  const querySnapshot = await getDocs(q);
  const ids = querySnapshot.docs
    .map(doc => doc.id)
    .filter(id => /^ht\d{3}$/.test(id));
  let maxNum = 0;
  ids.forEach(id => {
    const num = parseInt(id.substring(2), 10);
    if (num > maxNum) maxNum = num;
  });
  const nextNum = (maxNum + 1).toString().padStart(3, '0');
  return `ht${nextNum}`;
};

const TeamTypeTab = () => {
  const [teamTypes, setTeamTypes] = useState([]);

  // Modal: เพิ่ม
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamType, setNewTeamType] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [adding, setAdding] = useState(false);

  // Modal: แก้ไข/ลบ
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  useEffect(() => {
    fetchTeamTypes();
  }, []);

  const fetchTeamTypes = async () => {
    const q = query(collection(db, 'helper_teams'));
    const querySnapshot = await getDocs(q);
    setTeamTypes(querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  };

  // Modal เพิ่ม
  const handleOpenAddTeamModal = () => {
    setNewTeamType('');
    setNewTeamName('');
    setShowAddTeamModal(true);
  };
  const handleCloseAddTeamModal = () => {
    setShowAddTeamModal(false);
    setNewTeamType('');
    setNewTeamName('');
    setAdding(false);
  };
  const handleAddTeamType = async (e) => {
    e.preventDefault();
    if (!newTeamType.trim() || !newTeamName.trim()) return;
    setAdding(true);
    const nextId = await getNextTeamTypeId();
    await setDoc(doc(db, 'helper_teams', nextId), {
      id: nextId,
      type: newTeamType.trim(),
      name: newTeamName.trim()
    });
    setAdding(false);
    handleCloseAddTeamModal();
    fetchTeamTypes();
  };

  // Edit Modal
  const handleOpenEditTeamModal = (team) => {
    setEditTeam({ ...team });
    setShowEditTeamModal(true);
  };
  const handleCloseEditTeamModal = () => {
    setEditTeam(null);
    setShowEditTeamModal(false);
  };
  const handleSaveEditTeamModal = async () => {
    if (!editTeam) return;
    await updateDoc(doc(db, 'helper_teams', editTeam.id), {
      type: editTeam.type.trim(),
      name: editTeam.name.trim()
    });
    setShowEditTeamModal(false);
    setEditTeam(null);
    fetchTeamTypes();
  };

  // Delete Modal
  const handleAskDeleteTeam = (team) => {
    setTeamToDelete(team);
    setShowDeleteTeamModal(true);
  };
  const handleCancelDeleteTeam = () => {
    setShowDeleteTeamModal(false);
    setTeamToDelete(null);
  };
  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    await deleteDoc(doc(db, 'helper_teams', teamToDelete.id));
    setShowDeleteTeamModal(false);
    setTeamToDelete(null);
    fetchTeamTypes();
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        ⚙️ ຈັດການປະເພດທີມຊ່ວຍເຫຼືອ
      </h2>
      <button
        className="mb-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        onClick={handleOpenAddTeamModal}
      >
        + ເພີ່ມປະເພດທີມຊ່ວຍເຫຼືອ
      </button>
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-green-100">
          <tr>
            <th className="px-4 py-2 border text-left">ID (doc id)</th>
            <th className="px-4 py-2 border text-left">ລະຫັດປະເພດ (type)</th>
            <th className="px-4 py-2 border text-left">ຊື່ປະເພດທີມຊ່ວຍເຫຼືອ (name)</th>
            <th className="px-4 py-2 border text-center">ການດຳເນີນງານ</th>
          </tr>
        </thead>
        <tbody>
          {teamTypes.map(team => (
            <tr key={team.id}>
              <td className="px-4 py-2 border">{team.id}</td>
              <td className="px-4 py-2 border">{team.type}</td>
              <td className="px-4 py-2 border">{team.name}</td>
              <td className="px-4 py-2 border text-center space-x-2">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  onClick={() => handleOpenEditTeamModal(team)}>ແກ້ໄຂ</button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => handleAskDeleteTeam(team)}>ລົບ</button>
              </td>
            </tr>
          ))}
          {teamTypes.length === 0 && (
            <tr>
              <td colSpan={4} className="text-gray-500 text-center py-4">ບໍ່ມີຂໍ້ມູນ</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Add Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
              onClick={handleCloseAddTeamModal}
            >×</button>
            <h3 className="text-xl font-bold mb-4 text-center">ເພີ່ມປະເພດທີມຊ່ວຍເຫຼືອ</h3>
            <form onSubmit={handleAddTeamType} className="space-y-3">
              <div>
                <label className="block text-gray-700 mb-1">ລະຫັດປະເພດ</label>
                <input className="border px-3 py-2 rounded w-full"
                  placeholder="ລະຫັດປະເພດ"
                  value={newTeamType}
                  onChange={e => setNewTeamType(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຊື່ປະເພດທີມຊ່ວຍເຫຼືອ</label>
                <input className="border px-3 py-2 rounded w-full"
                  placeholder="ຊື່ປະເພດທີມ"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end pt-3">
                <button type="button"
                  className="mr-2 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={handleCloseAddTeamModal}>ຍົກເລີກ</button>
                <button type="submit"
                  className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded ${adding ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={adding}
                >
                  {adding ? 'ກຳລັງບັນທຶກ...' : 'ເພີ່ມ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditTeamModal && editTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
              onClick={handleCloseEditTeamModal}
            >×</button>
            <h3 className="text-xl font-bold mb-4 text-center">ແກ້ໄຂປະເພດທີມ</h3>
            <form onSubmit={e => { e.preventDefault(); handleSaveEditTeamModal(); }} className="space-y-3">
              <div>
                <label className="block text-gray-700 mb-1">ID</label>
                <input className="border px-3 py-2 rounded w-full bg-gray-100" value={editTeam.id} readOnly />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ລະຫັດປະເພດ</label>
                <input className="border px-3 py-2 rounded w-full" value={editTeam.type}
                  onChange={e => setEditTeam({ ...editTeam, type: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ຊື່ປະເພດທີມຊ່ວຍເຫຼືອ</label>
                <input className="border px-3 py-2 rounded w-full" value={editTeam.name}
                  onChange={e => setEditTeam({ ...editTeam, name: e.target.value })} required />
              </div>
              <div className="flex justify-end pt-3">
                <button type="button"
                  className="mr-2 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={handleCloseEditTeamModal}>ຍົກເລີກ</button>
                <button type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">ບັນທຶກ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteTeamModal && teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm relative text-center">
            <h3 className="text-xl font-bold mb-4 text-red-600">ຢືນຢັນການລົບ</h3>
            <p className="mb-6">ຕ້ອງການລົບ <b>{teamToDelete.name}</b> ຫຼືບໍ?</p>
            <div className="flex justify-center gap-3">
              <button className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={handleCancelDeleteTeam}>ຍົກເລີກ</button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={handleConfirmDeleteTeam}>ລົບ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamTypeTab;
