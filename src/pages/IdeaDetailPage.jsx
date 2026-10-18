import React, { useState, useEffect, useRef } from 'react';
import { FileText, Search, Trash2, Play, Pause, Mic, X, ChevronLeft, Sparkles, Loader2, Wand2, Download, UploadCloud, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AuthContext } from '../context/AuthContext';
import ActionButton from '../components/ActionButton';
import AIPopover from '../components/AIPopover';
import UploadButton from '../components/UploadButton';
import * as aiService from '../services/aiService';

export default function IdeaDetailPage({ idea, navigateTo, onDelete, onUpdate }) {
    const [focusedMedia, setFocusedMedia] = useState(null);
    const [isLoading, setIsLoading] = useState({});
    const fileInputRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const videoRef = useRef(null);
    const [mediaSearchTerm, setMediaSearchTerm] = useState('');
    const [mediaFilter, setMediaFilter] = useState('all');
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
                const src = user ? await storageService.uploadMediaFile(user.uid, idea.id, item.id, item.file) : await aiService.fileToDataUrl(item.file);
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
        let fullContext = `Title: ${idea.title}\nNote: ${idea.note}\n\n`;
        idea.media.forEach(m => {
            fullContext += `Media: ${m.name} (${m.type})\n`;
            if(m.transcription) fullContext += `Transcription: ${m.transcription}\n`;
            if(m.description) fullContext += `Description: ${m.description}\n`;
            if(m.tags?.length > 0) fullContext += `Tags: ${m.tags.join(', ')}\n`;
            fullContext += '---\n';
        });

        try {
            let result;
            if(featureType === 'title') result = await aiService.suggestTitleForIdea(fullContext);
            if(featureType === 'summary') result = await aiService.summarizeIdea(fullContext);
            if(featureType === 'takeaways') result = await aiService.getTakeawaysForIdea(fullContext);
            
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
        
        try {
            let result;
            let updateKey;

            if (mediaItem.type === 'audio') {
                if(featureType === 'transcribe' && !mediaItem.transcription) {
                    onUpdate(prev => ({ ...prev, media: prev.media.map(m => m.id === mediaItem.id ? { ...m, status: 'transcribing' } : m) }));
                    const audioBlob = await (await fetch(mediaItem.src)).blob();
                    const audioFile = new File([audioBlob], mediaItem.name, {type: audioBlob.type});
                    result = await aiService.transcribeAudio(audioFile);
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
                     result = await aiService.suggestTitleForMedia(mediaItem);
                     updateKey = 'name';
                }
            } else { // Image
                if(featureType === 'title') {
                    result = await aiService.suggestTitleForMedia(mediaItem);
                    updateKey = 'name';
                } else if (featureType === 'description') {
                    result = await aiService.describeImageAndTags(mediaItem);
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