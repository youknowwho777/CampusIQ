// Dashboard layout container with persistent sidebar and topbar
import React from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import './DashboardLayout.css';

const DashboardLayout = ({ children, onSearch }) => {
  return (
    <div className="campusiq-layout">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="campusiq-main-wrapper">
        <Navbar onSearch={onSearch} />
        <main className="campusiq-content-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
