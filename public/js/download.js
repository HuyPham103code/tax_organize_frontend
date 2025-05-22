var connect_btn = document.getElementById("connect-btn")
var search_return_btn = document.getElementById("search-return-id")
import { showUploadAlertUpload } from './utils/alertMessage.js';
import { toggleVisibility } from './utils/toggleHide.js'
import { showLoading, hideLoading } from './utils/loadingOverlay.js';
import { API_BASE_URL } from './utils/config.js'

let totalEntities = 0;
let CURRENT_RETURN_ID

window.addEventListener("DOMContentLoaded", function () {
    var jsonData = localStorage.getItem('jsonData');
    if (!jsonData) {
        toggleVisibility("search-list-returns-btn", "hide")
    }
});


//===========================================================
let searchInterval = null;

function startSearchingEffect(button) {
    let dots = 0;
    searchInterval = setInterval(() => {
        dots = (dots + 1) % 4;  // Quay vòng từ 0 → 3
        let dotText = '.'.repeat(dots);
        button.innerText = `Downloading${dotText}`;
    }, 500);
}

function stopSearchingEffect(button) {
    clearInterval(searchInterval);
    button.innerText = "Download return";
    searchInterval = null;
}

//===================================================================


search_return_btn.addEventListener('click', search_return_id)
function search_return_id() {

    // const yearInput = document.getElementById("search-return-value").value.trim();
    const btn_search = document.getElementById("search-return-id");
    const selected = document.querySelector('input[name="return_id"]:checked');
    const summary_container = document.getElementById('tax-summary-container')

    summary_container.style.display = 'none'
    console.log(selected.value);
    const yearInput = selected.value
    showLoading();
    document.body.style.cursor = 'wait';
    // return

    toggleVisibility("tax-summary-container", "hide")

    // Kiểm tra nếu không phải số hoặc không phải năm hợp lệ (4 chữ số)
    if (!yearInput) {
        showUploadAlertUpload('warning', "Please enter a valid 4-digit year.", 'upload-alert-placeholder-search');
        return;
    }

    // Gửi request đến API
    console.log("download with", { yearInput })

    btn_search.disabled = true;
    startSearchingEffect(btn_search);

    // const data = get_data();
    // displayEntities(data);

    // btn_search.disabled = false;
    // stopSearchingEffect(btn_search);
    // return

    fetch(`${API_BASE_URL}/api/cch-import/full_export_pipeline/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ return_id: yearInput })
    })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                console.log("success");
                console.log(response)
                const jsonData = response.data; // <-- dữ liệu chính
                const importHistory = response.imported_history || []; // <-- lấy import history

                console.log(response)
                localStorage.setItem('jsonData', JSON.stringify(jsonData));
                localStorage.setItem('importHistory', JSON.stringify(importHistory));
                window.location.href = "../templete/download.html";
                return
                // truyền cả 2
                renderChecklist(jsonData, importHistory);

                btn_search.disabled = false;
                stopSearchingEffect(btn_search);

                //render json
                // displayJsonOverlay(jsonData)

                //  get data for status box
                renderStatusBox(jsonData, importHistory)

                CURRENT_RETURN_ID = yearInput
                // hide button-box
                toggleVisibility("button_box", "hide")
                toggleVisibility("title-download", "hide")
            } else {
                const message = "❌ Download failed: " + response.error;
                showUploadAlertUpload('danger', message, 'upload-alert-placeholder-search');
            }
        })
        .catch(err => {
            const message = "❌ Download failed: " + err;
            showUploadAlertUpload('danger', message, 'upload-alert-placeholder-search');
        })
        .finally(() => {
            hideLoading();
            summary_container.style.display = 'block';
            // document.getElementById('client-questionnaire').style.display = 'block';
            document.getElementById('search-return-value').value = '';
            document.getElementById("list-returns").style.display = 'None';
            document.getElementById("search-container").style.display = 'None';
            document.body.style.cursor = 'default';
        });
}


// function renderOverview(data) {
//     const container = document.getElementById("result-search-return-id");
//     const overviewBox = document.getElementById("result-overview");
//     const btnView = document.getElementById("btn-view-json");
//     // const btnDownload = document.getElementById("btn-download-json");

//     container.style.display = "block";

//     // ✅ Clear nội dung cũ
//     overviewBox.innerHTML = "";

//     btnView.onclick = () => {
//         displayJsonOverlay(data)
//     }

//     // btnDownload.onclick = () => {
//     //     const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
//     //     const url = URL.createObjectURL(blob);

//     //     const a = document.createElement("a");
//     //     a.href = url;
//     //     a.download = "tax_data.json";
//     //     a.click();

//     //     URL.revokeObjectURL(url);
//     // };


//     // Tạo table
//     const table = document.createElement("table");
//     table.border = "1";
//     table.style.borderCollapse = "collapse";
//     table.style.marginTop = "10px";

//     // Tạo header
//     const headerRow = document.createElement("tr");
//     const header1 = document.createElement("th");
//     header1.textContent = "Worksheet Name";
//     const header2 = document.createElement("th");
//     header2.textContent = "Entities Count";
//     headerRow.appendChild(header1);
//     headerRow.appendChild(header2);
//     table.appendChild(headerRow);

//     // Duyệt qua từng worksheet trong JSON
//     for (const [worksheetName, worksheetData] of Object.entries(data)) {
//         const row = document.createElement("tr");

//         const nameCell = document.createElement("td");
//         nameCell.textContent = worksheetName;
//         nameCell.style.padding = "4px 8px";

//         const countCell = document.createElement("td");
//         countCell.textContent = worksheetData.entities_count;
//         countCell.style.textAlign = "center";

//         row.appendChild(nameCell);
//         row.appendChild(countCell);
//         table.appendChild(row);
//     }

//     overviewBox.appendChild(table);
// }

// //  Display json
// function displayJsonOverlay(data) {
//     const overlay = document.getElementById("jsonOverlay");
//     const jsonBox = document.getElementById("jsonDataBox");
//     const closeBtn = document.getElementById("closeJsonBtn");

//     // Chuyển JSON thành HTML dạng tree với khả năng expand/collapse
//     jsonBox.innerHTML = generateJsonTree(data);

//     // Hiển thị popup
//     overlay.style.display = "flex";

//     // Nút đóng popup
//     closeBtn.onclick = () => {
//         overlay.style.display = "none";
//         jsonBox.innerHTML = "";
//     };
// }

// // 🟢 Chuyển JSON thành HTML tree có thể expand/collapse
// function generateJsonTree(json, isRoot = true) {
//     if (typeof json !== "object" || json === null) {
//         return `<span class="json-value">${JSON.stringify(json)}</span>`;
//     }

//     const isArray = Array.isArray(json);
//     let html = `<div class="json-container">`;

//     if (!isRoot) {
//         html += `<span class="json-toggle" onclick="toggleJsonTree(this)">[+] </span>`;
//         html += `<div class="json-content json-collapsed">`;
//     }

//     html += isArray ? "[" : "{";
//     html += `<ul class="json-list">`;

//     for (const key in json) {
//         const value = json[key];
//         const isObject = typeof value === "object" && value !== null;
//         const keyLabel = isArray
//             ? ""
//             : `<span class="json-key">"${key}"</span>: `;

//         html += `<li>${keyLabel}`;

//         if (isObject) {
//             html += generateJsonTree(value, false);
//         } else {
//             html += `<span class="json-value">${JSON.stringify(value)}</span>`;
//         }

//         html += `,</li>`;
//     }

//     html += `</ul>${isArray ? "]" : "}"}`;

//     if (!isRoot) {
//         html += `</div>`;
//     }

//     html += `</div>`;
//     return html;
// }

// // 🟢 Xử lý sự kiện click để thu gọn/mở rộng JSON tree
// function toggleJsonTree(element) {
//     const content = element.nextElementSibling;
//     if (content) {
//         const isCollapsed = content.classList.contains("json-collapsed");
//         content.classList.toggle("json-collapsed", !isCollapsed);
//         element.textContent = isCollapsed ? "[-] " : "[+] ";
//     }
// }



// =========test============

// ===test===

function measureTextWidth(text, font = '16px Arial') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
}

function displayEntities(data) {
    toggleVisibility("tax-summary-container", "show")
    const container = document.getElementById('tax-summary-container');
    container.innerHTML = '';

    Object.entries(data).forEach(([worksheetName, worksheetData]) => {
        if (!worksheetData.data || !worksheetData.entities_count) return;

        const section = document.createElement('div');
        section.innerHTML = `
        <h3 style="color: #000000;">${worksheetName}</h3>
        <p style="color: #000000;">
            Entities Count: ${worksheetData.entities_count}
            <span class="toggle-icon" style="cursor: pointer;">▼</span>
        </p>
        `;

        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        table.style.tableLayout = 'fixed';
        // table.style.margin = '0 auto';

        const headers = new Set();
        worksheetData.data.forEach(entity => {
            const general = entity["General primary key"] || entity["General"] || {};
            Object.keys(general).forEach(key => headers.add(key));
        });

        const headerList = [...headers];
        const columnWidths = {};

        // Tính độ rộng mỗi cột dựa trên nội dung dài nhất
        headerList.forEach(header => {
            let maxWidth = measureTextWidth(header);
            worksheetData.data.forEach(entity => {
                const general = entity["General primary key"] || entity["General"] || {};
                const value = general[header] !== undefined ? String(general[header]) : '';
                const width = measureTextWidth(value);
                if (width > maxWidth) maxWidth = width;
            });
            columnWidths[header] = Math.ceil(maxWidth) + 40; // padding: 10 left + 10 right
        });

        // Tổng width
        const totalWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
        table.style.width = totalWidth + 'px';

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerList.forEach(header => {
            const th = document.createElement('th');
            th.innerText = header;
            th.style.padding = '10px';
            th.style.border = '1px solid #ccc';
            th.style.backgroundColor = '#e0e0e0';  // Màu xám nhạt
            th.style.color = '#000';
            th.style.whiteSpace = 'nowrap';
            th.style.width = columnWidths[header] + 'px';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        worksheetData.data.forEach(entity => {
            const general = entity["General primary key"] || entity["General"] || {};
            const row = document.createElement('tr');
            headerList.forEach(header => {
                const td = document.createElement('td');
                td.innerText = general[header] || '';
                td.style.padding = '10px';
                td.style.border = '1px solid #ccc';
                td.style.whiteSpace = 'nowrap';
                td.style.width = columnWidths[header] + 'px';
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        table.appendChild(tbody);

        table.style.display = 'none'; // Ẩn bảng lúc đầu

        const toggleIcon = section.querySelector('.toggle-icon');
        toggleIcon.addEventListener('click', () => {
            const isHidden = table.style.display === 'none';
            table.style.display = isHidden ? 'table' : 'none';
            toggleIcon.innerText = isHidden ? '▲' : '▼';
        });

        section.appendChild(table);
        container.appendChild(section);
    });
}

// 14/04
// ===test===
function get_data() {
    console.log(1)
    return {
        "success": true,
        "returns": [
            {
                "ReturnID": "2024I:1234567.001:V5",
                "ClientName": "John Doe",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 2,
                "LatestImportTime": "2025-05-19T11:30:50.028113+00:00"
            },
            {
                "ReturnID": "2024I:1234567.001:V6",
                "ClientName": "DOE, John",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.001:V4",
                "ClientName": "DOE, John",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.001:V3",
                "ClientName": "DOE, John",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.001:V2",
                "ClientName": "DOE, John",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.001:V1",
                "ClientName": "DOE, John",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.001:V7",
                "ClientName": "DOE, John",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.001:V8",
                "ClientName": "DOE, John",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.002:V8",
                "ClientName": "Doe, Jeff",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.002:V7",
                "ClientName": "Doe, Jeff",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.002:V6",
                "ClientName": "Doe, Jeff",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.002:V5",
                "ClientName": "Doe, Jeff",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.002:V4",
                "ClientName": "Doe, Jeff",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.002:V3",
                "ClientName": "Doe, Jeff",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.002:V2",
                "ClientName": "Doe, Jeff",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            },
            {
                "ReturnID": "2024I:1234567.002:V1",
                "ClientName": "Doe, Jeff",
                "TaxYear": "2024",
                "TotalEntities": 0,
                "ImportCount": 0,
                "LatestImportTime": null
            }
        ]
    }
}

// function renderChecklist(data, importedHistory) {
//     toggleVisibility("tax-summary-container", "show");

//     if (data.ReturnHeader) {
//         const header = data.ReturnHeader;
//         document.getElementById("return-header-section").style.display = "block";
//         document.getElementById("tax-year").textContent = header.TaxYear || "(missing)";
//         document.getElementById("return-type").textContent = header.ReturnType || "(missing)";
//         document.getElementById("version").textContent = header.ReturnVersion || "(missing)";
//         document.getElementById("client-id").textContent = header.ClientID || "(missing)";
//         document.getElementById("return-group").textContent = header.ReturnGroupName || "(missing)";
//         document.getElementById("office-business-unit").textContent =
//             header.OfficeName && header.BusinessUnitName
//                 ? `${header.OfficeName}/${header.BusinessUnitName}`
//                 : "(missing)";
//     }

//     const ulThisYear = document.getElementById("checklist-this-year");
//     const ulNewFound = document.getElementById("checklist-new-found");
//     ulThisYear.innerHTML = '';
//     ulNewFound.innerHTML = '';

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

//     const keyFieldMapping = {
//         "W-2": {
//             data: ["Employer name", "Employee social security no"],
//             import: ["Employer_Name", "SocialSecurityNumber"]
//         },
//         "1099-DIV": {
//             data: ["Payer's name" ], //"Account number"
//             import: ["Payer_Name" ] //"Account_Number"
//         }
//         // Thêm loại form khác nếu cần
//     };

//     // === 1. Duyệt importedHistory => tạo Set để tra nhanh
//     const importedMap = new Map();

//     const latestImportedByForm = new Map(); 

//     (importedHistory || []).forEach((historyItem) => {
//         const importedForms = historyItem.imported_json_data || [];

//         importedForms.forEach(form => {
//             const formType = form.form_type;
//             const mapping = keyFieldMapping[formType];
//             if (!mapping) return;

//             const importFields = mapping.import;
//             const status = form.status;

//             // ✅ Gộp form theo form_type (nhiều lần import W-2 vẫn gom về 1)
//             if (!latestImportedByForm.has(formType)) {
//                 latestImportedByForm.set(formType, {
//                     form_type: formType,
//                     status,
//                     data: [...form.data],
//                 });
//             } else {
//                 const existing = latestImportedByForm.get(formType);
//                 existing.data.push(...form.data);
//             }

//             // ✅ Set vào map dùng để so sánh sau
//             form.data.forEach(item => {
//                 const key = formType + "|" + importFields.map(f => String(item[f] || "").trim().toLowerCase()).join("|");
//                 importedMap.set(key, status);
//             });
//         });
//     });

//     // 👉 Đây là latestImported gộp theo form
//     const latestImported = Array.from(latestImportedByForm.values());

//     const currentOCRKeys = new Set();
//     // === 2. Duyệt từng worksheet trong data
//     for (const worksheet in data) {
//         const entities = data[worksheet].data || [];
//         if (entities.length === 0) continue;

//         const displayFields = displayFieldMapping[worksheet];
//         const mapping = keyFieldMapping[worksheet];

//         entities.forEach(entity => {
//             const pk = entity["General primary key"] || entity["General"] || entity;
//             const displayText = displayFields.map(f => pk?.[f] || "(missing)").join(" - ");
//             const li = document.createElement("li");

//             if (mapping) {
//                 const dataKey = mapping.data.map(f => String(pk?.[f] || "").trim().toLowerCase()).join("|");
//                 const fullKey = worksheet + "|" + dataKey;

//                 currentOCRKeys.add(fullKey); // ✅ lưu lại key OCR hiện có

//                 if (importedMap.has(fullKey)) {
//                     li.innerHTML = `<input type="checkbox" checked> ${worksheet} (${displayText})`;
//                 } else {
//                     li.innerHTML = `<input type="checkbox"> ${worksheet} (${displayText})`;
//                 }

//                 li.setAttribute("data-key", fullKey);
//                 ulThisYear.appendChild(li);
//             } else {
//                 li.innerHTML = `<input type="checkbox"> ${worksheet} (${displayText})`;
//                 ulThisYear.appendChild(li);
//             }
//         });

//     }

//     // === 3. Duyệt new found trong import history
//     // === Duyệt imported_history để thêm những new found bị thiếu trong checklist ===

//     const displayFieldMappingImport = {
//         "W-2": ["Employer_Name", "SocialSecurityNumber"],
//         "1099-DIV": ["Payer_Name"],
//     };
//     latestImported.forEach(form => {
//         const formType = form.form_type;
//         const status = form.status;
//         const mapping = keyFieldMapping[formType];
//         const displayFields = displayFieldMappingImport[formType];

//         if (status !== "new found" || !mapping || !displayFields) return;

//         form.data.forEach(item => {
//             const key = formType + "|" + mapping.import.map(f => String(item[f] || "").trim().toLowerCase()).join("|");

//             // Nếu chưa được render ở bước trước
//             if (!document.querySelector(`li[data-key="${key}"]`)) {
//                 const displayText = displayFields.map(f => item[f] || "(missing)").join(" - ");
//                 const li = document.createElement("li");
//                 li.innerHTML = `<input type="checkbox" checked> ${formType} (${displayText})`;
//                 li.classList.add("new-found");
//                 li.setAttribute("data-key", key); // đánh dấu để không bị trùng lần nữa
//                 ulNewFound.appendChild(li);
//             }
//         });
//     });

// }


// const latestImported = importedHistory?.[0]?.imported_json_data || [];

// latestImported.forEach(form => {
//     const formType = form.form_type;
//     const mapping = keyFieldMapping[formType];
//     if (!mapping) return;

//     const importFields = mapping.import;
//     const status = form.status;

//     form.data.forEach(item => {
//         const key = formType + "|" + importFields.map(f => String(item[f] || "").trim().toLowerCase()).join("|");
//         importedMap.set(key, status);
//     });
// });


function renderChecklist(jsonData, importHistory) {
    toggleVisibility("tax-summary-container", "show");
    var TAX_YEAR = ''
    // Hiển thị thông tin header
    if (jsonData.ReturnHeader) {
        const header = jsonData.ReturnHeader;
        document.getElementById("return-header-section").style.display = "block";
        document.getElementById("tax-year").textContent = header.TaxYear || "(missing)";
        TAX_YEAR = header.TaxYear
        document.getElementById("return-type").textContent = header.ReturnType || "(missing)";
        document.getElementById("version").textContent = header.ReturnVersion || "(missing)";
        document.getElementById("client-id").textContent = header.ClientID || "(missing)";
        document.getElementById("return-group").textContent = header.ReturnGroupName || "(missing)";
        document.getElementById("office-business-unit").textContent =
            header.OfficeName && header.BusinessUnitName
                ? `${header.OfficeName}/${header.BusinessUnitName}`
                : "(missing)";
    }

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

    const linkFieldMapping = {
        "W-2": "Employer_Name",
        "1099-DIV": "Payer_Name"
    };

    const importedMap = new Map();
    const latestImportedByForm = new Map();

    const latestImported = Array.from(latestImportedByForm.values());
    const currentOCRKeys = new Set();

    const checkedRows = [];
    const uncheckedRows = [];

    // === Render OCR data ===
    //===fix
    const tableBody = document.getElementById("document-table-body");
    tableBody.innerHTML = '';
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
            let tableRow = null
            importHistory.forEach(batch => {
                batch.imported_json_data?.forEach(doc => {
                    const hasValidYear = doc.data.every(entity => entity.tax_year == TAX_YEAR);
                    if (doc.form_type == worksheet && doc.link == fullKey && hasValidYear) {
                        isChecked = true;
                        key = batch.id;
                        status = (doc.status)
                    }
                });
            });
            if (isChecked) {
                tableRow = createTableRow(worksheet, displayText, key, isChecked, '', status);
                checkedRows.push(tableRow);
            } else {
                tableRow = createTableRow(worksheet, displayText, key, isChecked, '');
                uncheckedRows.push(tableRow);
            }
            // tableBody.appendChild(tableRow);
        });
    }

    importHistory.forEach(batch => {
        batch.imported_json_data?.forEach(doc => {
            const { form_type, link, status, data } = doc;
            const matchField = linkFieldMapping[form_type];


            if (!link || !Array.isArray(data) || !matchField) return;

            // const key = form_type + "|" + link.key?.toLowerCase();
            key = batch.id;

            if (link == "New Item") {
                const entity = data[0] || {};
                const displayText = (entity[matchField] || "(missing)").toString();
                const tableRow = createTableRow(form_type, displayText, key, true, " (New item)", status);
                tableBody.appendChild(tableRow);
                checkedRows.push(tableRow);
            }
        });
    });

    [...checkedRows, ...uncheckedRows].forEach(row => tableBody.appendChild(row));

}

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("dropdown-btn")) {
        const item = e.target.closest(".checklist-item");

        // Nếu chưa có .checklist-details thì thêm vào (demo nội dung chi tiết)
        let details = item.querySelector(".checklist-details");
        if (!details) {
            details = document.createElement("div");
            details.className = "checklist-details hidden"; // ✅ thêm hidden lúc tạo
            details.innerHTML = "<p style='padding: 10px;'>More details coming soon...</p>";
            item.appendChild(details);
        }

        // Toggle ẩn/hiện
        details.classList.toggle("hidden");
        e.target.textContent = details.classList.contains("hidden") ? "▼" : "▲";
    }
});


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




// document.getElementById('continue-btn').addEventListener('click', () => {
//     window.location.href = "../templete/basic_info.html";
// })


document.getElementById('get-list-returns-btn').addEventListener('click', () => {
    const btn = document.getElementById('get-list-returns-btn');
    // set display = none for these element
    const returnList = document.getElementById('list-returns');
    const search_container = document.getElementById('search-container')
    const summary_container = document.getElementById('tax-summary-container')
    // const client_questionnaire = document.getElementById('client-questionnaire')

    showLoading();
    returnList.style.display = 'none'
    search_container.style.display = 'none'
    summary_container.style.display = 'none'
    // client_questionnaire.style.display = 'none'
    toggleVisibility("tax-summary-container", "hile")
    btn.disabled = true;
    document.body.style.cursor = 'wait';
    var show = false

    // hideLoading();
    // search_container.style.display = 'block'
    // btn.disabled = false;
    // document.body.style.cursor = 'default';
    // returnList.style.display = 'block'
    // toggleVisibility("search-list-returns-btn", "show")


    fetch(`${API_BASE_URL}/api/cch-import/list-returns-sync/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filters: ["TaxYear eq '2024'"]
        })
    })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            console.log('Returns:', data.returns);
            returnList.style.display = 'block'

            renderReturnsTable(data.returns)

            // toggleVisibility("get-list-returns-btn", "show")
            document.getElementById('search-container').style.display = 'block'
            show = true
        })
        .catch(error => {
            console.error('Fetch error:', error);
        })
        .finally(() => {
            hideLoading();

            search_container.style.display = 'block'
            btn.disabled = false;
            document.body.style.cursor = 'default';
            if (show) {
                toggleVisibility("search-list-returns-btn", "show")
                returnList.style.display = 'block'
            }
        });

})

