import React from 'react';
import './App.css';
import Header from './components/layout/Header';

function App() {
  return (
    <div className="app-container">
      <Header />
      <div className="app-content">
        {/* We'll add the rest of the app structure later */}
        <div className="placeholder-content">
          <p>Content will be added step by step</p>
        </div>
      </div>
    </div>
  );
}

export default App;
