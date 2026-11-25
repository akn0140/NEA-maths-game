// Sends data to the server and returns the answer.
// requestJson("/api/...", { ... })  sends data (POST)
// requestJson("/api/...")           just asks for data (GET)
async function requestJson(url, body) {

    let response;

    try {
        if (body === undefined) {
            response = await fetch(url);
        } else {
            response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
        }
    } catch (error) {
        throw new Error("Could not reach Maths Quest. Check that the server is running.");
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}