import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection, getDocs, updateDoc, doc
} from 'firebase/firestore';

const AssignIncidentTypesToTeams = () => {
  const [teams, setTeams] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);

  useEffect(() => {
    fetchTeams();
    fetchIncidentTypes();
  }, []);

  const fetchTeams = async () => {
    const snapshot = await getDocs(collection(db, 'helper_teams'));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      supportedTypes: doc.data().supportedTypes || []
    }));
    setTeams(data);
  };

  const fetchIncidentTypes = async () => {
    const snapshot = await getDocs(collection(db, 'incident_types'));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setIncidentTypes(data);
  };

  // ใช้ type.type ในการ save แต่ใช้ type.name ในการแสดงผล
  const toggleType = async (teamId, typeCode) => {
  const team = teams.find(t => t.id === teamId);
  const current = team.supportedTypes || [];
  const updated = current.includes(typeCode)
    ? current.filter(t => t !== typeCode)
    : [...current, typeCode];

  await updateDoc(doc(db, 'helper_teams', teamId), {
    supportedTypes: updated
  });

  setTeams(prev =>
    prev.map(t =>
      t.id === teamId ? { ...t, supportedTypes: updated } : t
    )
  );
};


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">📋 ກຳນົດປະເພດເຫດການທີ່ທີມຊ່ວຍເຫຼືອເຫັນໄດ້</h2>
      <table className="w-full border table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">ຊື່ທີມ</th>
            {incidentTypes.map(type => (
              <th key={type.id} className="border p-2 text-center">
                {/* ใช้ชื่อ type.name ในการแสดงผล */}
                {type.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team.id} className="text-center hover:bg-gray-50">
              <td className="border p-2 text-left font-semibold">{team.name}</td>
              {incidentTypes.map(type => (
                
                <td key={type.id} className="border p-2">
                  <input
                    type="checkbox"
                    // ใช้ type.type ในการเช็คและบันทึก
                    checked={team.supportedTypes.includes(type.type)}
                    onChange={() => toggleType(team.id, type.type)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssignIncidentTypesToTeams;
