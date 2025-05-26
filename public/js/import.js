console.log("🔥 PAGE LOADED");
import { showUploadAlertUpload } from './utils/alertMessage.js';
import { API_BASE_URL } from './utils/config.js'
import { showLoading, hideLoading } from './utils/loadingOverlay.js';

// handle showing top 20 recent files
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".tab-link").forEach(tab => {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".tab-link").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

            this.classList.add("active");
            document.getElementById(this.dataset.tab).classList.add("active");

            if (this.dataset.tab === "import") {
                fetchRecentFiles();
            }
        });
        
    });

    const alertContainer = document.getElementById('upload-alert-placeholder-uploadfile');
    const alertContainer2 = document.getElementById('upload-alert-placeholder-processing2');

    if (alertContainer) {
        alertContainer.innerHTML = '';  // Xóa alert nếu có
    }
    if (alertContainer2) {
        alertContainer2.innerHTML = '';  // Xóa alert nếu có
    }
    console.log1
    fetchRecentFiles();

});

function fetchRecentFiles() {
    const loadingIndicator = document.getElementById("loading-files");
    const fileTable = document.getElementById("file-list");
    const fileTableBody = fileTable.querySelector("tbody");

    // Hiện loading và ẩn bảng khi đang fetch
    loadingIndicator.style.display = "block";
    fileTable.style.display = "none";
    fileTableBody.innerHTML = "";

    console.log("getting top 20 recent files")
    // http://127.0.0.1:8000             192.168.1.2:8000
    fetch(`${API_BASE_URL}/api/cch-import/lastest_import_task/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                data.data.forEach(file => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${file.source_file}</td>
                        <td><a href="${file.source_file_url}" download class="download-link">Download</a></td>
                        <td>${file.task_status}</td>
                        <td>${file.task_summary}</td>
                        <td><a href="${file.log_file_url}" download log class="download-link">Download</a></td>
                    `;
                    fileTableBody.appendChild(row);
                });

                fileTable.style.display = "table";
            } else {
                alert("Failed to fetch files.");
            }
        })
        .catch(error => {
            console.error("Error fetching files:", error);
            alert("Error fetching files.");
        })
        .finally(() => {
            loadingIndicator.style.display = "none";
        });
}


//================upload file==============
document.getElementById("upload-btn").addEventListener("click", function (e) {
    const alertContainer = document.getElementById('upload-alert-placeholder-uploadfile');
    const alertContainer2 = document.getElementById('upload-alert-placeholder-processing2');

    if (alertContainer) {
        alertContainer.innerHTML = ''; 
    }
    if (alertContainer2) {
        alertContainer2.innerHTML = ''; 
    }
    // e.preventDefault(); 
    
    
    uploadExcel();

    // console.log('do')
    // const data = get_json()
    // const result = data.result
    // const parsed = parseTaskResult(result);
    // const sectionedData = parseDataSections(parsed.data);
    // renderParsedSections(sectionedData);
    
});

async function uploadExcel() {
    const fileInput = document.getElementById("excelFile");
    const file = fileInput.files[0];
    const uploadBtn = document.getElementById("upload-btn");

    toggleVisibility('processing--container', "hide");
    toggleVisibility('result--container', 'hide');
    if (!file) {
        alert("Please select a file!");
        return;
    }

    // 🟨 Kiểm tra đuôi file (Excel)
    const allowedExtensions = [".xls", ".xlsx", ".xlsm"];
    const fileName = file.name.toLowerCase();
    const isExcel = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isExcel) {
        alert("Only Excel files (.xls, .xlsx, .xlsm) are allowed!");
        return;
    }

    showLoading()
    if (!fileInput.files.length) {
        showUploadAlertUpload('warning', '⚠️ Please select a file to upload.', 'upload-alert-placeholder-uploadfile');
    } else {
        showUploadAlertUpload('success', 'Please waiting for processing!', 'upload-alert-placeholder-uploadfile');
    }

    uploadBtn.disabled = true;
    uploadBtn.innerText = "Uploading...";

    const formData = new FormData();
    formData.append("file", file);
    console.log(formData)
    // return

    // Gửi request dùng Promise style
    try {
        const res = await fetch(`${API_BASE_URL}/api/cch-import/import-tax-data/`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            const taskId = data.task_id;
            console.log("✅ Upload successful! Now processing...", taskId);
            toggleVisibility('processing--container', 'show');

            const finalStatus = await pollUntilDone(taskId);

            showUploadAlertUpload('success', 'Upload sucessfully!', 'upload-alert-placeholder-processing2');

        } else {
            var message = "❌ Upload failed: " + (data.error || "Unknown error")
            showUploadAlertUpload('danger', message, 'upload-alert-placeholder-processing2');
        }
    } catch (err) {
        var message = "❌ Upload error:" + err
        showUploadAlertUpload('danger', message, 'upload-alert-placeholder-processing2');
    }

    //  showing the result, recentfile  after import process
    toggleVisibility('processing--container', 'show');
    toggleVisibility('result--container', 'show');
    fetchRecentFiles();
}

