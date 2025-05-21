function showSection(section) {
    let title = document.getElementById("section-title");
    let buttons = document.getElementById("buttons");

    if (section === "download") {
        title.innerText = "Download Data";
        buttons.innerHTML = `
            <button onclick="openPage('test-api')">Test API</button>
            <button onclick="openPage('search-return')">Search Return</button>
            <button onclick="openPage('download-return')">Download Return</button>
        `;
    } else if (section === "import") {
        title.innerText = "Import Data";
        buttons.innerHTML = `
            <button onclick="openPage('upload-file')">Upload File</button>
            <button onclick="openPage('process-file')">Process File</button>
            <button onclick="openPage('check-status')">Check Status</button>
        `;
    }
}

function openPage(page) {
    document.getElementById("content-frame").src = `pages/${page}.html`;
}
