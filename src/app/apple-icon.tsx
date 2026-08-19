import { ImageResponse } from 'next/og';

// iOS krever PNG for hjemskjermikonet, så det rasteriseres her i stedet for å
// sjekkes inn som en bildefil. Samme merke som icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#DE7214',
          color: '#fff',
          fontSize: 118,
          fontWeight: 700,
          letterSpacing: '-0.04em',
        }}
      >
        R
      </div>
    ),
    size,
  );
}
