import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseService } from './services/FirebaseService';
import { ToastProvider } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CategoryProvider } from './context/CategoryContext';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import SmartScan from './components/SmartScan/SmartScan';
import TransactionHistory from './components/Transactions/TransactionHistory';
import AccountManager from './components/Accounts/AccountManager';
import ChatAuditor from './components/ChatAuditor/ChatAuditor';
import Login from './components/Auth/Login';
import SettingsPage from './components/Settings/SettingsPage';
import AdminPanel from './components/Admin/AdminPanel';
import { ThemeProvider } from './context/ThemeContext';
import { BrandingProvider } from './context/BrandingContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem('sidebarCollapsed') !== 'false'
  );

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState);
  };

  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToAuthChanges((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ThemeProvider>
        <BrandingProvider user={user}>
          <CurrencyProvider>
            <CategoryProvider user={user}>
              <Router>
                <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
                  {!user ? (
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                  ) : (
                    <SubscriptionProvider user={user}>
                      <div className="flex">
                        <Sidebar user={user} isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
                        {/* Main content: padding for mobile header/bottom nav, left margin for desktop sidebar */}
                        <main className={`flex-1 min-h-screen pt-16 pb-20 md:pt-0 md:pb-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} p-4 md:p-6 overflow-x-hidden`}>
                          <Routes>
                            <Route path="/" element={<Dashboard user={user} />} />
                            <Route path="/scan" element={<SmartScan user={user} />} />
                            <Route path="/transactions" element={<TransactionHistory user={user} />} />
                            <Route path="/accounts" element={<AccountManager user={user} />} />
                            <Route path="/assistant" element={<ChatAuditor user={user} />} />
                            <Route path="/settings" element={<SettingsPage user={user} />} />
                            <Route path="/admin" element={<AdminPanel user={user} />} />
                            <Route path="*" element={<Navigate to="/" />} />
                          </Routes>
                        </main>
                      </div>
                    </SubscriptionProvider>
                  )}
                </div>
              </Router>
            </CategoryProvider>
          </CurrencyProvider>
        </BrandingProvider>
      </ThemeProvider>
    </ToastProvider>
  );
};

export default App;

