import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Header from './components/Header';
import MonthTabs from './components/MonthTabs';
import Legend from './components/Legend';
import ClientPanel from './components/ClientPanel';
import BillingForm from './components/BillingForm';
import Toast from './components/Toast';
import Modals from './components/Modals';
import ReportsPanel from './components/ReportsPanel';
import './styles/App.css';

function AppContent() {
  const { activeModal, closeModal } = useApp();

  return (
    <>
      <div className="container">
        <Header />
        <MonthTabs />
        <Legend />
        <div className="content-grid">
          <ClientPanel />
          <BillingForm />
        </div>
        <Toast />
        <Modals />
      </div>
      {activeModal === 'reports' && <ReportsPanel onClose={closeModal} />}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
