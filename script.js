//  HTML INFO

const loginScreen = document.getElementById("login-screen");
const classCodeInput = document.getElementById("class-code");
const pupilCodeInput = document.getElementById("pupil-code");
const loginButton = document.getElementById("login-btn");
const loginMessage = document.getElementById("login-message");

const startScreen = document.getElementById("start_screen");
const gameScreen = document.getElementById("game-screen");
const resultsScreen = document.getElementById("results-screen");
const topicScreen = document.getElementById("topic-screen");

const categoryScreen = document.getElementById("category-screen");
const categoryButtons = document.querySelectorAll(".category-btn");

const groupSpeed = document.getElementById("group-speed");
const groupShapes = document.getElementById("group-shapes");
const groupData = document.getElementById("group-data");

const countScreen = document.getElementById("count-screen");
const countButtons = document.querySelectorAll(".count-btn");
const customCountInput = document.getElementById("custom_count");
const customCountButton = document.getElementById("custom_count_btn");
const customCountError = document.getElementById("custom_count_error");

const difficultyScreen = document.getElementById("difficulty-screen");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

const statsScreen = document.getElementById("stats-screen");
const viewStatsButton = document.getElementById("view_stats_btn");
const statsBackButton = document.getElementById("stats_back_btn");

const statRounds = document.getElementById("stat_rounds");
const statQuestions = document.getElementById("stat_questions");
const statAccuracy = document.getElementById("stat_accuracy");
const statBest = document.getElementById("stat_best");

const pauseButton = document.getElementById("pause_btn");
const pauseMenu = document.getElementById("pause-menu");
const resumeButton = document.getElementById("resume_btn");
const restartButton = document.getElementById("restart_btn");
const homeButton = document.getElementById("home_btn");
const changeTopicButton = document.getElementById("change_topic_btn");
const resultsHomeButton = document.getElementById("results_home_btn");

const startButton = document.getElementById("start_btn");
const submitButton = document.getElementById("submit_btn");
const playAgainButton = document.getElementById("play_again_btn");
const topicButtons = document.querySelectorAll(".topic-btn");  // queryselectorall grabs every element with topic-btn as class

const coinsDisplay = document.getElementById("coins");
const questionDisplay = document.getElementById("question");
const timerDisplay = document.getElementById("timer");
const questionProgress = document.getElementById("question_progress");
const bestScoreDisplay = document.getElementById("best_score");
const shapeDisplay = document.getElementById("shape-display");
const answerInput = document.getElementById("answer_input");
const answerInput2 = document.getElementById("answer_input_2");
const feedback = document.getElementById("feedback");

const finalScore = document.getElementById("final_score");
const finalCoins = document.getElementById("final_coins");
const finalAccuracy = document.getElementById("final_accuracy");
const averageTimeDisplay = document.getElementById("average_time");
const saveMessage = document.getElementById("save-message");
const retrySaveButton = document.getElementById("retry-save-btn");
const signOutButton = document.getElementById("signout_btn");


//    GAME VARIABLES

let questionsAttempted = 0;
let correctAnswers = 0;
let difficulty = 1; // 1 = easy, 2 = med, 3 = hard
let selectedTopic = "mixed";
let correctStreak = 0;
let incorrectStreak = 0;
let coins = 0;
const ROUND_TIME = 60; // seconds, const means value can never be reassigned
let timeLeft = ROUND_TIME;
let countdownInterval;
let selectedCategory = "speed";
let shapeDimensions = {};

let gameMode = "timed";        // "timed" = 60 second round, "counted" = choose number of questions
let totalQuestions = 10;       // how many questions in a counted round
let secondsElapsed = 0;        // counts UP in counted mode, used for average time
let startingDifficulty = 1;   // 1 = easy, 2 = medium, 3 = hard
let waitingForNext = false;    // true during the 1 second feedback pause, stops double submits

let correctAnswer = 0;
let correctAnswer2 = 0;     // the y answer, only used when two answers are needed
let askingBoth = false;     // true when the question needs two answers


let signedInPupil = null;   // holds the class code and pupil code once signed in

