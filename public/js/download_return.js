var connect_btn = document.getElementById("connect-btn")
var search_return_btn = document.getElementById("search-return-id")
import { showUploadAlertUpload } from './utils/alertMessage.js';
import { toggleVisibility } from './utils/toggleHide.js'
import { showLoading, hideLoading } from './utils/loadingOverlay.js';
import { API_BASE_URL } from './utils/config.js'

let totalEntities = 0;
let CURRENT_RETURN_ID
var returnID = ''

window.addEventListener("DOMContentLoaded", function () {
    const data = localStorage.getItem('jsonData');
    const imports = localStorage.getItem('importHistory');

    if (!data || !imports) {
        // toggleVisibility("search-list-returns-btn", "hide");
        return;
    }

    const jsonData = JSON.parse(data);
    const importHistory = JSON.parse(imports);

    renderChecklist(jsonData, importHistory);
    renderStatusBox(jsonData, importHistory);

    renderReturnHeader()

    var returnData = localStorage.getItem('returnID');
    returnID = JSON.parse(returnData)
    console.log(returnID)
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
        "1099-SSA": {
            "entities_count": 2,
            "data": [
                {
                    "General primary key": {
                        "TSJ": "T"
                    },
                    "Name": "John DOE",
                    "Beneficiary's SSN": "987-65-4321",
                    "Benefits paid": 1,
                    "Benefits repaid to SSA": 2,
                    "Description of amount in Box 3": 4,
                    "Voluntary Fed income tax w/h": 5,
                    "Medicare premiums withheld": 6,
                    "Prescription drug coverage ins": 7
                },
                {
                    "General primary key": {
                        "TSJ": "S"
                    },
                    "Name": "Jane Doe",
                    "Beneficiary's SSN": "124-35-6789",
                    "Benefits paid": 1,
                    "Benefits repaid to SSA": 2,
                    "Description of amount in Box 3": 4,
                    "Voluntary Fed income tax w/h": 5,
                    "Medicare premiums withheld": 6,
                    "Prescription drug coverage ins": 7
                }
            ]
        },
        "W-2": {
            "entities_count": 5,
            "data": [
                {
                    "General primary key": {
                        "TS": "T",
                        "Employer identification number": "12-3456789",
                        "Employer name": "New Entity"
                    },
                    "Employee social security no": "987-65-4321",
                    "Wages, tips other compensation": 1001,
                    "Federal income tax withheld": 1002,
                    "Social security wages": 1003,
                    "Social security tax withheld": 1004,
                    "Employer address": "Street",
                    "Medicare wages": 1005,
                    "Medicare tax withheld": 1006,
                    "Employer city": "City",
                    "Employer state": "IL",
                    "Employer ZIP": 11111,
                    "Social security tips": 1007,
                    "Allocated tips": 1008,
                    "Control number": 1,
                    "Dependent care benefits": 1010,
                    "Employee name": "John DOE",
                    "Nonqualified plans": 1011,
                    "Employee address": "Chaning This Address Again",
                    "Employee city": "Edwardsville",
                    "Employee state": "IL",
                    "Employee ZIP": 62025,
                    "X if not trade/business income": "X",
                    "Flag for 1040/1040nr statement": "X",
                    "W2 income description": "Scholarship or fellowship grants",
                    "Uncollected FICA on tips": 3004,
                    "Elective deferrals": 3005,
                    "Tier II tax withheld": 3006,
                    "Tips reported - O/R": 3007,
                    "Tips not reported": 3008,
                    "Schedule C entity": "John DOE",
                    "S Corp activity": "Brighthouse Life Insurance Company",
                    "Nontaxable Medicaid waiver pmt": 3011,
                    "SE health insurance premiums": 3012,
                    "State voluntary retirement": 3013,
                    "Community property - Form 8958": "X",
                    "X if NR service member pay": "X",
                    "Do not PF this W-2": "X",
                    "Not a W-2": "X",
                    "Hypothetical wages - O/R": 3018,
                    "Exclude from TEC hypo calc": "X",
                    "Include in hypo FICA/Medi Y/N": "Yes (Default)",
                    "CA SDI wages": 3021,
                    "Sports franchise number": 322,
                    "MT state info - tips reported": 3023,
                    "Non standard W2": "X",
                    "Post of duty code": "AL",
                    "Employer foreign ID number": 3026,
                    "Employer's fgn st or province": 3027,
                    "Employee fgn st or province": 3028,
                    "Employee postal code": 3029,
                    "State and City Info": [
                        {
                            "State": "IL",
                            "Employer's state ID number": "State ID",
                            "State wages": "2001",
                            "State withholding": "2002",
                            "City wages": "2003",
                            "City withholding": "2004",
                            "City code": "XXX",
                            "Locality name": "Locality name",
                            "Military": "X",
                            "State use": "state use",
                            "State use 2": "state use 2",
                            "State disability insurance": "2005",
                            "Work days/hours in city": "2006",
                            "Dates worked in city from": "12/01",
                            "Dates worked in city to": "12/02",
                            "Hypo state wages - override": "2007",
                            "Hypo state code (if diff)": "AK",
                            "State exclude from hypo": "X"
                        }
                    ]
                },
                {
                    "General primary key": {
                        "TS": "S",
                        "Employer identification number": "17-2345689",
                        "Employer name": "Existing Entity"
                    },
                    "Employee social security no": "124-35-6789",
                    "Wages, tips other compensation": 1,
                    "Federal income tax withheld": 19,
                    "Social security wages": 17,
                    "Social security tax withheld": 18,
                    "Employer address": "Street",
                    "Medicare wages": 19,
                    "Medicare tax withheld": 19,
                    "Employer city": "City",
                    "Employer state": "IL",
                    "Employer ZIP": 22222,
                    "Social security tips": 21,
                    "Allocated tips": 22,
                    "Control number": 2,
                    "Dependent care benefits": 23,
                    "Employee name": "Jane Doe",
                    "Nonqualified plans": 24,
                    "Statutory employee": "X",
                    "Retirement plan": "X",
                    "Third-party sick pay": "X",
                    "Employee address": "Chaning This Address Again",
                    "Employee city": "Edwardsville",
                    "Employee state": "IL",
                    "Employee ZIP": 62025,
                    "SE health insurance premiums": 34,
                    "Box 12": [
                        {
                            "Code1  Box 12": "A",
                            "Amount (W-2, box 12)": "25"
                        },
                        {
                            "Code1  Box 12": "B",
                            "Amount (W-2, box 12)": "26"
                        },
                        {
                            "Code1  Box 12": "C",
                            "Amount (W-2, box 12)": "27"
                        },
                        {
                            "Code1  Box 12": "D",
                            "Amount (W-2, box 12)": "28"
                        },
                        {
                            "Code1  Box 12": "E",
                            "Amount (W-2, box 12)": "29"
                        },
                        {
                            "Code1  Box 12": "G",
                            "Amount (W-2, box 12)": "30"
                        },
                        {
                            "Code1  Box 12": "V",
                            "Amount (W-2, box 12)": "31"
                        },
                        {
                            "Code1  Box 12": "W",
                            "Amount (W-2, box 12)": "32"
                        },
                        {
                            "Code1  Box 12": "AA",
                            "Amount (W-2, box 12)": "33"
                        },
                        {
                            "Code1  Box 12": "BB",
                            "Amount (W-2, box 12)": "34"
                        },
                        {
                            "Code1  Box 12": "DD",
                            "Amount (W-2, box 12)": "35"
                        }
                    ],
                    "State and City Info": [
                        {
                            "State": "MO",
                            "State wages": "35",
                            "State withholding": "43",
                            "City wages": "37",
                            "City withholding": "19",
                            "City code": "ALB"
                        }
                    ]
                }
            ]
        },
        "1099-R": {
            "entities_count": 6,
            "data": [
                {
                    "General primary key": {
                        "TSJ": "S",
                        "Payer's Fed identification num": "18-2345679",
                        "Payer's name": "mapiing"
                    },
                    "Gross distribution": 15,
                    "Payer's street address": "street",
                    "Taxable amount": 16,
                    "Payer's city": "city",
                    "Payer's ZIP or postal code": 90211,
                    "Taxable amount not determined": "X",
                    "Total distribution": "X",
                    "Capital gain": 19,
                    "Federal income tax withheld": 20,
                    "Recipient's identification num": "124-35-6789",
                    "Employee contribution": 21,
                    "Unrealized apprec in security": 22,
                    "Recipient's name": "Jane Doe",
                    "Recipient's address": "Chaning This Address Again",
                    "Distribution code": "7A",
                    "Other distribution": 25,
                    "Recipient's city": "Edwardsville",
                    "Recipient's state": "IL",
                    "Recipient's ZIP or postal code": 62025,
                    "Percent of total distribution": 26,
                    "Total employee contributions": 27,
                    "State tax withheld": 100,
                    "State": "LA",
                    "State distribution": 34,
                    "Amount allocable to IRR": 28,
                    "First year of Roth 401(k) cont": 29,
                    "FATCA filing requirement": "X",
                    "Account number": "12-3456789",
                    "Date of payment": "01/01/2025",
                    "Local tax withheld": 123,
                    "Name of locality": 36,
                    "Local distribution": 37
                },
                {
                    "General primary key": {
                        "TSJ": "T",
                        "Payer's Fed identification num": "17-2345680",
                        "Payer's name": "New Entity"
                    },
                    "Gross distribution": 13,
                    "Payer's street address": "2 S Dollar St",
                    "Taxable amount": 14,
                    "Payer's city": "Beverly Hills",
                    "Payer's state": "CA",
                    "Payer's ZIP or postal code": 90211,
                    "Taxable amount not determined": "X",
                    "Total distribution": "X",
                    "Capital gain": 19,
                    "Federal income tax withheld": 20,
                    "Recipient's identification num": "987-65-4321",
                    "Employee contribution": 21,
                    "Unrealized apprec in security": 22,
                    "Recipient's name": "John DOE",
                    "Recipient's address": "Chaning This Address Again",
                    "IRA/SEP/Simple": "X",
                    "Other distribution": 25,
                    "Recipient's city": "Edwardsville",
                    "Recipient's state": "IL",
                    "Recipient's ZIP or postal code": 62025,
                    "Percent of total distribution": 26,
                    "Total employee contributions": 27,
                    "State tax withheld": 101,
                    "State": "IL",
                    "State distribution": 34,
                    "Amount allocable to IRR": 28,
                    "First year of Roth 401(k) cont": 29,
                    "FATCA filing requirement": "X",
                    "Account number": "11-3456789",
                    "Date of payment": "01/01/2025",
                    "Local tax withheld": 123,
                    "Name of locality": 36,
                    "Local distribution": 37,
                    "IRA": "X"
                }
            ]
        }
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

function renderReturnHeader() {
    var returnData = localStorage.getItem('returnID');
    var textReturnID = JSON.parse(returnData)
    console.log(textReturnID)
    const parts = textReturnID.split(':');
    document.getElementById("return-header-section").style.display = "block";
    document.getElementById("tax-year").textContent = textReturnID.slice(0, 4) || "(missing)";
    document.getElementById("return-type").textContent = textReturnID.slice(4, 5) || "(missing)";
    document.getElementById("version").textContent = parts[2] || "(missing)";
    document.getElementById("client-id").textContent = parts[1] || "(missing)";
}

function renderChecklist(jsonData, importHistory) {
    toggleVisibility("tax-summary-container", "show");

    if (jsonData == {} || jsonData == '' || !jsonData) {
        renderNewItem(importHistory)
        return
    }
    var TAX_YEAR = ''

    // Hiển thị thông tin header
    if (jsonData.ReturnHeader) {
        const header = jsonData.ReturnHeader;
        const general = jsonData.General || {};
        console.log("Ngo Thi Yen")
        console.log(general)
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
        document.getElementById("client-email").textContent = general["Primary email address"] || "None";
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

    const tableBody = document.getElementById("document-table-body");
    tableBody.innerHTML = '';

    let key = "0";
    let status = "2";

    for (const worksheet in jsonData) {
        const entities = jsonData[worksheet]?.data || [];
        const displayFields = displayFieldMapping[worksheet] || [];

        entities.forEach(entity => {
            const pk = entity["General primary key"] || entity["General"] || entity;
            const displayText = displayFields.map(f => pk?.[f] || "(missing)").join(" - ");
            const fullKey = worksheet + " - " + displayText;

            let isChecked = false;
            let tableRow = null;
            let cch_status = false
            let time_stamp = ''
            let cch_import_status = false

            // ✅ So sánh trực tiếp với từng entity trong importHistory
            importHistory.forEach(doc => {
                const hasValidYear = Array.isArray(doc.data)
                    && doc.data.every(item => item.tax_year == TAX_YEAR);

                if (
                    (doc.form_type === worksheet &&
                        doc.link === fullKey)
                    || doc.data == ''
                ) {
                    isChecked = true;
                    key = doc.id || "0";  // nếu không có id, gán tạm "0"
                    status = doc.status || "2";
                    cch_status = doc.is_imported_to_cch
                    time_stamp = doc.imported_to_cch_at
                    cch_import_status = doc.cch_import_status
                }
            });

            if (isChecked) {
                tableRow = createTableRow(worksheet, displayText, key, cch_status, time_stamp, cch_import_status, true, '', status);
                checkedRows.push(tableRow);
            } else {
                tableRow = createTableRow(worksheet, displayText, key, cch_status, time_stamp, cch_import_status, false, '');
                uncheckedRows.push(tableRow);
            }
        });
    }

    importHistory.forEach((entity, index) => {
        const { form_type, link, status, data } = entity;
        const matchField = linkFieldMapping[form_type];
        let cch_status = false
        let time_stamp = ''
        let cch_import_status = false
        console.log(link)

        // if (Object.keys(entity.data || {}).length > 0) {
        //     return
        // }
        console.log(111)
        // Kiểm tra nếu không có data hoặc không có matchField thì bỏ qua
        if (!Array.isArray(data) || !matchField) return;

        // key = return_id hoặc id của entity (tuỳ chọn)
        const key = entity.id;

        // Trường hợp chưa có link => hiển thị là new item
        if (link === "New Item" || !link) {
            console.log(123)
            const entityData = data[0] || {};
            const displayText = (entityData[matchField] || "(missing)").toString();

            if (entityData["tax_year"] == '2016') {
                return
            }

            cch_status = entity.is_imported_to_cch
            time_stamp = entity.imported_to_cch_at
            cch_import_status = entity.cch_import_status

            const tableRow = createTableRow(
                form_type,
                displayText,
                key,
                cch_status,
                time_stamp,
                cch_import_status,
                true,
                " (New item)",
                status
            );

            tableBody.appendChild(tableRow);
            checkedRows.push(tableRow);
        }
    });


    [...checkedRows, ...uncheckedRows].forEach(row => tableBody.appendChild(row));

}

function renderNewItem(importHistory) {

    const checkedRows = [];
    const uncheckedRows = [];

    const tableBody = document.getElementById("document-table-body");
    tableBody.innerHTML = '';

    const linkFieldMapping = {
        "W-2": "Employer_Name",
        "1099-DIV": "Payer_Name"
    };

    importHistory.forEach((entity, index) => {
        const { form_type, link, status, data } = entity;
        const matchField = linkFieldMapping[form_type];
        let cch_status = false
        let time_stamp = ''
        let cch_import_status = false

        // Kiểm tra nếu không có data hoặc không có matchField thì bỏ qua
        if (!Array.isArray(data) || !matchField) return;

        // key = return_id hoặc id của entity (tuỳ chọn)
        const key = entity.id;

        // Trường hợp chưa có link => hiển thị là new item
        if (link === "New Item" || !link) {
            console.log(123)
            const entityData = data[0] || {};
            const displayText = (entityData[matchField] || "(missing)").toString();

            if (entityData["tax_year"] == '2016') {
                return
            }

            cch_status = entity.is_imported_to_cch
            time_stamp = entity.imported_to_cch_at
            cch_import_status = entity.cch_import_status

            const tableRow = createTableRow(
                form_type,
                displayText,
                key,
                cch_status,
                time_stamp,
                cch_import_status,
                true,
                " (New item)",
                status
            );

            tableBody.appendChild(tableRow);
            checkedRows.push(tableRow);
        }
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



function createTableRow(formType, displayText, key, cch_status, timeStamp, cch_import_status, isChecked = false, newFound = '', status = '3') {
    const row = document.createElement("tr");
    row.setAttribute("data-key", key);

    if (newFound != '') {
        console.log(displayText)
    }
    let show_cch_status = `Pending`
    let formatted = ''
    //  nếu đã import to cch
    if (cch_status) {
        const date = new Date(timeStamp);

        // Format mm-dd-yyyy hh:mm:ss
        formatted = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()} ` +
            `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
        show_cch_status = `${cch_import_status}`
    }
    let statusText = "Pending to Upload";  // default
    if (status === '1') statusText = "✅ CCH Import - Success";
    else if (status === '2') statusText = "✅ Uploaded";
    else if (status === '4') statusText = "Not Applicable"
    else if (status === '5') statusText = "Provided Elsewhere"

    row.innerHTML = `
        <td class="doc-name">${formType} (${displayText})${newFound}</td>
        <td style="text-align: center;"><span class="status-tag status-${status}">${statusText}</span></td>
        <td class="center-row"><input type="checkbox" ${isChecked ? "checked" : ""} ${status != '2' ? "disabled" : ""}></td>
        <td class="import-cch-status"><span class="status-tag status-${show_cch_status}">${show_cch_status}</span></td>
        <td class="import-cch-timeStamp">${formatted}</td>
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
        const firstTdValue = row.querySelector('td')?.textContent.trim();

        if (importId == '0') { return }
        if (confirm(`Are you sure you want to delete this import - ${firstTdValue}? `)) {
            // return
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
                            statusTag.className = "status-tag status-3";
                        }

                        console.log("success")
                        showUploadAlertUpload('success', "remove sucessfully!", 'upload-alert-placeholder-search');

                        const importHistoryRaw = localStorage.getItem("importHistory");
                        if (importHistoryRaw) {
                            let importHistory = JSON.parse(importHistoryRaw);
                            importHistory = importHistory.filter(item => item.id !== Number(importId));
                            localStorage.setItem("importHistory", JSON.stringify(importHistory));
                            renderStatusBox('jsonData', importHistory)
                        }

                    } else {
                        showUploadAlertUpload('danger', data.error, 'upload-alert-placeholder-search');
                    }
                })
                .catch(err => {
                    showUploadAlertUpload('danger', err, 'upload-alert-placeholder-search');
                    console.error(err);
                });
        }
    }
});

//======================================remove all imports===========================
document.getElementById("btn-generate-pbc").addEventListener('click', () => {
    showLoading()
    console.log(returnID)
    //  return
    fetch(`${API_BASE_URL}/api/cch-import/delete-imports/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ return_id: returnID })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // upload-alert-placeholder-search
                console.log(data)
                //export_tax_data()

                showUploadAlertUpload('success', "remove all imports success", 'upload-alert-placeholder-checklist');
            } else {
                showUploadAlertUpload('danger', data.error, 'upload-alert-placeholder-checklist');

            }
        })
        .catch(err => {
            console.error(err);
            showUploadAlertUpload('danger', err, 'upload-alert-placeholder-search');
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
    hideLoading()
})

//==================================export data with return id============================
function export_tax_data() {

    var json = localStorage.getItem('jsonData');
    var jsonData = JSON.parse(json);


    const summary_container = document.getElementById('tax-summary-container')
    showLoading();
    document.body.style.cursor = 'wait';
    console.log(returnID)

    fetch(`${API_BASE_URL}/api/cch-import/full_export_pipeline2/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ return_id: returnID })
    })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                console.log("success");

                const jsonData = response.data; // <-- dữ liệu chính
                const importHistory = response.imported_history || []; // <-- lấy import history

                console.log(response)
                localStorage.setItem('jsonData', JSON.stringify(jsonData));
                localStorage.setItem('importHistory', JSON.stringify(importHistory));
                // window.location.href = "../template/download.html";
                // return
                // truyền cả 2
                renderChecklist(jsonData, importHistory);
                //render json
                // displayJsonOverlay(jsonData)

                //  get data for status box
                renderStatusBox(jsonData, importHistory)


                // hide button-box
                // toggleVisibility("button_box", "hide")
                // toggleVisibility("title-download", "hide")
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
            // document.getElementById('search-return-value').value = '';
            // document.getElementById("list-returns").style.display = 'None';
            // document.getElementById("search-container").style.display = 'None';
            document.body.style.cursor = 'default';
            document.getElementById('close-overlay2').disabled = false
        });
}

function updateImportedStatus() {

    export_tax_data()

}

//===============================send to cch======================================================
// function getCheckedImportItems(importHistory) {
//     const checkedIds = [];

//     // 1. Duyệt qua bảng và lấy các hàng được check
//     document.querySelectorAll("#document-table-body tr").forEach(row => {
//         const checkbox = row.querySelector("input[type='checkbox']");
//         const importId = row.getAttribute("data-key");

//         if (checkbox && checkbox.checked && importId !== '0') {
//             checkedIds.push(Number(importId));  // dùng số nguyên để so sánh đúng
//         }
//     });

//     // 2. Lọc lại danh sách importHistory
//     const selectedImports = importHistory.filter(item => checkedIds.includes(item.id));

//     return selectedImports;
// }

function getCheckedImportItems(importHistory) {
    const checkedIds = [];

    // 1. Duyệt qua bảng và lấy các hàng được check mà không bị disabled
    document.querySelectorAll("#document-table-body tr").forEach(row => {
        const checkbox = row.querySelector("input[type='checkbox']");
        const importId = row.getAttribute("data-key");

        if (
            checkbox &&
            checkbox.checked &&
            !checkbox.disabled &&          // ✅ Không bị disable
            importId !== '0'
        ) {
            //checkedIds.push(importId) // Đưa về kiểu số để so sánh chính xác
            const idNum = parseInt(importId.match(/\d+$/)?.[0]);
            if (!isNaN(idNum)) {
                checkedIds.push(idNum); // ✅ Đưa vào mảng dưới dạng số
            }
        }
    });

    // 2. Lọc lại danh sách importHistory theo danh sách id đã chọn
    const selectedImports = importHistory.filter(item => checkedIds.includes(item.id));

    return selectedImports;
}

//  sent to cch
document.getElementById("btn-send-to-cch").addEventListener("click", async () => {
    var returnId = "2024I:1234567.001:V5";
    const jsonData = localStorage.getItem('jsonData');
    const data = JSON.parse(jsonData);
    const importHistory = localStorage.getItem('importHistory');
    const imports = JSON.parse(importHistory);



    const import_checked = getCheckedImportItems(imports)

    document.getElementById('close-overlay2').disabled = true

    const payload = {
        return_id: returnID,
        imports: import_checked
    };


    document.getElementById("processing-overlay2").classList.remove("hidden");
    //  Testing
    // console.log("checked")
    // simulateSteps()
    // showUploadAlertUpload('success', 'upload successfully!', 'upload-alert-placeholder-processing2');
    // return

    console.log(payload)

    showLoading()
    try {

        const response = await fetch(`${API_BASE_URL}/api/cch-import/get-imports/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.success) {
            const response = await fetch(data.excel_url);
            const blob = await response.blob();

            const safeReturnId = returnID.replace(/[:/\\?%*|"<>]/g, "-");
            const filename = `1040 template - [${safeReturnId}].xlsx`;

            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            const finalStatus = await pollUntilDone(data.task);
        } else {
            alert("❌ Error: " + data.error);
        }

    } catch (err) {
        console.error("Error:", err);
        alert("❌ Error occurred while calling API.");
    } finally {
        hideLoading()

    }

});

const DONE_STATUSES = ["SUCCESS", "FAILED"];
// Bắt đầu polling để xem tiến trình
function pollUntilDone(taskId) {
    return new Promise((resolve, reject) => {
        // const uploadBtn = document.getElementById("upload-btn");
        document.body.classList.add('cursor-loading');

        const intervalId = setInterval(() => {
            fetch(`${API_BASE_URL}/api/cch-import/status/${taskId}/`)
                .then(res => res.json())
                .then(statusData => {
                    console.log(taskId)
                    console.log("⏳ Step:", statusData.step);
                    console.log("📦 Status:", statusData.status);

                    updateTabbar(statusData.step);
                    //  DONE_STATUSES.includes(statusData.status)
                    if (DONE_STATUSES.includes(statusData.status)) {
                        clearInterval(intervalId);
                        console.log(`✅ Done! Status: ${statusData.status}`);

                        document.body.classList.remove('cursor-loading');
                        showUploadAlertUpload('success', 'upload successfully!', 'upload-alert-placeholder-processing2');

                        resolve(statusData);
                        updateImportedStatus()
                    }
                })
                .catch(err => {
                    clearInterval(intervalId);
                    console.error("❌ Error checking status", err);
                    showUploadAlertUpload('danger', err, 'upload-alert-placeholder-processing2');
                    document.body.classList.remove('cursor-loading');

                    reject(err);
                });
        }, 1000);
    });
}


//  simulating
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

function simulateSteps() {
    let currentIndex = 0;

    const intervalId = setInterval(() => {
        const currentStep = STEP_NAMES[currentIndex];
        console.log("🧪 Simulated Step:", currentStep);

        // Gọi update UI
        updateTabbar(currentStep);
        // document.getElementById("progress-step").innerText = currentStep;

        currentIndex++;

        if (currentIndex >= STEP_NAMES.length) {
            clearInterval(intervalId);
            console.log("✅ Simulation complete!");
        }
    }, 3000);
}


document.getElementById("close-overlay2").addEventListener("click", () => {
    document.getElementById("processing-overlay2").classList.add("hidden");
});


//========================================send pbc list============================
document.getElementById("btn-send-client").addEventListener('click', async () => {
    var email = 'info@silversea-analytics.com';
    const jsonData = localStorage.getItem("jsonData");
    const importHistory = localStorage.getItem("importHistory");
    const returnID = localStorage.getItem("returnID");
    var clientName = 'info@silversea-analytics.com'

    var taxYear = '2024'
    if (jsonData) {
        const data = JSON.parse(jsonData)
        const general = data.General || {};
        if (general) {
            clientName = `${general["First name - TP"]} ${general["Last name - TP"]}`
            const primaryEmail = general["Primary email address"]
            if (primaryEmail && primaryEmail !== "undefined" && primaryEmail !== "null") {
                email = primaryEmail;
            }
        }
        const returnHeader = data.ReturnHeader || {};
        taxYear = returnHeader.TaxYear
    }

    if (importHistory) {
        const imports = JSON.parse(importHistory)
        imports.forEach(item => {
            console.log(item.id)
        })
    }
    console.log(taxYear)
    console.log(clientName)
    console.log(email)
    // return
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/api/cch-import/send-pbclist-link/`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                email: email,
                clientName: clientName,
                taxYear: taxYear,
                jsonData: jsonData,
                importHistory: importHistory,
                returnID: returnID
            })
        });

        const result = await response.json();
        // alert(result.message || "Email sent!");

        showUploadAlertUpload('success', `Email sent to ${email}`, 'upload-alert-placeholder-checklist');
    } catch (error) {
        console.error("Error sending email:", error);
        const massage = `Error sending email:  error`
        // alert("Failed to send email.");
        showUploadAlertUpload('danger', massage, 'upload-alert-placeholder-checklist');
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