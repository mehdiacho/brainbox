import React from 'react';

interface UnclassifiedPageProps {
  onNewIdea?: () => void;
}

const UnclassifiedPage: React.FC<UnclassifiedPageProps> = ({ onNewIdea }) => {
  return (
    <div className="notes-container">
      <div className="notes-header">
        <h2>Unclassified</h2>
        <span className="notes-count">Total notes: 0</span>
      </div>
      
      <div className="empty-notes">
        <p>No unclassified notes yet.</p>
      </div>
      
      <button className="add-note-button" onClick={onNewIdea}>+</button>
    </div>
  );
};

export default UnclassifiedPage;