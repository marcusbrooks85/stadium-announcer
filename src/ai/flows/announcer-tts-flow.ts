'use server';
/**
 * @fileOverview A Genkit flow for generating professional stadium announcer audio.
 *
 * - generateAnnouncerAudio - A function that handles the TTS process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const TTSInputSchema = z.object({
  text: z.string().describe('The script text to be read by the announcer.'),
  voice: z.string().optional().describe('The prebuilt voice name (e.g., Algenib, Achernar).').default('Algenib'),
});

export type TTSInput = z.infer<typeof TTSInputSchema>;

export async function generateAnnouncerAudio(input: TTSInput): Promise<{ media: string }> {
  return announcerTTSFlow(input);
}

const announcerTTSFlow = ai.defineFlow(
  {
    name: 'announcerTTSFlow',
    inputSchema: TTSInputSchema,
    outputSchema: z.object({
      media: z.string().describe('Base64 encoded WAV audio as a data URI.'),
    }),
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voice },
          },
        },
      },
      prompt: input.text,
    });

    if (!media || !media.url) {
      throw new Error('No audio media returned from the TTS model.');
    }

    // Gemini returns audio in PCM format, we need to wrap it in a WAV header
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

/**
 * Converts raw PCM data to a WAV formatted base64 string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}