import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ActionButton({ icon, text, onClick, destructive = false, loading = false, small = false, disabled = false, title = '' }) {
    const sizeClasses = small ? "px-3 py-1.5 text-sm" : "px-4 py-2";
    const baseClasses = `flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`;
    const themeClasses = destructive 
        ? "bg-red-50 text-red-700 hover:bg-red-100"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200";

    return (
        <button onClick={onClick} className={`${baseClasses} ${themeClasses}`} disabled={loading || disabled} title={title}>
            {loading ? <Loader2 size={small ? 16 : 18} className="animate-spin" /> : icon}
            <span>{text}</span>
        </button>
    );
}