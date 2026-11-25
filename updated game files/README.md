# Maths Quest updated game

This version builds on Avneet's GitHub game at the commit recorded in source-version.txt. The original screen layout, CSS, question generators and teacher interface are retained.

## Run it

1. Install the LTS version of Node.js from https://nodejs.org/en/download if needed.
2. Open this folder in File Explorer. Type powershell into the address bar and press Enter.
3. Run node server.js and leave PowerShell open.
4. Open http://localhost:3000 in a browser.
5. Press Ctrl+C in PowerShell when finished.

There are no extra packages to install. Use one running server for this folder. If port 3000 is already occupied, stop the older demo first, or run $env:PORT = "3001" before node server.js and open http://localhost:3001.

## Sample sign-ins

| User | Sign-in |
| --- | --- |
| Pupil | Class FOX7 (letter O), code P4K9 or M8R2 |
| Teacher | http://localhost:3000/teacher.html with password maths-demo |

P4K9 has one example Addition result. M8R2 starts with no results. To try a short round, select Data, Coordinates, Easy and a custom count of 1. Answer it, check for Score saved, then open the teacher page and view that pupil. Refresh the teacher page or return to its tab to load new results.

## How it fits together

- public contains Avneet's browser pages, styling and JavaScript. script.js runs the maths game. teacher.js fills the teacher screens.
- request.js sends requests to server.js. The server checks the sign-in, validates results and saves the JSON files in data.
- classes.json stores class names and pupil codes, games.json lists every recognised topic, and results.json stores one record per completed round.
- Sessions are held in server memory. Classes and results survive a restart, but users sign in again.

## Improvements in this version

- Added the missing Node.js server, sample data and the pupil rounds request used by My Stats.
- Recognised all eleven topic codes used in the existing game.
- Added a teacher refresh button, refresh on returning to the teacher tab, and accuracy totals by topic. Mixed rounds appear in their own category.
- Cancelled delayed question changes when pausing or leaving a round, and prevented an old round from completing twice.
- Kept adaptive difficulty within levels 1 to 3 and scaled large rectangles to fit the diagram.
- Protected an unfinished save while it is sending. Failed saves can be retried with the same round ID. Leaving a failed save asks for confirmation.
- Checked pupil access on the server, including after a code is deactivated. Teachers can create classes, add codes and deactivate codes while retaining past results.

## Data and coursework

Use fictional pupil codes for this local example. JSON files are readable text and are kept outside the public folder. The teacher password defaults to maths-demo for trying it locally. Set TEACHER_PASSWORD in PowerShell before starting if a different password is needed.

This is a reference implementation for discussion with Avneet and her teacher. Avneet should acknowledge assistance and keep evidence of her own design, understanding, implementation and testing for her coursework.

## Verification

Checked the complete pupil and teacher browser workflows using a separate temporary copy of the data. All eleven topic generators accepted their generated correct answers. Checked pausing during feedback, resuming, difficulty limits, timed and counted completion, and pupil statistics. Checked class creation, adding codes, teacher summaries, deactivation, invalid results, duplicate save retries and persistence after restarting the server. The sample data in this folder was preserved.
