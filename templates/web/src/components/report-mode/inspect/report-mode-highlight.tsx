import { hexToRgba } from '@vybekiit/report-mode';

interface ReportModeHighlightProps {
  readonly rect: DOMRect;
  readonly color: string;
}

/**
 * Render the inspect highlight ring around a DOM rect.
 *
 * @param props - Target rectangle plus highlight color.
 * @returns Fixed-position highlight overlay.
 * @example
 * <ReportModeHighlight rect={rect} color="#3b82f6" />
 */
const ReportModeHighlight = ({ rect, color }: ReportModeHighlightProps) => (
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

export { ReportModeHighlight };
