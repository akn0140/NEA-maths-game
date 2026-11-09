const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const teacherPassword = process.env.TEACHER_PASSWORD || "maths-demo";
const sessions = new Map();

// Only these files can be sent to a browser.
const pages = {
    "/": ["index.html", "text/html"],
    "/index.html": ["index.html", "text/html"],
    "/teacher.html": ["teacher.html", "text/html"],
    "/style.css": ["style.css", "text/css"],
    "/script.js": ["script.js", "text/javascript"],
    "/teacher.js": ["teacher.js", "text/javascript"],
    "/request.js": ["request.js", "text/javascript"]
};

function readFile(name) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "data", name + ".json"), "utf8"));
}

function saveFile(name, rows) {
    const file = path.join(__dirname, "data", name + ".json");
    // Write the new contents first so a failed write leaves the old file in place.
    fs.writeFileSync(file + ".tmp", JSON.stringify(rows, null, 2) + "\n");
    fs.renameSync(file + ".tmp", file);
}

function sendJson(response, status, data) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });
    response.end(JSON.stringify(data));
}

async function readBody(request) {
    request.setEncoding("utf8");
    let text = "";
    for await (const chunk of request) {
        text += chunk;
        if (text.length > 4096) {
            throw new Error("Request is too large.");
        }
    }
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new Error("Expected a JSON object.");
    }
    return body;
}

