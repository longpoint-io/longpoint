import { spawn } from 'child_process';
import { Readable } from 'stream';

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
    outputFn: (stdout: Readable) => void | Promise<void>
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
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`ffmpeg process failed: ${err.message}`));
      });
    });

    const outputPromise = outputFn(ffmpeg.stdout);

    await Promise.all([ffmpegPromise, outputPromise]);
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
          reject(new Error(`ffprobe exited with code ${code}: ${stderrData}`));
        }
      });

      ffprobe.on('error', (err) => {
        reject(new Error(`ffprobe process failed: ${err.message}`));
      });
    });

    const outputPromise = outputFn(ffprobe.stdout);

    await Promise.all([ffprobePromise, outputPromise]);
  }
}
