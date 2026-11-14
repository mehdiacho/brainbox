import React, { useState, useEffect, useRef } from 'react';
import { FileText, Mic, Sparkles, Wand2, Loader2 } from 'lucide-react';

export default function AIPopover({ onSelect, features, loading, small, isIcon = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    const featureMap = {
        title: { text: 'Suggest Title', icon: <Wand2 size={16}/> },
        summary: { text: 'Append Summary', icon: <FileText size={16}/> },
        takeaways: { text: 'Append Takeaways', icon: <FileText size={16}/> },
        description: { text: 'Describe & Tag', icon: <Sparkles size={16}/> },
        transcribe: { text: 'Transcribe', icon: <Mic size={16}/> },
    };

    const handleButtonClick = (e) => {
        e.stopPropagation();
        setIsOpen(o => !o);
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button onClick={handleButtonClick} className="group relative w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all">
                <Sparkles size={20} />
                {!isIcon && <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AI Actions</span>}
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-30 border flex flex-col gap-1 p-1">
                    {features.map(feature => (
                        <button key={feature} onClick={() => { onSelect(feature); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 rounded-md" disabled={loading?.[feature]}>
                            {loading?.[feature] ? <Loader2 size={16} className="animate-spin"/> : featureMap[feature].icon}
                            {featureMap[feature].text}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}