interface PixelIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function PixelHeart({ size = 32, color = '#ff69b4', className = '', style }: PixelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      {/* Pixelated heart made of squares */}
      <rect x="8" y="8" width="4" height="4" fill={color} />
      <rect x="12" y="8" width="4" height="4" fill={color} />
      <rect x="20" y="8" width="4" height="4" fill={color} />
      <rect x="24" y="8" width="4" height="4" fill={color} />
      
      <rect x="4" y="12" width="4" height="4" fill={color} />
      <rect x="8" y="12" width="4" height="4" fill={color} />
      <rect x="12" y="12" width="4" height="4" fill={color} />
      <rect x="16" y="12" width="4" height="4" fill={color} />
      <rect x="20" y="12" width="4" height="4" fill={color} />
      <rect x="24" y="12" width="4" height="4" fill={color} />
      <rect x="28" y="12" width="4" height="4" fill={color} />
      
      <rect x="4" y="16" width="4" height="4" fill={color} />
      <rect x="8" y="16" width="4" height="4" fill={color} />
      <rect x="12" y="16" width="4" height="4" fill={color} />
      <rect x="16" y="16" width="4" height="4" fill={color} />
      <rect x="20" y="16" width="4" height="4" fill={color} />
      <rect x="24" y="16" width="4" height="4" fill={color} />
      <rect x="28" y="16" width="4" height="4" fill={color} />
      
      <rect x="8" y="20" width="4" height="4" fill={color} />
      <rect x="12" y="20" width="4" height="4" fill={color} />
      <rect x="16" y="20" width="4" height="4" fill={color} />
      <rect x="20" y="20" width="4" height="4" fill={color} />
      <rect x="24" y="20" width="4" height="4" fill={color} />
      
      <rect x="12" y="24" width="4" height="4" fill={color} />
      <rect x="16" y="24" width="4" height="4" fill={color} />
      <rect x="20" y="24" width="4" height="4" fill={color} />
      
      <rect x="16" y="28" width="4" height="4" fill={color} />
    </svg>
  );
}

export function PixelStar({ size = 32, color = '#fbbf24', className = '', style }: PixelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      {/* Pixelated star made of squares */}
      <rect x="14" y="4" width="4" height="4" fill={color} />
      
      <rect x="10" y="8" width="4" height="4" fill={color} />
      <rect x="14" y="8" width="4" height="4" fill={color} />
      <rect x="18" y="8" width="4" height="4" fill={color} />
      
      <rect x="6" y="12" width="4" height="4" fill={color} />
      <rect x="10" y="12" width="4" height="4" fill={color} />
      <rect x="14" y="12" width="4" height="4" fill={color} />
      <rect x="18" y="12" width="4" height="4" fill={color} />
      <rect x="22" y="12" width="4" height="4" fill={color} />
      
      <rect x="2" y="16" width="4" height="4" fill={color} />
      <rect x="6" y="16" width="4" height="4" fill={color} />
      <rect x="10" y="16" width="4" height="4" fill={color} />
      <rect x="14" y="16" width="4" height="4" fill={color} />
      <rect x="18" y="16" width="4" height="4" fill={color} />
      <rect x="22" y="16" width="4" height="4" fill={color} />
      <rect x="26" y="16" width="4" height="4" fill={color} />
      
      <rect x="10" y="20" width="4" height="4" fill={color} />
      <rect x="14" y="20" width="4" height="4" fill={color} />
      <rect x="18" y="20" width="4" height="4" fill={color} />
      
      <rect x="6" y="24" width="4" height="4" fill={color} />
      <rect x="10" y="24" width="4" height="4" fill={color} />
      <rect x="14" y="24" width="4" height="4" fill={color} />
      <rect x="18" y="24" width="4" height="4" fill={color} />
      <rect x="22" y="24" width="4" height="4" fill={color} />
      
      <rect x="10" y="28" width="4" height="4" fill={color} />
      <rect x="18" y="28" width="4" height="4" fill={color} />
    </svg>
  );
}

export function PixelSparkles({ size = 32, color = '#fde047', className = '', style }: PixelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={{ imageRendering: 'pixelated', ...style }}
    >
      {/* Small pixelated sparkles */}
      <rect x="14" y="2" width="4" height="4" fill={color} />
      <rect x="10" y="6" width="4" height="4" fill={color} />
      <rect x="14" y="6" width="4" height="4" fill={color} />
      <rect x="18" y="6" width="4" height="4" fill={color} />
      <rect x="14" y="10" width="4" height="4" fill={color} />
      
      <rect x="24" y="10" width="4" height="4" fill={color} />
      <rect x="20" y="14" width="4" height="4" fill={color} />
      <rect x="24" y="14" width="4" height="4" fill={color} />
      <rect x="28" y="14" width="4" height="4" fill={color} />
      <rect x="24" y="18" width="4" height="4" fill={color} />
      
      <rect x="6" y="20" width="4" height="4" fill={color} />
      <rect x="2" y="24" width="4" height="4" fill={color} />
      <rect x="6" y="24" width="4" height="4" fill={color} />
      <rect x="10" y="24" width="4" height="4" fill={color} />
      <rect x="6" y="28" width="4" height="4" fill={color} />
    </svg>
  );
}
