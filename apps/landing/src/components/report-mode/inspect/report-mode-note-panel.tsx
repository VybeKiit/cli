'use client';

import {
  ReportCancelIcon,
  ReportCopyIcon,
  ReportSendIcon,
} from '@/components/report-mode/shared/report-mode-icons';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface ReportModeNotePanelProps {
  readonly note: string;
  readonly spotLabel: string;
  readonly submitting: boolean;
  readonly copying?: boolean;
  readonly onNoteChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly onCopySpot: () => void;
}

/** One-line builder note after clicking a broken spot. */
export function ReportModeNotePanel({
  note,
  spotLabel,
  submitting,
  copying = false,
  onNoteChange,
  onSubmit,
  onCancel,
  onCopySpot,
}: ReportModeNotePanelProps) {
  return (
    <div
      className="report-mode-note-panel rounded-lg border border-white/15 bg-[#0d1117] p-4 shadow-lg"
      data-report-mode-ui={true}
      data-report-tutorial="inspect"
      data-testid="report-mode-note-panel"
    >
      <p className="mb-2 font-medium text-sm text-white">What looks wrong here?</p>

      <div className="report-mode-note-spot mb-3 flex items-center gap-2">
        <p className="min-w-0 flex-1 text-white/55 text-xs">
          <span className="text-white/70">You pointed at:</span>{' '}
          <span
            className="report-mode-note-spot-label text-white/90"
            data-testid="report-mode-spot-label"
            title={spotLabel}
          >
            {spotLabel}
          </span>
        </p>
        <button
          aria-label="Copy spot"
          className="report-mode-note-btn report-mode-note-btn--copy shrink-0"
          data-testid="report-mode-copy-spot"
          disabled={!spotLabel.trim() || copying}
          onClick={onCopySpot}
          type="button"
          aria-busy={copying}
        >
          {copying ? <Spinner className="size-3.5" /> : <ReportCopyIcon />}
          <span>Copy</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          autoFocus={true}
          className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
          data-testid="report-mode-note-input"
          onChange={(event) => onNoteChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSubmit();
            }
          }}
          placeholder="e.g. typewriter too fast on testimonials"
          value={note}
        />
        <div className="flex gap-2">
          <button
            className={cn(
              'report-mode-note-btn report-mode-note-btn--send',
              (submitting || !note.trim()) && 'report-mode-note-btn--disabled',
            )}
            data-testid="report-mode-send"
            disabled={submitting || !note.trim()}
            onClick={onSubmit}
            type="button"
            aria-busy={submitting}
          >
            {submitting ? <Spinner className="size-3.5" /> : <ReportSendIcon />}
            <span>Send</span>
          </button>
          <button
            className="report-mode-note-btn report-mode-note-btn--cancel"
            onClick={onCancel}
            type="button"
          >
            <ReportCancelIcon />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
