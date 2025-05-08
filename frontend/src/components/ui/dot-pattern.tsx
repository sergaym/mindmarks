"use client";

import React from "react";

interface DotPatternProps {
  width: number;
  height: number;
  cx: number;
  cy: number;
  cr: number;
  className?: string;
}

const DotPattern = ({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className = "",
}: DotPatternProps) => {
  const pixelWidth = width;
  const pixelHeight = height;

  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="dotPattern"
          x="0"
          y="0"
          width={pixelWidth}
          height={pixelHeight}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={cx} cy={cy} r={cr} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotPattern)" />
    </svg>
  );
};

export default DotPattern; 