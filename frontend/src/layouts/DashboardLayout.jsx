// Authenticated dashboard layout with persistent sidebar and topbar
import React from 'react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout-root">
      <Sidebar />
      <div className="dashboard-layout-main">
        <Navbar />
        <main className="dashboard-layout-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
