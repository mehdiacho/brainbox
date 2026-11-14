import React, { useState, useRef } from 'react';
import { Search, UploadCloud, Download, BrainCircuit, Plus } from 'lucide-react';
import ActionButton from '../components/ActionButton';

export default function IdeaListPage({ ideas, navigateTo, searchTerm, setSearchTerm, onImport, onCreateIdea, getMatchContext }) {
    const [isExporting, setIsExporting] = useState(false);
    const importInputRef = useRef(null);

    const handleExport = async () => {
        if (ideas.length === 0) return alert("Nothing to export.");
        setIsExporting(true);
        try {
            const jsonString = JSON.stringify(ideas, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ideas_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Could not export ideas.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => importInputRef.current.click();
    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) onImport(data);
                else alert("Invalid file format.");
            } catch (error) {
                alert("Could not parse file.");
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    return (
        <div className="relative min-h-[calc(100vh-150px)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold text-gray-900">My Ideas</h2>
                <div className="flex gap-2">
                    <input type="file" ref={importInputRef} onChange={handleImportFile} className="hidden" accept=".json" />
                    <ActionButton icon={<UploadCloud size={18}/>} text="Import" onClick={handleImportClick} />
                    <ActionButton icon={<Download size={18}/>} text="Export All" onClick={handleExport} loading={isExporting} />
                </div>
            </div>
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Search all ideas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            
            {ideas.length === 0 ? (
                 <div className="text-center py-24">
                    <BrainCircuit size={48} className="mx-auto text-gray-400" />
                    <h3 className="mt-4 text-2xl font-bold text-gray-900">Your IdeaSpace is Empty</h3>
                    <p className="mt-2 text-gray-500">Click the '+' button to create your first idea.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {ideas.map((idea) => {
                        const matchContext = getMatchContext(idea);
                        return (
                        <div key={idea.id} onClick={() => navigateTo('detail', idea)} className="bg-white p-6 rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg hover:border-purple-400 transition-all transform hover:-translate-y-1">
                            <h3 className="font-bold text-lg text-gray-800 truncate">{idea.title}</h3>
                            <p className="text-gray-600 text-sm mt-2 h-10 overflow-hidden text-ellipsis">{idea.note.split('\n')[0].replace(/^[#*-\s]+/, '')}</p>
                            {matchContext && <p className="text-xs text-purple-600 mt-2 truncate">Match: {matchContext}</p>}
                            <p className="text-xs text-gray-400 mt-4">{new Date(idea.date).toLocaleDateString()}</p>
                        </div>
                    )})}
                </div>
            )}
            
            <button onClick={onCreateIdea} className="fixed bottom-8 right-8 bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-transform transform hover:scale-110 z-30">
                <Plus size={32} />
            </button>
        </div>
    );
}