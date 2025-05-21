
import { showUploadAlertUpload } from './utils/alertMessage.js';
import { showLoading, hideLoading } from './utils/loadingOverlay.js';
import { API_BASE_URL } from './utils/config.js'
//=======================================================================
var jsonData = ''
var importHistory = ''
var TAX_YEAR = ''

document.addEventListener('DOMContentLoaded', function () {
    jsonData = localStorage.getItem('jsonData');
    var importedHistory = ''
    importHistory = localStorage.getItem("importHistory");
    if (importHistory) {
        importedHistory = JSON.parse(importHistory);
    }
    if( jsonData){
        jsonData = JSON.parse(jsonData)
        const returnHeader = jsonData.ReturnHeader || {};
        if (returnHeader) {
            TAX_YEAR = returnHeader.TaxYear
            const general = jsonData.General || {};
            console.log(general)
            console.log(general["Primary email address"])
            document.getElementById("primary-email").innerText = general["Primary email address"];
            document.getElementById("client-name").innerText = `${general["First name - TP"]} ${general["Last name - TP"]}`;
        }
    }
    

    console.log("do1")
    renderChecklist(jsonData, importedHistory)
    console.log("do2")
    save_attachments()
});

// document.getElementById('btn-download-excel').addEventListener('click', function (e) {
//     e.preventDefault(); // ⛔ chặn chuyển hướng về #

//     const data = parseChecklistToJson();
//     const clientName = document.querySelectorAll('.client-line strong')[0]?.textContent.trim();
//     const clientEmail = document.querySelectorAll('.client-line strong')[1]?.textContent.trim();

//     const payload = {
//         client_name: clientName,
//         client_email: clientEmail,
//         data: data
//     };

//     console.log(payload)
//     return
//     fetch('http://127.0.0.1:8000/api/excel_preview/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(payload)
//     })
//     .then(async response => {
//         const blob = await response.blob();

//         // ✅ Lấy tên file từ Content-Disposition header Content-Disposition
//         const disposition = response.headers.get('Content-Disposition');
//         let fileName = 'Checklist_Report.xlsx'; // fallback nếu không có header
//         const match = /filename="(.+?)"/.exec(disposition);
//         if (match && match[1]) {
//             fileName = match[1];
//         }
//         // ✅ Tải file với tên đúng
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = fileName;
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         window.URL.revokeObjectURL(url); // cleanup URL blob
//     })
//     .catch(error => {
//         console.error("❌ Error downloading Excel file:", error);
//         alert("Failed to download file. Please try again.");
//     });
// });


//============================send email to client=======================

function parseChecklistToJson() {
    const result = [];

    const processList = (ulId, status, includeReason = false) => {
        const listItems = document.querySelectorAll(`#${ulId} li`);
        listItems.forEach(li => {
            const strong = li.querySelector('strong'); // 🔁 Đổi từ span thành strong
            if (!strong) return;

            const text = strong.textContent.trim(); // Ví dụ: "W-2 (S Corp 1)"
            const match = text.match(/^(.+?)\s+\((.+?)\)$/);
            if (!match) return;

            const form = match[1].trim();
            const entityName = match[2].trim();

            const item = {
                form,
                entity_name: entityName,
                status: status
            };

            // Lý do nằm trong span.reason (nếu có)
            if (includeReason) {
                const reasonSpan = li.querySelector('.reason');
                if (reasonSpan) {
                    const reasonText = reasonSpan.textContent.replace(/^✔️ Reason:\s*/, '');
                    item.reason = reasonText.trim();
                } else {
                    item.reason = '';
                }
            }

            result.push(item);
        });
    };

    processList('checked-list', 'N/A-Confirmed with client', true);
    processList('uploaded-list', 'New this year');
    processList('unchecked-list', 'Missing');

    return result;
}




//============================send email to client=======================
// function parseChecklistToJson() {
//     const result = [];

//     const processList = (ulId, status) => {
//         const listItems = document.querySelectorAll(`#${ulId} li`);
//         listItems.forEach(li => {
//             const text = li.textContent.trim(); // Ví dụ: "K-1 1041 (J - mapping5)"

//             const match = text.match(/^(.+?)\s+\((.+?)\)$/);
//             if (match) {
//                 const form = match[1].trim();         // "K-1 1041"
//                 const entityName = match[2].trim();   // "J - mapping5"

