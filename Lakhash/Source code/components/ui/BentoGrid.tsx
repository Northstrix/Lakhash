
// components/ui/BentoGrid.tsx
"use client"
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, CSSProperties } from 'react';

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-[repeat(auto-fill,354px)] gap-[60px] max-w-full mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  children,
  metadataIntegrity,
}: {
  className?: string;
  children?: React.ReactNode;
  metadataIntegrity: boolean;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const angle = Math.atan2(-x, y);
      card.style.setProperty("--rotation", `${angle}rad`);
    };

    card.addEventListener("mousemove", handleMouseMove);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const backgroundStyle: CSSProperties = metadataIntegrity
    ? {
        backgroundImage: 'linear-gradient(black, black), linear-gradient(calc(var(--rotation)), #888 0, #444 20%, transparent 80%)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }
    : {
        backgroundImage: 'repeating-linear-gradient(-45deg, #800000, #800000 10px, #000000 10px, #000000 20px), linear-gradient(calc(var(--rotation)), #888 0, #444 20%, transparent 80%)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      };

  return (
    <div
      ref={cardRef}
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 border border-transparent relative",
        "before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r before:from-gray-500 before:via-gray-400 before:to-transparent before:rounded-xl before:-z-10",
        "after:absolute after:inset-0 after:p-[2px] after:bg-black after:rounded-xl after:-z-10",
        className
      )}
      style={{
        '--rotation': '2.5rad',
        // 'border': '2px solid transparent'
        ...backgroundStyle,
      } as CSSProperties}
    >
      <div className="w-full h-full p-4 flex flex-col justify-between">
        {children}
      </div>
      <style jsx>{`
        :root {
          --rotation: 2.5rad;
        }
        * {
          color: white;
          font-size: 18px;
        }
        body {
          background-color: #050505;
        }
      `}</style>
    </div>
  );
};