async function signIn() {

    loginButton.disabled = true;      // stops double clicks while we wait for the server
    loginMessage.textContent = "";

    try {
        // asks the server if this class code and pupil code are valid
        signedInPupil = await requestJson("/api/pupil/login", {
            classCode: classCodeInput.value,
            pupilCode: pupilCodeInput.value
        });

        classCodeInput.value = "";
        pupilCodeInput.value = "";

        loginScreen.hidden = true;
        startScreen.hidden = false;

    } catch (error) {
        loginMessage.textContent = error.message;   // shows "Check your class code and pupil code."

    } finally {
        loginButton.disabled = false;
    }
}

loginButton.addEventListener("click", signIn);

pupilCodeInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        signIn();
    }
});

//   SIGN OUT

signOutButton.addEventListener("click", async function() {

    try {
        await requestJson("/api/pupil/logout", {});
    } catch (error) {
        // even if this fails, we still send the pupil back to the login screen
    }

    signedInPupil = null;

    startScreen.hidden = true;
    loginScreen.hidden = false;
});

//    PLAYING SCREEN

startButton.addEventListener("click", showCategoryScreen);

function showCategoryScreen() {

    startScreen.hidden = true;
    categoryScreen.hidden = false;
}

categoryButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        selectedCategory = button.dataset.category;

        categoryScreen.hidden = true;
        topicScreen.hidden = false;

        groupSpeed.hidden = (selectedCategory !== "speed");
        groupShapes.hidden = (selectedCategory !== "shapes");
        groupData.hidden = (selectedCategory !== "data");
    });
});

topicButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        selectedTopic = button.dataset.topic;

        topicScreen.hidden = true;
        difficultyScreen.hidden = false;
    });
});

difficultyButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        startingDifficulty = Number(button.dataset.level);

        difficultyScreen.hidden = true;

        if (selectedCategory === "data") {

            gameMode = "counted";
            countScreen.hidden = false;

        } else {

            gameMode = "timed";
            startGame();
        }
    });
});

countButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        totalQuestions = Number(button.dataset.count);
        startGame();
    });
});

const MAX_QUESTIONS = 100;

customCountButton.addEventListener("click", startCustomRound);

customCountInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        startCustomRound();
    }
});

function startCustomRound() {

    let amount = Number(customCountInput.value);

    if (customCountInput.value === "" || !Number.isInteger(amount) || amount < 1 || amount > MAX_QUESTIONS) {

        customCountError.textContent = "Please enter a whole number from 1 to " + MAX_QUESTIONS + ".";
        return;
    }

    customCountError.textContent = "";
    totalQuestions = amount;
    startGame();
}


function startGame() {

    // resets all values back to 0 when new game starts
    correctAnswers = 0;
    questionsAttempted = 0;
    coins = 0;
    difficulty = startingDifficulty;
    correctStreak = 0;
    incorrectStreak = 0;
    secondsElapsed = 0;
    waitingForNext = false;

    topicScreen.hidden = true;
    countScreen.hidden = true;
    resultsScreen.hidden = true;
    gameScreen.hidden = false;

    if (gameMode === "timed") {

        timeLeft = ROUND_TIME;
        timerDisplay.textContent = "Time left: " + timeLeft + "s";
        timerDisplay.hidden = false;
        questionProgress.hidden = true;

    } else {

        timerDisplay.hidden = true;       // no countdown in counted mode
        questionProgress.hidden = false;
    }

    startRoundTimer();
    generateQuestion();
}

function startRoundTimer() {

    clearInterval(countdownInterval);  // stops any previous timer

    countdownInterval = setInterval(function() {

        if (gameMode === "timed") {

            timeLeft--;
            timerDisplay.textContent = "Time left: " + timeLeft + "s";

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                endRound();
            }

        } else {

            secondsElapsed++;  // counted mode just counts up, so we can work out average time
        }

    }, 1000);
}

//    PAUSE MENU

pauseButton.addEventListener("click", pauseGame);  // when pause button clicked pauseGame function is ran

function pauseGame() {

    clearInterval(countdownInterval);  //  stops the timer counting down while paused

    gameScreen.hidden = true;
    pauseMenu.hidden = false;
}

resumeButton.addEventListener("click", resumeGame);

//    STATS SCREEN

viewStatsButton.addEventListener("click", showStats);

