import { useState, useContext } from 'react';
import { ChevronLeft, CheckCircle, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ActionButton from '../components/ActionButton';

export default function SettingsPage({ navigateTo }) {
    const { user, logout, updateUser } = useContext(AuthContext);
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