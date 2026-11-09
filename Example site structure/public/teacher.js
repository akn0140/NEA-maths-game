const login = document.getElementById("teacher-login");
const panel = document.getElementById("teacher-panel");
const message = document.getElementById("teacher-message");
const classList = document.getElementById("class-list");
const pupilList = document.getElementById("pupil-list");
const resultsList = document.getElementById("results-list");
const resultsTitle = document.getElementById("results-title");
const resultsTable = document.getElementById("results-table");

let classes = [];
let results = [];
let games = [];
let selectedPupil = "";

// Use the same error message area for each teacher action.
async function runAction(control, action) {
    control.disabled = true;
    message.textContent = "";
    try {
        await action();
    } catch (error) {
        message.textContent = error.message;
    } finally {
        control.disabled = false;
    }
}

login.addEventListener("submit", function(event) {
    event.preventDefault();
    runAction(login.querySelector("button"), async function() {
        await requestJson("/api/teacher/login", { password: document.getElementById("password").value });
        await loadClasses();
        login.reset();
        login.hidden = true;
        panel.hidden = false;
    });
});

document.getElementById("sign-out").addEventListener("click", function(event) {
    runAction(event.currentTarget, async function() {
        await requestJson("/api/teacher/logout", {});
        panel.hidden = true;
        login.hidden = false;
        selectedPupil = "";
    });
});

const createForm = document.getElementById("create-class");
createForm.addEventListener("submit", function(event) {
    event.preventDefault();
    runAction(createForm.querySelector("button"), async function() {
        const classroom = await requestJson("/api/teacher/classes", {
            name: document.getElementById("class-name").value,
            count: Number(document.getElementById("pupil-count").value)
        });
        createForm.reset();
        selectedPupil = "";
        await loadClasses(classroom.code);
        message.textContent = "Class created.";
    });
});

const addForm = document.getElementById("add-pupils");
addForm.addEventListener("submit", function(event) {
    event.preventDefault();
    runAction(addForm.querySelector("button"), async function() {
        await requestJson("/api/teacher/add", {
            classCode: classList.value,
            count: Number(document.getElementById("extra-count").value)
        });
        addForm.reset();
        await loadClasses();
        message.textContent = "Pupil codes added.";
    });
});

classList.addEventListener("change", function() {
    selectedPupil = "";
    showClass();
});

document.getElementById("refresh-results").addEventListener("click", function(event) {
    runAction(event.currentTarget, async function() {
        await loadClasses();
        message.textContent = "Results refreshed.";
    });
});

async function loadClasses(preferredCode = classList.value) {
    const data = await requestJson("/api/teacher/classes");
    classes = data.classes;
    results = data.results;
    games = data.games;

    classList.replaceChildren();
    for (const classroom of classes) {
        const option = document.createElement("option");
        option.value = classroom.code;
        option.textContent = classroom.name + " (" + classroom.code + ")";
        classList.appendChild(option);
    }
    if (classes.some(classroom => classroom.code === preferredCode)) {
        classList.value = preferredCode;
    }
    showClass();
}

function showClass() {
    const classroom = classes.find(item => item.code === classList.value);
    document.getElementById("class-details").hidden = !classroom;
    document.getElementById("class-code").textContent = classroom
        ? "Class code: " + classroom.code
        : "Create a class to get started.";

    pupilList.replaceChildren();
    if (!classroom) {
        return;
    }

    for (const pupil of classroom.pupils) {
        const row = pupilList.insertRow();
        row.insertCell().textContent = pupil.code;
        row.insertCell().textContent = pupil.active ? "Active" : "Inactive";
        row.insertCell().textContent = pupilRounds(pupil.code).length;

        const actions = row.insertCell();
        const view = document.createElement("button");
        view.textContent = "View rounds";
        view.addEventListener("click", function() {
            selectedPupil = pupil.code;
            showRounds();
        });
        actions.appendChild(view);

        if (pupil.active) {
            const deactivate = document.createElement("button");
            deactivate.textContent = "Deactivate";
            deactivate.addEventListener("click", function() {
                if (confirm("Deactivate " + pupil.code + "? Their past rounds will still be visible.")) {
                    runAction(deactivate, async function() {
                        await requestJson("/api/teacher/deactivate", {
                            classCode: classroom.code,
                            pupilCode: pupil.code
                        });
                        await loadClasses();
                        message.textContent = "Pupil code deactivated.";
                    });
                }
            });
            actions.appendChild(deactivate);
        }
    }
    showRounds();
}

function pupilRounds(pupilCode) {
    return results.filter(row => row.classCode === classList.value && row.pupilCode === pupilCode);
}

function showRounds() {
    resultsList.replaceChildren();
    resultsTable.hidden = true;
    resultsTitle.textContent = "Choose a pupil to see their rounds";
    if (!selectedPupil) {
        return;
    }

    const rounds = pupilRounds(selectedPupil);
    resultsTitle.textContent = "Rounds for " + selectedPupil;
    if (rounds.length === 0) {
        resultsTitle.textContent += " (no rounds yet)";
        return;
    }

    resultsTable.hidden = false;
    rounds.sort((first, second) => new Date(second.date) - new Date(first.date));
    for (const round of rounds) {
        const game = games.find(item => item.code === round.gameCode);
        const row = resultsList.insertRow();
        row.insertCell().textContent = game ? game.name : round.gameCode;
        row.insertCell().textContent = round.score + " out of " + round.attempted;
        row.insertCell().textContent = new Date(round.date).toLocaleString("en-GB");
    }
}
