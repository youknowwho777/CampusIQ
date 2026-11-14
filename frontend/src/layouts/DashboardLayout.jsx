// Dashboard layout container with persistent sidebar and topbar
import React from 'react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = ({ children, onSearch }) => {
  return (
    <div className="campusiq-layout dashboard-layout-root">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="campusiq-main-wrapper dashboard-layout-main">
        <Navbar onSearch={onSearch} />
        <main className="campusiq-content-body dashboard-layout-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