async function showStats() {

    startScreen.hidden = true;
    statsScreen.hidden = false;

    statRounds.textContent = "Loading...";

    try {
        // asks the server for this pupil's saved rounds
        let data = await requestJson("/api/pupil/rounds", {
            classCode: signedInPupil.classCode,
            pupilCode: signedInPupil.pupilCode
        });

        let rounds = data.rounds;

        let questionsTotal = 0;
        let correctTotal = 0;
        let best = 0;

        // adds up every saved round
        for (let i = 0; i < rounds.length; i++) {

            questionsTotal = questionsTotal + rounds[i].attempted;
            correctTotal = correctTotal + rounds[i].score;

            if (rounds[i].score > best) {
                best = rounds[i].score;
            }
        }

        let accuracy = questionsTotal > 0
            ? Math.round((correctTotal / questionsTotal) * 100)
            : 0;

        statRounds.textContent = "Rounds played: " + rounds.length;
        statQuestions.textContent = "Total questions answered: " + questionsTotal;
        statAccuracy.textContent = "Overall accuracy: " + accuracy + "%";
        statBest.textContent = "Best score: " + best;

    } catch (error) {
        statRounds.textContent = error.message;
    }
}

statsBackButton.addEventListener("click", function() {

    statsScreen.hidden = true;
    startScreen.hidden = false;
});

function resumeGame() {

    pauseMenu.hidden = true;
    gameScreen.hidden = false;

    startRoundTimer();
}

    restartButton.addEventListener("click", function() {

    pauseMenu.hidden = true;
    startGame();  //  reuses your existing startGame function to reset everything
});

homeButton.addEventListener("click", function() {

    clearInterval(countdownInterval);  //  makes sure the old timer definitely stops

    pauseMenu.hidden = true;
    gameScreen.hidden = true;
    startScreen.hidden = false;
});

changeTopicButton.addEventListener("click", function() {

    clearInterval(countdownInterval);

    pauseMenu.hidden = true;
    gameScreen.hidden = true;
    categoryScreen.hidden = false;
});


//     GENERATES QUESTIONS

