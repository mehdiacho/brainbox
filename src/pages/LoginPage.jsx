import {useContext} from 'react';
import { AuthContext } from '../context/AuthContext';

export default function LoginPage({ navigateTo }) {
    const { login } = useContext(AuthContext);
    const handleLogin = async (email, password) => {
        await login(email, password);
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