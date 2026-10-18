import React from 'react';
import './Header.css';
import AppDropdown from '../ui/AppDropdown';

interface HeaderProps {
  onNewIdea?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewIdea }) => {
  const appOptions = [
    { id: 'find-device', name: 'Find device', icon: '📍' },
    { id: 'messages', name: 'Messages', icon: '✉️' },
    { id: 'contacts', name: 'Contacts', icon: '👤' },
    { id: 'notes', name: 'Notes', icon: '📝', isHighlighted: true },
    { id: 'recordings', name: 'Recordings', icon: '🎙️' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  const handleOptionSelect = (option: { id: string; name: string; icon: string }) => {
    console.log('Selected option:', option);
    // Handle navigation or other actions based on selected option
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <img src="/logo.svg" alt="BrainBox" className="header-logo" />
          <h1 className="header-title">
            <span className="product-main">BrainBox</span>
            <span className="product-separator"> | </span>
            <AppDropdown options={appOptions} onSelect={handleOptionSelect} />
          </h1>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <span className="user-name">Mehdi</span>
            <div className="avatar-container">
              <img src="/placeholder-avatar.png" alt="User" className="avatar" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;