//  HTML INFO

const loginSection = document.getElementById("teacher-login");
const classesView = document.getElementById("classes-view");
const classView = document.getElementById("class-view");
const pupilView = document.getElementById("pupil-view");

const passwordInput = document.getElementById("teacher-password");
const loginButton = document.getElementById("teacher-login-btn");
const loginMessage = document.getElementById("teacher-login-message");
const logoutButton = document.getElementById("teacher-logout-btn");

const classList = document.getElementById("class-list");
const newClassName = document.getElementById("new-class-name");
const newClassCount = document.getElementById("new-class-count");
const createClassButton = document.getElementById("create-class-btn");
const classesMessage = document.getElementById("classes-message");

const backToClassesButton = document.getElementById("back-to-classes");
const classTitle = document.getElementById("class-title");
const classCodeLine = document.getElementById("class-code-line");
const pupilList = document.getElementById("pupil-list");
const addCount = document.getElementById("add-count");
const addCodesButton = document.getElementById("add-codes-btn");
const classMessage = document.getElementById("class-message");

const backToClassButton = document.getElementById("back-to-class");
const pupilTitle = document.getElementById("pupil-title");
const pupilSummary = document.getElementById("pupil-summary");
const roundList = document.getElementById("round-list");


//  VARIABLES

let data = null;               // everything the server sends: classes, results and games
let currentClassCode = null;   // the class being looked at
let currentPupilCode = null;   // the pupil being looked at


//  SHOWING ONE SCREEN AT A TIME

function showOnly(section) {

    loginSection.hidden = (section !== loginSection);
    classesView.hidden = (section !== classesView);
    classView.hidden = (section !== classView);
    pupilView.hidden = (section !== pupilView);
}


//  HELPERS

// asks the server for all classes, results and topics
async function loadData() {
    data = await requestJson("/api/teacher/classes");
}

// turns a game code like "addition" into its display name
function gameName(code) {

    let game = data.games.find(function(item) {
        return item.code === code;
    });

    return game ? game.name : code;
}

// all saved rounds for one pupil, newest first
function roundsFor(classCode, pupilCode) {

    let rounds = data.results.filter(function(row) {
        return row.classCode === classCode && row.pupilCode === pupilCode;
    });

    rounds.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    return rounds;
}

function findClass(code) {
    return data.classes.find(function(item) {
        return item.code === code;
    });
}

function formatDate(isoText) {
    return new Date(isoText).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
    });
}

// makes a small button inside a row
function makeButton(text, onClick) {

    let button = document.createElement("button");
    button.textContent = text;
    button.className = "small-btn";
    button.addEventListener("click", onClick);
    return button;
}


//  SIGN IN AND OUT

async function signIn() {

    loginButton.disabled = true;
    loginMessage.textContent = "";

    try {
        await requestJson("/api/teacher/login", { password: passwordInput.value });
        passwordInput.value = "";
        await loadData();
        showClasses();

    } catch (error) {
        loginMessage.textContent = error.message;

    } finally {
        loginButton.disabled = false;
    }
}

loginButton.addEventListener("click", signIn);

passwordInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        signIn();
    }
});

logoutButton.addEventListener("click", async function() {

    try {
        await requestJson("/api/teacher/logout", {});
    } catch (error) {
        // still send the teacher back to the sign in screen
    }

    data = null;
    showOnly(loginSection);
});


//  STEP 1: ALL CLASSES

function showClasses() {

    classList.innerHTML = "";
    classesMessage.textContent = "";

    if (data.classes.length === 0) {
        let empty = document.createElement("p");
        empty.textContent = "No classes yet. Create one below.";
        classList.appendChild(empty);
    }

    data.classes.forEach(function(classroom) {

        let button = document.createElement("button");
        button.className = "class-btn";

        let name = document.createElement("span");
        name.textContent = classroom.name;

        let details = document.createElement("span");
        details.className = "class-details";
        details.textContent = "Class code " + classroom.code + " · " + classroom.pupils.length + " pupils";

        button.appendChild(name);
        button.appendChild(details);

        button.addEventListener("click", function() {
            currentClassCode = classroom.code;
            showClass();
        });

        classList.appendChild(button);
    });

    showOnly(classesView);
}

