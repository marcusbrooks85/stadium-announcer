'use server';
/**
 * @fileOverview A Genkit flow for generating standardized stadium announcer scripts.
 *
 * - runAnnouncementGenerator - A function that handles the generation process.
 * - AnnouncementInput - The input type for the generator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnnouncementInputSchema = z.object({
  playerName: z.string().describe('The name of the baseball player.'),
  playerNumber: z.number().describe('The jersey number of the player.'),
});

export type AnnouncementInput = z.infer<typeof AnnouncementInputSchema>;

const AnnouncementOutputSchema = z.object({
  script: z.string().describe('The standardized stadium announcement script.'),
});

const prompt = ai.definePrompt({
  name: 'announcementPrompt',
  input: { schema: AnnouncementInputSchema },
  output: { schema: AnnouncementOutputSchema },
  prompt: `You are a professional stadium announcer. 

Output exactly this script for the batter:
"NOW BATTING, NUMBER {{{playerNumber}}}, {{{playerName}}}!"

STRICT INSTRUCTIONS:
- NO other text.
- NO stats.
- NO ad-libs.
- NO stage directions.`,
});

const announcementFlow = ai.defineFlow(
  {
    name: 'announcementFlow',
    inputSchema: AnnouncementInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await prompt(input);
    // Fallback to a safe default if needed
    return output?.script || `NOW BATTING, NUMBER ${input.playerNumber}, ${input.playerName.toUpperCase()}!`;
  }
);

/**
 * Runs the announcement generator flow.
 * @param input The player details.
 * @returns A standardized announcer script.
 */
export async function runAnnouncementGenerator(input: AnnouncementInput): Promise<string> {
  return announcementFlow(input);
}
