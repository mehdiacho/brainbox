import React from 'react';

interface HomePageProps {
  onNewIdea?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNewIdea }) => {
  // Sample notes data - in a real app, this would come from your database
  const notes = [
    {
      id: '1',
      title: 'Balance Sheet',
      date: '7/26/2024 11:18',
      lastEdited: '7/26/2024 11:18',
      content: 'Papa\n• P775 money from uncle enno\n• P400 starlink\n• P400 starlink\n• P400 starlink\n• P30 pet food',
      characters: '128'
    },
    {
      id: '2',
      title: 'Sure! Here\'s a longer set of question...',
      date: '5/6/2024 07:32',
      content: '1. What is my favorite genre of anime o...',
      isPinned: true
    },
    {
      id: '3',
      title: 'What is my favorite genre of anime o...',
      date: '9/28/2024 17:41',
      isPinned: true
    },
    {
      id: '4',
      title: '2024 highlights',
      date: '7/20/2024 12:56',
      isPinned: true
    }
  ];

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h2>All notes</h2>
        <span className="notes-count">Total notes: {notes.length}</span>
      </div>
      
      <ul className="notes-list">
        {notes.map(note => (
          <li key={note.id} className="note-item">
            <h3 className="note-title">{note.title}</h3>
            <div className="note-meta">
              <span className="note-date">{note.date}</span>
              {note.isPinned && <span>📌</span>}
            </div>
            {note.content && <p className="note-content">{note.content}</p>}
          </li>
        ))}
      </ul>
      
      <button className="add-note-button" onClick={onNewIdea}>+</button>
    </div>
  );
};

export default HomePage;