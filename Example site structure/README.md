# Animal Quiz example

This standalone example uses three animal questions to show how code sign-in, file storage and a teacher view can work together. Use it to explore the design and build your own version for Maths Quest.

## Try it on Windows

1. Open this folder in File Explorer. Type `powershell` into the address bar and press Enter.
2. Run `node server.js`. Install Node.js if the command is unavailable, then reopen PowerShell and try again.
3. Leave PowerShell open and visit [the pupil page](http://localhost:3000/). Sign in with class code **FOX7** (letter O) and pupil code **M8R2**. Answer all three questions and look for **Score saved**.
4. Open the [teacher page](http://localhost:3000/teacher.html) with password **maths-demo**. Click **Refresh results** and **View rounds** beside **M8R2**. You can also create a class, add a code or deactivate a code.
5. Press Ctrl+C in PowerShell to stop the server.

## How the files fit together

- `public/index.html` and `public/script.js` show the quiz and send the score when the last question is answered.
- `public/teacher.html` and `public/teacher.js` show the class list and saved scores. Both pages use `public/request.js` to contact the server.
- `server.js` checks the sign-in and reads or writes the JSON text files in `data`. `classes.json` holds class and pupil codes, `games.json` holds activity labels, and `results.json` holds scores.

Use fictional codes and results in this local demo. The server keeps the JSON files outside the public web folder and requires the teacher sign-in for class lists and results. If you keep a list linking names to codes, keep it separate from the demo and out of GitHub.
