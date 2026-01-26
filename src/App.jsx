import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseService } from './services/FirebaseService';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import SmartScan from './components/SmartScan/SmartScan';
import TransactionHistory from './components/Transactions/TransactionHistory';
import AccountManager from './components/Accounts/AccountManager';
import ChatAuditor from './components/ChatAuditor/ChatAuditor';
import Login from './components/Auth/Login';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToAuthChanges((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        {!user ? (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        ) : (
          <div className="flex">
            <Sidebar user={user} />
            {/* Main content: padding for mobile header/bottom nav, left margin for desktop sidebar */}
            <main className="flex-1 min-h-screen pt-16 pb-20 md:pt-0 md:pb-0 md:ml-64 md:p-6">
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/scan" element={<SmartScan user={user} />} />
                <Route path="/transactions" element={<TransactionHistory user={user} />} />
                <Route path="/accounts" element={<AccountManager user={user} />} />
                <Route path="/assistant" element={<ChatAuditor user={user} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
