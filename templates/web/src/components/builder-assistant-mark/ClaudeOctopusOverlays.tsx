import type { ClaudeOctopusPose } from './claudeOctopusPoses';
import { CLAUDE_CODE_BRAND_HEX, CLAUDE_CODE_SAD_FACE } from './builderAssistantMarkPaths';
import { claudeOctopusExtendedPose } from './claudeOctopusExtendedPoses';
import { extendedPoseOverlay } from './extendedPoseOverlays';

const SadFace = () => (
  <g className="claude-octopus__sad-face">
    <path
      className="claude-octopus__brow claude-octopus__brow--left"
      d={CLAUDE_CODE_SAD_FACE.leftBrow}
      fill="none"
      stroke="#6B3D2E"
      strokeLinecap="round"
      strokeWidth="0.55"
    />
    <path
      className="claude-octopus__brow claude-octopus__brow--right"
      d={CLAUDE_CODE_SAD_FACE.rightBrow}
      fill="none"
      stroke="#6B3D2E"
      strokeLinecap="round"
      strokeWidth="0.55"
    />
    <path
      className="claude-octopus__mouth"
      d={CLAUDE_CODE_SAD_FACE.mouth}
      fill="none"
      stroke="#6B3D2E"
      strokeLinecap="round"
      strokeWidth="0.6"
    />
    <ellipse
      className="claude-octopus__tear claude-octopus__tear--left"
      cx={CLAUDE_CODE_SAD_FACE.leftTear.cx}
      cy={CLAUDE_CODE_SAD_FACE.leftTear.cy}
      fill="#7EC8E3"
      rx={CLAUDE_CODE_SAD_FACE.leftTear.rx}
      ry={CLAUDE_CODE_SAD_FACE.leftTear.ry}
    />
    <ellipse
      className="claude-octopus__tear claude-octopus__tear--right"
      cx={CLAUDE_CODE_SAD_FACE.rightTear.cx}
      cy={CLAUDE_CODE_SAD_FACE.rightTear.cy}
      fill="#7EC8E3"
      rx={CLAUDE_CODE_SAD_FACE.rightTear.rx}
      ry={CLAUDE_CODE_SAD_FACE.rightTear.ry}
    />
  </g>
);

/**
 * Render the legacy path-body overlay for poses that need extra face or prop detail.
 *
 * @returns SVG overlay nodes for the current pose.
 * @example
 * <ClaudeOctopusOverlays pose="sad" />;
 */
