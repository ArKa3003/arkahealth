"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onContinue]);

  const handleClick = () => onContinue();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-arka-bg-dark cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Welcome - Click anywhere or press Enter to continue"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onContinue();
        }
      }}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 500ms ease-in-out",
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] md:w-[700px] md:h-[700px] rounded-full blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(91, 155, 213, 0.4) 0%, rgba(13, 25, 41, 0) 70%)",
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-8 sm:py-12 gap-4 animate-fade-in">
        <Image
          src="/arka-logo.svg"
          alt="ARKA Logo"
          width={600}
          height={675}
          className="w-[400px] h-[450px] sm:w-[500px] sm:h-[562px] md:w-[600px] md:h-[675px] object-contain max-w-[90vw] max-h-[60vh]"
        />
      </div>
      <div className="absolute bottom-12 sm:bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-10">
        <p className="text-arka-text-muted/80 text-sm sm:text-base font-medium text-center px-4 font-sans">
          Click anywhere or press Enter to continue
        </p>
      </div>
    </div>
  );
}
