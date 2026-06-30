'use client';

import { useState, useEffect } from 'react';

interface MatchTimerProps {
  elapsed?: number;
  statusShort?: string;
  isLive?: boolean;
  isFinished?: boolean;
  isSuspended?: boolean;
  fallbackTime?: string;
}

export default function MatchTimer({ 
  elapsed = 0, 
  statusShort = '', 
  isLive = false, 
  isFinished = false, 
  isSuspended = false, 
  fallbackTime = '' 
}: MatchTimerProps) {
  const [displayMinutes, setDisplayMinutes] = useState(elapsed);

  useEffect(() => {
    setDisplayMinutes(elapsed);
  }, [elapsed]);

  useEffect(() => {
    if (!isLive || isFinished || isSuspended || statusShort === 'HT') return;

    const interval = setInterval(() => {
      setDisplayMinutes(prev => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, [isLive, isFinished, isSuspended, statusShort]);

  if (isFinished) return <span>FT</span>;
  if (isSuspended) return <span className="text-red-500">SUSP</span>;
  if (statusShort === 'HT') return <span className="text-yellow-500 font-black">HT</span>;
  
  if (!isLive) return <span>{fallbackTime}</span>;

  if (statusShort === '1H' && displayMinutes > 45) {
    return <span>45+{displayMinutes - 45}&apos;</span>;
  }
  if (statusShort === '2H' && displayMinutes > 90) {
    return <span>90+{displayMinutes - 90}&apos;</span>;
  }

  if (displayMinutes === 0 && isLive) {
    return <span className="animate-pulse">LIVE</span>;
  }

  return <span>{displayMinutes}&apos;</span>;
}
