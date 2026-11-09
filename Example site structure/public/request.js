async function requestJson(url, data) {
    let options = {};
    if (data !== undefined) {
        options = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    }

    let response;
    try {
        response = await fetch(url, options);
    } catch {
        throw new Error("Could not reach Animal Quiz. Check that the server is running.");
    }

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error);
    }
    return result;
}
