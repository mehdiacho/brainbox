import React, { useState, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import IdeaListPage from './pages/IdeaListPage';
import IdeaDetailPage from './pages/IdeaDetailPage';
import SettingsPage from './pages/SettingsPage';
import * as ideaService from './services/ideaService';

export default function App() {
    return (
        <AuthProvider>
            <IdeaSpaceApp />
        </AuthProvider>
    );
}

function IdeaSpaceApp() {
    const [page, setPage] = useState('list');
    const [ideas, setIdeas] = useState([]);
    const [selectedIdea, setSelectedIdea] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = React.useContext(AuthContext);

    useEffect(() => {
        if (user) {
            ideaService.getIdeas(user.uid).then(setIdeas);
        } else {
            try {
                const localData = localStorage.getItem('ideas-guest-data');
                if (localData) setIdeas(JSON.parse(localData));
            } catch (error) {
                console.error("Could not load local data", error);
                setIdeas([]);
            }
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            localStorage.setItem('ideas-guest-data', JSON.stringify(ideas));
        }
    }, [ideas, user]);

    const navigateTo = (pageName, idea = null) => {
        setPage(pageName);
        setSelectedIdea(idea);
    };
    
    const handleCreateIdea = () => {
        const newIdea = { 
            id: Date.now(), 
            title: 'Untitled Idea', 
            note: '# My New Idea\n\nStart writing here...', 
            date: new Date().toISOString(), 
            media: [],
        };
        if (user) ideaService.saveIdea(user.uid, newIdea);
        setIdeas(prev => [newIdea, ...prev]);
        navigateTo('detail', newIdea);
    };
    
    const handleUpdateIdea = (updater) => {
        const ideaIdToUpdate = selectedIdea.id;
        setIdeas(prevIdeas => {
            const newIdeas = prevIdeas.map(i => {
                if (i.id === ideaIdToUpdate) {
                    const updatedIdea = typeof updater === 'function' ? updater(i) : updater;
                    if (user) ideaService.saveIdea(user.uid, updatedIdea);
                    if (selectedIdea && selectedIdea.id === updatedIdea.id) {
                        setSelectedIdea(updatedIdea);
                    }
                    return updatedIdea;
                }
                return i;
            });
            return newIdeas;
        });
    };

    const handleDeleteIdea = (id) => {
        if (user) ideaService.deleteIdea(user.uid, id);
        setIdeas(prev => prev.filter(i => i.id !== id));
        navigateTo('list');
    };

    const handleImport = (importedIdeas) => {
        if (user) ideaService.importIdeas(user.uid, importedIdeas);
        const combined = [...ideas, ...importedIdeas];
        const uniqueMap = new Map(combined.map(item => [item.id, item]));
        setIdeas(Array.from(uniqueMap.values()));
        alert(`${importedIdeas.length} ideas imported successfully!`);
    };
    
    const getMatchContextForIdea = (idea) => {
        if (!searchTerm) return null;
        const term = searchTerm.toLowerCase();
        if (idea.note?.toLowerCase().includes(term)) return `Found in note`;
        for (const m of idea.media) {
            if (m.name?.toLowerCase().includes(term)) return `Found in media title: ${m.name}`;
            if (m.description?.toLowerCase().includes(term)) return `Found in media description`;
            if (m.transcription?.toLowerCase().includes(term)) return `Found in transcription`;
            if (m.tags?.some(tag => tag.toLowerCase().includes(term))) return `Found in media tags`;
        }
        return null;
    };

    const filteredIdeas = ideas.filter(idea =>
        !searchTerm ||
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMatchContextForIdea(idea)
    );

    const mainContent = () => {
        switch(page) {
            case 'list':
                return <IdeaListPage ideas={filteredIdeas} navigateTo={navigateTo} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onImport={handleImport} onCreateIdea={handleCreateIdea} getMatchContext={getMatchContextForIdea} />;
            case 'detail':
                return selectedIdea && <IdeaDetailPage idea={selectedIdea} navigateTo={navigateTo} onDelete={handleDeleteIdea} onUpdate={handleUpdateIdea} />;
            case 'settings':
                return user ? <SettingsPage navigateTo={navigateTo} /> : <LoginPage navigateTo={navigateTo} />;
            case 'login':
                return <LoginPage navigateTo={navigateTo} />;
            default:
                return <IdeaListPage ideas={filteredIdeas} navigateTo={navigateTo} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onImport={handleImport} onCreateIdea={handleCreateIdea} getMatchContext={getMatchContextForIdea} />;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-800">
            <div className="max-w-7xl mx-auto">
                <Header navigateTo={navigateTo} />
                <main className="p-4 sm:p-6 lg:p-8">
                    {mainContent()}
                </main>
            </div>
        </div>
    );
}