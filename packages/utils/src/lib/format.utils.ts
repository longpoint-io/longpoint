/**
 * Formats a number of bytes into a human-readable string
 * @param bytes - The number of bytes to format
 * @returns A formatted string with appropriate unit (B, KB, MB, GB, TB)
 *
 * @example
 * formatBytes(1024) // "1.0 KB"
 * formatBytes(2560) // "2.5 KB"
 * formatBytes(1342984) // "1.3 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const divisor = 1000;

  const unitIndex = Math.floor(Math.log(absBytes) / Math.log(divisor));
  const clampedIndex = Math.max(0, Math.min(unitIndex, units.length - 1));
  const value = absBytes / Math.pow(divisor, clampedIndex);
  const formattedValue = value.toFixed(1).replace(/\.0$/, '');
  const sign = isNegative ? '-' : '';

  return `${sign}${formattedValue} ${units[clampedIndex]}`;
}

/**
 * Parses a human-readable byte string into a number of bytes
 * Uses decimal (1000-based) units to match formatBytes behavior
 * @param sizeString - The size string to parse (e.g., "5MB", "1.5 GB", "1000 KB")
 * @returns The number of bytes
 * @throws Error if the string cannot be parsed
 *
 * @example
 * parseBytes("5MB") // 5000000 (5 * 1000 * 1000)
 * parseBytes("1.5GB") // 1500000000 (1.5 * 1000 * 1000 * 1000)
 * parseBytes("0B") // 0
 * parseBytes("1000") // 1000
 */
export function parseBytes(sizeString: string): number {
  const trimmed = sizeString.trim();
  if (trimmed === '' || trimmed === '0') return 0;

  const match = trimmed.match(/^(-?\d+\.?\d*)\s*([a-zA-Z]+)?$/);
  if (!match) {
    throw new Error(`Cannot parse size string: "${sizeString}"`);
  }

  const value = parseFloat(match[1]);
  const rawUnit = match[2] || 'B';
  const unit = rawUnit.toUpperCase();

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1000,
    MB: 1000 ** 2,
    GB: 1000 ** 3,
    TB: 1000 ** 4,
  };

  const multiplier = multipliers[unit];
  if (!multiplier) {
    throw new Error(`Unknown unit: "${unit}"`);
  }

  return Math.round(value * multiplier);
}

/**
 * Duration formatting styles
 */
export type DurationStyle =
  | 'hhmmss' // Always show hours: "01:02:03"
  | 'mmss' // Only show hours if > 0: "02:03" or "1:02:03"
  | 'hmmss' // No leading zero on hours: "1:02:03"
  | 'mss' // No leading zeros: "2:03" or "1:2:03"
  | 'compact' // Compact with units: "1h 2m 3s" or "2m 3s"
  | 'verbose' // Full words: "1 hour 2 minutes 3 seconds"
  | 'iso' // ISO 8601 duration: "PT1H2M3S"
  | 'short' // Short units: "1h 2m 3s" (always show all units)
  | 'long'; // Long units: "1hr 2min 3sec" (always show all units);

/**
 * Formats a duration in seconds into a human-readable string
 * @param duration - The duration in seconds
 * @param style - The formatting style to use (default: 'hhmmss')
 * @returns A formatted string with appropriate format
 *
 * @example
 * formatDuration(120) // "00:02:00"
 * formatDuration(120, 'mmss') // "02:00"
 * formatDuration(3661, 'compact') // "1h 1m 1s"
 * formatDuration(3661, 'verbose') // "1 hour 1 minute 1 second"
 * formatDuration(3661, 'iso') // "PT1H1M1S"
 * formatDuration(90, 'mmss') // "01:30"
 * formatDuration(90, 'mss') // "1:30"
 */
export function formatDuration(
  duration: number,
  style: DurationStyle = 'hhmmss'
): string {
  if (duration < 0) {
    duration = 0;
  }

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  switch (style) {
    case 'hhmmss':
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0'
      )}:${String(seconds).padStart(2, '0')}`;

    case 'mmss':
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(
          seconds
        ).padStart(2, '0')}`;
      }
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
        2,
        '0'
      )}`;

    case 'hmmss':
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(
        seconds
      ).padStart(2, '0')}`;

    case 'mss':
      if (hours > 0) {
        return `${hours}:${minutes}:${String(seconds).padStart(2, '0')}`;
      }
      return `${minutes}:${String(seconds).padStart(2, '0')}`;

    case 'compact': {
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
      return parts.join(' ');
    }

    case 'verbose': {
      const parts: string[] = [];
      if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
      }
      if (minutes > 0) {
        parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
      }
      if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
      }
      return parts.join(' ');
    }

    case 'iso': {
      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours}H`);
      if (minutes > 0) parts.push(`${minutes}M`);
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}S`);
      return `PT${parts.join('')}`;
    }

    case 'short':
      return `${hours}h ${minutes}m ${seconds}s`;

    case 'long':
      return `${hours}hr ${minutes}min ${seconds}sec`;

    default:
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0'
      )}:${String(seconds).padStart(2, '0')}`;
  }
}