function cleanCode(value) {
    return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function makeCode(usedCodes) {
    let code;
    do {
        code = randomBytes(4).toString("hex").toUpperCase();
    } while (usedCodes.includes(code));
    return code;
}

function addPupils(classroom, count) {
    for (let i = 0; i < count; i++) {
        const code = makeCode(classroom.pupils.map(pupil => pupil.code));
        classroom.pupils.push({ code, active: true });
    }
}

// Pupil and teacher sign-ins can coexist in two tabs in the same browser.
function sessionId(request, role) {
    const prefix = role + "Session=";
    const cookies = (request.headers.cookie || "").split(";").map(cookie => cookie.trim());
    const cookie = cookies.find(cookie => cookie.startsWith(prefix));
    return cookie ? cookie.slice(prefix.length) : "";
}

function endSession(request, response, role) {
    sessions.delete(sessionId(request, role));
    response.setHeader("Set-Cookie", role + "Session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
}

function startSession(request, response, role, details) {
    sessions.delete(sessionId(request, role));
    const id = randomBytes(24).toString("hex");
    sessions.set(id, { role, ...details });
    response.setHeader("Set-Cookie", role + "Session=" + id + "; Path=/; HttpOnly; SameSite=Strict");
}

function getSession(request, role) {
    const session = sessions.get(sessionId(request, role));
    if (session && session.role === role) {
        return session;
    }
}

function findPupil(classes, classCode, pupilCode) {
    const classroom = classes.find(item => item.code === classCode);
    return classroom && classroom.pupils.find(pupil => pupil.code === pupilCode);
}

function validCount(count) {
    return Number.isInteger(count) && count >= 1 && count <= 40;
}

function teacherRequest(request, response, route, body) {
    if (route === "POST /api/teacher/login") {
        if (body.password !== teacherPassword) {
            return sendJson(response, 401, { error: "That teacher password is incorrect." });
        }
        startSession(request, response, "teacher", {});
        return sendJson(response, 200, {});
    }
    if (route === "POST /api/teacher/logout") {
        endSession(request, response, "teacher");
        return sendJson(response, 200, {});
    }
    if (!getSession(request, "teacher")) {
        return sendJson(response, 401, { error: "Please sign in as a teacher." });
    }

    const classes = readFile("classes");
    if (route === "GET /api/teacher/classes") {
        return sendJson(response, 200, { classes, results: readFile("results"), games: readFile("games") });
    }

    if (route === "POST /api/teacher/classes") {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name || name.length > 60 || !validCount(body.count)) {
            return sendJson(response, 400, { error: "Enter a class name and a number from 1 to 40." });
        }
        const classroom = { code: makeCode(classes.map(item => item.code)), name, pupils: [] };
        addPupils(classroom, body.count);
        classes.push(classroom);
        saveFile("classes", classes);
        return sendJson(response, 201, classroom);
    }

    if (route === "POST /api/teacher/add" || route === "POST /api/teacher/deactivate") {
        const classroom = classes.find(item => item.code === cleanCode(body.classCode));
        if (!classroom) {
            return sendJson(response, 404, { error: "Class not found." });
        }

        if (route === "POST /api/teacher/add") {
            if (!validCount(body.count)) {
                return sendJson(response, 400, { error: "Choose a number from 1 to 40." });
            }
            addPupils(classroom, body.count);
        } else {
            const pupil = classroom.pupils.find(item => item.code === cleanCode(body.pupilCode));
            if (!pupil) {
                return sendJson(response, 404, { error: "Pupil code not found." });
            }
            pupil.active = false;
        }

        saveFile("classes", classes);
        return sendJson(response, 200, {});
    }

    sendJson(response, 404, { error: "Request not found." });
}

function pupilRequest(request, response, route, body) {
    if (route === "POST /api/pupil/logout") {
        endSession(request, response, "pupil");
        return sendJson(response, 200, {});
    }

    const classes = readFile("classes");
    if (route === "POST /api/pupil/login") {
        const classCode = cleanCode(body.classCode);
        const pupilCode = cleanCode(body.pupilCode);
        const pupil = findPupil(classes, classCode, pupilCode);
        if (!pupil || !pupil.active) {
            return sendJson(response, 401, { error: "Check your class code and pupil code." });
        }
        startSession(request, response, "pupil", { classCode, pupilCode });
        return sendJson(response, 200, { classCode, pupilCode });
    }

    const session = getSession(request, "pupil");
    const pupil = session && findPupil(classes, session.classCode, session.pupilCode);
    if (!pupil || !pupil.active) {
        return sendJson(response, 401, { error: "Please sign in with an active pupil code." });
    }

    if (body.classCode !== session.classCode || body.pupilCode !== session.pupilCode) {
        return sendJson(response, 401, { error: "The pupil sign-in changed. Please sign in again." });
    }

    const results = readFile("results");
    const ownResults = results.filter(row =>
        row.classCode === session.classCode && row.pupilCode === session.pupilCode
    );

    if (route === "POST /api/pupil/results") {
        const { roundId, gameCode, score, attempted } = body;
        const knownGame = readFile("games").some(game => game.code === gameCode);
        if (typeof roundId !== "string" || !/^[a-z0-9-]{1,80}$/i.test(roundId) ||
            !knownGame || !Number.isInteger(attempted) || attempted < 0 ||
            !Number.isInteger(score) || score < 0 || score > attempted) {
            return sendJson(response, 400, { error: "The round result is invalid." });
        }

        // A retry can use the same round ID without adding a second row.
        const savedRound = ownResults.find(row => row.roundId === roundId);
        if (!savedRound) {
            results.push({
                roundId, classCode: session.classCode, pupilCode: session.pupilCode,
                gameCode, score, attempted, date: new Date().toISOString()
            });
            saveFile("results", results);
        }
        return sendJson(response, 200, {});
    }

    sendJson(response, 404, { error: "Request not found." });
}

http.createServer(async function(request, response) {
    const url = request.url.split("?")[0];
    const route = request.method + " " + url;
    try {
        if (request.method === "GET" && Object.hasOwn(pages, url)) {
            const [file, type] = pages[url];
            response.writeHead(200, { "Content-Type": type + "; charset=utf-8" });
            return response.end(fs.readFileSync(path.join(__dirname, "public", file)));
        }

        if (url.startsWith("/api/")) {
            let body = {};
            if (request.method === "POST") {
                if (request.headers["content-type"] !== "application/json") {
                    return sendJson(response, 415, { error: "Send JSON data." });
                }
                try {
                    body = await readBody(request);
                } catch {
                    return sendJson(response, 400, { error: "Could not read the form data." });
                }
            }

            if (url.startsWith("/api/teacher/")) {
                return teacherRequest(request, response, route, body);
            }
            if (url.startsWith("/api/pupil/")) {
                return pupilRequest(request, response, route, body);
            }
        }

        sendJson(response, 404, { error: "Page not found." });
    } catch (error) {
        console.error(error);
        if (!response.headersSent) {
            sendJson(response, 500, { error: "The server could not complete that request." });
        } else {
            response.end();
        }
    }
}).listen(port, host, function() {
    console.log("Animal Quiz is running on port " + port + ".");
});
