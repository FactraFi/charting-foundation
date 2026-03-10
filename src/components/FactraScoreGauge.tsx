import React, { useState, useEffect, useRef, useMemo } from "react";
import { Loader2 } from "lucide-react";

interface FactraScoreGaugeProps {
  score: number;
  size?: "normal" | "medium" | "large";
  minimal?: boolean;
}

const FactraScoreGauge = React.forwardRef<HTMLDivElement, FactraScoreGaugeProps>(({ score, size = "normal", minimal = false }, ref) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [wave, setWave] = useState(0);
  const timeRef = useRef(0);

  const isLarge = size === "large";
  const isMedium = size === "medium";

  let containerSize: string, fontSize: string, tickCount: number;

  if (isLarge) {
    containerSize = "w-[300px] h-[300px] md:w-[400px] md:h-[400px]";
    fontSize = "text-6xl md:text-8xl";
    tickCount = 120;
  } else if (isMedium) {
    containerSize = "w-[180px] h-[180px]";
    fontSize = "text-5xl";
    tickCount = 60;
  } else {
    containerSize = "w-[200px] h-[200px]";
    fontSize = "text-4xl";
    tickCount = 80;
  }

  useEffect(() => {
    if (minimal) return;
    let animationFrame: number;
    const startTime = Date.now();
    const duration = 2000;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(easeOut * score);

      timeRef.current += 0.015;
      const w = (Math.sin(timeRef.current) + 1) / 2;

      setDisplayScore(currentScore);
      setWave(w);

      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [score, minimal]);

  const ticks = useMemo(() => Array.from({ length: tickCount }), [tickCount]);

  // Minimal gauge for cards
  if (minimal) {
    const radius = 20;
    const stroke = 3;
    const normalized = score / 100;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - normalized * circumference;
    const color = score >= 60 ? 'hsl(var(--primary))' : score >= 40 ? '#EAB308' : 'hsl(var(--destructive))';

    return (
      <div ref={ref} className="relative w-12 h-12 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full">
          <circle cx="24" cy="24" r={radius} stroke="hsl(var(--border))" strokeWidth={stroke} fill="transparent" />
          <circle cx="24" cy="24" r={radius} stroke={color} strokeWidth={stroke} fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
        </svg>
        <span className="absolute text-[10px] font-bold text-foreground">{score}</span>
      </div>
    );
  }

  const isStable = displayScore >= 60;
  const mainColorRaw = isStable ? "#00FF94" : "#EF4444";
  const normalizedScore = displayScore / 100;

  const baseTickLength = isLarge ? 5 : isMedium ? 4 : 5;

  return (
    <div ref={ref} className={`relative ${containerSize} flex items-center justify-center`}>
      <div
        className="absolute inset-0 rounded-full blur-[60px] transition-all duration-300 opacity-20"
        style={{
          backgroundColor: mainColorRaw,
          transform: `scale(${1 + (normalizedScore * 0.1) + (wave * 0.05)})`
        }}
      />
      <div className="absolute inset-0 pointer-events-none">
        {ticks.map((_, i) => {
          const isAnchor = i % 5 === 0;
          const scaleFactor = isLarge ? 1.1 : 1;
          const dynamicBase = baseTickLength + (normalizedScore * (isLarge ? 8 : 4)) + (wave * 3);
          const tickHeight = (isAnchor ? dynamicBase * 1.6 : dynamicBase) * scaleFactor;
          const opacity = isAnchor ? 1 : 0.2 + (normalizedScore * 0.3) + (wave * 0.15);
          const rotation = i * (360 / tickCount);

          return (
            <div
              key={i}
              className="absolute left-1/2 top-0 w-[2px] rounded-full transition-all duration-75 origin-bottom"
              style={{
                height: `${tickHeight}px`,
                backgroundColor: mainColorRaw,
                opacity,
                transformOrigin: `50% ${isLarge ? '200px' : isMedium ? '90px' : '100px'}`,
                transform: `translateX(-50%) rotate(${rotation}deg)`,
                boxShadow: (!isStable && isAnchor) ? `0 0 8px ${mainColorRaw}` : 'none'
              }}
            />
          );
        })}
      </div>
      <div className="z-10 flex flex-col items-center justify-center text-center">
        <div
          className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold mb-2 transition-colors duration-300"
          style={{ color: isStable ? 'rgba(0, 255, 148, 0.7)' : 'rgba(239, 68, 68, 0.7)' }}
        >
          FactraFi Score
        </div>
        <div className={`${fontSize} font-bold text-foreground tracking-tighter tabular-nums leading-none mb-3 font-sans`}>
          {displayScore}
        </div>
        {!isMedium && (
          <div
            className="px-4 py-1.5 rounded-full border bg-background/40 backdrop-blur-md uppercase tracking-widest text-[10px] font-sans font-bold flex items-center gap-2 transition-colors duration-300"
            style={{
              borderColor: `${mainColorRaw}60`,
              color: mainColorRaw
            }}
          >
            {!isStable && <Loader2 size={12} className="animate-spin" />}
            {isStable ? "SIGNAL DETECTED" : "ANALYZING NOISE..."}
          </div>
        )}
      </div>
    </div>
  );
};

export default FactraScoreGauge;
