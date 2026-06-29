interface ReportModeHighlightProps {
  readonly rect: DOMRect;
}

/** Ring around the hovered or selected element during pick mode. */
export function ReportModeHighlight({ rect }: ReportModeHighlightProps) {
  return (
    <div
      className="pointer-events-none fixed z-[9997] rounded border-2 border-amber-500 bg-amber-400/20"
      data-report-mode-ui={true}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}