// serch list return

function renderReturnsTable(data) {
    const returnList = document.getElementById('list-returns');
    const tableBody = document.getElementById('list-returns-table-body');

    returnList.style.display = 'block';
    tableBody.innerHTML = ''; 

    data.forEach((item) => {
        const row = document.createElement('tr');

        const lastUpdate = item.LatestImportTime
            ? new Date(item.LatestImportTime).toLocaleString()
            : 'Not Generated';
        const pbcProgress = item.ImportCount > 0
            ? `${item.ImportCount}/${item.TotalEntities}`
            : 'Not Generated';

        // const pbcStatus = item.MatchedStatus2Count > 0 ? 'Client - Completed' : 'Not Generated';
        let pbcStatus = 'Not Generated';
        if (item.ImportCount > 0) {
            if (item.ImportCount === item.TotalEntities) {
                pbcStatus = 'Client - Completed';
            } else {
                pbcStatus = 'Client - In Progress';
            }
        }

        row.innerHTML = `
            <td>${item.ReturnID}</td>
            <td>${pbcProgress}</td>
            <td>${pbcStatus}</td>
            <td>${lastUpdate}</td>
            <td><input type="radio" name="return_id" value="${item.ReturnID}"  /></td>
        `;
        //  <td><input type="checkbox" value="${item.ReturnID}" /></td>
        tableBody.appendChild(row);
    });

}

