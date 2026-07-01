import type { Format } from '@number-flow/react';

export interface ParsedDisplayNumber {
  readonly value: number;
  readonly prefix: string;
  readonly suffix: string;
  readonly format?: Format;
}

function withFormat(
  base: Omit<ParsedDisplayNumber, 'format'>,
  format?: Format,
): ParsedDisplayNumber {
  return format ? { ...base, format } : base;
}

/** Parse a display string into NumberFlow props (prefix / numeric value / suffix). */
export function parseDisplayNumber(input: string): ParsedDisplayNumber | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // "$1,200k" → ["", "$", "1,200", "k"]; optional +/$ sign, then $, grouped number, optional k/+
  const currencyMatch = trimmed.match(/^([+$]?)(\$)([\d,]+(?:\.\d+)?)(k|\+)?$/i);
  if (currencyMatch) {
    const sign = currencyMatch[1] ?? '';
    const numPart = currencyMatch[3] ?? '';
    const unit = currencyMatch[4] ?? '';
    const numeric = Number(numPart.replaceAll(',', ''));
    if (Number.isNaN(numeric)) {
      return null;
    }
    const decimals = numPart.includes('.') ? (numPart.split('.')[1]?.length ?? 2) : 0;
    return withFormat(
      { value: numeric, prefix: `${sign}$`, suffix: unit },
      decimals > 0
        ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
        : undefined,
    );
  }

  // "+12.5%" → ["+12.5", "%"]; optional leading +, a number, required trailing %
  const percentMatch = trimmed.match(/^([+]?\d+(?:\.\d+)?)(%)$/);
  if (percentMatch) {
    const numPart = percentMatch[1] ?? '';
    const pct = percentMatch[2] ?? '';
    const numeric = Number(numPart.replace('+', ''));
    if (Number.isNaN(numeric)) {
      return null;
    }
    return withFormat(
      {
        value: numeric,
        prefix: numPart.startsWith('+') ? '+' : '',
        suffix: pct,
      },
      numPart.includes('.') ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : undefined,
    );
  }

  // "500+" → ["500", "+"]; digits then a trailing +
  const plusSuffixMatch = trimmed.match(/^(\d+)(\+)$/);
  if (plusSuffixMatch) {
    return { value: Number(plusSuffixMatch[1]), prefix: '', suffix: plusSuffixMatch[2] ?? '' };
  }

  // "1,200 users" → ["1,200", " users"]; optional +, grouped/decimal number, then any suffix
  const plainNumberMatch = trimmed.match(/^([+]?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (plainNumberMatch) {
    const numPart = plainNumberMatch[1] ?? '';
    const rest = plainNumberMatch[2] ?? '';
    // strip a leading "+" then thousands separators: "+1,200" → "1200"
    const normalizedNum = numPart.replace(/^\+/, '').replaceAll(',', '');
    const numeric = Number(normalizedNum);
    if (Number.isNaN(numeric)) {
      return null;
    }
    const hadGrouping = numPart.includes(',');
    let format: Format | undefined;
    if (normalizedNum.includes('.')) {
      format = {
        minimumFractionDigits: normalizedNum.split('.')[1]?.length ?? 1,
        maximumFractionDigits: 2,
        useGrouping: hadGrouping,
      };
    } else if (hadGrouping) {
      format = { useGrouping: true, maximumFractionDigits: 0 };
    }
    return withFormat(
      {
        value: numeric,
        prefix: numPart.startsWith('+') ? '+' : '',
        suffix: rest,
      },
      format,
    );
  }

  return null;
}
