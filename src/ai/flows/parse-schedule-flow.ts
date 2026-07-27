'use server';
/**
 * @fileOverview A Genkit flow for parsing baseball schedules from documents/images using Gemini 2.5 Flash.
 * 
 * - runScheduleParser - A function that handles the AI parsing process.
 * - ParseScheduleInput - The input type for the parser.
 * - ParseScheduleOutput - The return type for the parser.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ParseScheduleInputSchema = z.object({
  fileDataUri: z.string().describe("A photo or document of a schedule, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  teamName: z.string().describe('The name of the user\'s team to determine home/away status.'),
});

export type ParseScheduleInput = z.infer<typeof ParseScheduleInputSchema>;

const ScheduleItemSchema = z.object({
  gameDate: z.string().describe('ISO format date string (YYYY-MM-DD).'),
  opponent: z.string().describe('The name of the opposing team.'),
  homeOrAway: z.enum(['home', 'away']).describe('Whether the user\'s team is home or away.'),
  time: z.string().describe('The start time of the game (e.g. 6:00 PM).'),
  location: z.string().describe('The field or stadium name.'),
  notes: z.string().optional().describe('Any relevant metadata like Week number or playoff info.'),
});

const ParseScheduleOutputSchema = z.object({
  games: z.array(ScheduleItemSchema),
});

export type ParseScheduleOutput = z.infer<typeof ParseScheduleOutputSchema>;

const parsePrompt = ai.definePrompt({
  name: 'parseSchedulePrompt',
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: ParseScheduleInputSchema },
  output: { schema: ParseScheduleOutputSchema },
  prompt: `You are an expert baseball league administrator. 
    Analyze the provided document: {{media url=fileDataUri}}
    
    Extract the full sports game schedule from this document or image for the team named: "{{teamName}}".
    
    For each game involving "{{teamName}}", identify:
    1. The exact date (formatted strictly as YYYY-MM-DD).
    2. The opponent team name.
    3. Whether "{{teamName}}" is the Home or Away team.
    4. The start time (e.g. 10:00 AM or 6:30 PM).
    5. The location or field name.
    6. Any relevant notes (e.g. "Week 1", "Championship Game").
    
    STRICT RULES:
    - Only include games where "{{teamName}}" is participating.
    - If a date is ambiguous, use your best judgment based on the context of the season.
    - Return a clean list of games in the requested JSON structure.
    - If no games are found for "{{teamName}}", return an empty array.`,
});

const parseScheduleFlow = ai.defineFlow(
  {
    name: 'parseScheduleFlow',
    inputSchema: ParseScheduleInputSchema,
    outputSchema: ParseScheduleOutputSchema,
  },
  async (input) => {
    const { output } = await parsePrompt(input);
    return output!;
  }
);

/**
 * Runs the AI schedule parser flow.
 * @param input The file data URI and team name.
 * @returns A structured list of extracted games.
 */
export async function runScheduleParser(input: ParseScheduleInput): Promise<ParseScheduleOutput> {
  return parseScheduleFlow(input);
}
