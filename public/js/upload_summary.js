
import { showUploadAlertUpload } from './utils/alertMessage.js';
import { showLoading, hideLoading } from './utils/loadingOverlay.js';
import { API_BASE_URL } from './utils/config.js'
import {getReturnID} from './utils/get_data_header.js'
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
    if( jsonData != "null"){
        jsonData = JSON.parse(jsonData)
        const returnHeader = jsonData.ReturnHeader || {};
        if (returnHeader) {
            TAX_YEAR = returnHeader.TaxYear
            const general = jsonData.General || {};
            document.getElementById("primary-email").innerText = general["Primary email address"];
            document.getElementById("client-name").innerText = `${general["First name - TP"]} ${general["Last name - TP"]}`;
        }
        var returnid_element = document.getElementById("client-line-returnID")
        returnid_element.innerHTML = getReturnID()
    }
    
    
    renderChecklist(jsonData, importedHistory)
    save_attachments()
    // render return id

    // render return id
    var returnData = localStorage.getItem('returnID');
    var textReturnID = JSON.parse(returnData)
    console.log(textReturnID)
    document.getElementById("client-line-returnID").innerHTML = textReturnID
    
});

//============================send email to client=======================

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
// function renderChecklist(jsonData, importHistory) {
//     // return
//     toggleVisibility("checklist", "show");
//     const checklist = document.getElementById("checklist")
//     checklist.innerHTML = ''
//     const displayFieldMapping = {
//         "W-2": ["Employer name", "TS"],
//         "1099-R": ["Payer's name"],
//         "1099-SSA": ["TSJ"],
//         "1099-INT": ["Payer's name"],
//         "1099-DIV": ["Payer's name"],
//         "Consolidated 1099": ["Payer name"],
//         "K-1 1041": ["TSJ", "Name of k-1 entity"],
//         "K-1 1065": ["TSJ", "Partnership's name"],
//         "K-1 1120S": ["TSJ", "Corporation's name"]
//     };

//     var key = '0'
//     var status = '2'

//     for (const worksheet in jsonData) {
//         const entities = jsonData[worksheet]?.data || [];
//         const displayFields = displayFieldMapping[worksheet] || [];

//         entities.forEach(entity => {
//             const pk = entity["General primary key"] || entity["General"] || entity;
//             const displayText = displayFields.map(f => pk?.[f] || "(missing)").join(" - ");
//             const fullKey = worksheet + " - " + displayText;
//             // So sánh với importHistory.link
//             let isChecked = false;
//             const li = document.createElement("li");
//             li.setAttribute("data-key", fullKey);
//             importHistory.forEach(batch => {
//                 batch.imported_json_data?.forEach(doc => {
//                     const hasValidYear = doc.data.every(entity => entity.tax_year == TAX_YEAR);
//                     // console.log("link: ", doc.link)
//                     // console.log(fullKey)
//                     if (doc.form_type == worksheet && doc.link == fullKey && hasValidYear) {
//                         isChecked = true;
//                         key = batch.id;
//                         status = (doc.status)
//                     }
//                 });
//             });
//             if (!isChecked) {
//                 // li.innerHTML = `<input type="checkbox"> ${worksheet} (${displayText})`;
//                 li.innerHTML = `
//                     <label>
//                         <input type="checkbox">
//                         ${worksheet} (${displayText})
//                     </label>
//                     <div class="expand-panel">
//                         <button class="btn-upload"><a href="../templete/document.html">Upload</a></button>
//                         <button class="btn-secondary btn-na">Not Applicable</button>
//                         <button class="btn-secondary btn-pe">Provided Elsewhere</button>
//                     </div>
//                 `
//                 checklist.appendChild(li);
//             } else {
//                 console.log(123)
//             }
//         });
//     }

//     document.querySelectorAll("#checklist li").forEach((item) => {
//         item.addEventListener("click", function (e) {
//             // Tránh trigger khi click vào checkbox
//             if (e.target.tagName.toLowerCase() === "input") return;

//             this.classList.toggle("active");
//         });
//     });

//     attachChecklistEvents()

// }

