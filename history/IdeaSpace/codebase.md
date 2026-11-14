import React, { useState, useEffect, useRef } from 'react';
import { FileText, Settings, User, Search, Trash2, Play, Pause, Mic, X, ChevronLeft, Plus, Sparkles, Loader2, Wand2, Download, UploadCloud, Image as ImageIcon, Video as VideoIcon, BrainCircuit, CheckCircle, LogOut, ChevronsUpDown } from 'lucide-react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9?bundle';
import remarkGfm from 'https://esm.sh/remark-gfm@4?bundle';

// --- MOCK FIREBASE & AUTH ---
const mockFirebase = {
    auth: {
        currentUser: null,
        signIn: (email) => {
            const isPro = email === 'pro@example.com';
            mockFirebase.auth.currentUser = { 
                uid: isPro ? 'pro-user-123' : 'free-user-456',
                email: email,
                displayName: isPro ? 'Pro User' : 'Free User',
                photoURL: 'https://i.pravatar.cc/150?img=32',
                tier: isPro ? 'pro' : 'free',
                aiQuota: isPro ? 9999 : 15,
                preferences: { autoTranscribe: false, autoAnalyze: false },
            };
            return Promise.resolve(mockFirebase.auth.currentUser);
        },
        signOut: () => {
            mockFirebase.auth.currentUser = null;
            return Promise.resolve();
        },
        updateProfile: (profile) => {
             if (mockFirebase.auth.currentUser) {
                mockFirebase.auth.currentUser = { ...mockFirebase.auth.currentUser, ...profile };
            }
            return Promise.resolve();
        }
    },
    firestore: {
        getIdeas: (userId) => Promise.resolve([]),
        saveIdea: (userId, idea) => { console.log(`Saving idea for ${userId}:`, idea.title); return Promise.resolve(idea); },
        deleteIdea: (userId, ideaId) => { console.log(`Deleting idea ${ideaId} for ${userId}`); return Promise.resolve(); }
    },
    storage: {
        upload: (userId, file) => { console.log(`Uploading ${file.name} for ${userId}`); return fileToDataUrl(file); }
    }
};

// --- Helper & API Functions ---

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const callGemini = async (prompt, filePayload = null, jsonSchema = null) => {
    const apiKey = ""; // Leave empty
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const requestParts = [{ text: prompt }];
    if (filePayload) {
        requestParts.push({ inlineData: { mimeType: filePayload.mimeType, data: filePayload.data } });
    }

    const payload = {
        contents: [{ role: "user", parts: requestParts }],
        generationConfig: { temperature: 0.3 }
    };

    if (jsonSchema) {
        payload.generationConfig.responseMimeType = "application/json";
        payload.generationConfig.responseSchema = jsonSchema;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API call failed: ${response.status}. ${errorBody}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
        return text.trim();
    } else {
        if (result.promptFeedback?.blockReason) {
             throw new Error(`Request blocked: ${result.promptFeedback.blockReason}`);
        }
        console.error("Unexpected API response:", result);
        throw new Error("Failed to extract text from API response.");
    }
};

// --- Auth Context & Provider ---
const AuthContext = React.createContext();

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { setLoading(false); }, []);

    const login = async (email) => {
        const loggedInUser = await mockFirebase.auth.signIn(email);
        setUser(loggedInUser);
    };

    const logout = async () => {
        await mockFirebase.auth.signOut();
        setUser(null);
    };
    
    const updateUser = (updates) => {
        if(user) {
            const updatedUser = { ...user, ...updates };
            mockFirebase.auth.updateProfile(updatedUser);
            setUser(updatedUser);
        }
    };
    
    const consumeQuota = () => {
        if (user && user.tier === 'free') {
            setUser(prev => ({...prev, aiQuota: Math.max(0, prev.aiQuota - 1)}));
        }
    };

    const value = { user, login, logout, updateUser, consumeQuota, hasQuota: !user || user.tier === 'pro' || (user.tier === 'free' && user.aiQuota > 0) };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