createClassButton.addEventListener("click", async function() {

    createClassButton.disabled = true;
    classesMessage.textContent = "";

    try {
        let classroom = await requestJson("/api/teacher/classes", {
            name: newClassName.value,
            count: Number(newClassCount.value)
        });

        newClassName.value = "";
        await loadData();

        currentClassCode = classroom.code;   // goes straight to the new class so the codes can be handed out
        showClass();

    } catch (error) {
        classesMessage.textContent = error.message;

    } finally {
        createClassButton.disabled = false;
    }
});


//  STEP 2: ONE CLASS AND ITS PUPILS

function showClass() {

    let classroom = findClass(currentClassCode);

    classTitle.textContent = classroom.name;
    classCodeLine.textContent = "Class code: " + classroom.code + " (pupils type this and their own pupil code to sign in)";
    classMessage.textContent = "";
    pupilList.innerHTML = "";

    classroom.pupils.forEach(function(pupil) {

        let rounds = roundsFor(classroom.code, pupil.code);

        let row = document.createElement("div");
        row.className = "list-row";

        let info = document.createElement("span");
        info.textContent = pupil.code + " · " + (pupil.active ? "Active" : "Deactivated") + " · " + rounds.length + (rounds.length === 1 ? " round" : " rounds");

        let buttons = document.createElement("span");

        buttons.appendChild(makeButton("View", function() {
            currentPupilCode = pupil.code;
            showPupil();
        }));

        if (pupil.active) {
            buttons.appendChild(makeButton("Deactivate", function() {
                deactivatePupil(pupil.code);
            }));
        }

        row.appendChild(info);
        row.appendChild(buttons);
        pupilList.appendChild(row);
    });

    showOnly(classView);
}

async function deactivatePupil(pupilCode) {

    if (!confirm("Deactivate " + pupilCode + "? They won't be able to sign in or save scores. Their old results stay.")) {
        return;
    }

    try {
        await requestJson("/api/teacher/deactivate", {
            classCode: currentClassCode,
            pupilCode: pupilCode
        });
        await loadData();
        showClass();

    } catch (error) {
        classMessage.textContent = error.message;
    }
}

addCodesButton.addEventListener("click", async function() {

    addCodesButton.disabled = true;

    try {
        await requestJson("/api/teacher/add", {
            classCode: currentClassCode,
            count: Number(addCount.value)
        });
        await loadData();
        showClass();

    } catch (error) {
        classMessage.textContent = error.message;

    } finally {
        addCodesButton.disabled = false;
    }
});

backToClassesButton.addEventListener("click", showClasses);


//  STEP 3: ONE PUPIL

function showPupil() {

    let rounds = roundsFor(currentClassCode, currentPupilCode);

    let questionsTotal = 0;
    let correctTotal = 0;
    let best = 0;

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

    pupilTitle.textContent = "Pupil " + currentPupilCode;

    pupilSummary.innerHTML = "";

    [
        "Rounds played: " + rounds.length,
        "Questions answered: " + questionsTotal,
        "Accuracy: " + accuracy + "%",
        "Best score: " + best
    ].forEach(function(text) {
        let line = document.createElement("p");
        line.textContent = text;
        pupilSummary.appendChild(line);
    });

    roundList.innerHTML = "";

    if (rounds.length === 0) {
        let empty = document.createElement("p");
        empty.textContent = "This pupil hasn't played a round yet.";
        roundList.appendChild(empty);
    }

    rounds.forEach(function(round) {

        let row = document.createElement("div");
        row.className = "list-row";
        row.textContent = gameName(round.gameCode) + " · " + round.score + " out of " + round.attempted + " · " + formatDate(round.date);
        roundList.appendChild(row);
    });

    showOnly(pupilView);
}

backToClassButton.addEventListener("click", showClass);


//  WHEN THE PAGE OPENS: go straight in if the teacher is already signed in

async function start() {

    try {
        await loadData();
        showClasses();

    } catch (error) {
        showOnly(loginSection);

        if (error.message.includes("Could not reach")) {
            loginMessage.textContent = error.message;
        }
    }
}

start();