//                 result.push({
//                     form: form,
//                     entity_name: entityName,
//                     status: status
//                 });
//             }
//         });
//     };

//     processList('checked-list', 'uploaded');
//     processList('unchecked-list', 'missing');

//     return result;
// }


// const btn_send = document.getElementById('btn-send-to-client')
// btn_send.addEventListener('click', async () => {

//     btn_send.disabled = true;
//     document.body.style.cursor = 'wait';
//     btn_send.textContent = "Sending...";
//     showLoading()

//     const data = parseChecklistToJson()
//     console.log(data)

//     // Lấy tên và email từ DOM
//     const clientName = document.querySelectorAll('.client-line strong')[0]?.textContent.trim();
//     const clientEmail = document.querySelectorAll('.client-line strong')[1]?.textContent.trim();

//     const payload = {
//         client_name: clientName,
//         client_email: clientEmail,
//         data: data
//     };
//     console.log(payload)

//     // Gửi dữ liệu lên server
//     try {
//         const response = await fetch(`${API_BASE_URL}/api/send_forms/`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(payload)
//         })
//         const result = await response.json();
//         console.log("✅ Server response:", result);
//         showUploadAlertUpload('success', result.success, 'alert-placeholder-send-client');
//     } catch (error) {
//         console.error("❌ Error sending forms:", error);
//         showUploadAlertUpload('danger', error.error, 'alert-placeholder-send-client');
//     } finally {
//         // Bật lại nút và con trỏ
//         btn_send.disabled = false;
//         document.body.style.cursor = 'default';
//         btn_send.textContent = "Send to Client";
//         hideLoading()
//     }
// })


//===================================save===========================
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 's') {
        save_attachments()
    }
});

function save_attachments() {
    var importedHistory = ''
    var importHistory = localStorage.getItem("importHistory");
    if (importHistory) {
        importedHistory = JSON.parse(importHistory);
    }
    console.log(importedHistory)
    var count = importedHistory.length
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    var import_time = `${hours}:${minutes}`
    if (count > 0) {
        // Sắp xếp theo thời gian giảm dần
        importedHistory.sort((a, b) => new Date(b.imported_at) - new Date(a.imported_at));

        // Lấy record đầu tiên (mới nhất)
        var latestImport = importedHistory[0];
        var latestTime = new Date(latestImport.imported_at);
        import_time = latestTime
        import_time = formatDate(import_time)
        console.log("Latest import time:", latestTime.toLocaleString());  // Hiển thị định dạng dễ đọc
        console.log("Latest file:", latestImport.imported_json_url);     // Có thể dùng tên file nếu cần
    }
    function formatDate(dateStr) {
        const date = new Date(dateStr);

        const MM = String(date.getMonth() + 1).padStart(2, '0');
        const DD = String(date.getDate()).padStart(2, '0');
        const YYYY = date.getFullYear();

        const HH = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const SS = String(date.getSeconds()).padStart(2, '0');

        return `${MM}:${DD}:${YYYY} ${HH}:${mm}:${SS}`;
    }

    event.preventDefault(); // chặn hành vi lưu trang mặc định

    // Cập nhật thời gian

    document.getElementById('saved-time').textContent = `✔️ Saved at ${import_time}`;

    // Giả lập tăng attachment count
    const attachmentElement = document.getElementById('attachment-count');
    const currentCount = parseInt(attachmentElement.textContent.match(/\d+/)[0]);
    attachmentElement.textContent = `📎 ${count} Attachments`;
}

// document.addEventListener('DOMContentLoaded', function () {
//     save_attachments()
// })



