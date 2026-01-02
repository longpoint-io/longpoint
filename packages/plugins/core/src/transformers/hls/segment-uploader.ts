import { TransformArgs } from '@longpoint/devkit';
import { createReadStream, watch } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { HlsInput } from './input.js';

type OutputVariant = TransformArgs<HlsInput>['variants'][0];

export class SegmentUploader {
  private readonly tempDir: string;
  private readonly outputVariant: OutputVariant;
  private readonly uploadedFiles = new Set<string>();
  private readonly processingFiles = new Set<string>();
  private readonly uploadQueue: string[] = [];
  private isProcessingQueue = false;
  private watcher: ReturnType<typeof watch> | null = null;

  constructor(tempDir: string, outputVariant: OutputVariant) {
    this.tempDir = tempDir;
    this.outputVariant = outputVariant;
  }

  setupWatcher(): void {
    this.watcher = watch(this.tempDir, (eventType, filename) => {
      if (!filename || !filename.endsWith('.ts')) return;
      if (
        this.uploadedFiles.has(filename) ||
        this.processingFiles.has(filename)
      )
        return;
      if (eventType !== 'rename') return;

      if (!this.uploadQueue.includes(filename)) {
        this.uploadQueue.push(filename);
        this.processUploadQueue().catch((error) => {
          console.error('Error processing upload queue:', error);
        });
      }
    });
  }

  async waitForCompletion(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    while (this.isProcessingQueue || this.uploadQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async queueRemainingSegments(): Promise<void> {
    const files = await fs.readdir(this.tempDir);
    for (const file of files) {
      if (
        file.endsWith('.ts') &&
        !this.uploadedFiles.has(file) &&
        !this.processingFiles.has(file) &&
        !this.uploadQueue.includes(file)
      ) {
        this.uploadQueue.push(file);
      }
    }
    await this.processUploadQueue();
  }

  async uploadRemainingSegments(): Promise<void> {
    const files = await fs.readdir(this.tempDir);
    for (const file of files) {
      if (file.endsWith('.ts') && !this.uploadedFiles.has(file)) {
        const filePath = path.join(this.tempDir, file);
        try {
          await fs.access(filePath);
          const stats = await fs.stat(filePath);
          if (stats.size === 0) {
            console.warn(`Skipping empty segment ${file}`);
            continue;
          }

          await this.uploadSegmentFile(file);
        } catch (error) {
          console.error(`Failed to upload remaining segment ${file}:`, error);
        }
      }
    }
  }

  cleanup(): void {
    if (this.watcher) {
      this.watcher.close();
    }
  }

  private async processUploadQueue(): Promise<void> {
    if (this.isProcessingQueue || this.uploadQueue.length === 0) return;
    this.isProcessingQueue = true;

    while (this.uploadQueue.length > 0) {
      const filename = this.uploadQueue.shift();
      if (
        !filename ||
        this.uploadedFiles.has(filename) ||
        this.processingFiles.has(filename)
      ) {
        continue;
      }

      this.processingFiles.add(filename);
      try {
        await this.uploadSegmentFile(filename);
      } catch (error) {
        console.error(`Failed to upload segment ${filename}:`, error);
      } finally {
        this.processingFiles.delete(filename);
      }
    }

    this.isProcessingQueue = false;
  }

  private async uploadSegmentFile(filename: string): Promise<void> {
    const filePath = path.join(this.tempDir, filename);
    await this.waitForFileStability(filePath);

    const relativePath = `segments/${filename}`;
    const fileStream = createReadStream(filePath);
    await this.outputVariant.fileOperations.write(relativePath, fileStream);

    this.uploadedFiles.add(filename);

    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      if ((unlinkError as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Failed to delete temp file ${filename}:`, unlinkError);
      }
    }
  }

  private async waitForFileStability(
    filePath: string,
    maxWaitTime = 5000
  ): Promise<void> {
    let previousSize = -1;
    let stableCount = 0;
    const startTime = Date.now();

    while (stableCount < 3 && Date.now() - startTime < maxWaitTime) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.size === previousSize && stats.size > 0) {
          stableCount++;
        } else {
          stableCount = 0;
          previousSize = stats.size;
        }
        if (stableCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          await new Promise((resolve) => setTimeout(resolve, 200));
          continue;
        }
        throw error;
      }
    }

    await fs.access(filePath);
    const finalStats = await fs.stat(filePath);
    if (finalStats.size === 0) {
      throw new Error('File is empty');
    }
  }
}
