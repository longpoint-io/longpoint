import { spawn } from 'child_process';
import { Readable } from 'stream';

/**
 * Parse FFmpeg stderr output to extract meaningful error messages.
 * Removes version info, build config, and other noise.
 */
export function parseFFmpegError(stderr: string): string {
  const lines = stderr.split('\n');
  const errorLines: string[] = [];

  // Skip version info and build config (usually at the start)
  let skipVersion = true;
  let foundError = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Stop skipping when we see input info or stream mapping
    if (
      trimmed.startsWith('Input #') ||
      trimmed.startsWith('Stream mapping:')
    ) {
      skipVersion = false;
      continue;
    }

    // Skip version/build info
    if (
      skipVersion &&
      (trimmed.includes('ffmpeg version') ||
        trimmed.includes('built with') ||
        trimmed.includes('configuration:') ||
        trimmed.startsWith('lib'))
    ) {
      continue;
    }

    // Skip informational lines
    if (
      trimmed.startsWith('Press [') ||
      trimmed.startsWith('frame=') ||
      trimmed.startsWith('size=') ||
      trimmed.includes('Qavg:')
    ) {
      continue;
    }

    // Look for error indicators
    if (
      trimmed.toLowerCase().includes('error') ||
      trimmed.toLowerCase().includes('failed') ||
      trimmed.toLowerCase().includes('invalid')
    ) {
      foundError = true;
      errorLines.push(trimmed);
    } else if (foundError && trimmed.length > 0) {
      // Include context lines after errors
      if (!trimmed.startsWith('[') || trimmed.includes('Error')) {
        errorLines.push(trimmed);
      }
    }
  }

  // If we found specific errors, return them
  if (errorLines.length > 0) {
    return errorLines.join('. ').replace(/\s+/g, ' ').trim();
  }

  // Fallback: look for common error patterns
  const commonErrors = [
    /height not divisible by (\d+)/i,
    /width not divisible by (\d+)/i,
    /not divisible by (\d+)/i,
    /Error while opening encoder/i,
    /Could not open encoder/i,
    /Conversion failed/i,
  ];

  for (const pattern of commonErrors) {
    const match = stderr.match(pattern);
    if (match) {
      const context = stderr.substring(
        Math.max(0, stderr.indexOf(match[0]) - 200),
        stderr.indexOf(match[0]) + 500
      );
      return context
        .split('\n')
        .filter((l) => l.trim().length > 0 && !l.includes('ffmpeg version'))
        .slice(0, 5)
        .join('. ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  // Last resort: return a cleaned version of the last meaningful lines
  const meaningfulLines = lines
    .filter((l) => {
      const t = l.trim();
      return (
        t.length > 0 &&
        !t.includes('ffmpeg version') &&
        !t.includes('built with') &&
        !t.includes('configuration:') &&
        !t.startsWith('lib') &&
        !t.startsWith('frame=') &&
        !t.startsWith('size=')
      );
    })
    .slice(-10);

  return (
    meaningfulLines.join('. ').replace(/\s+/g, ' ').trim() ||
    'FFmpeg conversion failed'
  );
}

abstract class BaseCommand {
  protected args: string[] = [];

  arg(arg0: string, arg1?: string): this {
    this.args.push(arg0);
    if (arg1) {
      this.args.push(arg1);
    }
    return this;
  }

  abstract toString(): string;
}

export class FFmpegCommand extends BaseCommand {
  toString(): string {
    return `ffmpeg ${this.args.join(' ')}`;
  }

  async execute(
    outputFn: (stdout: Readable) => void | Promise<void>,
    parseError?: (stderr: string, code: number) => Error
  ): Promise<void> {
    const ffmpeg = spawn('ffmpeg', this.args);

    let stderrData = '';
    ffmpeg.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    const ffmpegPromise = new Promise((resolve, reject) => {
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          const exitCode = code ?? -1;
          if (parseError) {
            reject(parseError(stderrData, exitCode));
          } else {
            const parsedError = parseFFmpegError(stderrData);
            reject(
              new Error(
                `ffmpeg exited with code ${exitCode}${
                  parsedError ? `: ${parsedError}` : ''
                }`
              )
            );
          }
        }
      });

      ffmpeg.on('error', (err) => {
        reject(
          new Error(
            `Failed to start ffmpeg: ${err.message}. Make sure FFmpeg is installed and accessible.`
          )
        );
      });
    });

    const outputPromise = outputFn(ffmpeg.stdout);

    await Promise.all([ffmpegPromise, outputPromise]);
  }

  /**
   * Execute FFmpeg with file-based output (not stdout).
   * Useful for formats like HLS that write to multiple files.
   *
   * @param onStderr Optional callback to receive stderr data as it's produced
   * @param parseError Optional function to parse and format error messages from stderr
   * @returns Promise that resolves with stderr output on success, or rejects with a parsed error
   */
  async executeToFiles(
    onStderr?: (data: string) => void,
    parseError?: (stderr: string, code: number) => Error
  ): Promise<string> {
    const ffmpeg = spawn('ffmpeg', this.args);

    let stderrData = '';
    ffmpeg.stderr.on('data', (data) => {
      const dataStr = data.toString();
      stderrData += dataStr;
      onStderr?.(dataStr);
    });

    const ffmpegPromise = new Promise<string>((resolve, reject) => {
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(stderrData);
        } else {
          const exitCode = code ?? -1;
          if (parseError) {
            reject(parseError(stderrData, exitCode));
          } else {
            const parsedError = parseFFmpegError(stderrData);
            reject(
              new Error(
                `ffmpeg exited with code ${exitCode}${
                  parsedError ? `: ${parsedError}` : ''
                }`
              )
            );
          }
        }
      });

      ffmpeg.on('error', (err) => {
        reject(
          new Error(
            `Failed to start ffmpeg: ${err.message}. Make sure FFmpeg is installed and accessible.`
          )
        );
      });
    });

    // Discard stdout if any (for file-based output, stdout is usually empty)
    ffmpeg.stdout.on('data', () => {
      // Ignore stdout for file-based output
    });

    return ffmpegPromise;
  }
}

export class FFprobeCommand extends BaseCommand {
  toString(): string {
    return `ffprobe ${this.args.join(' ')}`;
  }

  async execute(
    outputFn: (stdout: Readable) => void | Promise<void>
  ): Promise<void> {
    const ffprobe = spawn('ffprobe', this.args);

    let stderrData = '';
    ffprobe.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    const ffprobePromise = new Promise((resolve, reject) => {
      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve(void 0);
        } else {
          const exitCode = code ?? -1;
          const parsedError = parseFFmpegError(stderrData);
          reject(
            new Error(
              `ffprobe exited with code ${exitCode}${
                parsedError ? `: ${parsedError}` : ''
              }`
            )
          );
        }
      });

      ffprobe.on('error', (err) => {
        reject(new Error(`ffprobe process failed: ${err.message}`));
      });
    });

    const outputPromise = outputFn(ffprobe.stdout);

    await Promise.all([ffprobePromise, outputPromise]);
  }

  async executeAndReturnOutput(): Promise<string> {
    let outputData = '';
    await this.execute(async (stdout) => {
      for await (const chunk of stdout) {
        outputData += chunk.toString();
      }
    });
    return outputData;
  }
}
