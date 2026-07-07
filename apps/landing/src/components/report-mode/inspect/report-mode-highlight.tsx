import { hexToRgba } from '@vybekiit/report-mode';

interface ReportModeHighlightProps {
  readonly rect: DOMRect;
  readonly color: string;
}

/**
 * Ring around the hovered or selected element during pick mode.
 *
 * @param props - Component props.
 * @returns The rendered ReportModeHighlight element.
 * @example
 * ```tsx
 * <ReportModeHighlight />
 * ```
 */

export const ReportModeHighlight = ({ rect, color }: ReportModeHighlightProps) => (
  <div
    className="pointer-events-none fixed z-[9997] rounded border-2"
    data-report-mode-ui={true}
    data-testid="report-mode-highlight"
    style={{
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderColor: color,
      backgroundColor: hexToRgba(color, 0.2),
    }}
  />
);
