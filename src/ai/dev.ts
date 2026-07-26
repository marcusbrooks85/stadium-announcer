import { config } from 'dotenv';
config();

import '@/ai/flows/dynamic-announcement-generator.ts';
import '@/ai/flows/announcer-tts-flow.ts';
import '@/ai/flows/parse-schedule-flow.ts';