document.getElementById('search-list-returns-btn').addEventListener('click', () => {
    const btn = document.getElementById('search-list-returns-btn');
    // set display = none for these element
    const returnList = document.getElementById('list-returns');
    const search_container = document.getElementById('search-container')
    const summary_container = document.getElementById('tax-summary-container')
    // const client_questionnaire = document.getElementById('client-questionnaire')

    showLoading();
    returnList.style.display = 'none'
    search_container.style.display = 'none'
    summary_container.style.display = 'none'
    // client_questionnaire.style.display = 'none'
    toggleVisibility("tax-summary-container", "hile")
    btn.disabled = true;
    document.body.style.cursor = 'wait';


    fetch(`${API_BASE_URL}/api/cch-import/list-returns/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filters: ["TaxYear eq '2024'"]
        })
    })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            console.log('Returns:', data.returns);
            returnList.style.display = 'block'
            renderReturnsTable(data.returns)

            // data.returns.forEach((item, index) => {
            //     const label = document.createElement('label');
            //     label.className = 'radio-item';

            //     const input = document.createElement('input');
            //     input.type = 'radio';
            //     input.name = 'return_id';
            //     input.value = item.ReturnID;
            //     if (index === 0) input.checked = true; // chọn sẵn item đầu tiên

            //     label.appendChild(input);
            //     label.appendChild(document.createTextNode(item.ReturnID));
            //     returnList.appendChild(label);
            // });

            document.getElementById('search-container').style.display = 'block'
        })
        .catch(error => {
            // console.error('Fetch error:', error);
        })
        .finally(() => {
            hideLoading();
            returnList.style.display = 'block'
            search_container.style.display = 'block'
            btn.disabled = false;
            document.body.style.cursor = 'default';
        });

})

// function displayEntities(data) {
//     const container = document.getElementById('tax-summary-container');
//     container.innerHTML = '';

//     Object.entries(data).forEach(([worksheetName, worksheetData]) => {
//       if (!worksheetData.data || !worksheetData.entities_count) return;

//       // Title for worksheet
//       const section = document.createElement('div');
//       section.innerHTML = `
//         <h3>${worksheetName}</h3>
//         <p><strong>Entities Count:</strong> ${worksheetData.entities_count}</p>
//       `;

//       // Table for General primary key
//       const table = document.createElement('table');
//       table.border = '1';
//       table.style.marginBottom = '20px';

//       const headers = new Set();

//       // Get headers from General primary key
//       worksheetData.data.forEach(entity => {
//         const general = entity["General primary key"] || entity["General"] || {};
//         Object.keys(general).forEach(key => headers.add(key));
//       });

//       const thead = document.createElement('thead');
//       thead.innerHTML = `<tr>${[...headers].map(h => `<th>${h}</th>`).join('')}</tr>`;
//       table.appendChild(thead);

//       const tbody = document.createElement('tbody');
//       worksheetData.data.forEach(entity => {
//         const general = entity["General primary key"] || entity["General"] || {};
//         const row = document.createElement('tr');
//         row.innerHTML = [...headers].map(h => `<td>${general[h] || ''}</td>`).join('');
//         tbody.appendChild(row);
//       });

//       table.appendChild(tbody);
//       section.appendChild(table);
//       container.appendChild(section);
//     });
// }

//=============================apply filter for search box============================

// document.addEventListener("DOMContentLoaded", () => {
//     const searchInput = document.getElementById("search-return-value");
//     const returnListContainer = document.getElementById("list-returns");

//     searchInput.addEventListener("keydown", (event) => {
//         console.log("⏳ Key pressed:", event.key);

//         // Optional: chỉ filter khi nhấn Enter
//         if (event.key !== "Enter") return;

//         const keyword = searchInput.value.trim().toLowerCase();

//         // Nếu list đang ẩn hoặc không tồn tại
//         if (!returnListContainer || returnListContainer.style.display === "none") {
//             console.log("⚠️ No list to search in.");
//             return;
//         }

//         const labels = returnListContainer.querySelectorAll("label.radio-item");

//         labels.forEach(label => {
//             const text = label.textContent.toLowerCase();
//             if (text.includes(keyword)) {
//                 label.style.display = "block";
//             } else {
//                 label.style.display = "none";
//             }
//         });
//     });
// });

//================================filter list return===========================================
// document.addEventListener("DOMContentLoaded", () => {
//     const searchInput = document.getElementById("search-return-value");
//     const returnListContainer = document.getElementById("list-returns");

//     searchInput.addEventListener("input", () => {
//         const keyword = searchInput.value.trim().toLowerCase();

//         if (!returnListContainer || returnListContainer.style.display === "none") {
//             return;
//         }

//         const labels = returnListContainer.querySelectorAll("label.radio-item");

//         labels.forEach(label => {
//             const text = label.textContent.toLowerCase();
//             label.style.display = text.includes(keyword) ? "block" : "none";
//         });
//     });
// });
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-return-value");
    const tableBody = document.getElementById("list-returns-table-body");

    if (!searchInput || !tableBody) return;

    searchInput.addEventListener("input", () => {
        const keyword = searchInput.value.trim().toLowerCase();

        const rows = tableBody.querySelectorAll("tr");

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(keyword) ? "table-row" : "none";
        });
    });
});



