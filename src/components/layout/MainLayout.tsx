import React, { useState } from 'react';
import Sidebar from './Sidebar';
import IdeaForm from '../ui/IdeaForm';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const handleNewIdea = () => {
    setShowIdeaForm(true);
  };

  const handleSaveIdea = (idea: any) => {
    // In a real app, you would save the idea to your database
    console.log('Saving idea:', idea);
    // For now, we'll just log it to the console
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="app-main">
        <header className="app-header">
          <div className="header-left">
            <h1 className="header-title">All notes</h1>
          </div>
          <div className="header-right">
            <button 
              className="view-toggle"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? '☰' : '⊞'}
            </button>
            <button className="search-button">🔍</button>
          </div>
        </header>
        
        <main className="notes-content">
          {React.cloneElement(children as React.ReactElement, { onNewIdea: handleNewIdea })}
        </main>
      </div>

      <IdeaForm 
        show={showIdeaForm} 
        onHide={() => setShowIdeaForm(false)} 
        onSave={handleSaveIdea} 
      />
    </div>
  );
};

export default MainLayout;