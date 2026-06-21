'use server';
/**
 * @fileOverview A Genkit flow for generating dynamic, hype-filled baseball announcer scripts.
 *
 * - runAnnouncementGenerator - A function that handles the generation process.
 * - AnnouncementInput - The input type for the generator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnnouncementInputSchema = z.object({
  playerName: z.string().describe('The name of the baseball player.'),
  playerNumber: z.number().describe('The jersey number of the player.'),
  stats: z.object({
    ab: z.number(),
    h: z.number(),
    r: z.number(),
    rbi: z.number(),
  }).describe('The current game statistics for the player.'),
});

export type AnnouncementInput = z.infer<typeof AnnouncementInputSchema>;

const prompt = ai.definePrompt({
  name: 'announcementPrompt',
  input: { schema: AnnouncementInputSchema },
  output: { schema: z.string() },
  prompt: `You are a professional stadium announcer for a Major League Baseball game. 
Your job is to introduce the next batter with maximum hype and energy.

Use the following player details:
Name: {{{playerName}}}
Number: {{{playerNumber}}}
Today's Stats: {{{stats.h}}} hits in {{{stats.ab}}} at-bats, with {{{stats.rbi}}} RBIs.

Instructions:
1. Be energetic, loud (use capitalization for emphasis if needed), and rhythmic.
2. Mention their number and name.
3. If they have hits or RBIs today, mention their "hot bat" or "productive day" at the plate.
4. Keep it concise enough to be read in 5-10 seconds.
5. Do NOT include any stage directions like [Music starts] or [Cheering]. Just the spoken words.

Announcement:`,
});

const announcementFlow = ai.defineFlow(
  {
    name: 'announcementFlow',
    inputSchema: AnnouncementInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await prompt(input);
    return output || `NOW AT BAT, NUMBER ${input.playerNumber}, ${input.playerName.toUpperCase()}!`;
  }
);

/**
 * Runs the announcement generator flow.
 * @param input The player details and stats.
 * @returns A hype-filled announcer script.
 */
export async function runAnnouncementGenerator(input: AnnouncementInput): Promise<string> {
  return announcementFlow(input);
}
