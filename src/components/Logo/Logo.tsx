import React from 'react';
export function Logo({
  className,
  width = 120,
  height = 40,
  'data-id': dataId





}: {className?: string;width?: number;height?: number;'data-id'?: string;}) {
  return (
    <img
      src="/4bb35e6a-8695-4844-8b53-7d1b31577d2c.png"
      alt="Logo"
      className={className}
      style={{
        width,
        height,
        objectFit: 'contain'
      }}
      data-id={dataId} />);


}