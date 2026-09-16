import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { InventoryPage } from './pages/InventoryPage';
import { TransfersPage } from './pages/TransfersPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { BranchesPage } from './pages/BranchesPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-body)',
        }}
      >
        <div className="pulse-indicator" style={{ width: '24px', height: '24px' }} />
        <div style={{ marginTop: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Cargando NexusPOS Cloud...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigateToTab={setActiveTab} />;
      case 'pos':
        return <POSPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'transfers':
        return <TransfersPage />;
      case 'sales':
        return <SalesHistoryPage />;
      case 'branches':
        return <BranchesPage />;
      default:
        return <DashboardPage onNavigateToTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Header />
        <main style={{ flex: 1 }}>{renderActiveView()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
