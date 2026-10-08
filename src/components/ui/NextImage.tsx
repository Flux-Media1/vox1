import React from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * Drop-in shim for Next.js Image component in Vite/React SPA.
 * Renders standard responsive <img> element while preserving Next.js Image prop compatibility.
 */
export const Image: React.FC<ImageProps> = ({ src, alt = '', width, height, className = '', ...rest }) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      {...rest}
    />
  );
};

export default Image;