function showMessage(msg, isError = false) {
    const messageDiv = document.getElementById("message-import");
    messageDiv.innerText = msg;
    messageDiv.style.color = isError ? "red" : "green";
    messageDiv.style.display = "block";
}

const DONE_STATUSES = ["SUCCESS", "FAILED"];    
// Bắt đầu polling để xem tiến trình
function pollUntilDone(taskId) {
    return new Promise((resolve, reject) => {
        const uploadBtn = document.getElementById("upload-btn");
        document.body.classList.add('cursor-loading');

        const intervalId = setInterval(() => {
            fetch(`${API_BASE_URL}/api/cch-import/status/${taskId}/`)
                .then(res => res.json())
                .then(statusData => {
                    console.log("⏳ Step:", statusData.step);
                    console.log("📦 Status:", statusData.status);

                    updateTabbar(statusData.step);

                    if (DONE_STATUSES.includes(statusData.status)) {
                        clearInterval(intervalId);
                        console.log(`✅ Done! Status: ${statusData.status}`);
                        
                        //  Display task result summary
                        const result = statusData.result
                        const parsed = parseTaskResult(result);
                        const sectionedData = parseDataSections(parsed.data);
                        renderParsedSections(sectionedData);

                        toggleVisibility('result--container', 'show'); 

                        document.body.classList.remove('cursor-loading');
                        uploadBtn.disabled = false;
                        uploadBtn.innerText = "Upload & Process";
                        resolve(statusData);
                        hideLoading()
                    }
                })
                .catch(err => {
                    clearInterval(intervalId);
                    console.error("❌ Error checking status", err);
                    
                    showUploadAlertUpload('danger', err, 'upload-alert-placeholder-processing2');

                    document.body.classList.remove('cursor-loading');
                    uploadBtn.disabled = false;
                    uploadBtn.innerText = "Upload & Process";

                    reject(err);
                });
        }, 3000);
    });
}

//  update step
function updateTabbar(currentStepString) {
    // Lấy số step từ chuỗi, ví dụ "3. Download..." => 3
    const match = currentStepString.match(/^(\d+)\./);
    if (!match) return;

    const stepNumber = parseInt(match[1]);

    // Reset tất cả tab
    const tabs = document.querySelectorAll("#step-tabs .step");
    tabs.forEach(tab => {
        tab.classList.remove("active");
    });

    // Highlight tab hiện tại
    const currentTab = document.querySelector(`#step-tabs .step[data-step="${stepNumber}"]`);
    if (currentTab) {
        currentTab.classList.add("active");
    }
}

const STEP_NAMES = [
    "1. Upload input file",
    "2. Extract Return ID and entities to import",
    "3. Downloading tax API data for W-2",
    "4. Validating data for W-2",
    "5. Uploading batches to CCH",
    "6. Completed"
];
//  simulating
function simulateSteps() {
    let currentIndex = 0;

    const intervalId = setInterval(() => {
        const currentStep = STEP_NAMES[currentIndex];
        console.log("🧪 Simulated Step:", currentStep);

        // Gọi update UI
        updateTabbar(currentStep);
        document.getElementById("progress-step").innerText = currentStep;

        currentIndex++;

        if (currentIndex >= STEP_NAMES.length) {
            clearInterval(intervalId);
            console.log("✅ Simulation complete!");
        }
    }, 3000);
}

//===============task result summary
function get_json() {
    return {
        "status": "SUCCESS",
        "step": "6. Completed",
        "note": null,
        "result": "Return ID: 2024I:1234567.001:V5\nSuccessfully Imported data for the following sheets:\n\nSocial Security:\n\t• T - (no_change)\n\t• S - (no_change)\nBrokerage Summary (Sch B, D):\n\t• Account Number: 79\n\t  - Form 1099-DIV Dividend Income:\n\t    ○ updated: 1\n\t    ○ created: 0\n\t    ○ no_change: 0\n\t  - Form 1099-INT Interest Income:\n\t    ○ updated: 0\n\t    ○ created: 0\n\t    ○ no_change: 196\n\t  - Gains and Losses:\n\t    ○ updated: 27\n\t    ○ created: 0\n\t    ○ no_change: 9\n\t• Account Number: 11\n\t  - Interest (IRS 1099-INT):\n\t    ○ updated: 0\n\t    ○ created: 14\n\t    ○ no_change: 0\n\t• Account Number: 32\n\t  - Dividends (IRS 1099-DIV):\n\t    ○ updated: 0\n\t    ○ created: 1\n\t    ○ no_change: 0\nSchedule E -K-1 Summary:\n\t• Corporation - T - XX-XXX6091 - Activity number 1 - (created): 2 data points created\n\t• Partnership - T - XX-XXX6091 - Activity number 2 - (created): 2 data points created\n\t• Fiduciary - T - XX-XXX6091 - Activity number 3 - (created): 2 data points created\n\t• Corporation - T - XX-XXX6091 - Activity number 4 - (created): 2 data points created\n\t• Fiduciary - J - XX-XXX6091 - Activity number 5 - (created): 2 data points created\nTime taken: 43.50 seconds"
    }
}

