/**
 * Latar gradasi + gelombang animasi (gradient wave).
 * Dua lapis gelombang bergeser horizontal secara mulus + blob gradasi mengambang.
 */
export default function WaveBackground() {
  return (
    <div className="bg-fx" aria-hidden="true">
      <div className="blob blob-a" />
      <div className="blob blob-b" />
      <div className="blob blob-c" />

      <svg
        className="waves"
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
        </defs>

        {/* Gelombang belakang */}
        <g className="wave-layer wave-slow">
          <g>
            <path
              fill="url(#waveGrad3)"
              opacity="0.45"
              d="M0,220 C180,160 360,280 540,230 C720,180 900,120 1080,180 C1260,240 1350,260 1440,220 L1440,420 L0,420 Z"
            />
            <path
              fill="url(#waveGrad3)"
              opacity="0.45"
              transform="translate(1440,0)"
              d="M0,220 C180,160 360,280 540,230 C720,180 900,120 1080,180 C1260,240 1350,260 1440,220 L1440,420 L0,420 Z"
            />
          </g>
        </g>

        {/* Gelombang tengah */}
        <g className="wave-layer wave-mid">
          <g>
            <path
              fill="url(#waveGrad1)"
              opacity="0.35"
              d="M0,260 C200,320 400,200 600,250 C800,300 1000,340 1200,270 C1320,230 1390,220 1440,250 L1440,420 L0,420 Z"
            />
            <path
              fill="url(#waveGrad1)"
              opacity="0.35"
              transform="translate(1440,0)"
              d="M0,260 C200,320 400,200 600,250 C800,300 1000,340 1200,270 C1320,230 1390,220 1440,250 L1440,420 L0,420 Z"
            />
          </g>
        </g>

        {/* Gelombang depan */}
        <g className="wave-layer wave-fast">
          <g>
            <path
              fill="url(#waveGrad2)"
              opacity="0.30"
              d="M0,320 C160,280 320,360 480,330 C640,300 800,250 960,300 C1120,350 1280,340 1440,310 L1440,420 L0,420 Z"
            />
            <path
              fill="url(#waveGrad2)"
              opacity="0.30"
              transform="translate(1440,0)"
              d="M0,320 C160,280 320,360 480,330 C640,300 800,250 960,300 C1120,350 1280,340 1440,310 L1440,420 L0,420 Z"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
