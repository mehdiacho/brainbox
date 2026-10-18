import React, { useState, useRef, useEffect } from 'react';
import './AppDropdown.css';

interface AppOption {
  id: string;
  name: string;
  icon: string;
  isHighlighted?: boolean;
}

interface AppDropdownProps {
  options: AppOption[];
  onSelect: (option: AppOption) => void;
}

const AppDropdown: React.FC<AppDropdownProps> = ({ options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option: AppOption) => {
    onSelect(option);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="app-dropdown" ref={dropdownRef}>
         <span className="dropdown-toggle" onClick={toggleDropdown}>
            Notes
            <i className="dropdown-arrow"/>
             </span>
         
      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-grid">
            {options.map((option) => (
              <div 
                key={option.id} 
                className={`dropdown-option ${option.isHighlighted ? 'highlighted' : ''}`}
                onClick={() => handleOptionClick(option)}
              >
                <div className="option-icon">{option.icon}</div>
                <div className="option-name">{option.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppDropdown;