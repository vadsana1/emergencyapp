import React, { useState } from 'react';
import HelperTab from './HelperTab';
import TeamTypeTab from './TeamTypeTab';
import IncidentTypeTab from './IncidentTypeTab';
import AssignIncidentTypesToTeams from './AssignIncidentTypesToTeams';

const HelperApproval = () => {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="min-h-screen bg-gray-100 p-6 pt-16">
      <div className="max-w-6xl mx-auto">
        {/* Main Tabs */}
        <div className="flex space-x-6 overflow-x-auto whitespace-nowrap max-w-full scrollbar-thin scrollbar-thumb-gray-600">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-6 py-2 rounded-full font-medium transition ${activeTab === 1 ? 'bg-blue-600 text-white shadow' : 'bg-white border text-gray-700'}`}>
            ຈັດການທີມຊ່ວຍເຫຼືອ
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`px-6 py-2 rounded-full font-medium transition ${activeTab === 2 ? 'bg-purple-600 text-white shadow' : 'bg-white border text-gray-700'}`}>
            ຈັດການປະເພດທີມຊ່ວຍເຫຼືອ
          </button>
          <button
            onClick={() => setActiveTab(3)}
            className={`px-6 py-2 rounded-full font-medium transition ${activeTab === 3 ? 'bg-yellow-500 text-white shadow' : 'bg-white border text-gray-700'}`}>
            ຈັດການປະເພດເຫດການ
          </button>
          <button
            onClick={() => setActiveTab(4)}
            className={`px-6 py-2 rounded-full font-medium transition ${activeTab === 4 ? 'bg-green-600 text-white shadow' : 'bg-white border text-gray-700'}`}>
            ກຳນົດປະເພດເຫດທີ່ທີມຮັບໄດ້
          </button>
        </div>
        {activeTab === 1 && <HelperTab />}
        {activeTab === 2 && <TeamTypeTab />}
        {activeTab === 3 && <IncidentTypeTab />}
        {activeTab === 4 && <AssignIncidentTypesToTeams />}
      </div>
    </div>
  );
};

export default HelperApproval;