function generateQuestion() {

    let operation;

    if (selectedTopic === "mixed") {

        let operations = ["+", "-", "x", "/"];
        // math.floor always rounds a number down to integer
        operation = operations[Math.floor(Math.random() * operations.length)];

    } else if (selectedTopic === "shapes-mixed") {

        let shapeOperations = ["area", "perimeter"];
        operation = shapeOperations[Math.floor(Math.random() * shapeOperations.length)];

    } else if (selectedTopic === "data-mixed") {

        let dataOperations = ["coordinates", "barchart"];
        operation = dataOperations[Math.floor(Math.random() * dataOperations.length)];

    } else {

        operation = selectedTopic;
    }

    let number1;
    let number2;
    let questionText;
    let chartData;
    let gridMax = 8;
    askingBoth = false;

    if (operation === "+") {

        // chooses random num 1-10/20/30
        // +1 is needed to get to 10 rather than 9 because math.random is always less than 1, 0.999...
        number1 = Math.floor(Math.random() * (10 * difficulty)) + 1;
        number2 = Math.floor(Math.random() * (10 * difficulty)) + 1;

        correctAnswer = number1 + number2;

    } else if (operation === "-") {

        number1 = Math.floor(Math.random() * (10 * difficulty)) + 1;
        number2 = Math.floor(Math.random() * number1) + 1;  //  uses number 1 to esnure no negatives are made

        correctAnswer = number1 - number2;

    } else if (operation === "x") {

        number1 = Math.floor(Math.random() * (5 * difficulty)) + 1; // smaller number chosen so not too hard
        number2 = Math.floor(Math.random() * 10) + 1;

        correctAnswer = number1 * number2;

    } else if (operation === "/") {

        // calculates answer beforehand to ensure its positive
        number2 = Math.floor(Math.random() * 10) + 1;
        correctAnswer = Math.floor(Math.random() * (5 * difficulty)) + 1;
        number1 = number2 * correctAnswer;

    } else if (operation === "area") {

        // "bottom" rectangle: full width, short height
        let bottomWidth = Math.floor(Math.random() * 5) + 6;   // 6-10
        let bottomHeight = Math.floor(Math.random() * 3) + 2;  // 2-4

        // "top" rectangle: narrower, sits on the left side
        let topWidth = Math.floor(Math.random() * (bottomWidth - 3)) + 2;  // stays smaller than bottomWidth
        let topHeight = Math.floor(Math.random() * 4) + 3;   // 3-6

        correctAnswer = (bottomWidth * bottomHeight) + (topWidth * topHeight);

        // store these 4 numbers so drawLShape can use them later
        shapeDimensions = { bottomWidth, bottomHeight, topWidth, topHeight };

    } else if (operation === "perimeter") {

        number1 = Math.floor(Math.random() * (10 * difficulty)) + 1;
        number2 = Math.floor(Math.random() * (10 * difficulty)) + 1;

        correctAnswer = (number1 + number2) * 2;

        } else if (operation === "coordinates") {

        // grid gets bigger as difficulty rises: 8, 10, then 12 (never more than 12)
        gridMax = Math.min(12, 6 + difficulty * 2);

        number1 = Math.floor(Math.random() * gridMax) + 1;
        number2 = Math.floor(Math.random() * gridMax) + 1;

        if (difficulty >= 2) {

            // harder: the player has to give both coordinates
            askingBoth = true;
            questionText = "Look at the red dot. What are its coordinates? Type the x (across) first, then the y (up).";
            correctAnswer = number1;
            correctAnswer2 = number2;

        } else if (Math.random() < 0.5) {

            questionText = "Look at the red dot. What is its x-coordinate? (how far across)";
            correctAnswer = number1;

        } else {

            questionText = "Look at the red dot. What is its y-coordinate? (how far up)";
            correctAnswer = number2;
        }

    } else if (operation === "barchart") {

        // bar heights get bigger as difficulty rises: 12, 16, then 20 (never more than 20)
        let maxValue = Math.min(20, 8 + difficulty * 4);

        // each chart is about a different topic
        let themes = [
            { title: "favourite pets", names: ["Cats", "Dogs", "Fish", "Birds", "Rabbits"] },
            { title: "favourite fruits", names: ["Apples", "Bananas", "Grapes", "Oranges", "Pears"] },
            { title: "favourite sports", names: ["Football", "Netball", "Swimming", "Tennis", "Cricket"] },
            { title: "favourite colours", names: ["Red", "Blue", "Green", "Yellow", "Purple"] },
            { title: "favourite lunches", names: ["Pizza", "Pasta", "Sandwich", "Soup", "Rice"] }
        ];

        let theme = themes[Math.floor(Math.random() * themes.length)];

        // random 0 or 1, plus 2, gives 2 or 3 bars
        let numberOfBars = Math.floor(Math.random() * 2) + 2;

        let labels = [];
        let values = [];

        // keeps picking until there are enough different bar names
        while (labels.length < numberOfBars) {

            let name = theme.names[Math.floor(Math.random() * theme.names.length)];

            if (!labels.includes(name)) {
                labels.push(name);
            }
        }

        // keeps picking until there are enough different bar heights (3 up to maxValue)
        while (values.length < numberOfBars) {

            let value = Math.floor(Math.random() * (maxValue - 2)) + 3;

            if (!values.includes(value)) {
                values.push(value);
            }
        }

        chartData = { labels: labels, values: values, axisMax: maxValue };

        // pick which bar to ask about
        let a = Math.floor(Math.random() * numberOfBars);

        if (Math.random() < 0.5) {

            questionText = "The chart shows children's " + theme.title + ". How many children chose " + labels[a] + "?";
            correctAnswer = values[a];

        } else {

            // pick a second bar that is different from the first
            let b = Math.floor(Math.random() * numberOfBars);

            while (b === a) {
                b = Math.floor(Math.random() * numberOfBars);
            }

            // make sure a is the taller bar, so the answer is never negative
            if (values[a] < values[b]) {
                let temp = a;
                a = b;
                b = temp;
            }

            questionText = "How many more children chose " + labels[a] + " than " + labels[b] + "?";
            correctAnswer = values[a] - values[b];
        }
    }


    if (operation === "area") {

        questionDisplay.textContent = "This shape is made of two rectangles. What is its total area?";
        drawLShape(shapeDimensions);
        shapeDisplay.style.display = "block";

    } else if (operation === "perimeter") {

        questionDisplay.textContent = "A rectangle is " + number1 + "cm wide and " + number2 + "cm tall. What is its perimeter?";
        drawRectangle(number1, number2);
        shapeDisplay.style.display = "block";

        } else if (operation === "coordinates") {

            questionDisplay.textContent = questionText;
            drawGrid(number1, number2, gridMax);
            shapeDisplay.style.display = "block";

    } else if (operation === "barchart") {

        questionDisplay.textContent = questionText;
        drawBarChart(chartData);
        shapeDisplay.style.display = "block";

    } else {

        questionDisplay.textContent = number1 + " " + operation + " " + number2 + " = ?";
        shapeDisplay.style.display = "none";

    }

        waitingForNext = false;

    if (gameMode === "counted") {
        questionProgress.textContent = "Question " + (questionsAttempted + 1) + " / " + totalQuestions;
    }

    coinsDisplay.textContent = "Coins: " + coins;

    answerInput.value = "";
    answerInput2.value = "";
    feedback.textContent = "";

    // the second box only shows when the question needs two answers
    answerInput2.hidden = !askingBoth;

    if (askingBoth) {
        answerInput.placeholder = "x";
    } else {
        answerInput.placeholder = "";
    }

    answerInput.focus();
}

