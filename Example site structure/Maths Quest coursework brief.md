# Maths Quest coursework brief

Extend Avneet's Maths Quest game so primary pupils can sign in with codes, play a round and save their score. A teacher should be able to set up a class and see how each pupil is doing, including when pupils play on different devices.

## What pupils and teachers can do

- **Pupil.** Enter a class code and an individual pupil code supplied by the teacher. Show a friendly error if the pair is invalid. After signing in, choose a topic and play as usual. Save one result when the timer finishes and show whether it was saved. Include a sign-out button so the next pupil can use the same device.
- **Teacher.** Sign in on a separate teacher page using a teacher password. Create a class by entering a class name and choosing how many pupil codes to generate. Show the class code and the list of pupil codes so the teacher can hand them out. When the teacher opens the class again, let them generate extra codes or deactivate a pupil code. Deactivated codes can no longer sign in or submit scores. Keep their past results visible and never reuse their codes.
- **Progress.** Show a row for every pupil code, including pupils who have yet to play. Let the teacher select a pupil to see their completed rounds, newest first, with the topic, number correct, questions attempted and date. For example, a row could show **Addition · 8 out of 10 · 9 Nov 2026**.

## Suggested structure

Keep the existing HTML, CSS and browser JavaScript. Use one small Node.js server so Avneet can write the file-handling code in JavaScript too. The browser uses `fetch()` to send a login or a completed round to the server, and the server reads or writes the shared files. Run one copy of the server and serve both pages from it.

```text
Maths Quest/
  public/
    index.html, style.css, script.js    Existing pupil game
    teacher.html, teacher.js           Class setup and results
  server.js                           Login, requests and file handling
  data/
    classes.json
    results.json
    games.json
```

JSON is plain text and fits the objects and arrays Avneet already uses. Read the files with `JSON.parse()` and write them with `JSON.stringify()`. Keep `data` outside the folder the browser can access.

| File | What to store | Example |
| --- | --- | --- |
| `classes.json` | Class code, class name and a list of pupil codes with an active flag | `FOX7`, Fox Class, `P4K9` active |
| `results.json` | One record per completed round with class code, pupil code, game code, score, questions attempted and date/time | `FOX7`, `P4K9`, `addition`, 8, 10, `2026-11-09T10:30:00Z` |
| `games.json` | One entry per topic with a game code and a display name | `addition`, Addition |

Make class codes unique across classes and pupil codes unique within each class. The server should check codes when a pupil signs in and use that sign-in to identify the pupil when saving a result. Check that the pupil is still active, the game code exists and the score is a whole number from zero up to the number attempted. Set the date on the server. For the coursework demo, use one teacher password set on the server, check the teacher login on every class-management or results request, and use fictional pupils identified only by their codes.

## Where this fits the existing code

Avneet's game uses HTML sections that it shows and hides, button event listeners and named functions. Replace the current name picker with two code fields and keep the existing pattern of switching to the start screen after login. Keep question generation and the timer in `script.js`. At `endRound()`, send the chosen topic and the existing `correctAnswers` and `questionsAttempted` counters to the server. Give each topic a readable code in `games.json`, with separate entries for the two Mixed options.

The current `showStats()` and `endRound()` refer to an undefined `overallStats`, and the best score is stored once per browser. When connecting the new save flow, replace those storage calls with results for the signed-in pupil. Start with rounds played, total questions, accuracy and best score, which can all be calculated from the saved rounds. In `checkAnswer()`, count the attempt after checking that the answer field contains a value.

## Build and test in order

1. Put one sample class and two pupil codes in the file. Check that a valid pair opens the game and a wrong pair shows an error.
2. Play one round and check that it saves once with the correct topic, score and pupil. Check that an abandoned round saves nothing and that the saved result is still there after restarting the server.
3. Build the teacher page. Create a class with three codes, add a fourth, then deactivate one. Check that the old results still show and the deactivated code cannot sign in.
4. Sign in as a pupil in a second browser or on another device. Play a round and check that the teacher can see it. Check that a pupil cannot open the teacher's results.
