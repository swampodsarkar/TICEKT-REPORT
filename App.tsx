
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import TicketHub from './components/TicketHub';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; adminId: string } | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('ticketHubUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('ticketHubUser');
    }
  }, []);

  const handleLogin = (username: string, adminId: string) => {
    const userData = { username, adminId };
    localStorage.setItem('ticketHubUser', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('ticketHubUser');
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen font-sans">
      {isLoggedIn && user ? <TicketHub user={user} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />}
    </div>
  );
};

export default App;
