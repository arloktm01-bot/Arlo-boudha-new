import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, Clock, Globe, BarChart } from 'lucide-react';
import { motion } from 'motion/react';

export function AnalyticsTab() {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);

  useEffect(() => {
    // We consider users active if their lastActive timestamp is within the last 60 seconds
    const q = query(collection(db, "active_sessions"));
    
    const unsubscribeSessions = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      
      const sessions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(session => session.lastActive >= oneMinuteAgo)
        .sort((a, b) => b.lastActive - a.lastActive);
        
      setActiveUsers(sessions);
    }, (error: any) => {
      if (!error?.message?.includes("permissions")) {
        console.error("Failed to fetch active sessions", error);
      }
    });

    // Listen to total visitors count
    const statsDocRef = doc(db, "analytics", "visitors");
    const unsubscribeStats = onSnapshot(statsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTotalVisitors(docSnap.data().totalVisitors || 0);
      }
    }, (error: any) => {
      if (!error?.message?.includes("permissions")) {
        console.error("Failed to fetch total visitors stats", error);
      }
    });

    return () => {
      unsubscribeSessions();
      unsubscribeStats();
    };
  }, []);

  return (
    <div className="space-y-8 p-6 md:p-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141414] text-white p-8 border border-black/10 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-50 mb-4">Live Active Users</h3>
            <div className="flex items-end gap-3 transition-transform group-hover:scale-105 origin-left">
              <span className="text-6xl font-black">{activeUsers.length}</span>
              <div className="flex items-center gap-2 mb-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Online</span>
              </div>
            </div>
          </div>
          <Users className="absolute -right-6 -bottom-6 w-32 h-32 opacity-5 scale-110 group-hover:scale-125 transition-transform" />
        </div>
        
        <div className="bg-white p-8 border border-black/10 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Active Sessions</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black">{activeUsers.length}</span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#141414]/40 mt-2">Within last 60s</p>
          </div>
          <Globe className="absolute -right-4 -bottom-4 w-24 h-24 text-black/5 scale-110 group-hover:scale-125 transition-transform" />
        </div>

        <div className="bg-white p-8 border border-black/10 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 mb-4">Total Visitors</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black">{totalVisitors}</span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#141414]/40 mt-2">All time unique visits</p>
          </div>
          <BarChart className="absolute -right-4 -bottom-4 w-24 h-24 text-black/5 scale-110 group-hover:scale-125 transition-transform" />
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#141414]/50 mb-4 border-b border-black/10 pb-4">Live Activity Log</h3>
        
        {activeUsers.length === 0 ? (
          <div className="py-12 text-center text-[11px] font-bold uppercase tracking-widest opacity-30">
            No active users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[10px] tracking-widest uppercase font-bold text-[#141414]/50">
                <tr>
                  <th className="py-4">Session ID</th>
                  <th className="py-4">Status</th>
                  <th className="py-4">Current Page</th>
                  <th className="py-4">Last Activity</th>
                  <th className="py-4">Device Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-medium">
                {activeUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-4">
                      <div>{user.userId ? "Logged In User" : "Guest User"}</div>
                      <div className="text-[10px] opacity-40 font-mono mt-1">{user.id}</div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="bg-black/5 px-2 py-1 text-[11px] rounded-md font-mono">
                        {user.path || '/'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 opacity-70">
                        <Clock size={12} />
                        <span className="text-[11px] uppercase tracking-widest font-bold">
                          {Math.floor((Date.now() - user.lastActive) / 1000)}s ago
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-[10px] max-w-xs overflow-hidden text-ellipsis opacity-50 uppercase tracking-widest">
                        {user.userAgent || 'Unknown'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
