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

const AnnouncementOutputSchema = z.object({
  script: z.string().describe('The energetic stadium announcement script.'),
});

const prompt = ai.definePrompt({
  name: 'announcementPrompt',
  input: { schema: AnnouncementInputSchema },
  output: { schema: AnnouncementOutputSchema },
  prompt: `You are a professional stadium announcer. 
Your job is to introduce the next batter using ONLY the data provided.

Use the following player details:
Name: {{{playerName}}}
Number: {{{playerNumber}}}
Today's Stats: {{{stats.h}}} hits in {{{stats.ab}}} at-bats, with {{{stats.rbi}}} RBIs.

Pronunciation Guidelines:
- Jimena: "he-men-uh"
- Jacobo: "ha-co-bo"

STRICT INSTRUCTIONS:
1. NO AD-LIBS. Do not add phrases like "He's looking good today" or "The crowd is going wild."
2. STICK TO THE LISTED INFO: Name, Number, and Hits/RBIs.
3. TONE VARIATION: You can vary the rhythm and emphasis (e.g., "NOW STEPPING UP..." vs "BATTER UP..."), but do not invent facts.
4. Keep it concise (under 8 seconds).
5. NO stage directions.

Announcement Script:`,
});

const announcementFlow = ai.defineFlow(
  {
    name: 'announcementFlow',
    inputSchema: AnnouncementInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await prompt(input);
    // Ensure we return a string, falling back to a safe default if needed
    return output?.script || `NOW AT BAT, NUMBER ${input.playerNumber}, ${input.playerName.toUpperCase()}!`;
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