submitButton.addEventListener("click", checkAnswer);
// if enter key is pressed, submits answer
answerInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        checkAnswer();
    }
});

answerInput2.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        checkAnswer();
    }
});

function drawLShape(dims) {

    let scale = 13;

    let bw = dims.bottomWidth * scale;
    let bh = dims.bottomHeight * scale;
    let tw = dims.topWidth * scale;
    let th = dims.topHeight * scale;

    let startX = 60;
    let startY = 40;

    // the 6 corner points of the L-shape, going clockwise
    let points =
        startX + "," + startY + " " +
        (startX + tw) + "," + startY + " " +
        (startX + tw) + "," + (startY + th) + " " +
        (startX + bw) + "," + (startY + th) + " " +
        (startX + bw) + "," + (startY + th + bh) + " " +
        startX + "," + (startY + th + bh);

    shapeDisplay.innerHTML =
        '<polygon points="' + points + '" style="fill:lightblue;stroke:black;stroke-width:2" />' +

        // top section width label
        '<text x="' + (startX + tw / 2) + '" y="' + (startY - 8) + '" text-anchor="middle" font-size="12">' + dims.topWidth + 'cm</text>' +

        // top section height label
        '<text x="' + (startX + tw + 18) + '" y="' + (startY + th / 2 - 10) + '" text-anchor="middle" transform="rotate(-90, ' + (startX + tw + 18) + ', ' + (startY + th / 2 - 10) + ')" font-size="12">' + dims.topHeight + 'cm</text>' +

        // bottom section extra width label
        '<text x="' + (startX + bw / 2) + '" y="' + (startY + th + bh + 15) + '" text-anchor="middle" font-size="12">' + dims.bottomWidth + 'cm</text>' +

        // bottom section height label
        '<text x="' + (startX + bw + 15) + '" y="' + (startY + th + bh / 2) + '" text-anchor="middle" transform="rotate(-90, ' + (startX + bw + 15) + ', ' + (startY + th + bh / 2) + ')" font-size="12">' + dims.bottomHeight + 'cm</text>';
}

function checkAnswer() {

        if (waitingForNext) {
        return;   // already answered, ignore extra Enter or clicks
    }

    let playerAnswer = Number(answerInput.value); // str -> num

    // checks if either box is empty
    if (answerInput.value === "" || (askingBoth && answerInput2.value === "")) {

        feedback.textContent = "Please enter an answer.";
        return;
    }

    // only counts as an attempt once a real answer has been entered
    questionsAttempted++;

    // works out if the answer is right, and what to show if it's wrong
    let isCorrect;
    let answerText;

    if (askingBoth) {

        isCorrect = (playerAnswer === correctAnswer && Number(answerInput2.value) === correctAnswer2);
        answerText = "(" + correctAnswer + ", " + correctAnswer2 + ")";

    } else {

        isCorrect = (playerAnswer === correctAnswer);
        answerText = correctAnswer;
    }

    // rewards if correct
    if (isCorrect) {

        feedback.textContent = "Correct!";
        coins = coins + 5;
        correctAnswers++;

        correctStreak++;
        incorrectStreak = 0;

        if (correctStreak >= 3) {

            difficulty++;
            coins = coins + 10;
            correctStreak = 0;
            feedback.textContent = "Correct! Difficulty increased! +10 bonus coins!";
        }

    } else {

        feedback.textContent = "Incorrect! The answer was " + answerText;

        incorrectStreak++;
        correctStreak = 0;

        // the same pattern applies for incorrect answers
        if (incorrectStreak >= 2) {

            // stops difficulty going below 1
            if (difficulty > 1) {
                difficulty--;
            }

            incorrectStreak = 0;
            feedback.textContent = "Incorrect! The answer was " + answerText + ". lets slow things down!";
        }
    }

    coinsDisplay.textContent = "Coins: " + coins;

    waitingForNext = true;

    // gives user 1 second to read feedback
    setTimeout(nextQuestion, 1000);
}