export const ClaudeOctopusOverlays = ({ pose }: { readonly pose: ClaudeOctopusPose }) => {
  switch (pose) {
    case 'sad':
      return <SadFace />;

    case 'singing':
      return (
        <g className="claude-octopus__sing-group">
          <ellipse
            className="claude-octopus__sing-mouth"
            cx="12"
            cy="13.1"
            fill="#6B3D2E"
            rx="1.1"
            ry="0.75"
          />
          <circle
            className="claude-octopus__note claude-octopus__note--a"
            cx="18.2"
            cy="6.8"
            fill="#6B3D2E"
            r="0.55"
          />
          <rect
            className="claude-octopus__note claude-octopus__note--a"
            fill="#6B3D2E"
            height="2.2"
            width="0.35"
            x="18.5"
            y="4.8"
          />
          <circle
            className="claude-octopus__note claude-octopus__note--b"
            cx="20.4"
            cy="5.2"
            fill="#6B3D2E"
            r="0.45"
          />
          <rect
            className="claude-octopus__note claude-octopus__note--b"
            fill="#6B3D2E"
            height="1.8"
            width="0.3"
            x="20.65"
            y="3.6"
          />
        </g>
      );

    case 'celebrating': {
      // Real confetti burst — sharp pixel bits in the official Clawd palette
      // (blue/orange/pink) that erupt above the head and rain down the sides.
      // Variant sets the drift: a/c cascade left, b/d cascade right.
      const confetti = [
        { x: 0.5, y: -2, s: 0.9, f: '#7CA4D0', v: 'a' },
        { x: 2.5, y: -3.4, s: 0.8, f: '#DD8361', v: 'c' },
        { x: 4.5, y: -1.5, s: 0.75, f: '#C87392', v: 'a' },
        { x: 1.5, y: 1.5, s: 0.7, f: '#CB708F', v: 'c' },
        { x: 5.5, y: 0.4, s: 0.8, f: '#7CA4D0', v: 'a' },
        { x: 3.5, y: 3.2, s: 0.72, f: '#DD8361', v: 'c' },
        { x: 8.5, y: -3.2, s: 0.8, f: '#C87392', v: 'd' },
        { x: 11, y: -2.4, s: 0.7, f: '#7CA4D0', v: 'c' },
        { x: 13.5, y: -3.4, s: 0.85, f: '#CB708F', v: 'd' },
        { x: 15, y: -1.6, s: 0.75, f: '#DD8361', v: 'c' },
        { x: 17.5, y: -2, s: 0.85, f: '#7CA4D0', v: 'b' },
        { x: 19.5, y: -3.4, s: 0.8, f: '#C87392', v: 'd' },
        { x: 21.5, y: -1.5, s: 0.75, f: '#DD8361', v: 'b' },
        { x: 23, y: 0.4, s: 0.9, f: '#CB708F', v: 'd' },
        { x: 20, y: 2, s: 0.7, f: '#7CA4D0', v: 'b' },
      ];
      return (
        <g className="claude-octopus__confetti" shapeRendering="crispEdges">
          {confetti.map((bit) => (
            <rect
              className={`claude-octopus__confetti-bit claude-octopus__confetti-bit--${bit.v}`}
              fill={bit.f}
              height={bit.s}
              key={`${bit.x}-${bit.y}`}
              width={bit.s}
              x={bit.x}
              y={bit.y}
            />
          ))}
        </g>
      );
    }

    case 'thinking':
      return (
        <g className="claude-octopus__thoughts">
          <circle
            className="claude-octopus__thought claude-octopus__thought--1"
            cx="19.2"
            cy="5.8"
            fill="#6B3D2E"
            opacity="0.55"
            r="0.55"
          />
          <circle
            className="claude-octopus__thought claude-octopus__thought--2"
            cx="20.6"
            cy="4.2"
            fill="#6B3D2E"
            opacity="0.4"
            r="0.4"
          />
          <circle
            className="claude-octopus__thought claude-octopus__thought--3"
            cx="21.5"
            cy="2.8"
            fill="#6B3D2E"
            opacity="0.28"
            r="0.28"
          />
        </g>
      );

    case 'coffee':
      return (
        <g className="claude-octopus__coffee">
          <rect fill="#6B3D2E" height="2.4" rx="0.35" width="2.8" x="10.6" y="18.2" />
          <path
            d="M13.4 18.6 H14.2 Q15.2 18.6 15.2 19.6 V19.8"
            fill="none"
            stroke="#6B3D2E"
            strokeWidth="0.45"
          />
          <path
            className="claude-octopus__steam claude-octopus__steam--1"
            d="M11.4 17.6 Q11.1 16.8 11.5 16.2"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.35"
          />
          <path
            className="claude-octopus__steam claude-octopus__steam--2"
            d="M12.4 17.5 Q12.1 16.7 12.5 16.1"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.35"
          />
        </g>
      );

    case 'debugging':
      return (
        <g className="claude-octopus__debug">
          <circle cx="19.8" cy="7.2" fill="none" r="1.8" stroke="#6B3D2E" strokeWidth="0.45" />
          <line
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.45"
            x1="21.1"
            x2="22.4"
            y1="8.5"
            y2="9.8"
          />
          <text
            className="claude-octopus__bug-glyph"
            fill="#6B3D2E"
            fontSize="1.8"
            x="18.95"
            y="7.85"
          >
            ?
          </text>
        </g>
      );

    case 'vibing':
      return (
        <g className="claude-octopus__shades">
          <rect fill="#1C1917" height="0.55" rx="0.12" width="4.2" x="9.9" y="9.15" />
          <rect fill="#1C1917" height="0.18" width="1.4" x="11.3" y="9.05" />
        </g>
      );

    case 'panicking':
      return (
        <g className="claude-octopus__panic-face">
          <path
            d="M9.8 12.4 H14.2"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
          <ellipse
            className="claude-octopus__sweat claude-octopus__sweat--left"
            cx="4.8"
            cy="9.8"
            fill="#7EC8E3"
            rx="0.35"
            ry="0.55"
          />
          <ellipse
            className="claude-octopus__sweat claude-octopus__sweat--right"
            cx="19.2"
            cy="9.8"
            fill="#7EC8E3"
            rx="0.35"
            ry="0.55"
          />
        </g>
      );

    case 'loving':
      return (
        <g className="claude-octopus__hearts">
          <path
            className="claude-octopus__heart claude-octopus__heart--1"
            d="M4.2 6.2 C4.2 5.4 5.1 5.2 5.5 5.9 C5.9 5.2 6.8 5.4 6.8 6.2 C6.8 7.1 5.5 8 5.5 8 C5.5 8 4.2 7.1 4.2 6.2Z"
            fill="#E11D48"
          />
          <path
            className="claude-octopus__heart claude-octopus__heart--2"
            d="M18.5 4.8 C18.5 4.2 19.2 4 19.5 4.5 C19.8 4 20.5 4.2 20.5 4.8 C20.5 5.5 19.5 6.2 19.5 6.2 C19.5 6.2 18.5 5.5 18.5 4.8Z"
            fill="#E11D48"
          />
          <path
            className="claude-octopus__heart claude-octopus__heart--3"
            d="M20.8 8.5 C20.8 7.9 21.5 7.7 21.8 8.2 C22.1 7.7 22.8 7.9 22.8 8.5 C22.8 9.2 21.8 9.9 21.8 9.9 C21.8 9.9 20.8 9.2 20.8 8.5Z"
            fill="#FB7185"
          />
        </g>
      );

    case 'deploying':
      return (
        <g className="claude-octopus__rocket">
          <path d="M20.2 16.5 L21.4 13.8 L22.6 16.5 Z" fill="#6B3D2E" />
          <rect fill="#F97316" height="2.2" width="0.9" x="21.05" y="11.6" />
          <path
            className="claude-octopus__rocket-flame"
            d="M21.2 18.2 Q21.5 19.4 21.5 20.2 Q21.5 19.4 21.8 18.2"
            fill="#FBBF24"
          />
        </g>
      );

    case 'eureka':
      return (
        <g className="claude-octopus__bulb">
          <circle className="claude-octopus__bulb-glass" cx="12" cy="3.2" fill="#FBBF24" r="1.35" />
          <rect fill="#78716C" height="0.7" rx="0.1" width="1.1" x="11.45" y="4.45" />
          <line
            className="claude-octopus__bulb-ray claude-octopus__bulb-ray--1"
            stroke="#FBBF24"
            strokeLinecap="round"
            strokeWidth="0.35"
            x1="12"
            x2="12"
            y1="0.8"
            y2="1.4"
          />
          <line
            className="claude-octopus__bulb-ray claude-octopus__bulb-ray--2"
            stroke="#FBBF24"
            strokeLinecap="round"
            strokeWidth="0.35"
            x1="9.2"
            x2="9.7"
            y1="2.2"
            y2="2.7"
          />
          <line
            className="claude-octopus__bulb-ray claude-octopus__bulb-ray--3"
            stroke="#FBBF24"
            strokeLinecap="round"
            strokeWidth="0.35"
            x1="14.8"
            x2="14.3"
            y1="2.2"
            y2="2.7"
          />
        </g>
      );

    case 'sleeping':
      return (
        <g className="claude-octopus__zzz">
          <text
            className="claude-octopus__z claude-octopus__z--1"
            fill="#6B3D2E"
            fontSize="1.6"
            fontWeight="700"
            x="17.5"
            y="5.5"
          >
            z
          </text>
          <text
            className="claude-octopus__z claude-octopus__z--2"
            fill="#6B3D2E"
            fontSize="1.3"
            fontWeight="700"
            x="19.2"
            y="4.2"
          >
            z
          </text>
          <text
            className="claude-octopus__z claude-octopus__z--3"
            fill="#6B3D2E"
            fontSize="1"
            fontWeight="700"
            x="20.5"
            y="3.2"
          >
            z
          </text>
        </g>
      );

    case 'tired':
      return (
        <g className="claude-octopus__tired-face">
          <path
            d="M5.2 7.9 L7.6 8.2"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.45"
          />
          <path
            d="M16.4 8.2 L18.8 7.9"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.45"
          />
          <path
            d="M10.4 13.1 Q12 12.3 13.6 13.1"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
        </g>
      );

    case 'prompting':
      return (
        <g className="claude-octopus__cursor-blink">
          <rect
            className="claude-octopus__caret"
            fill="#6B3D2E"
            height="2.2"
            width="0.45"
            x="14.8"
            y="12.2"
          />
        </g>
      );

    case 'merging':
      return (
        <g className="claude-octopus__merge">
          <path
            className="claude-octopus__branch claude-octopus__branch--left"
            d="M2.5 8.5 L6.2 9.8"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
          <path
            className="claude-octopus__branch claude-octopus__branch--right"
            d="M21.5 8.5 L17.8 9.8"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
          <circle className="claude-octopus__merge-node" cx="12" cy="4.8" fill="#22C55E" r="0.65" />
        </g>
      );

    case 'reviewing':
      return (
        <g className="claude-octopus__review">
          <rect
            fill="none"
            height="2.6"
            stroke="#1C1917"
            strokeWidth="0.42"
            width="2.5"
            x="5.3"
            y="8.1"
          />
          <rect
            fill="none"
            height="2.6"
            stroke="#1C1917"
            strokeWidth="0.42"
            width="2.5"
            x="16.2"
            y="8.1"
          />
          <rect fill="#1C1917" height="0.4" width="8.4" x="7.8" y="9.2" />
        </g>
      );

    case 'waiting':
      return (
        <g className="claude-octopus__wait">
          <circle
            className="claude-octopus__clock"
            cx="19.5"
            cy="5.5"
            fill="none"
            r="1.5"
            stroke="#6B3D2E"
            strokeWidth="0.4"
          />
          <line
            className="claude-octopus__clock-hand"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.35"
            x1="19.5"
            x2="19.5"
            y1="5.5"
            y2="4.4"
          />
          <path
            d="M10.5 13.2 Q12 12.5 13.5 13.2"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.45"
          />
        </g>
      );

    case 'broke':
      return (
        <g className="claude-octopus__broke-face">
          <path
            d="M6 9.2 L7.5 10.7 M7.5 9.2 L6 10.7"
            stroke="#DC2626"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
          <path
            d="M16.5 9.2 L18 10.7 M18 9.2 L16.5 10.7"
            stroke="#DC2626"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
          <path
            className="claude-octopus__crack"
            d="M11.5 6.5 L12.2 9.5 L11.8 12.5 L12.5 15.5"
            fill="none"
            stroke="#DC2626"
            strokeLinecap="round"
            strokeWidth="0.45"
          />
          <path
            d="M9.5 13.5 H14.5"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
        </g>
      );

    case 'rich':
      return (
        <g className="claude-octopus__money">
          <text
            className="claude-octopus__dollar claude-octopus__dollar--1"
            fill="#22C55E"
            fontSize="1.8"
            fontWeight="700"
            x="3.2"
            y="6.5"
          >
            $
          </text>
          <text
            className="claude-octopus__dollar claude-octopus__dollar--2"
            fill="#22C55E"
            fontSize="1.5"
            fontWeight="700"
            x="18.8"
            y="5.2"
          >
            $
          </text>
          <text
            className="claude-octopus__dollar claude-octopus__dollar--3"
            fill="#16A34A"
            fontSize="1.2"
            fontWeight="700"
            x="20.2"
            y="8.5"
          >
            $
          </text>
          <path
            d="M10 12.6 Q12 14.2 14 12.6"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
        </g>
      );

    case 'summoning':
      return (
        <g className="claude-octopus__summon">
          <circle
            className="claude-octopus__spark claude-octopus__spark--1"
            cx="12"
            cy="3.5"
            fill="#A855F7"
            r="0.45"
          />
          <circle
            className="claude-octopus__spark claude-octopus__spark--2"
            cx="9.5"
            cy="4.8"
            fill="#C084FC"
            r="0.3"
          />
          <circle
            className="claude-octopus__spark claude-octopus__spark--3"
            cx="14.5"
            cy="4.8"
            fill="#C084FC"
            r="0.3"
          />
          <path
            className="claude-octopus__summon-ring"
            d="M8.5 3.8 Q12 1.8 15.5 3.8"
            fill="none"
            stroke="#A855F7"
            strokeLinecap="round"
            strokeWidth="0.35"
          />
        </g>
      );

    case 'hotfix':
      return (
        <g className="claude-octopus__hotfix">
          <path
            className="claude-octopus__flame claude-octopus__flame--1"
            d="M20.5 16.2 Q21.2 14.8 20.8 13.5 Q22 14.5 21.5 16.5 Q20.8 17.8 20.5 16.2"
            fill="#F97316"
          />
          <path
            className="claude-octopus__flame claude-octopus__flame--2"
            d="M3.2 15.8 Q2.5 14.2 3 13 Q1.8 14 2.2 15.8 Q2.8 17 3.2 15.8"
            fill="#EF4444"
          />
          <path
            d="M9.8 12.8 H14.2"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
        </g>
      );

    case 'facepalm':
      return (
        <g className="claude-octopus__facepalm">
          <rect
            className="claude-octopus__palm"
            fill="#D97757"
            height="3.2"
            opacity="0.95"
            rx="0.4"
            width="5.5"
            x="9.25"
            y="7.8"
          />
          <path
            d="M10.5 13.5 Q12 12.8 13.5 13.5"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.45"
          />
        </g>
      );

    case 'micdrop':
      return (
        <g className="claude-octopus__micdrop">
          <g className="claude-octopus__mic-arm">
            <rect fill={CLAUDE_CODE_BRAND_HEX} height="2.2" width="2.4" x="19.6" y="6.2" />
            <rect fill={CLAUDE_CODE_BRAND_HEX} height="2.2" width="2.2" x="21" y="4.4" />
            <rect fill={CLAUDE_CODE_BRAND_HEX} height="2" width="2.4" x="20.4" y="2.8" />
          </g>
          <g className="claude-octopus__mic">
            <rect fill="#3F3F46" height="1.9" width="2.3" x="20.4" y="1.2" />
            <rect fill="#52525B" height="1.8" width="1.1" x="21" y="3" />
          </g>
        </g>
      );

    case 'manifesting':
      return (
        <g className="claude-octopus__manifest">
          <text
            className="claude-octopus__star claude-octopus__star--1"
            fill="#FBBF24"
            fontSize="1.4"
            x="17.8"
            y="4.8"
          >
            ✦
          </text>
          <text
            className="claude-octopus__star claude-octopus__star--2"
            fill="#FDE68A"
            fontSize="1.1"
            x="19.8"
            y="3.5"
          >
            ✦
          </text>
          <text
            className="claude-octopus__star claude-octopus__star--3"
            fill="#FBBF24"
            fontSize="0.9"
            x="21"
            y="5.5"
          >
            ✦
          </text>
        </g>
      );

    case 'unhinged':
      return (
        <g className="claude-octopus__unhinged-eyes">
          <circle cx="6.75" cy="9.5" fill="none" r="0.9" stroke="#6B3D2E" strokeWidth="0.4" />
          <circle cx="17.25" cy="9.5" fill="none" r="0.9" stroke="#6B3D2E" strokeWidth="0.4" />
          <path
            d="M6.2 9.5 Q6.75 8.8 7.3 9.5 T6.75 10.2"
            fill="none"
            stroke="#6B3D2E"
            strokeWidth="0.35"
          />
          <path
            d="M16.7 9.5 Q17.25 8.8 17.8 9.5 T17.25 10.2"
            fill="none"
            stroke="#6B3D2E"
            strokeWidth="0.35"
          />
          <path
            d="M9 13.2 Q12 14.5 15 13"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
        </g>
      );

    case 'snacking':
      return (
        <g className="claude-octopus__snack">
          <rect
            className="claude-octopus__chip-bag"
            fill="#EAB308"
            height="2.8"
            rx="0.3"
            width="2.2"
            x="18.5"
            y="14.5"
          />
          <rect fill="#CA8A04" height="0.5" width="2.2" x="18.5" y="14.5" />
          <ellipse
            className="claude-octopus__crumb claude-octopus__crumb--1"
            cx="17.5"
            cy="16.5"
            fill="#FDE047"
            rx="0.35"
            ry="0.2"
          />
          <path
            d="M10.5 12.8 Q12 13.8 13.5 12.8"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
        </g>
      );

    case 'typing':
      return (
        <g className="claude-octopus__keyboard">
          <rect fill="#44403C" height="1.4" rx="0.2" width="5.5" x="9.25" y="18.4" />
          <rect
            className="claude-octopus__key claude-octopus__key--1"
            fill="#78716C"
            height="0.45"
            rx="0.1"
            width="0.55"
            x="9.6"
            y="18.55"
          />
          <rect
            className="claude-octopus__key claude-octopus__key--2"
            fill="#78716C"
            height="0.45"
            rx="0.1"
            width="0.55"
            x="10.35"
            y="18.55"
          />
          <rect
            className="claude-octopus__key claude-octopus__key--3"
            fill="#78716C"
            height="0.45"
            rx="0.1"
            width="0.55"
            x="11.1"
            y="18.55"
          />
          <rect
            className="claude-octopus__key claude-octopus__key--4"
            fill="#78716C"
            height="0.45"
            rx="0.1"
            width="0.55"
            x="11.85"
            y="18.55"
          />
        </g>
      );

    case 'scrolling':
      return (
        <g className="claude-octopus__scroll">
          <g className="claude-octopus__phone">
            <rect fill="#27272A" height="5.4" width="3.4" x="10.3" y="12.2" />
            <rect fill="#0B1220" height="4.2" width="2.6" x="10.7" y="12.7" />
            <g className="claude-octopus__phone-feed">
              <rect fill="#38BDF8" height="0.5" width="1.9" x="11" y="13.2" />
              <rect fill="#52525B" height="0.5" width="1.5" x="11" y="14.1" />
              <rect fill="#52525B" height="0.5" width="1.9" x="11" y="15" />
              <rect fill="#38BDF8" height="0.5" width="1.3" x="11" y="15.9" />
            </g>
          </g>
          <g className="claude-octopus__scroll-arm">
            <rect fill={CLAUDE_CODE_BRAND_HEX} height="2.2" width="2.2" x="8.4" y="15.8" />
            <rect fill={CLAUDE_CODE_BRAND_HEX} height="1.8" width="2" x="9.9" y="14.6" />
          </g>
        </g>
      );

    case 'rubberduck':
      return (
        <g className="claude-octopus__duck">
          <ellipse
            className="claude-octopus__duck-body"
            cx="19.8"
            cy="16.2"
            fill="#FACC15"
            rx="1.4"
            ry="1"
          />
          <circle
            className="claude-octopus__duck-head"
            cx="20.8"
            cy="15.2"
            fill="#FACC15"
            r="0.75"
          />
          <path
            className="claude-octopus__duck-bill"
            d="M21.5 15.3 L22.2 15.1 L21.5 14.9 Z"
            fill="#F97316"
          />
          <circle cx="21.05" cy="15" fill="#6B3D2E" r="0.15" />
        </g>
      );

    case 'gaming':
      return (
        <g className="claude-octopus__gamepad">
          <rect fill="#44403C" height="1.8" rx="0.45" width="3.2" x="17.8" y="16.8" />
          <circle
            className="claude-octopus__pad-btn claude-octopus__pad-btn--a"
            cx="20.4"
            cy="17.5"
            fill="#EF4444"
            r="0.35"
          />
          <circle
            className="claude-octopus__pad-btn claude-octopus__pad-btn--b"
            cx="19.2"
            cy="17.9"
            fill="#3B82F6"
            r="0.3"
          />
          <rect fill="#78716C" height="0.35" rx="0.1" width="0.9" x="18.1" y="17.5" />
        </g>
      );

    case 'streaking':
      return (
        <g className="claude-octopus__streak">
          <g className="claude-octopus__speed">
            <rect fill="#F97316" height="0.7" width="3.6" x="0.4" y="9.4" />
            <rect fill="#FBBF24" height="0.6" width="2.8" x="0.4" y="11.3" />
            <rect fill="#F97316" height="0.6" width="3.2" x="0.4" y="13.1" />
          </g>
          <g className="claude-octopus__streak-fire">
            <rect fill="#EA580C" height="1.7" width="1.8" x="5.1" y="3.5" />
            <rect fill="#F97316" height="1.3" width="1.2" x="5.4" y="3.8" />
            <rect fill="#FBBF24" height="0.7" width="0.7" x="5.65" y="4.4" />
          </g>
          <text
            className="claude-octopus__streak-num"
            fill="#EA580C"
            fontSize="1.9"
            fontWeight="700"
            x="7.4"
            y="5.4"
          >
            7
          </text>
        </g>
      );

    case 'hoarding':
      return (
        <g className="claude-octopus__tabs">
          <rect
            className="claude-octopus__tab claude-octopus__tab--1"
            fill="#E7E5E4"
            height="1.2"
            rx="0.15"
            stroke="#A8A29E"
            strokeWidth="0.2"
            width="2.8"
            x="2.2"
            y="4.2"
          />
          <rect
            className="claude-octopus__tab claude-octopus__tab--2"
            fill="#F5F5F4"
            height="1.2"
            rx="0.15"
            stroke="#A8A29E"
            strokeWidth="0.2"
            width="2.8"
            x="2.8"
            y="3.5"
          />
          <rect
            className="claude-octopus__tab claude-octopus__tab--3"
            fill="#FAFAF9"
            height="1.2"
            rx="0.15"
            stroke="#A8A29E"
            strokeWidth="0.2"
            width="2.8"
            x="3.4"
            y="2.8"
          />
        </g>
      );

    case 'preaching':
      return (
        <g className="claude-octopus__megaphone">
          <path
            className="claude-octopus__horn"
            d="M2.5 10.5 L6.5 9.8 L6.5 11.2 Z"
            fill="#F97316"
          />
          <rect fill="#EA580C" height="1.4" rx="0.2" width="0.8" x="6.5" y="9.8" />
          <path
            className="claude-octopus__sound claude-octopus__sound--1"
            d="M1.5 9.5 Q0.5 10.5 1.5 11.5"
            fill="none"
            stroke="#F97316"
            strokeLinecap="round"
            strokeWidth="0.35"
          />
          <path
            className="claude-octopus__sound claude-octopus__sound--2"
            d="M0.8 8.8 Q-0.5 10.5 0.8 12.2"
            fill="none"
            stroke="#FB923C"
            strokeLinecap="round"
            strokeWidth="0.3"
          />
        </g>
      );

    case 'nesting':
      return (
        <g className="claude-octopus__nest">
          <path
            className="claude-octopus__blanket"
            d="M3 20.5 Q12 18.5 21 20.5 L21 22.5 Q12 21 3 22.5 Z"
            fill="#818CF8"
            opacity="0.85"
          />
          <path
            className="claude-octopus__headphone-band"
            d="M4.5 8.5 Q12 5.5 19.5 8.5"
            fill="none"
            stroke="#44403C"
            strokeLinecap="round"
            strokeWidth="0.5"
          />
          <rect fill="#44403C" height="1.6" rx="0.35" width="1.2" x="3.8" y="8.2" />
          <rect fill="#44403C" height="1.6" rx="0.35" width="1.2" x="19" y="8.2" />
        </g>
      );

    case 'ghosting':
      return (
        <g className="claude-octopus__ghost">
          <ellipse
            className="claude-octopus__ghost-aura"
            cx="12"
            cy="12"
            fill="#E7E5E4"
            opacity="0.35"
            rx="10"
            ry="10"
          />
          <text
            className="claude-octopus__ghost-text"
            fill="#A8A29E"
            fontSize="1.2"
            fontWeight="600"
            x="16.5"
            y="5.5"
          >
            ?
          </text>
        </g>
      );

    case 'flexing':
      return (
        <g className="claude-octopus__flex">
          <path
            className="claude-octopus__bicep claude-octopus__bicep--left"
            d="M2.5 14 Q4 11 6 13"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
          <path
            className="claude-octopus__bicep claude-octopus__bicep--right"
            d="M21.5 14 Q20 11 18 13"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.55"
          />
          <text className="claude-octopus__flex-emoji" fontSize="1.6" x="10.2" y="14.5">
            💪
          </text>
        </g>
      );

    case 'meditating':
      return (
        <g className="claude-octopus__meditate">
          <ellipse
            className="claude-octopus__halo"
            cx="12"
            cy="3.8"
            fill="none"
            rx="2.2"
            ry="0.45"
            stroke="#FBBF24"
            strokeWidth="0.35"
          />
          <path
            className="claude-octopus__om"
            d="M10.8 13.2 Q12 12.5 13.2 13.2"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeWidth="0.45"
          />
        </g>
      );

    case 'rewinding':
      return (
        <g className="claude-octopus__rewind">
          <path
            className="claude-octopus__rewind-arrow claude-octopus__rewind-arrow--1"
            d="M19.5 5.5 L17.5 7.5 L19.5 9.5"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="0.5"
          />
          <path
            className="claude-octopus__rewind-arrow claude-octopus__rewind-arrow--2"
            d="M21.5 5.5 L19.5 7.5 L21.5 9.5"
            fill="none"
            stroke="#6B3D2E"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="0.5"
          />
          <text
            className="claude-octopus__undo"
            fill="#DC2626"
            fontSize="1.1"
            fontWeight="700"
            x="3.2"
            y="6.2"
          >
            undo
          </text>
        </g>
      );

    default: {
      const extended = claudeOctopusExtendedPose(pose);
      if (!extended) {
        return null;
      }

      // Prefer the hand-drawn overlay; fall back to the emoji glyph for any
      // extended pose not yet migrated off the shared glyph+anim fallback.
      const overlay = extendedPoseOverlay(pose);
      if (overlay) {
        return overlay;
      }

      return (
        <g className="claude-octopus__glyph">
          <text className="claude-octopus__glyph-text" fontSize="2.2" x="16.8" y="6.8">
            {extended.glyph}
          </text>
        </g>
      );
    }
  }
};
