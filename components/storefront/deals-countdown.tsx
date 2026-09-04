"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface DealsCountdownProps {
  targetDate?: string | Date | null;
  label?: string;
  className?: string;
  onExpire?: () => void;
  compact?: boolean;
}

export function DealsCountdown({
  targetDate,
  label = "Deal ends in",
  className = "",
  onExpire,
  compact = false,
}: DealsCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, isExpired: false });

  useEffect(() => {
    function update() {
      const now = new Date().getTime();
      let targetTime: number;

      if (targetDate) {
        targetTime = new Date(targetDate).getTime();
      } else {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        targetTime = midnight.getTime();
      }

      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / 86400),
        h: Math.floor((diff % 86400) / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
        isExpired: false,
      });
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3 py-1 text-xs font-bold text-red-400">
        <Clock size={13} /> Deal Expired
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold text-orange ${className}`}>
        <Clock size={13} className="shrink-0" />
        <span>
          {timeLeft.d > 0 ? `${pad(timeLeft.d)}d ` : ""}
          {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
        </span>
      </div>
    );
  }

  const digits = timeLeft.d > 0
    ? [
        { val: timeLeft.d, label: "DAYS" },
        { val: timeLeft.h, label: "HRS" },
        { val: timeLeft.m, label: "MIN" },
        { val: timeLeft.s, label: "SEC" },
      ]
    : [
        { val: timeLeft.h, label: "HRS" },
        { val: timeLeft.m, label: "MIN" },
        { val: timeLeft.s, label: "SEC" },
      ];

  return (
    <div className={`flex flex-col items-start md:items-end gap-1 ${className}`}>
      {label && (
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-orange mb-1">
          <Clock size={13} className="text-orange" />
          {label}
        </p>
      )}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {digits.map(({ val, label: digitLabel }, i) => (
          <div key={digitLabel} className="flex items-center gap-1.5 sm:gap-2">
            <div className="countdown-digit">
              <span className="countdown-number bg-white/10 text-orange border border-white/20 backdrop-blur-md">
                {pad(val)}
              </span>
              <span className="countdown-label text-white/60">{digitLabel}</span>
            </div>
            {i < digits.length - 1 && (
              <span className="mb-4 text-lg font-black text-white/40">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
