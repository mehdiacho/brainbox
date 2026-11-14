import { useState, useEffect, createContext } from 'react';
import * as authService from '../services/authService';


// --- MOCK FIREBASE & AUTH ---
// export const mockFirebase = {
//     auth: {
//         currentUser: null,
//         signIn: (email) => {
//             const isPro = email === 'pro@example.com';
//             mockFirebase.auth.currentUser = { 
//                 uid: isPro ? 'pro-user-123' : 'free-user-456',
//                 email: email,
//                 displayName: isPro ? 'Pro User' : 'Free User',
//                 photoURL: 'https://i.pravatar.cc/150?img=32',
//                 tier: isPro ? 'pro' : 'free',
//                 aiQuota: isPro ? 9999 : 15,
//                 preferences: { autoTranscribe: false, autoAnalyze: false },
//             };
//             return Promise.resolve(mockFirebase.auth.currentUser);
//         },
//         signOut: () => {
//             mockFirebase.auth.currentUser = null;
//             return Promise.resolve();
//         },
//         updateProfile: (profile) => {
//              if (mockFirebase.auth.currentUser) {
//                 mockFirebase.auth.currentUser = { ...mockFirebase.auth.currentUser, ...profile };
//             }
//             return Promise.resolve();
//         }
//     },
//     firestore: {
//         getIdeas: (userId) => Promise.resolve([]),
//         saveIdea: (userId, idea) => { console.log(`Saving idea for ${userId}:`, idea.title); return Promise.resolve(idea); },
//         deleteIdea: (userId, ideaId) => { console.log(`Deleting idea ${ideaId} for ${userId}`); return Promise.resolve(); }
//     },
//     storage: {
//         upload: (userId, file) => { console.log(`Uploading ${file.name} for ${userId}`); return fileToDataUrl(file); }
//     }
// };

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authService.onAuthChange(setUser);
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const loggedInUser = await authService.signIn(email, password);
        setUser(loggedInUser);
    };

    const logout = async () => {
        await authService.signOut();
        setUser(null);
    };
    
    const updateUser = (updates) => {
        if(user) {
            const updatedUser = { ...user, ...updates };
            authService.updateUserProfile(user.uid, updates);
            setUser(updatedUser);
        }
    };
    
    const consumeQuota = () => {
        if (user && user.tier === 'free') {
            const newQuota = Math.max(0, user.aiQuota - 1);
            updateUser({ aiQuota: newQuota });
        }
    };

    const value = { user, login, logout, updateUser, consumeQuota, hasQuota: !user || user.tier === 'pro' || (user.tier === 'free' && user.aiQuota > 0) };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}