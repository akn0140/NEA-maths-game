//  HTML INFO

const loginScreen = document.getElementById("login-screen");
const existingStudentsDiv = document.getElementById("existing-students");
const newStudentInput = document.getElementById("new-student-name");
const createStudentButton = document.getElementById("create-student-btn");

const startScreen = document.getElementById("start_screen");
const gameScreen = document.getElementById("game-screen");
const resultsScreen = document.getElementById("results-screen");
const topicScreen = document.getElementById("topic-screen");

const categoryScreen = document.getElementById("category-screen");
const categoryButtons = document.querySelectorAll(".category-btn");

const groupSpeed = document.getElementById("group-speed");
const groupShapes = document.getElementById("group-shapes");

const statsScreen = document.getElementById("stats-screen");
const viewStatsButton = document.getElementById("view_stats_btn");
const statsBackButton = document.getElementById("stats_back_btn");

const statRounds = document.getElementById("stat_rounds");
const statQuestions = document.getElementById("stat_questions");
const statAccuracy = document.getElementById("stat_accuracy");
const statDifficulty = document.getElementById("stat_difficulty");
const statSpeed = document.getElementById("stat_speed");

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
const bestScoreDisplay = document.getElementById("best_score");
const shapeDisplay = document.getElementById("shape-display");
const answerInput = document.getElementById("answer_input");
const feedback = document.getElementById("feedback");

const finalScore = document.getElementById("final_score");
const finalCoins = document.getElementById("final_coins");
const finalAccuracy = document.getElementById("final_accuracy");
const averageTimeDisplay = document.getElementById("average_time");


//    GAME VARIABLES

let allStudents = {};  //  creates an empty array that will hold every students data 
let currentStudent = null;  //  creates an empty box to hold every students data 

let savedStudents = localStorage.getItem("allStudents");  //  fetches previously saved student data from browsers storage 

if (savedStudents !== null) {
    allStudents = JSON.parse(savedStudents);  //  if something was found when it was fetched it is converted and stored in allStudents
}

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

let correctAnswer = 0;


function createNewStudent(name) {

    //  

    allStudents[name] = {
        overallStats: {
            totalQuestions: 0,
            totalCorrect: 0,
            totalTimePlayed: 0,
            bestDifficulty: 1,
            roundsPlayed: 0
        },
        bestScore: 0
    };

    saveAllStudents();
}

function saveAllStudents() {
    localStorage.setItem("allStudents", JSON.stringify(allStudents));
}


function showLoginScreen() {

    existingStudentsDiv.innerHTML = "";

    for (let name in allStudents) {

        let button = document.createElement("button");
        button.textContent = name;

        button.addEventListener("click", function() {
            logInAsStudent(name);
        });

        existingStudentsDiv.appendChild(button);
    }
}

function logInAsStudent(name) {

    currentStudent = name;

    loginScreen.hidden = true;
    startScreen.hidden = false;
}

createStudentButton.addEventListener("click", function() {

    let name = newStudentInput.value.trim();

    if (name === "") {
        return;
    }

    if (!allStudents[name]) {
        createNewStudent(name);
    }

    logInAsStudent(name);
});

showLoginScreen();

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
    });
});


topicButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        selectedTopic = button.dataset.topic;

        startGame();
    });
});

function startGame() {

    // resets all values back to 0 when new game starts
    correctAnswers = 0;
    questionsAttempted = 0;
    coins = 0;
    difficulty = 1;
    correctStreak = 0;
    incorrectStreak = 0;

    topicScreen.hidden = true;
    resultsScreen.hidden = true;
    gameScreen.hidden = false;

    timeLeft = ROUND_TIME;
    timerDisplay.textContent = "Time left: " + timeLeft + "s";

    clearInterval(countdownInterval);  //  stops any previous countdown

    countdownInterval = setInterval(function() {   // set interval runs every second subtracting 1 from time left

        timeLeft--;  // subtracts 1 from timeleft
        timerDisplay.textContent = "Time left: " + timeLeft + "s";  // updates time on screen to the new time left

        if (timeLeft <= 0) {   // if it gets to 0 we stop the interval and call end round
            clearInterval(countdownInterval);
            endRound();
        }

    }, 1000);

    generateQuestion();
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

function showStats() {

    startScreen.hidden = true;
    statsScreen.hidden = false;

    let overallAccuracy = overallStats.totalQuestions > 0  // has the player answered more than 0 questions ever?
        ? Math.round((overallStats.totalCorrect / overallStats.totalQuestions) * 100)  //  ? = if thats true then... works out %
        : 0;  //  : = else do this... if no questions then stay at 0

    let averageSpeed = overallStats.totalQuestions > 0
        ? (overallStats.totalTimePlayed / overallStats.totalQuestions).toFixed(1)
        : 0;

    statRounds.textContent = "Rounds played: " + overallStats.roundsPlayed;
    statQuestions.textContent = "Total questions answered: " + overallStats.totalQuestions;
    statAccuracy.textContent = "Overall accuracy: " + overallAccuracy + "%";
    statDifficulty.textContent = "Best difficulty reached: " + overallStats.bestDifficulty;
    statSpeed.textContent = "Average time per question: " + averageSpeed + "s";
}

statsBackButton.addEventListener("click", function() {

    statsScreen.hidden = true;
    startScreen.hidden = false;
});

function resumeGame() {

    pauseMenu.hidden = true;
    gameScreen.hidden = false;

    //  restarts the countdown from wherever timeLeft currently is, rather than resetting it
    countdownInterval = setInterval(function() {

        timeLeft--;
        timerDisplay.textContent = "Time left: " + timeLeft + "s";

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            endRound();
        }

    }, 1000);
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

    } else {

        operation = selectedTopic;
    }

    let number1;
    let number2;

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

    }

    if (operation === "area") {

        questionDisplay.textContent = "This shape is made of two rectangles. What is its total area?";
        drawLShape(shapeDimensions);
        shapeDisplay.style.display = "block";

    } else if (operation === "perimeter") {

        questionDisplay.textContent = "A rectangle is " + number1 + "cm wide and " + number2 + "cm tall. What is its perimeter?";
        drawRectangle(number1, number2);
        shapeDisplay.style.display = "block";

    } else {

        questionDisplay.textContent = number1 + " " + operation + " " + number2 + " = ?";
        shapeDisplay.style.display = "none";

    }

    coinsDisplay.textContent = "Coins: " + coins;

    answerInput.value = "";
    feedback.textContent = "";

    answerInput.focus();
}

