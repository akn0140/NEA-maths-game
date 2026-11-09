const questions = [
    { text: "Which animal has eight legs?", choices: ["Ant", "Spider", "Butterfly"], answer: "Spider" },
    { text: "Which animal has feathers?", choices: ["Robin", "Frog", "Mouse"], answer: "Robin" },
    { text: "Which animal lives in the sea?", choices: ["Fox", "Rabbit", "Octopus"], answer: "Octopus" }
];

const login = document.getElementById("login");
const quiz = document.getElementById("quiz");
const question = document.getElementById("question");
const answers = document.getElementById("answers");
const again = document.getElementById("again");
const retry = document.getElementById("retry");
const logout = document.getElementById("logout");
const message = document.getElementById("message");

let pupil;
let questionNumber;
let score;
let result;

login.addEventListener("submit", async function(event) {
    event.preventDefault();
    const button = login.querySelector("button");
    button.disabled = true;
    try {
        pupil = await requestJson("/api/pupil/login", {
            classCode: document.getElementById("class-code").value,
            pupilCode: document.getElementById("pupil-code").value
        });
        login.reset();
        login.hidden = true;
        quiz.hidden = false;
        document.getElementById("pupil").textContent = "Playing as " + pupil.pupilCode;
        startQuiz();
    } catch (error) {
        message.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

function startQuiz() {
    questionNumber = 0;
    score = 0;
    again.hidden = true;
    retry.hidden = true;
    message.textContent = "";
    showQuestion();
}

function showQuestion() {
    const current = questions[questionNumber];
    question.textContent = current.text;
    answers.replaceChildren();

    for (const choice of current.choices) {
        const button = document.createElement("button");
        button.textContent = choice;
        button.addEventListener("click", function() {
            if (choice === current.answer) {
                score++;
            }
            questionNumber++;

            if (questionNumber === questions.length) {
                finishQuiz();
            } else {
                showQuestion();
            }
        });
        answers.appendChild(button);
    }
}

function finishQuiz() {
    answers.replaceChildren();
    question.textContent = "You scored " + score + " out of " + questions.length + ".";
    result = {
        roundId: Date.now() + "-" + Math.random().toString(36).slice(2),
        classCode: pupil.classCode,
        pupilCode: pupil.pupilCode,
        gameCode: "animals",
        score,
        attempted: questions.length
    };
    saveResult();
}

async function saveResult() {
    retry.hidden = true;
    logout.disabled = true;
    message.textContent = "Saving...";
    try {
        await requestJson("/api/pupil/results", result);
        message.textContent = "Score saved.";
        again.hidden = false;
    } catch (error) {
        message.textContent = error.message;
        retry.hidden = false;
    } finally {
        logout.disabled = false;
    }
}

again.addEventListener("click", startQuiz);
retry.addEventListener("click", saveResult);
logout.addEventListener("click", async function() {
    logout.disabled = true;
    try {
        await requestJson("/api/pupil/logout", {});
        quiz.hidden = true;
        login.hidden = false;
        message.textContent = "";
    } catch (error) {
        message.textContent = error.message;
    } finally {
        logout.disabled = false;
    }
});