//=========================handle show json========================
const btn_show_JSON = document.getElementById('btn-show-json')

function displayJsonOverlay(data) {
    const jsonBox = document.getElementById("result-overview");

    // Chuyển JSON thành HTML dạng tree
    jsonBox.innerHTML = generateJsonTree(data);

    // Bắt sự kiện toggle sau khi đã render
    jsonBox.querySelectorAll(".json-toggle").forEach(toggle => {
        toggle.addEventListener("click", function () {
            const content = this.nextElementSibling;
            if (content) {
                const isCollapsed = content.classList.contains("json-collapsed");
                content.classList.toggle("json-collapsed", !isCollapsed);
                this.textContent = isCollapsed ? "[-] " : "[+] ";
            }
        });
    });

    const btnDownload = document.getElementById("btn-download-json");
    btnDownload.onclick = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "tax_data.json";
        a.click();

        URL.revokeObjectURL(url);
    };
}


// 🟢 Chuyển JSON thành HTML tree có thể expand/collapse
function generateJsonTree(json, isRoot = true) {
    if (typeof json !== "object" || json === null) {
        return `<span class="json-value">${JSON.stringify(json)}</span>`;
    }

    const isArray = Array.isArray(json);
    let html = `<div class="json-container">`;

    if (!isRoot) { //onclick="toggleJsonTree(this)"
        html += `<span class="json-toggle" >[+] </span>`;
        html += `<div class="json-content json-collapsed">`;
    }

    html += isArray ? "[" : "{";
    html += `<ul class="json-list">`;

    for (const key in json) {
        const value = json[key];
        const isObject = typeof value === "object" && value !== null;
        const keyLabel = isArray
            ? ""
            : `<span class="json-key">"${key}"</span>: `;

        html += `<li>${keyLabel}`;

        if (isObject) {
            html += generateJsonTree(value, false);
        } else {
            html += `<span class="json-value">${JSON.stringify(value)}</span>`;
        }

        html += `,</li>`;
    }

    html += `</ul>${isArray ? "]" : "}"}`;

    if (!isRoot) {
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

document.querySelectorAll(".json-toggle").forEach(toggle => {
    toggle.addEventListener("click", function () {
        const content = this.nextElementSibling;
        if (content) {
            const isCollapsed = content.classList.contains("json-collapsed");
            content.classList.toggle("json-collapsed", !isCollapsed);
            this.textContent = isCollapsed ? "[-] " : "[+] ";
        }
    });
});

// 🟢 Xử lý sự kiện click để thu gọn/mở rộng JSON tree
function toggleJsonTree(element) {
    const content = element.nextElementSibling;
    if (content) {
        const isCollapsed = content.classList.contains("json-collapsed");
        content.classList.toggle("json-collapsed", !isCollapsed);
        element.textContent = isCollapsed ? "[-] " : "[+] ";
    }
}

// render status box
function renderStatusBox(jsonData, importHistory) {
    // for (const [key, value] of Object.entries(jsonData)) {
    //     if (key !== "ReturnHeader" && value.entities_count) {
    //         totalEntities += value.entities_count;
    //     }
    // }
    const totalEntities = document.querySelectorAll("#document-table-body tr").length;
    console.log("Total entities:", totalEntities);

    // console.log("Total entities:", totalEntities);
    const checkedCount = document.querySelectorAll('#document-table-body input[type="checkbox"]:checked').length;
    console.log("Số checklist đã được chọn:", checkedCount);

    const importedHistory = importHistory || [];
    const latestImportTime = importedHistory.length > 0 ? importedHistory[0].imported_at : null;
    var formattedTime = ''
    if (latestImportTime) {
        console.log("Thời gian import gần nhất:", latestImportTime);
        // const isoString = "2025-05-09T14:39:26.067791+00:00";
        const date = new Date(latestImportTime);

        const pad = num => String(num).padStart(2, '0');
        formattedTime = `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

        console.log(formattedTime);
    }

    const status = checkedCount === totalEntities && totalEntities > 0 ? "Done" : "In Progress";

    // Gán vào các label
    const labels = document.querySelectorAll('.status-box #label-progress');
    if (labels.length >= 4) {
        labels[0].innerHTML = `<strong>Progress: </strong>${checkedCount}/${totalEntities}`;
        labels[1].innerHTML = `<strong>Status: </strong>${status}`;
        labels[2].innerHTML = `<strong>Last Update: </strong>${formattedTime}`;
        labels[3].innerHTML = `<strong>CCH Push Status: </strong>Pending`;
    }
}

//  checked table checklist
// const rowCheckboxes = document.querySelectorAll(".document-table tbody input[type='checkbox']");
const tableBody = document.getElementById("document-table-body");
const selectAllCheckbox = document.getElementById("select-all");

selectAllCheckbox.addEventListener("change", function () {
    const all = document.querySelectorAll("#document-table-body input[type='checkbox']:not(:disabled)");
    all.forEach(cb => cb.checked = this.checked);
});

tableBody.addEventListener("change", function (e) {
    if (e.target.matches("input[type='checkbox']")) {
        const checkboxes = tableBody.querySelectorAll("input[type='checkbox']:not(:disabled)");
        const allChecked = [...checkboxes].every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
    }
});



function createTableRow(formType, displayText, key, isChecked = false, newFound = '', status = '3') {
    const row = document.createElement("tr");
    row.setAttribute("data-key", key);

    if (newFound != '') {
        console.log(displayText)
    }
    console.log(status)
    let statusText = "Pending to Upload";  // default
    if (status === '1') statusText = "✅ CCH Import - Success";
    else if (status === '2') statusText = "✅ Uploaded";
    else if (status === '4') statusText = "Not Applicable"
    else if (status === '5') statusText = "Provided Elsewhere"


    row.innerHTML = `
        <td ><input type="checkbox" ${isChecked ? "checked" : ""} ${status != '2' ? "disabled" : ""}></td>
        <td class="doc-name">${formType} (${displayText})${newFound}</td>
        <td ><span class="status-tag">${statusText}</span></td>
        <td class="center-cell">
            <button class="action-btn delete-btn" title="Remove">🗑</button>
        </td>
    `;
    return row;
}

//=====================================remove import item============================
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-btn")) {
        const row = e.target.closest("tr");
        const importId = row.getAttribute("data-key");
        if (importId == '0') { return }
        if (confirm(`Are you sure you want to delete this import - ${importId}? `)) {
            fetch(`${API_BASE_URL}/api/cch-import/delete-import/${importId}/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {

                        const checkbox = row.querySelector("input[type='checkbox']");
                        const statusTag = row.querySelector(".status-tag");

                        checkbox.checked = false;
                        checkbox.disabled = true;
                        // checkbox.classList.remove("na", "pe"); // nếu có icon tuỳ chỉnh
                        // row.classList.remove("active"); // nếu có style active

                        if (statusTag) {
                            statusTag.innerText = "Pending to Upload";
                        }

                        console.log("success")
                    } else {
                        alert("❌ Failed to delete: " + data.error);
                    }
                })
                .catch(err => {
                    alert("❌ Error deleting import.");
                    console.error(err);
                });
        }
    }
});

