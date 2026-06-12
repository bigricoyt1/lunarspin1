import React, { useState } from 'react';
import { 
  Shield, Users, MessageSquare, CheckCircle, XCircle, 
  Clock, AlertTriangle, Search
} from 'lucide-react';
import { User as UserType, TransactionRequest } from '../types';

interface HelperPanelProps {
  user: UserType | null;
  allUsers: UserType[];
  pendingRequests: TransactionRequest[];
  onApproveRequest: (req: TransactionRequest) => void;
  onDenyRequest: (req: TransactionRequest) => void;
  onApproveMinecraft: (targetUser: UserType) => void;
  onDenyMinecraft: (userId: string) => void;
  onTimeout: (userId: string, minutes: number) => void;
  onClearChat: () => void;
  toast: (msg: string, type: 'win' | 'lose' | 'info') => void;
}

export default function HelperPanel({
  user,
  allUsers,
  pendingRequests,
  onApproveRequest,
  onDenyRequest,
  onApproveMinecraft,
  onDenyMinecraft,
  onTimeout,
  onClearChat,
  toast
}: HelperPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'requests' | 'chat'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.minecraftUsername && u.minecraftUsername.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingMcLinks = allUsers.filter(u => u.pendingMinecraftUsername);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto animate-[fadeIn_0.3s_ease]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Staff Assistance Center</span>
          <span className="text-xl font-black text-white">🛡️ HELPER COMMAND PANEL</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5 gap-1">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'users' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Users
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'requests' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />
            Requests
            {(pendingRequests.length + pendingMcLinks.length) > 0 && (
              <span className="bg-rose-500 text-white text-[8px] px-1.5 rounded-full">
                {pendingRequests.length + pendingMcLinks.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'chat' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </div>
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'users' && (
        <div className="flex flex-col gap-4 text-left">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search by username or Minecraft name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl bg-slate-900/50 text-white text-xs font-bold outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-extrabold uppercase tracking-wider">
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-sm shadow-inner">
                          {u.emoji}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-[11px]">{u.username}</span>
                          <span className="text-[8px] text-slate-500 uppercase tracking-tighter">
                            {u.minecraftUsername || 'No MC Linked'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        u.role === 'owner' ? 'bg-rose-500/10 text-rose-400' :
                        u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                        u.role === 'dev' ? 'bg-blue-500/10 text-blue-400' :
                        u.role === 'mod' ? 'bg-emerald-500/10 text-emerald-400' :
                        u.role === 'helper' ? 'bg-sky-500/10 text-sky-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                          <span className="text-[9px] font-bold text-slate-400">
                            {u.isOnline ? 'Active' : 'Offline'}
                          </span>
                        </div>
                        {u.timeoutUntil && new Date(u.timeoutUntil) > new Date() && (
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">
                            Muted ({Math.ceil((new Date(u.timeoutUntil).getTime() - Date.now()) / 60000)}m)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => onTimeout(u.id, 0)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded text-[9px] font-black uppercase transition-all cursor-pointer"
                        >
                          Unmute
                        </button>
                        <button
                          onClick={() => onTimeout(u.id, 10)}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded text-[9px] font-black uppercase transition-all cursor-pointer"
                        >
                          10m Mute
                        </button>
                        <button
                          onClick={() => onTimeout(u.id, 60)}
                          className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 rounded text-[9px] font-black uppercase transition-all cursor-pointer"
                        >
                          60m Mute
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'requests' && (
        <div className="flex flex-col gap-6 text-left">
          {/* Minecraft Link Requests */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white uppercase tracking-tight">Pending Minecraft Verifications</span>
              <span className="ml-auto text-[10px] font-bold text-slate-500">{pendingMcLinks.length} items</span>
            </div>
            
            {pendingMcLinks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest italic font-mono">
                Queue Empty: No pending MC link requests
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingMcLinks.map(it => (
                  <div key={it.id} className="p-4 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-between group transition-all hover:border-emerald-500/20 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">
                        {it.emoji}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white">@{it.username}</span>
                        <span className="text-[10px] font-bold text-slate-500">REQUESTED: <span className="text-emerald-400 underline">{it.pendingMinecraftUsername}</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => onDenyMinecraft(it.id)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all cursor-pointer"
                        title="Deny Request"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onApproveMinecraft(it)}
                        className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction Requests */}
          <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
             <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-white uppercase tracking-tight">Financial Transaction Queue</span>
              <span className="ml-auto text-[10px] font-bold text-slate-500">{pendingRequests.length} items</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest italic font-mono">
                Queue Empty: No pending cash flow requests
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-between transition-all hover:border-amber-500/20">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black ${
                        req.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {req.type === 'deposit' ? 'IN' : 'OUT'}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">@{req.username}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            req.type === 'deposit' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {req.type}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          Amount: <span className="text-white font-mono">${req.amount.toLocaleString()}</span> • MC: <span className="text-indigo-400">{req.mcName}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onDenyRequest(req)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-[9px] uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => onApproveRequest(req)}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest rounded-lg shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-2"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'chat' && (
        <div className="flex flex-col gap-6 text-left">
          <div className="p-6 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-black text-white uppercase tracking-tight">Mass Chat Cleanup</span>
              <p className="text-[10px] text-slate-500 font-medium">Use this to globally purge all active messages in the chat panel if people are acting out.</p>
            </div>
            <button
              onClick={onClearChat}
              className="py-3 px-6 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Flush All Messages
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
