import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <img src="/xiaomi-cloud-logo.png" alt="Xiaomi Cloud" />
        <h2>Xiaomi Cloud | Notes</h2>
      </div>
      
      <nav>
        <ul className="sidebar-menu">
          <li className="sidebar-menu-item">
            <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
              <span className="icon">📝</span> All notes
            </NavLink>
          </li>
          <li className="sidebar-menu-item">
            <NavLink to="/unclassified" className={({ isActive }) => isActive ? "active" : ""}>
              <span className="icon">📄</span> Unclassified
            </NavLink>
          </li>
        </ul>
        
        <div className="folders-header">
          <h3>Folders</h3>
          <button className="add-folder">+</button>
        </div>
        
        <ul className="folders-list">
          <li>Hidden notes</li>
          <li>Recently deleted notes</li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;