//======================================remove all imports===========================
document.getElementById("btn-generate-pbc").addEventListener('click', () => {

    // return
    fetch(`${API_BASE_URL}/api/cch-import/delete-imports/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log("remove all success")
            } else {
                alert("❌ Failed to delete: " + data.error);
            }
        })
        .catch(err => {
            alert("❌ Error deleting import.");
            console.error(err);
        });
    var imported = []
    localStorage.setItem('importHistory', JSON.stringify(imported));
    var jsonData = localStorage.getItem('jsonData');
    if (jsonData) {
        renderChecklist(JSON.parse(jsonData), imported);
    } else {
        console.warn("jsonData is null or undefined in localStorage.");
    }

    renderStatusBox(jsonData, imported)
})

function updateImportedStatus() {
    var imports = localStorage.getItem('importHistory');
    var importHistory = JSON.parse(imports);
    const checkedRows = document.querySelectorAll("#document-table-body tr");

    checkedRows.forEach(row => {
        const checkbox = row.querySelector("input[type='checkbox']");
        const key = row.getAttribute("data-key");

        if (checkbox && checkbox.checked && !checkbox.disabled) {
            const matchedItem = importHistory.find(item => String(item.id) === key);
            if (matchedItem) {
                // ✅ Cập nhật tất cả status trong imported_json_data thành "1"
                matchedItem.imported_json_data.forEach(doc => {
                    doc.status = "1";
                });
            }
        }
    });
    var jsonData = localStorage.getItem('jsonData');
    renderChecklist(JSON.parse(jsonData), importHistory)
    // ✅ Nếu muốn lưu lại importHistory vào localStorage sau khi cập nhật
    localStorage.setItem("importHistory", JSON.stringify(importHistory));
}

//===============================send to cch======================================================
function getCheckedImportItems(importHistory) {
    const checkedIds = [];

    // 1. Duyệt qua bảng và lấy các hàng được check
    document.querySelectorAll("#document-table-body tr").forEach(row => {
        const checkbox = row.querySelector("input[type='checkbox']");
        const importId = row.getAttribute("data-key");

        if (checkbox && checkbox.checked && importId !== '0') {
            checkedIds.push(Number(importId));  // dùng số nguyên để so sánh đúng
        }
    });

    // 2. Lọc lại danh sách importHistory
    const selectedImports = importHistory.filter(item => checkedIds.includes(item.id));

    return selectedImports;
}

document.getElementById("btn-send-to-cch").addEventListener("click", async () => {
    var returnId = "2024I:1234567.001:V5";
    const jsonData = localStorage.getItem('jsonData');
    const data = JSON.parse(jsonData);
    const importHistory = localStorage.getItem('importHistory');
    const imports = JSON.parse(importHistory);
    const header = data.ReturnHeader;
    returnId = `${header.TaxYear}${header.ReturnType}:${header.ClientID}:V${header.ReturnVersion}`
    const import_checked = getCheckedImportItems(imports)

    const payload = {
        return_id: returnId,
        imports: import_checked
    };



    // showLoading()
    // try {

    //     fetch(`${API_BASE_URL}/api/cch-import/get-imports/`, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify(payload)
    //     })
    //         .then(res => res.json())
    //         .then(data => {
    //             if (data.success) {
    //                 const link = document.createElement("a");
    //                 link.href = data.excel_url;
    //                 link.download = "latest-import.xlsx";
    //                 document.body.appendChild(link);
    //                 link.click();

    //                 document.body.removeChild(link);
    //             } else {
    //                 alert("❌ Error: " + data.error);
    //             }
    //         });
    // } catch (err) {
    //     console.error("Error:", err);
    //     alert("❌ Error occurred while calling API.");
    // } finally {
    //     hideLoading()
    //     updateImportedStatus()
    // }

});

//========================================send pbc list============================
document.getElementById("btn-send-client").addEventListener('click', async () => {
    const email = 'henry@silversea-analytics.com';
    const jsonData = localStorage.getItem("jsonData");
    const importHistory = localStorage.getItem("importHistory");


    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/api/cch-import/send-pbclist-link/`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                email: email,
                jsonData: jsonData,
                importHistory: importHistory
            })
        });

        const result = await response.json();
        alert(result.message || "Email sent!");
    } catch (error) {
        console.error("Error sending email:", error);
        alert("Failed to send email.");
    } finally {
        hideLoading();
    }
});

const overlay = document.querySelector(".detail-json-container");
const closeBtn = document.getElementById("close-overlay");

closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
});
//=======================================show detail json=========================================
document.getElementById('btn-detail-json').addEventListener('click', () => {


    overlay.style.display = "flex";
    var jsonData = localStorage.getItem('jsonData');
    if (jsonData) {
        var data = JSON.parse(jsonData)
        console.log(data)
        displayJsonOverlay(data)
    }

})