function parseTaskResult(resultText) {
    const result = {};

    
    // 1. Return ID
    const returnMatch = resultText.match(/Return ID:\s*(.+)/);
    result.return_id = returnMatch ? returnMatch[1].trim() : null;

    // 2. Time Taken
    const timeMatch = resultText.match(/Time taken:\s*([\d.]+)/);
    result.time_taken = timeMatch ? parseFloat(timeMatch[1]) : null;

    // 3. Version
    const versionMatch = resultText.match(/Version:\s*([a-f0-9]+)/i);
    result.version = versionMatch ? versionMatch[1] : null;

    // 4. Version Date
    const versionDateMatch = resultText.match(/Version:\s*[a-f0-9]+\s*\((.*?)\)/i);
    result.version_date = versionDateMatch ? versionDateMatch[1] : null;

    // 5. Environment
    const envMatch = resultText.match(/Environment:\s*(.+)/);
    result.environment = envMatch ? envMatch[1].trim() : null;

    // 6. Data (between “Successfully Imported…” and “Time taken:”)
    const dataStart = resultText.indexOf("Successfully Imported");
    const dataEnd = resultText.indexOf("Time taken:");
    if (dataStart !== -1 && dataEnd !== -1) {
        // result.data = resultText.slice(dataStart, dataEnd).trim();
        let raw = resultText.slice(dataStart, dataEnd).trim();
        raw = raw.replace(/^Successfully Imported data for the following sheets:\s*/i, '');
        result.data = raw.trim();
    } else {
        result.data = null;
    }

    return result;
}

function parseDataSections(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const sections = {};
    let currentSection = null;

    lines.forEach(line => {
        // Nếu là tên worksheet (có dấu ':' và không bắt đầu bằng bullet)
        if (line.endsWith(':') && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('○')) {
            currentSection = line.replace(/:$/, '');
            sections[currentSection] = [];
        } else if (currentSection) {
            sections[currentSection].push(line);
        }
    });

    // console.log(sections)
    // return sections;

    const reorderedSections = {};
    const sectionKeys = Object.keys(sections);

    const firstKey = sectionKeys.find(k => k.toLowerCase() === 'w-2');

    // ✅ 1. Ưu tiên đầu tiên
    if (firstKey) {
        reorderedSections[firstKey] = sections[firstKey];
    }

    for (const key of sectionKeys) {
        if (key !== firstKey) {
            reorderedSections[key] = sections[key];
        }
    }

    console.log(sections)
    console.log(reorderedSections)
    return reorderedSections;
}

function renderParsedSections(parsedData) {
    const container = document.getElementById('import--result');
    container.innerHTML = '';

    Object.entries(parsedData).forEach(([sectionTitle, lines]) => {
        const section = document.createElement('div');
        section.style.marginBottom = '15px';

        // Title
        const title = document.createElement('h3');
        title.innerHTML = `${sectionTitle} <span class="toggle-icon" style="cursor: pointer;">▼</span>`;
        title.style.fontSize = '25px';
        section.appendChild(title);

        // Content container
        const content = document.createElement('div');
        content.style.display = 'none';

        lines.forEach(line => {
            const div = document.createElement('div');
            div.innerText = line;

            div.style.fontSize = '20px';
            div.style.whiteSpace = 'pre-wrap';
            div.style.marginBottom = '2px';

            // Cấp độ thụt vào dựa theo loại dòng
            if (line.startsWith('•')) {
                div.style.paddingLeft = '10px';
                div.style.fontWeight = 'bold';
            } else if (line.startsWith('-')) {
                div.style.paddingLeft = '30px';
                div.style.fontStyle = 'italic';
                div.style.color = '#333';
            } else if (line.startsWith('○')) {
                div.style.paddingLeft = '60px';
                // Gợi ý nâng cao – tô màu theo nội dung
                if (line.includes('updated')) {
                    div.style.color = 'green';
                } else if (line.includes('created')) {
                    div.style.color = 'orange';
                } else if (line.includes('no_change')) {
                    div.style.color = 'gray';
                } else {
                    div.style.color = '#555';
                }
            } else {
                div.style.paddingLeft = '10px'; // mặc định
                div.style.color = '#222';
            }

            // div.style.fontFamily = 'monospace';
            // div.style.whiteSpace = 'pre-wrap';
            content.appendChild(div);
        });

        const toggle = title.querySelector('.toggle-icon');
        toggle.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            toggle.innerText = isHidden ? '▲' : '▼';
        });

        section.appendChild(content);
        container.appendChild(section);
    });
}


function toggleVisibility(id, mode = null) {
    const element = document.getElementById(id);
    if (!element) return;

    if (mode === 'show') {
        element.classList.remove('hidden');
        element.classList.add('show');
    } else if (mode === 'hide') {
        element.classList.remove('show');
        element.classList.add('hidden');
    } else {
        // toggle mode
        if (element.classList.contains('hidden')) {
            element.classList.remove('hidden');
            element.classList.add('show');
        } else {
            element.classList.remove('show');
            element.classList.add('hidden');
        }
    }
}

