import { useEffect, useRef } from "react";
import { doc, setDoc, deleteDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useLocation } from "react-router-dom";

export function ActiveUsersTracker() {
  const { user } = useAuthStore();
  const location = useLocation();
  const sessionIdRef = useRef(`session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`);
  
  useEffect(() => {
    // Record unique visitor
    const recordVisitor = async () => {
      if (!sessionStorage.getItem('hasVisited')) {
        sessionStorage.setItem('hasVisited', 'true');
        try {
          const statsRef = doc(db, "analytics", "visitors");
          await setDoc(statsRef, {
            totalVisitors: increment(1),
            lastUpdated: Date.now()
          }, { merge: true });
        } catch (err) {
          console.error("Failed to increment visitors counter", err);
        }
      }
    };
    recordVisitor();
  }, []);

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const sessionRef = doc(db, "active_sessions", sessionId);
    
    let isTracking = true;
    
    const updatePresence = async () => {
      if (!isTracking) return;
      try {
        await setDoc(sessionRef, {
          sessionId,
          userId: user?.uid || null,
          email: user?.email || null,
          lastActive: Date.now(),
          path: location.pathname,
          userAgent: navigator.userAgent
        }, { merge: true });
      } catch (error) {
        // Silencing error to avoid console spam for missing permissions during dev
      }
    };
    
    updatePresence();
    
    // Update presence every 30 seconds
    const interval = setInterval(updatePresence, 30000);
    
    // Also update on interaction (throttled)
    let lastInteraction = Date.now();
    const handleInteraction = () => {
      const now = Date.now();
      if (now - lastInteraction > 15000) { // Throttled to 15 seconds to reduce writes
        lastInteraction = now;
        updatePresence();
      }
    };
    
    const opts = { passive: true };
    window.addEventListener("mousemove", handleInteraction, opts);
    window.addEventListener("keydown", handleInteraction, opts);
    window.addEventListener("touchstart", handleInteraction, opts);
    window.addEventListener("scroll", handleInteraction, opts);
    window.addEventListener("click", handleInteraction, opts);

    const cleanup = () => {
      isTracking = false;
      // We use beacon or standard fetch if this is beforeunload, but deleteDoc is async
      try {
        deleteDoc(sessionRef);
      } catch (e) {
        // Ignore
      }
    };
    
    window.addEventListener("beforeunload", cleanup);
    
    return () => {
      isTracking = false;
      clearInterval(interval);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, [user?.uid, user?.email, location.pathname]);

  return null;
}