// --- Main App Component ---
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
        if (!user) {
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


    useEffect(() => {
        if (user) {
            mockFirebase.firestore.getIdeas(user.uid).then(setIdeas);
        }
    }, [user]);

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
        if (user) mockFirebase.firestore.saveIdea(user.uid, newIdea);
        setIdeas(prev => [newIdea, ...prev]);
        navigateTo('detail', newIdea);
    };
    
    const handleUpdateIdea = (updater) => {
        const ideaIdToUpdate = selectedIdea.id;
        setIdeas(prevIdeas => {
            const newIdeas = prevIdeas.map(i => {
                if (i.id === ideaIdToUpdate) {
                    const updatedIdea = typeof updater === 'function' ? updater(i) : updater;
                    if (user) mockFirebase.firestore.saveIdea(user.uid, updatedIdea);
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
        if (user) mockFirebase.firestore.deleteIdea(user.uid, id);
        setIdeas(prev => prev.filter(i => i.id !== id));
        navigateTo('list');
    };

    const handleImport = (importedIdeas) => {
        if (user) importedIdeas.forEach(idea => mockFirebase.firestore.saveIdea(user.uid, idea));
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

// --- Components ---

function Header({ navigateTo }) {
    const { user, logout } = React.useContext(AuthContext);
    return (
        <header className="flex justify-between items-center p-4 sm:p-6 lg:p-8 border-b border-gray-200 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('list')}>
                <span className="bg-purple-600 text-white p-2 rounded-full"><BrainCircuit size={22} /></span>
                <h1 className="text-2xl font-bold text-gray-900">IdeaSpace</h1>
            </div>
            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <button onClick={() => navigateTo('settings')} className="text-gray-500 hover:text-gray-800"><Settings size={22} /></button>
                        <button onClick={logout} className="text-gray-500 hover:text-red-600"><LogOut size={22} /></button>
                        <img src={user.photoURL} alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-gray-200"/>
                    </>
                ) : (
                    <button onClick={() => navigateTo('login')} className="font-semibold text-purple-600 hover:text-purple-800">Sign In</button>
                )}
            </div>
        </header>
    );
}

function LoginPage({ navigateTo }) {
    const { login } = React.useContext(AuthContext);
    const handleLogin = async (email) => {
        await login(email);
        navigateTo('list');
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign In to IdeaSpace</h2>
                    <p className="mt-2 text-sm text-gray-600">Sync your ideas across devices and unlock AI features.</p>
                </div>
                <div className="flex flex-col gap-4">
                     <button onClick={() => handleLogin('pro@example.com')} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">Sign In as Pro User</button>
                     <button onClick={() => handleLogin('free@example.com')} className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Sign In as Free User</button>
                </div>
                 <p className="mt-4 text-center text-xs text-gray-500">This is a mock login. No password required.</p>
            </div>
        </div>
    );
}

function IdeaListPage({ ideas, navigateTo, searchTerm, setSearchTerm, onImport, onCreateIdea, getMatchContext }) {
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

function IdeaDetailPage({ idea, navigateTo, onDelete, onUpdate }) {
    const [focusedMedia, setFocusedMedia] = useState(null);
    const [isLoading, setIsLoading] = useState({});
    const fileInputRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const videoRef = useRef(null);
    const [mediaSearchTerm, setMediaSearchTerm] = useState('');
    const [mediaFilter, setMediaFilter] = useState('all');
    const [noteEditorTab, setNoteEditorTab] = useState('write');
    const { user, hasQuota, consumeQuota } = React.useContext(AuthContext);
    const preferences = user?.preferences || { autoTranscribe: false, autoAnalyze: false };

    useEffect(() => {
        if (focusedMedia) {
            const updatedFocused = idea.media.find(m => m.id === focusedMedia.id);
            setFocusedMedia(updatedFocused);
        }
    }, [idea]);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const uploadType = e.target.dataset.uploadType;
    
        setIsLoading(prev => ({ ...prev, [uploadType]: true }));
    
        const newMediaItems = files.map(file => ({
            id: Date.now() + Math.random(),
            type: uploadType,
            src: '',
            name: file.name,
            description: '',
            tags: [],
            status: 'uploading',
            file: file
        }));
    
        onUpdate(prevIdea => ({ ...prevIdea, media: [...(prevIdea.media || []), ...newMediaItems] }));
    
        for (const item of newMediaItems) {
            try {
                const src = user ? await mockFirebase.storage.upload(user.uid, item.file) : await fileToDataUrl(item.file);
                let finalMedia = { ...item, src, status: 'default' };
                delete finalMedia.file;
    
                if (finalMedia.type === 'audio' && preferences.autoTranscribe && user && hasQuota) {
                    finalMedia.status = 'queued';
                }
    
                onUpdate(prevIdea => ({
                    ...prevIdea,
                    media: prevIdea.media.map(m => m.id === item.id ? finalMedia : m)
                }));
    
                if (finalMedia.status === 'queued') {
                    handleMediaAI(finalMedia, 'transcribe');
                }
            } catch (error) {
                console.error(`Failed to upload ${item.name}`, error);
                onUpdate(prevIdea => ({
                    ...prevIdea,
                    media: prevIdea.media.filter(m => m.id !== item.id)
                }));
            }
        }
    
        setIsLoading(prev => ({ ...prev, [uploadType]: false }));
        fileInputRef.current.value = "";
    };

    const handleIdeaAI = async (featureType) => {
        if (!user) return alert("Please sign in to use AI features.");
        if (!hasQuota) return alert("You've reached your AI quota for this month.");
        setIsLoading(prev => ({ ...prev, idea: { ...prev.idea, [featureType]: true }}));
        consumeQuota();
        let prompt = '';
        let fullContext = `Title: ${idea.title}\nNote: ${idea.note}\n\n`;
        idea.media.forEach(m => {
            fullContext += `Media: ${m.name} (${m.type})\n`;
            if(m.transcription) fullContext += `Transcription: ${m.transcription}\n`;
            if(m.description) fullContext += `Description: ${m.description}\n`;
            if(m.tags?.length > 0) fullContext += `Tags: ${m.tags.join(', ')}\n`;
            fullContext += '---\n';
        });

        if(featureType === 'title') prompt = `You are a title suggestion AI. Based on the following context, suggest a short, compelling title for the entire idea. Output ONLY the title itself, without any introductory text or quotation marks. Context:\n${fullContext}`;
        if(featureType === 'summary') prompt = `You are a summarization AI. Analyze the entire context of this idea and provide a concise summary. Do not include any introductory phrases like "Based on the context...". Just provide the summary. Context:\n${fullContext}`;
        if(featureType === 'takeaways') prompt = `You are a key points AI. Analyze the entire context of this idea and extract the key takeaways as a bulleted list. Do not include any introductory phrases. Just provide the bulleted list. Context:\n${fullContext}`;
        
        try {
            const result = await callGemini(prompt);
            if(featureType === 'title') {
                onUpdate(prev => ({ ...prev, title: result }));
            } else {
                const newNote = `${idea.note}\n\n---\n### ${featureType.charAt(0).toUpperCase() + featureType.slice(1)} (${new Date().toLocaleDateString()})\n${result}`;
                onUpdate(prev => ({ ...prev, note: newNote }));
            }
        } catch (error) {
            alert(`Failed to generate ${featureType}: ${error.message}`);
        } finally {
            setIsLoading(prev => ({ ...prev, idea: { ...prev.idea, [featureType]: false }}));
        }
    };
    
    const handleMediaAI = async (mediaItem, featureType) => {
        if (!user) return alert("Please sign in to use AI features.");
        if (!hasQuota) return alert("You've reached your AI quota for this month.");
        const loadingId = mediaItem.id;
        setIsLoading(prev => ({ ...prev, [loadingId]: { ...(prev[loadingId] || {}), [featureType]: true }}));
        consumeQuota();
        
        let prompt = '';
        let updateKey = '';

        try {
            let result;
            if (mediaItem.type === 'audio') {
                if(featureType === 'transcribe' && !mediaItem.transcription) {
                    onUpdate(prev => ({ ...prev, media: prev.media.map(m => m.id === mediaItem.id ? { ...m, status: 'transcribing' } : m) }));
                    const base64Data = (await fileToDataUrl(await (await fetch(mediaItem.src)).blob())).split(',')[1];
                    result = await callGemini("Transcribe this audio file accurately. Provide only the transcribed text.", { mimeType: 'audio/webm', data: base64Data });
                    updateKey = 'transcription';
                } else if (featureType === 'title') {
                     if(!mediaItem.transcription) {
                         const transcribeFirst = window.confirm("Transcription is required to suggest a title. Transcribe now?");
                         if (transcribeFirst) {
                             await handleMediaAI(mediaItem, 'transcribe');
                             return;
                         } else {
                             throw new Error("Transcription cancelled.");
                         }
                     }
                     prompt = `Generate a short, descriptive title (4-6 words) for the following transcription. Output ONLY the title itself, without any extra text or quotes. \n\nTranscription: ${mediaItem.transcription}`;
                     updateKey = 'name';
                     result = await callGemini(prompt);
                }
            } else { // Image
                const base64Data = mediaItem.src.split(',')[1];
                const filePayload = { mimeType: mediaItem.src.match(/:(.*?);/)[1], data: base64Data };
                if(featureType === 'title') {
                    prompt = 'Describe this image in 4-6 words to use as a title. Output ONLY the title itself, without quotes.';
                    updateKey = 'name';
                    result = await callGemini(prompt, filePayload);
                } else if (featureType === 'description') {
                     const schema = {
                        type: "OBJECT",
                        properties: {
                          description: { "type": "STRING", "description": "A concise one-sentence description of the image." },
                          tags: { "type": "ARRAY", "items": { "type": "STRING" }, "description": "A list of 3-5 relevant keywords or tags for the image." }
                        }
                      };
                    prompt = 'Analyze this image. Provide a concise one-sentence description and a list of 3-5 relevant tags.';
                    const jsonResult = await callGemini(prompt, filePayload, schema);
                    result = JSON.parse(jsonResult);
                    updateKey = 'descriptionAndTags';
                }
            }
            
            onUpdate(prevIdea => {
                let updatedMedia;
                if (updateKey === 'descriptionAndTags') {
                    updatedMedia = prevIdea.media.map(m => m.id === mediaItem.id ? { ...m, description: result.description, tags: result.tags } : m);
                } else {
                    const statusUpdate = updateKey === 'transcription' ? { status: 'complete' } : {};
                    updatedMedia = prevIdea.media.map(m => m.id === mediaItem.id ? { ...m, [updateKey]: result, ...statusUpdate } : m);
                }
                return { ...prevIdea, media: updatedMedia };
            });

        } catch (error) {
            alert(`Failed to generate ${featureType}: ${error.message}`);
            onUpdate(prevIdea => ({ ...prevIdea, media: prevIdea.media.map(m => m.id === mediaItem.id ? { ...m, status: 'default' } : m) }));
        } finally {
            setIsLoading(prev => {
                const newLoading = {...prev};
                if(newLoading[loadingId]) {
                    delete newLoading[loadingId][featureType];
                    if(Object.keys(newLoading[loadingId] || {}).length === 0) {
                        delete newLoading[loadingId];
                    }
                }
                return newLoading;
            });
        }
    };

    const analyzeAllMedia = async () => {
        if (!user) return alert("Please sign in to use AI features.");
        setIsLoading(prev => ({...prev, analyzeAll: true}));
        const updates = idea.media.map(m => {
            if((m.type === 'image') && !m.description) {
                return handleMediaAI(m, 'description');
            }
            return Promise.resolve();
        });
        await Promise.all(updates);
        setIsLoading(prev => ({...prev, analyzeAll: false}));
    };
    
    const getMatchContext = (mediaItem) => {
        if (!mediaSearchTerm) return null;
        const term = mediaSearchTerm.toLowerCase();
        if (mediaItem.description?.toLowerCase().includes(term)) return `Found in description: "...${mediaItem.description.substring(mediaItem.description.toLowerCase().indexOf(term)-10, mediaItem.description.toLowerCase().indexOf(term)+10)}..."`;
        if (mediaItem.transcription?.toLowerCase().includes(term)) return `Found in transcription: "...${mediaItem.transcription.substring(mediaItem.transcription.toLowerCase().indexOf(term)-10, mediaItem.transcription.toLowerCase().indexOf(term)+10)}..."`;
        const matchingTag = mediaItem.tags?.find(tag => tag.toLowerCase().includes(term));
        if (matchingTag) return `Found in tags: "${matchingTag}"`;
        return null;
    };

    const filteredMedia = idea.media?.filter(m => {
        const typeMatch = mediaFilter === 'all' || m.type === mediaFilter;
        if (!typeMatch) return false;
        return !mediaSearchTerm || getMatchContext(m) || m.name.toLowerCase().includes(mediaSearchTerm.toLowerCase());
    }) || [];

    const handlePlayPause = (media) => {
        if (audioRef.current) {
            if (audioRef.current.src !== media.src) {
                audioRef.current.src = media.src;
            }
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play().catch(console.error);
        }
    };
    
    const handleVideoPlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            
            <button onClick={() => navigateTo('list')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold"><ChevronLeft size={20} /> Back to My Ideas</button>
            
            <div className="flex justify-between items-start gap-4">
                <input type="text" value={idea.title} onChange={e => onUpdate(prev => ({...prev, title: e.target.value}))} className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0" placeholder="Untitled Idea" />
                <AIPopover onSelect={(feature) => handleIdeaAI(feature)} features={['title']} loading={isLoading.idea} />
            </div>
            <p className="mt-1 text-sm text-gray-500">Last updated on {new Date(idea.date).toLocaleString()}</p>
            
            <div className="mt-6">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (Markdown supported)</label>
                     <AIPopover onSelect={(feature) => handleIdeaAI(feature)} features={['summary', 'takeaways']} loading={isLoading.idea} />
                </div>
                <textarea value={idea.note} onChange={e => onUpdate(prev => ({...prev, note: e.target.value}))} rows="10" className="w-full text-gray-700 leading-relaxed bg-white rounded-lg p-4 border border-gray-300 focus:ring-purple-500 focus:border-purple-500 font-mono"></textarea>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Add to this Idea</h3>
                <div className="mt-4 flex flex-wrap gap-4">
                    <UploadButton type="audio" icon={<Mic size={18}/>} text="Audio" inputRef={fileInputRef} loading={isLoading.audio} />
                    <UploadButton type="image" icon={<ImageIcon size={18}/>} text="Image" inputRef={fileInputRef} loading={isLoading.image} />
                    <UploadButton type="video" icon={<VideoIcon size={18}/>} text="Video" inputRef={fileInputRef} loading={isLoading.video} />
                </div>
            </div>

            {focusedMedia && (
                <div className="mt-8 pt-6 border-t border-gray-200 relative">
                     <button onClick={() => setFocusedMedia(null)} className="absolute top-4 right-0 text-gray-500 hover:text-gray-800 z-10"><X size={24} /></button>
                     <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800 truncate pr-16">{focusedMedia.name}</h3>
                        <div className="flex items-center gap-4">
                            {focusedMedia.type === 'video' && <button onClick={handleVideoPlay} className="bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-full hover:bg-blue-700 transition-colors shrink-0"><Play size={20} className="ml-0.5" /></button>}
                            {focusedMedia.type === 'audio' && <button onClick={() => handlePlayPause(focusedMedia)} className="bg-blue-600 text-white w-12 h-12 flex items-center justify-center rounded-full hover:bg-blue-700 transition-colors shrink-0">{isPlaying && audioRef.current?.src.includes(focusedMedia.src) ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}</button>}
                        </div>
                     </div>
                     
                     <div className="bg-gray-100 rounded-lg p-4">
                        {focusedMedia.type === 'image' && <img src={focusedMedia.src} alt={focusedMedia.name} className="rounded-lg max-h-96 w-auto mx-auto" />}
                        {focusedMedia.type === 'video' && <video ref={videoRef} id={`video-${focusedMedia.id}`} controls src={focusedMedia.src} className="rounded-lg w-full" />}
                        {focusedMedia.type === 'audio' && <p className="text-gray-700 leading-relaxed flex-grow">{focusedMedia.transcription || "No transcription available."}</p>}
                        <audio ref={audioRef} src={focusedMedia.src} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="hidden"></audio>
                     </div>
                     
                     <div className="mt-4 flex flex-wrap gap-2 items-center">
                         <AIPopover onSelect={(feature) => handleMediaAI(focusedMedia, feature)} features={['title']} mediaType={focusedMedia.type} loading={isLoading[focusedMedia.id]} small />
                         {focusedMedia.type === 'image' && <AIPopover onSelect={(feature) => handleMediaAI(focusedMedia, feature)} features={['description']} mediaType={focusedMedia.type} loading={isLoading[focusedMedia.id]} small />}
                         {focusedMedia.type === 'video' && <ActionButton text="Describe & Tag" icon={<Sparkles size={16}/>} small disabled title="Video analysis is not currently supported" />}
                         {focusedMedia.type === 'audio' && !focusedMedia.transcription && <ActionButton text="Transcribe" icon={<Mic size={16}/>} onClick={() => handleMediaAI(focusedMedia, 'transcribe')} loading={isLoading[focusedMedia.id]?.transcribe} small />}
                         {focusedMedia.description && <p className="w-full text-sm text-gray-600 mt-2 p-2 bg-purple-50 rounded"><b>Description:</b> {focusedMedia.description}</p>}
                         {focusedMedia.tags?.length > 0 && <div className="w-full flex flex-wrap gap-2 mt-2"><b>Tags:</b> {focusedMedia.tags.map(t => <span key={t} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">{t}</span>)}</div>}
                     </div>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Media Gallery</h3>
                    {user && <ActionButton icon={<Sparkles size={18}/>} text="Analyze All Images" onClick={analyzeAllMedia} loading={isLoading.analyzeAll} />}
                </div>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Search media by title, description, tags..." value={mediaSearchTerm} onChange={e => setMediaSearchTerm(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
                        {['all', 'audio', 'image', 'video'].map(type => (
                            <button key={type} onClick={() => setMediaFilter(type)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mediaFilter === type ? 'bg-white text-purple-600 shadow' : 'text-gray-600 hover:bg-gray-300'}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</button>
                        ))}
                    </div>
                </div>
                
                <div className="grid gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filteredMedia.map(m => {
                        const matchContext = getMatchContext(m);
                        const isMediaLoading = isLoading[m.id] || m.status === 'uploading';
                        return (
                        <div key={m.id} className="group">
                            <div onClick={() => !isMediaLoading && setFocusedMedia(m)} className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent group-hover:border-purple-500 relative">
                               {m.type === 'image' && <img src={m.src} alt={m.name} className="w-full h-full object-cover" />}
                               {m.type === 'video' && <video src={m.src} className="w-full h-full object-cover" />}
                               {m.type === 'audio' && <div className={`w-full h-full flex items-center justify-center ${m.status === 'complete' ? 'bg-purple-100' : m.status === 'transcribing' ? 'bg-orange-200' : m.status === 'queued' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                                    {m.status === 'complete' ? <Mic size={40} className="text-purple-500"/> : <Mic size={40} className={m.status === 'transcribing' ? 'text-orange-600' : 'text-orange-500'}/>}
                               </div>}
                               {isMediaLoading && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                               <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    {user && <AIPopover onSelect={(feature) => handleMediaAI(m, feature)} features={m.type === 'audio' ? (m.transcription ? ['title'] : ['transcribe']) : ['title', 'description']} mediaType={m.type} loading={isLoading[m.id]} small isIcon />}
                               </div>
                                {(m.status === 'queued' || m.status === 'transcribing') && <div className={`absolute bottom-0 left-0 right-0 h-1 ${m.status === 'queued' ? 'bg-orange-300' : 'bg-orange-400'} overflow-hidden rounded-b-lg`}><div className="h-full bg-white opacity-50 w-1/3 animate-progress-bar"></div></div>}
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate mt-2">{m.name}</p>
                            {matchContext && <p className="text-xs text-purple-600 truncate">{matchContext}</p>}
                        </div>
                    )})}
                </div>
                {idea.media?.length > 0 && filteredMedia.length === 0 && <p className="text-gray-500 mt-4">No media found matching your criteria.</p>}
                {idea.media?.length === 0 && <p className="text-gray-500">No media added yet.</p>}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
                 <ActionButton icon={<Trash2 size={18}/>} text="Delete Idea" onClick={() => onDelete(idea.id)} destructive />
            </div>
        </div>
    );
}

function SettingsPage({ navigateTo }) {
    const { user, logout, updateUser } = React.useContext(AuthContext);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [preferences, setPreferences] = useState(user?.preferences || { autoTranscribe: false, autoAnalyze: false });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        updateUser({ displayName, preferences });
        setTimeout(() => {
            setIsSaving(false);
            alert("Settings saved!");
        }, 1000); // Simulate network delay
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
             <button onClick={() => navigateTo('list')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold"><ChevronLeft size={20} /> Back to My Ideas</button>
             <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
             
             {/* Profile Section */}
             <div className="mt-8 pt-6 border-t">
                <h3 className="text-xl font-bold text-gray-800">Profile</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Name</label>
                        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-gray-500">{user?.email}</p>
                    </div>
                </div>
             </div>

            {/* Preferences Section */}
             <div className="mt-8 pt-6 border-t">
                <h3 className="text-xl font-bold text-gray-800">Preferences</h3>
                 <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="flex-grow flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Auto-transcribe new audio</span>
                            <span className="text-sm text-gray-500">Automatically transcribe audio files upon upload. (Uses AI quota)</span>
                        </span>
                        <button onClick={() => setPreferences(p => ({...p, autoTranscribe: !p.autoTranscribe}))} className={`${preferences.autoTranscribe ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}>
                            <span className={`${preferences.autoTranscribe ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
                        </button>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="flex-grow flex flex-col">
                            <span className="text-sm font-medium text-gray-900">Auto-analyze new images</span>
                            <span className="text-sm text-gray-500">Automatically generate descriptions and tags for new images. (Uses AI quota)</span>
                        </span>
                        <button onClick={() => setPreferences(p => ({...p, autoAnalyze: !p.autoAnalyze}))} className={`${preferences.autoAnalyze ? 'bg-purple-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}>
                            <span className={`${preferences.autoAnalyze ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
                        </button>
                    </div>
                </div>
            </div>

             {/* Subscription Section */}
            <div className="mt-8 pt-6 border-t">
                <h3 className="text-xl font-bold text-gray-800">Subscription & Billing</h3>
                <p className="text-sm text-gray-500 mt-1">Your current AI quota: <span className="font-bold text-purple-600">{user?.aiQuota}</span> actions remaining.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Free Plan */}
                    <div className={`p-6 rounded-lg border-2 ${user?.tier === 'free' ? 'border-purple-500' : 'border-gray-300'}`}>
                        <h4 className="text-lg font-semibold">Free Tier</h4>
                        <p className="text-gray-500 mt-2">Basic idea capturing and local storage.</p>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Limited AI quota per month</li>
                            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Manual import/export</li>
                            <li className="flex items-center gap-2"><X size={16} className="text-red-500"/> Cloud sync across devices</li>
                        </ul>
                        {user?.tier === 'free' && <p className="mt-4 text-sm font-bold text-purple-600">Current Plan</p>}
                    </div>
                    {/* Pro Plan */}
                     <div className={`p-6 rounded-lg border-2 ${user?.tier === 'pro' ? 'border-purple-500' : 'border-gray-300'}`}>
                        <h4 className="text-lg font-semibold">Pro Tier</h4>
                        <p className="text-gray-500 mt-2">Unlock the full power of AI and cloud sync.</p>
                         <ul className="mt-4 space-y-2 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Unlimited AI features</li>
                            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Cloud sync across devices</li>
                            <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Priority support</li>
                        </ul>
                        {user?.tier === 'pro' ? <p className="mt-4 text-sm font-bold text-purple-600">Current Plan</p> : <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700">Upgrade to Pro</button>}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t flex justify-end">
                <ActionButton text="Save Changes" onClick={handleSave} loading={isSaving} />
            </div>
        </div>
    );
}

function AIPopover({ onSelect, features, loading, small, isIcon = false }) {
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

function UploadButton({ type, icon, text, inputRef, loading }) {
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

function ActionButton({ icon, text, onClick, destructive = false, loading = false, small = false, disabled = false, title = '' }) {
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
