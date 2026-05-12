import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useOrderNotificationStore,
  OrderNotification,
} from "@/store/useOrderNotificationStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const NOTIFICATION_DURATION = 6000; // 6 seconds

export function OrderNotificationBar() {
  const { notifications, removeNotification } = useOrderNotificationStore();
  const { notificationSoundUrl } = useSettingsStore();
  const [activeNotification, setActiveNotification] =
    useState<OrderNotification | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [timeText, setTimeText] = useState("just now");
  const navigate = useNavigate();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pick the first notification to show
  useEffect(() => {
    if (notifications.length > 0 && !activeNotification) {
      // Find the first notification that is not older than 1 hour
      const oneHourAgo = Date.now() - 3600000;
      const validNotification = notifications.find(
        (n) => n.timestamp >= oneHourAgo,
      );

      if (validNotification) {
        setActiveNotification(validNotification);

        // Play alert sound when a new notification becomes active
        if (audioRef.current) {
          audioRef.current.volume = 0.5;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log("Audio play failed, falling back to Web Audio API: ", error);
              // Fallback to Web Audio API for a pleasant chime
              try {
                const audioCtx = new (
                  window.AudioContext || (window as any).webkitAudioContext
                )();
                if (audioCtx.state === "suspended") {
                  audioCtx.resume();
                }
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
                oscillator.frequency.exponentialRampToValueAtTime(
                  1760,
                  audioCtx.currentTime + 0.1,
                ); // Slide up to A6

                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(
                  0.3,
                  audioCtx.currentTime + 0.05,
                );
                gainNode.gain.exponentialRampToValueAtTime(
                  0.001,
                  audioCtx.currentTime + 0.5,
                );

                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.5);
              } catch (e) {
                console.log("Fallback audio also failed", e);
              }
            });
          }
        }
      } else {
        // If all notifications are older than an hour, clear them
        notifications.forEach((n) => removeNotification(n.id));
      }
    }
  }, [notifications, activeNotification, removeNotification]);

  // Handle auto-hide logic
  useEffect(() => {
    if (!activeNotification || isHovered) return;

    const timer = setTimeout(() => {
      removeNotification(activeNotification.id);
      setActiveNotification(null);
    }, NOTIFICATION_DURATION);

    return () => clearTimeout(timer);
  }, [activeNotification, isHovered, removeNotification]);

  // Update time text dynamically
  useEffect(() => {
    if (!activeNotification) return;

    const updateTime = () => {
      const diffMs = Date.now() - activeNotification.timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins === 0) {
        setTimeText("just now");
      } else {
        setTimeText(`${diffMins} min${diffMins > 1 ? "s" : ""} ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [activeNotification]);

  return (
    <div className="fixed bottom-4 left-4 z-50 md:bottom-8 md:left-8 w-full max-w-sm pointer-events-none px-4 md:px-0">
      <audio 
        ref={audioRef} 
        src={notificationSoundUrl || "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"} 
        preload="auto" 
      />
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5 overflow-hidden flex items-center p-3 relative cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              navigate(activeNotification.productUrl);
              removeNotification(activeNotification.id);
              setActiveNotification(null);
            }}
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#FAFAFA] border border-black/5">
              <img
                src={activeNotification.productImage}
                alt={activeNotification.productName}
                className="w-full h-full object-cover mix-blend-multiply"
              />
            </div>

            <div className="ml-4 pr-6 flex-1 min-w-0">
              <p className="text-[13px] text-[#141414] leading-tight break-words">
                <span className="font-bold">
                  {activeNotification.customerName}
                </span>{" "}
                has ordered{" "}
                <span className="font-medium text-[#141414]/70">
                  {activeNotification.productName}
                </span>{" "}
                from{" "}
                <span className="font-medium">
                  {activeNotification.deliveryAddress}
                </span>
              </p>
              <p className="text-[11px] text-[#141414]/40 mt-1 font-bold uppercase tracking-widest">
                {timeText}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(activeNotification.id);
                setActiveNotification(null);
              }}
              className="absolute top-3 right-3 text-[#141414]/30 hover:text-[#141414] p-1 rounded-full hover:bg-black/5 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