function renderChecklist(jsonData, importHistory) {
    toggleVisibility("checklist", "show");
    const checklist = document.getElementById("checklist");
    checklist.innerHTML = "";

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

    for (const worksheet in jsonData) {
        const entities = jsonData[worksheet]?.data || [];
        const displayFields = displayFieldMapping[worksheet] || [];

        entities.forEach(entity => {
            const pk = entity["General primary key"] || entity["General"] || entity;
            const displayText = displayFields.map(f => pk?.[f] || "(missing)").join(" - ");
            const fullKey = worksheet + " - " + displayText;

            let isChecked = false;
            let matchedEntityId = null;
            let matchedStatus = "2";

            // ✅ So sánh với từng entity trong importHistory (flat)
            importHistory.forEach(doc => {
                const isSameType = doc.form_type === worksheet;
                const isSameLink = doc.link?.toLowerCase() === fullKey.toLowerCase();
                const isValidYear = Array.isArray(doc.data)
                    && doc.data.every(d => String(d.tax_year) === String(TAX_YEAR));
                

                if (isSameType && isSameLink && isValidYear) {
                    console.log("check")
                    console.log(doc.link?.toLowerCase())
                    console.log(fullKey.toLowerCase())

                    isChecked = true;
                    matchedEntityId = doc.id;
                    matchedStatus = doc.status;
                }
            });

            const li = document.createElement("li");
            li.setAttribute("data-key", fullKey);

            if (!isChecked) {
                // ❌ Chưa được matched → render với checkbox và panel

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
                `;
                checklist.appendChild(li);
            } else {
                // ✅ Đã matched (không cần hiện )
                console.log(123)
            }
            
        });
    }

    // 🔁 Gán sự kiện toggle cho expand panel
    document.querySelectorAll("#checklist li").forEach((item) => {
        item.addEventListener("click", function (e) {
            if (e.target.tagName.toLowerCase() === "input") return;
            this.classList.toggle("active");
        });
    });

    attachChecklistEvents();
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
    const jsonData = localStorage.getItem("jsonData");

    if (jsonData){
        const data = JSON.parse(jsonData)
        const returnHeader = data.ReturnHeader || {};
        var returnID = `${returnHeader.TaxYear}${returnHeader.ReturnType}:${returnHeader.ClientID}:V${returnHeader.ReturnVersion}`;
    }
    console.log("✅ Selected items:", results);
    console.log(returnID)
    console.log(results)
    if (results.length == 0){
        showUploadAlertUpload('success', 'Saved successfully.', 'alert-placeholder-send-client');
        return
    }

    // TODO: gửi results lên server
    fetch(`${API_BASE_URL}/api/cch-import/create-import-from-checklist/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            return_id: returnID,
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

document.getElementById("btn-send-to-client-complete").addEventListener("click", () => {
    const results = [];

    for (const [key, value] of statusMap.entries()) {
        results.push({
            key: key,
            text: value.text,
            status: value.status
        });
    }
    const jsonData = localStorage.getItem("jsonData");

    if (jsonData){
        const data = JSON.parse(jsonData)
        const returnHeader = data.ReturnHeader || {};
        var returnID = `${returnHeader.TaxYear}${returnHeader.ReturnType}:${returnHeader.ClientID}:V${returnHeader.ReturnVersion}`;
    }

    const checklistItems = document.querySelectorAll("#checklist li");

    console.log("✅ Selected items:", results);
    console.log(returnID)
    console.log(results)
    console.log(checklistItems.length)
    console.log(results.length)
    if (results.length == 0){
        showUploadAlertUpload('success', 'Saved successfully.', 'alert-placeholder-send-client');
        return
    } else if (results.length != checklistItems.length) {
        showUploadAlertUpload('danger', 'Some items are missing.', 'alert-placeholder-send-client');
        return
    }
    // showUploadAlertUpload('success', 'All items selected and saved successfully.', 'alert-placeholder-send-client');
    // return
    // TODO: gửi results lên server
    fetch(`${API_BASE_URL}/api/cch-import/create-import-from-checklist/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            return_id: returnID,
            checklist: results  // kết quả từ statusMap như bạn đã có
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showUploadAlertUpload('success', 'All items selected and saved successfully.', 'alert-placeholder-send-client');
            } else {

                showUploadAlertUpload('danger', data.error, 'alert-placeholder-send-client');
            }
        })
        .catch(err => {
            alert("❌ Error deleting import.");
            console.error(err);
        });
});