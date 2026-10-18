import React, {useContext} from 'react';
import { Settings, LogOut, BrainCircuit } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Header({ navigateTo }) {
    const { user, logout } = useContext(AuthContext);
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