//========================================show new checklist=====================================
import { toggleVisibility } from './utils/toggleHide.js'
function renderChecklist(jsonData, importHistory) {
    // return
    toggleVisibility("checklist", "show");
    const checklist = document.getElementById("checklist")
    checklist.innerHTML = ''
    const displayFieldMapping = {
        "W-2": ["Employer name", "TS"],
        "1099-R": ["Payer's name"],
        "1099-SSA": ["TSJ"],
        "1099-INT": ["Payer's name"],
        "1099-DIV": ["Payer's name"],
        "Consolidated 1099": ["Payer name"],
        "K-1 1041": ["TSJ", "Name of k-1 entity"],
        "K-1 1065": ["TSJ", "Partnership's name"],
        "K-1 1120S": ["TSJ", "Corporation's name"]
    };

    var key = '0'
    var status = '2'

    for (const worksheet in jsonData) {
        const entities = jsonData[worksheet]?.data || [];
        const displayFields = displayFieldMapping[worksheet] || [];

        entities.forEach(entity => {
            const pk = entity["General primary key"] || entity["General"] || entity;
            const displayText = displayFields.map(f => pk?.[f] || "(missing)").join(" - ");
            const fullKey = worksheet + " - " + displayText;
            // So sánh với importHistory.link
            let isChecked = false;
            const li = document.createElement("li");
            li.setAttribute("data-key", fullKey);
            importHistory.forEach(batch => {
                batch.imported_json_data?.forEach(doc => {
                    const hasValidYear = doc.data.every(entity => entity.tax_year == TAX_YEAR);
                    // console.log("link: ", doc.link)
                    // console.log(fullKey)
                    if (doc.form_type == worksheet && doc.link == fullKey && hasValidYear) {
                        isChecked = true;
                        key = batch.id;
                        status = (doc.status)
                    }
                });
            });
            if (!isChecked) {
                // li.innerHTML = `<input type="checkbox"> ${worksheet} (${displayText})`;
                li.innerHTML = `
                    <label>
                        <input type="checkbox">
                        ${worksheet} (${displayText})
                    </label>
                    <div class="expand-panel">
                        <button class="btn-upload"><a href="../templete/document.html">Upload</a></button>
                        <button class="btn-secondary btn-na">Not Applicable</button>
                        <button class="btn-secondary btn-pe">Provided Elsewhere</button>
                    </div>
                `
                checklist.appendChild(li);
            } else {
                console.log(123)
            }
        });
    }

    document.querySelectorAll("#checklist li").forEach((item) => {
        item.addEventListener("click", function (e) {
            // Tránh trigger khi click vào checkbox
            if (e.target.tagName.toLowerCase() === "input") return;

            this.classList.toggle("active");
        });
    });

    attachChecklistEvents()

}

const statusMap = new Map();
// function attachChecklistEvents() {
//     // Not Applicable / Provided Elsewhere
//     document.querySelectorAll(".btn-na, .btn-pe").forEach(btn => {
//         btn.addEventListener("click", (e) => {
//             e.stopPropagation();
//             const li = btn.closest("li");
//             const key = li.getAttribute("data-key");
//             const text = li.querySelector("label").innerText.trim();
//             const status = btn.classList.contains("btn-na") ? "4" : "1";

//             // ✅ lưu lại vào Map
//             statusMap.set(key, { text, status });

//             // ✅ Optional: highlight item
//             li.classList.remove("active");
//         });
//     });

// }

function attachChecklistEvents() {
    document.querySelectorAll(".btn-na, .btn-pe").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const li = btn.closest("li");
            const checkbox = li.querySelector("input[type='checkbox']");
            const key = li.getAttribute("data-key");
            const text = li.querySelector("label").innerText.trim();

            // Xác định trạng thái
            const isNA = btn.classList.contains("btn-na");
            const status = isNA ? "4" : "5";

            // Set checked & style class
            checkbox.checked = true;
            checkbox.classList.remove("na", "pe");
            checkbox.classList.add(isNA ? "na" : "pe");

            // Lưu trạng thái
            statusMap.set(key, { text, status });

            li.classList.remove("active");
        });
    });
}

document.getElementById("btn-send-to-client").addEventListener("click", () => {
    const results = [];

    for (const [key, value] of statusMap.entries()) {
        results.push({
            key: key,
            text: value.text,
            status: value.status
        });
    }

    console.log("✅ Selected items:", results);

    // TODO: gửi results lên server
    fetch(`${API_BASE_URL}/api/cch-import/create-import-from-checklist/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            return_id: "2024I:1234567.001:V5",
            checklist: results  // kết quả từ statusMap như bạn đã có
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showUploadAlertUpload('success', 'Your form selections have been saved successfully.', 'alert-placeholder-send-client');
            } else {

                showUploadAlertUpload('danger', data.error, 'alert-placeholder-send-client');
            }
        })
        .catch(err => {
            alert("❌ Error deleting import.");
            console.error(err);
        });
});

