# **App Name**: Stadium Booth

## Core Features:

- Live Stat Board: Dual-column scoreboard for Home and Away tracking with tactile numeric adjustments optimized for high-speed tablet interactions.
- Intelligent Player Roster: A scrollable sidebar featuring profiles for Max Camargo, Diomedes Plata, Jimena Briones, Alexa Franco, Camila Brooks, Ezekiel Jacobo, and Aldrich Munoz, including their specific numbers and jersey colors.
- AI Stadium Commentary Tool: Generates a customized, hype-filled announcer script by combining real-time player statistics and recent hit history to draft a dynamic 'Now at bat' script.
- Booming Voice Sequencing: Utilizes the Web Speech API with tuned low-pitch (0.85) and slow-rate (0.82) parameters to announce players with an authentic ballpark resonance.
- Walk-Up Sync Logic: Automated music sequencing that chains voice introductions with targeted YouTube Music timestamps, including precise 55s-80s start intervals for Diomedes, Alexa, and Ezekiel.
- In-Game Stat Tap-Tracker: A focused module to increment At-Bats, Hits, Runs, and RBIs instantly, with data state-locked until a player is active to prevent error-entry during play.

## Style Guidelines:

- Primary Color: Vivid Sport Blue (#4285FF) evoking the clarity of modern digital scoreboards and outdoor visibility.
- Background Color: Deep Night Navy (#181B26), a highly desaturated variant of the primary color to maximize contrast for dark-mode stadium operations.
- Accent Color: Arctic Cerulean (#2EB1D9) used for high-impact status indicators and current-batter highlights.
- Headline Font: 'Space Grotesk', a geometric sans-serif that provides a techy, digital scoreboard feel. Body Font: 'Inter' for dense stat-tracking legibility.
- Command-center layout with a prioritized center channel for active controls, flanked by a dense stat sidebar and a prominent persistent top-fixed scoreboard.
- Outline-heavy, bold icons for quick identification of At-Bats and Hits under high-sun or glare conditions.
- Smooth status-fill transitions for player active states and percussive scale-up effects when updating score tallies.