submitButton.addEventListener("click", checkAnswer);
// if enter key is pressed, submits answer
answerInput.addEventListener("keydown", function(event) {

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

    questionsAttempted++;

    let playerAnswer = Number(answerInput.value); // str -> num

    // checks if area is empty
    if (answerInput.value === "") {

        feedback.textContent = "Please enter an answer.";
        return;
    }

    // rewards if correct
    if (playerAnswer === correctAnswer) {

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

        feedback.textContent = "Incorrect! The answer was " + correctAnswer;

        incorrectStreak++;
        correctStreak = 0;

        // the same pattern applies for incorrect answers
        if (incorrectStreak >= 2) {

            // stops difficulty going below 1
            if (difficulty > 1) {
                difficulty--;
            }

            incorrectStreak = 0;
            feedback.textContent = "Incorrect! The answer was " + correctAnswer + ". lets slow things down!";
        }
    }

    coinsDisplay.textContent = "Coins: " + coins;

    // gives user 1 second to read feedback
    setTimeout(nextQuestion, 1000);
}


//    NEXT QUESTION

function nextQuestion() {

    if (timeLeft > 0) {
        generateQuestion();
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

//   END ROUND

function endRound() {

    gameScreen.hidden = true;
    resultsScreen.hidden = false;

    //  update overall stats with this round's numbers
    overallStats.totalQuestions = overallStats.totalQuestions + questionsAttempted;     // totals all time questions attempted
    overallStats.totalCorrect = overallStats.totalCorrect + correctAnswers;  // totals all correct answers
    overallStats.totalTimePlayed = overallStats.totalTimePlayed + ROUND_TIME;
    overallStats.roundsPlayed = overallStats.roundsPlayed + 1;     // adds to number of rounds completed after finished

    // checks if this rounds difficulty is harder than previous
    if (difficulty > overallStats.bestDifficulty) {
        overallStats.bestDifficulty = difficulty;
    }

    saveOverallStats();

    finalScore.textContent = correctAnswers + " out of " + questionsAttempted + " correct";
    finalCoins.textContent = "Coins: " + coins;

    // if the player attempted more than 0 questions, then calculate the accuracy
    let accuracy = questionsAttempted > 0
        ? Math.round((correctAnswers / questionsAttempted) * 100)       // ? shorthand of writing else/if
        : 0;
    finalAccuracy.textContent = "Accuracy: " + accuracy + "%";

    let bestScore = localStorage.getItem("bestScore");
    //  tries to fetch previously saved best score

    let averageTime = 0;

    if (questionsAttempted > 0) {
        averageTime = (ROUND_TIME / questionsAttempted).toFixed(1);  // rounds to one decimal place
    }

    averageTimeDisplay.textContent = "Average time per question: " + averageTime + "s";

    if (bestScore === null || correctAnswers > Number(bestScore)) {
        // || means or, so if they have never played before best score is nothing or did this rounds score beat the previous best, number(bestscore) converts it into an actual number for comparing

        localStorage.setItem("bestScore", correctAnswers);
        //  if either condition is true its saved overwriting what was there before
        bestScore = correctAnswers;
        //  updates the best score locally too so it shows the correct best score at the end
        bestScoreDisplay.textContent = "New best! " + bestScore;
        //  says the new best score
    } else {

        bestScoreDisplay.textContent = "Best: " + bestScore;
        //  states the old best score
    }
}

function saveOverallStats() {
    // current stats are translated into text first, not actual box
    localStorage.setItem("overallStats", JSON.stringify(overallStats));
}

//   PLAY AGAIN

playAgainButton.addEventListener("click", startGame);

resultsHomeButton.addEventListener("click", function() {

    resultsScreen.hidden = true;
    startScreen.hidden = false;
});