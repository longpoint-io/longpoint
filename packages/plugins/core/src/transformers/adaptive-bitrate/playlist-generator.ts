export interface ResolvedQuality {
  name: string;
  width?: number;
  height?: number;
  bitrate?: number;
  codec: string;
  isSource: boolean;
}

export interface VariantMapping {
  variant: {
    id: string;
  };
  qualityIndex: number;
  playlistType: 'HLS' | 'DASH';
}

interface HlsSegment {
  filename: string;
  duration: number;
}

/**
 * Parses HLS playlist content to extract segment information
 */
export function parseHlsSegments(hlsContent: string): Array<HlsSegment> {
  const segments: Array<HlsSegment> = [];
  const lines = hlsContent.split('\n');

  let currentDuration = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse #EXTINF duration
    if (line.startsWith('#EXTINF:')) {
      const durationMatch = line.match(/#EXTINF:([\d.]+)/);
      if (durationMatch) {
        currentDuration = parseFloat(durationMatch[1]);
      }
    }
    // Parse segment filename (non-comment, non-empty line after EXTINF)
    else if (
      line &&
      !line.startsWith('#') &&
      (line.endsWith('.m4s') || line.endsWith('.ts'))
    ) {
      // Extract just the filename (remove any path prefix)
      const filename = line.split('/').pop() || line;
      segments.push({
        filename,
        duration: currentDuration,
      });
      currentDuration = 0; // Reset for next segment
    }
  }

  return segments;
}

/**
 * Generates a DASH playlist for a single quality variant
 */
export function generateQualityDashPlaylist(
  quality: ResolvedQuality,
  hlsVariantId: string,
  hlsPlaylistContent: string = ''
): string {
  const bandwidth = (quality.bitrate || 2000) * 1000;
  const width =
    quality.width || Math.round(((quality.height || 1080) * 16) / 9);
  const height = quality.height || 1080;

  // Parse HLS playlist to extract segment information
  const segments = parseHlsSegments(hlsPlaylistContent);
  const timescale = 1000; // milliseconds

  // Calculate total duration for mediaPresentationDuration
  const totalDurationSeconds = segments.reduce(
    (sum, seg) => sum + seg.duration,
    0
  );
  const mediaPresentationDuration =
    totalDurationSeconds > 0
      ? ` mediaPresentationDuration="PT${totalDurationSeconds.toFixed(3)}S"`
      : '';

  // Generate SegmentList if we have segments, otherwise use SegmentTemplate as fallback
  let segmentElement = '';
  if (segments.length > 0) {
    const segmentListItems = segments
      .map((seg) => {
        const duration = Math.round(seg.duration * timescale);
        return `        <SegmentURL media="../${hlsVariantId}/segments/${seg.filename}" duration="${duration}"/>`;
      })
      .join('\n');

    segmentElement = `      <SegmentList timescale="${timescale}">
        <Initialization sourceURL="../${hlsVariantId}/init.mp4"/>
${segmentListItems}
      </SegmentList>`;
  } else {
    // Fallback to template if no segments parsed
    segmentElement = `      <SegmentTemplate media="../${hlsVariantId}/segments/segment_$Number%03d$.m4s" initialization="../${hlsVariantId}/init.mp4" startNumber="0" timescale="${timescale}" duration="6000"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" minBufferTime="PT2S" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011"${mediaPresentationDuration}>
  <Period>
    <AdaptationSet mimeType="video/mp4" segmentAlignment="true" startWithSAP="1">
      <Representation id="video" bandwidth="${bandwidth}" width="${width}" height="${height}" codecs="avc1.64001f">
${segmentElement}
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;
}

/**
 * Generates an HLS master playlist
 */
export function generateHlsMasterPlaylist(
  qualities: ResolvedQuality[],
  hlsMappings: VariantMapping[]
): string {
  let playlist = '#EXTM3U\n#EXT-X-VERSION:6\n\n';

  for (let i = 0; i < qualities.length; i++) {
    const quality = qualities[i];
    const mapping = hlsMappings.find((m) => m.qualityIndex === i);
    if (!mapping) continue;

    const bandwidth = (quality.bitrate || 2000) * 1000;
    const resolution =
      quality.width && quality.height
        ? `${quality.width}x${quality.height}`
        : quality.height
        ? `${Math.round((quality.height * 16) / 9)}x${quality.height}`
        : '1920x1080';

    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},NAME="${quality.name}"\n`;
    // Reference sibling variant folder by ID
    playlist += `../${mapping.variant.id}/playlist.m3u8\n\n`;
  }

  return playlist;
}

/**
 * Generates a DASH master manifest
 */
export function generateDashMasterManifest(
  qualities: ResolvedQuality[],
  variantMap: VariantMapping[],
  hlsPlaylistContents: Map<number, string>
): string {
  const timescale = 1000;
  const representations = qualities
    .map((quality, index) => {
      // Find HLS variant for this quality (segments are stored there)
      const hlsMapping = variantMap.find(
        (m) => m.qualityIndex === index && m.playlistType === 'HLS'
      );
      if (!hlsMapping) return '';

      const bandwidth = (quality.bitrate || 2000) * 1000;
      const width =
        quality.width || Math.round(((quality.height || 1080) * 16) / 9);
      const height = quality.height || 1080;

      // Parse HLS playlist to get segment information
      const hlsContent = hlsPlaylistContents.get(index) || '';
      const segments = parseHlsSegments(hlsContent);

      // Generate SegmentList if we have segments, otherwise use SegmentTemplate as fallback
      let segmentElement = '';
      if (segments.length > 0) {
        const segmentListItems = segments
          .map((seg) => {
            const duration = Math.round(seg.duration * timescale);
            return `        <SegmentURL media="../${hlsMapping.variant.id}/segments/${seg.filename}" duration="${duration}"/>`;
          })
          .join('\n');

        segmentElement = `      <SegmentList timescale="${timescale}">
        <Initialization sourceURL="../${hlsMapping.variant.id}/init.mp4"/>
${segmentListItems}
      </SegmentList>`;
      } else {
        // Fallback to template if no segments parsed
        segmentElement = `      <SegmentTemplate media="../${hlsMapping.variant.id}/segments/segment_$Number%03d$.m4s" initialization="../${hlsMapping.variant.id}/init.mp4" startNumber="0" timescale="${timescale}" duration="6000"/>`;
      }

      return `      <Representation id="${quality.name}" bandwidth="${bandwidth}" width="${width}" height="${height}" codecs="avc1.64001f">
${segmentElement}
      </Representation>`;
    })
    .filter((r) => r !== '')
    .join('\n');

  // Calculate total duration from first quality's segments (all qualities should have same duration)
  let totalDurationSeconds = 0;
  if (qualities.length > 0) {
    const firstQualityIndex = 0;
    const firstHlsContent = hlsPlaylistContents.get(firstQualityIndex) || '';
    const firstSegments = parseHlsSegments(firstHlsContent);
    totalDurationSeconds = firstSegments.reduce(
      (sum, seg) => sum + seg.duration,
      0
    );
  }
  const mediaPresentationDuration =
    totalDurationSeconds > 0
      ? ` mediaPresentationDuration="PT${totalDurationSeconds.toFixed(3)}S"`
      : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" minBufferTime="PT2S" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011"${mediaPresentationDuration}>
  <Period>
    <AdaptationSet mimeType="video/mp4" segmentAlignment="true" startWithSAP="1">
${representations}
    </AdaptationSet>
  </Period>
</MPD>`;
}
