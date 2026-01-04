import { TransformArgs } from '@longpoint/devkit';
import { createReadStream, watch } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { AdaptiveBitrateStreamInput } from './input.js';

type OutputVariant = TransformArgs<AdaptiveBitrateStreamInput>['variants'][0];

/**
 * Handles uploading segments for multiple quality renditions.
 * Each quality has its own subdirectory and corresponding variant.
 */
export class MultiQualitySegmentUploader {
  private readonly uploaders: Map<string, QualityUploader> = new Map();

  constructor(
    tempDir: string,
    qualityVariants: OutputVariant[],
    qualityDirs: string[]
  ) {
    // Create an uploader for each quality
    for (let i = 0; i < qualityDirs.length; i++) {
      const qualityDir = qualityDirs[i];
      const variant = qualityVariants[i];
      const fullQualityDir = path.join(tempDir, qualityDir);
      this.uploaders.set(
        qualityDir,
        new QualityUploader(fullQualityDir, variant)
      );
    }
  }

  setupWatchers(): void {
    for (const uploader of this.uploaders.values()) {
      uploader.setupWatcher();
    }
  }

  async waitForCompletion(): Promise<void> {
    await Promise.all(
      Array.from(this.uploaders.values()).map((u) => u.waitForCompletion())
    );
  }

  async queueRemainingSegments(): Promise<void> {
    await Promise.all(
      Array.from(this.uploaders.values()).map((u) => u.queueRemainingSegments())
    );
  }

  async uploadRemainingSegments(): Promise<void> {
    await Promise.all(
      Array.from(this.uploaders.values()).map((u) =>
        u.uploadRemainingSegments()
      )
    );
  }

  cleanup(): void {
    for (const uploader of this.uploaders.values()) {
      uploader.cleanup();
    }
  }
}

/**
 * Handles uploading segments for a single quality rendition.
 */
class QualityUploader {
  private readonly qualityDir: string;
  private readonly outputVariant: OutputVariant;
  private readonly uploadedFiles = new Set<string>();
  private readonly processingFiles = new Set<string>();
  private readonly uploadQueue: string[] = [];
  private isProcessingQueue = false;
  private watcher: ReturnType<typeof watch> | null = null;

  constructor(qualityDir: string, outputVariant: OutputVariant) {
    this.qualityDir = qualityDir;
    this.outputVariant = outputVariant;
  }

  setupWatcher(): void {
    this.watcher = watch(this.qualityDir, (eventType, filename) => {
      if (!filename || !this.isSegmentFile(filename)) return;
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
    try {
      const files = await fs.readdir(this.qualityDir);
      for (const file of files) {
        if (
          this.isSegmentFile(file) &&
          !this.uploadedFiles.has(file) &&
          !this.processingFiles.has(file) &&
          !this.uploadQueue.includes(file)
        ) {
          this.uploadQueue.push(file);
        }
      }
      await this.processUploadQueue();
    } catch {
      // Directory may not exist yet
    }
  }

  async uploadRemainingSegments(): Promise<void> {
    try {
      const files = await fs.readdir(this.qualityDir);
      for (const file of files) {
        if (this.isSegmentFile(file) && !this.uploadedFiles.has(file)) {
          const filePath = path.join(this.qualityDir, file);
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
    } catch {
      // Directory may not exist
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
    const filePath = path.join(this.qualityDir, filename);
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

  private isSegmentFile(filename: string): boolean {
    return filename.endsWith('.m4s');
  }
}