//    NEXT QUESTION

function nextQuestion() {

    if (gameMode === "timed") {

        if (timeLeft > 0) {
            generateQuestion();
        }

    } else {

        if (questionsAttempted >= totalQuestions) {
            endRound();
        } else {
            generateQuestion();
        }
    }
}

//   RECTANGLE

function drawRectangle(width, height) {

    // scales the numbers up so small rectangles are still visible on screen
    let scale = 10;
    let displayWidth = width * scale;
    let displayHeight = height * scale;

    let startX = 40;
    let startY = 30;

    // innerHTML lets us insert actual HTML into an element - can create real shapes
    shapeDisplay.innerHTML =
        '<rect x="' + startX + '" y="' + startY + '" width="' + displayWidth + '" height="' + displayHeight + '" style="fill:lightblue;stroke:black;stroke-width:2" />' +
        '<text x="' + (startX + displayWidth / 2) + '" y="' + (startY - 10) + '" text-anchor="middle">' + width + 'cm</text>' +
        '<text x="' + (startX - 20) + '" y="' + (startY + displayHeight / 2) + '" text-anchor="middle" transform="rotate(-90, ' + (startX - 20) + ', ' + (startY + displayHeight / 2) + ')">' + height + 'cm</text>';
}

//   SAVING RESULTS

// the server only knows topics by the codes in games.json,
// so this turns each topic button's value into its code
const gameCodes = {
    "+": "addition",
    "-": "subtraction",
    "x": "multiplication",
    "/": "division",
    "mixed": "speed-mixed",
    "area": "area",
    "perimeter": "perimeter",
    "shapes-mixed": "shapes-mixed",
    "coordinates": "coordinates",
    "barchart": "barchart",
    "data-mixed": "data-mixed"
};

let roundResult = null;   // the result waiting to be saved

function saveRound() {

    // roundId is a unique label, so retrying never saves the same round twice
    roundResult = {
        roundId: Date.now() + "-" + Math.random().toString(36).slice(2),
        classCode: signedInPupil.classCode,
        pupilCode: signedInPupil.pupilCode,
        gameCode: gameCodes[selectedTopic],
        score: correctAnswers,
        attempted: questionsAttempted
    };

    sendResult();
}

async function sendResult() {

    retrySaveButton.hidden = true;
    saveMessage.textContent = "Saving...";

    try {
        await requestJson("/api/pupil/results", roundResult);   // sends it to the server
        saveMessage.textContent = "Score saved.";

    } catch (error) {
        saveMessage.textContent = error.message;
        retrySaveButton.hidden = false;   // lets the pupil try again
    }
}

retrySaveButton.addEventListener("click", sendResult);


//   END ROUND

function endRound() {

    clearInterval(countdownInterval);

    // how long the round lasted: fixed for timed rounds, counted up for chosen-question rounds
    let roundTime;

    if (gameMode === "timed") {
        roundTime = ROUND_TIME;
    } else {
        roundTime = secondsElapsed;
    }

    gameScreen.hidden = true;
    resultsScreen.hidden = false;

    finalScore.textContent = correctAnswers + " out of " + questionsAttempted + " correct";
    finalCoins.textContent = "Coins: " + coins;

    let accuracy = questionsAttempted > 0
        ? Math.round((correctAnswers / questionsAttempted) * 100)
        : 0;
    finalAccuracy.textContent = "Accuracy: " + accuracy + "%";

    let averageTime = 0;

    if (questionsAttempted > 0) {
        averageTime = (roundTime / questionsAttempted).toFixed(1);
    }

    averageTimeDisplay.textContent = "Average time per question: " + averageTime + "s";

    // the best score now lives on the My Stats screen, so it's hidden here
    bestScoreDisplay.hidden = true;

    // saves this round to the server (an empty round isn't worth saving)
    if (questionsAttempted > 0) {
        saveRound();
    } else {
        saveMessage.textContent = "";
    }
}

