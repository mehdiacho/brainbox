import React, { useState, useEffect, useRef } from 'react';
import { ChevronsUpDown, Loader2 } from 'lucide-react';

export default function UploadButton({ type, icon, text, inputRef, loading }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const triggerUpload = (multiple) => {
        inputRef.current.dataset.uploadType = type;
        inputRef.current.accept = `${type}/*`;
        inputRef.current.multiple = multiple;
        inputRef.current.click();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex rounded-lg shadow-sm">
                <button onClick={() => triggerUpload(false)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-l-lg font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
                    <span>{text}</span>
                </button>
                <button onClick={() => setIsOpen(o => !o)} className="px-2 py-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-r-lg border-l border-gray-300">
                    <ChevronsUpDown size={16} />
                </button>
            </div>
            {isOpen && (
                 <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                    <button onClick={() => triggerUpload(false)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Upload Single</button>
                    <button onClick={() => triggerUpload(true)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Upload Multiple</button>
                 </div>
            )}
        </div>
    );
}