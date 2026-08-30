"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Countdown to the next midnight (end of day deals reset).
 * Purely client-side — no server state needed.
 */
export function DealsCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    function update() {
      const now   = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      setTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-start md:items-end gap-1">
      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-orange mb-1.5">
        <Clock size={13} className="text-orange" />
        Deals reset in
      </p>
      <div className="flex items-center gap-2">
        {[
          { val: timeLeft.h, label: "HRS" },
          { val: timeLeft.m, label: "MIN" },
          { val: timeLeft.s, label: "SEC" },
        ].map(({ val, label }, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="countdown-digit">
              <span className="countdown-number bg-white/10 text-orange border border-white/20 backdrop-blur-md">{pad(val)}</span>
              <span className="countdown-label text-white/60">{label}</span>
            </div>
            {i < 2 && (
              <span className="mb-5 text-xl font-black text-white/40">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