//   COORDINATE GRID

function drawGrid(pointX, pointY, max) {

    let cell = Math.floor(240 / max);   // squares get smaller as the grid gets bigger, so it always fits
    let originX = 40;                   // where (0,0) sits on the svg
    let originY = 270;

    let svg = "";

    for (let i = 0; i <= max; i++) {

        // vertical grid line
        svg += '<line x1="' + (originX + i * cell) + '" y1="' + originY + '" x2="' + (originX + i * cell) + '" y2="' + (originY - max * cell) + '" stroke="lightgray" />';

        // horizontal grid line
        svg += '<line x1="' + originX + '" y1="' + (originY - i * cell) + '" x2="' + (originX + max * cell) + '" y2="' + (originY - i * cell) + '" stroke="lightgray" />';

        // number under the grid
        svg += '<text x="' + (originX + i * cell) + '" y="' + (originY + 18) + '" text-anchor="middle" font-size="12">' + i + '</text>';

        // number beside the grid
        svg += '<text x="' + (originX - 10) + '" y="' + (originY - i * cell + 4) + '" text-anchor="middle" font-size="12">' + i + '</text>';
    }

    // the two main axes, in black
    svg += '<line x1="' + originX + '" y1="' + originY + '" x2="' + (originX + max * cell) + '" y2="' + originY + '" stroke="black" stroke-width="2" />';
    svg += '<line x1="' + originX + '" y1="' + originY + '" x2="' + originX + '" y2="' + (originY - max * cell) + '" stroke="black" stroke-width="2" />';

    // the red dot
    svg += '<circle cx="' + (originX + pointX * cell) + '" cy="' + (originY - pointY * cell) + '" r="6" fill="red" />';

    shapeDisplay.innerHTML = svg;
}


//   BAR CHART

function drawBarChart(data) {

    let originX = 40;
    let originY = 260;
    let unit = Math.floor(230 / data.axisMax);   // pixels for each 1 of height, smaller when the axis is taller
    let barWidth = 55;
    let gap = 25;
    let count = data.values.length;
    let chartWidth = count * (barWidth + gap);

    let svg = "";

    // grid lines for every 1, numbers only on every 2nd line
    for (let i = 0; i <= data.axisMax; i++) {

        svg += '<line x1="' + originX + '" y1="' + (originY - i * unit) + '" x2="' + (originX + chartWidth) + '" y2="' + (originY - i * unit) + '" stroke="lightgray" />';

        if (i % 2 === 0) {
            svg += '<text x="' + (originX - 8) + '" y="' + (originY - i * unit + 4) + '" text-anchor="end" font-size="12">' + i + '</text>';
        }
    }

    // the bars and their labels
    for (let i = 0; i < count; i++) {

        let barHeight = data.values[i] * unit;
        let barX = originX + gap / 2 + i * (barWidth + gap);

        svg += '<rect x="' + barX + '" y="' + (originY - barHeight) + '" width="' + barWidth + '" height="' + barHeight + '" fill="lightblue" stroke="black" />';
        svg += '<text x="' + (barX + barWidth / 2) + '" y="' + (originY + 18) + '" text-anchor="middle" font-size="12">' + data.labels[i] + '</text>';
    }

    // bottom axis
    svg += '<line x1="' + originX + '" y1="' + originY + '" x2="' + (originX + chartWidth) + '" y2="' + originY + '" stroke="black" stroke-width="2" />';

    shapeDisplay.innerHTML = svg;
}

//   PLAY AGAIN

playAgainButton.addEventListener("click", startGame);

resultsHomeButton.addEventListener("click", function() {

    resultsScreen.hidden = true;
    startScreen.hidden = false;
});
