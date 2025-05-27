import { showLoading, hideLoading } from './utils/loadingOverlay.js';
import { API_BASE_URL } from './utils/config.js'
import { toggleVisibility } from './utils/toggleHide.js'
import { getReturnID } from './utils/get_data_header.js'

var RETURN_ID = ''
var jsonData = ''
var importHistory = ''
var TAX_YEAR = ''

//=================================show checklist===================================

window.addEventListener('DOMContentLoaded', () => {
    const savedRendered = localStorage.getItem('renderedChecklistData');
    jsonData = localStorage.getItem('jsonData');
    var importedHistory = ''
    importHistory = localStorage.getItem("importHistory");
    if (importHistory) {
        importedHistory = JSON.parse(importHistory);
    }

    var checklistData = null;

    const fromSummaryPage = document.referrer.includes("upload_summary.html");

    if (jsonData != "null") {
        checklistData = JSON.parse(jsonData);
        console.log("📌 Rendering from checklistData fallback");
        console.log(checklistData)
        
        //======get selecct json
        generateEntityListFromOCR(checklistData)
        console.log(globalEntityOptions)
        // render return id
        var returnid_element = document.getElementById("client-line-returnID")
        returnid_element.innerHTML = getReturnID()

        checklistData = checklistData || JSON.parse(jsonData); // nếu chưa parse ở trên

        const filteredChecklistData = Object.fromEntries(
            Object.entries(checklistData).filter(
                ([key, value]) => key !== "returnHeader" && value.entities_count > 0
            )
        );

        const returnHeader = checklistData.ReturnHeader || {};
        if (returnHeader) {
            RETURN_ID = `${returnHeader.TaxYear}${returnHeader.ReturnType}:${returnHeader.ClientID}:V${returnHeader.ReturnVersion}`;
            TAX_YEAR = returnHeader.TaxYear
            document.getElementById('label-tax-year').innerHTML = `Tax year: ${TAX_YEAR}`
            const general = checklistData.General || {};
            console.log(general)
            console.log(general["Primary email address"])
            document.getElementById("primary-email").innerText = general["Primary email address"];
            document.getElementById("client-name").innerText = `${general["First name - TP"]} ${general["Last name - TP"]}`;

        }
    }

    
    var returnData = localStorage.getItem('returnID');
    var textReturnID = JSON.parse(returnData)
    console.log(textReturnID)
    document.getElementById("client-line-returnID").innerHTML = textReturnID
    TAX_YEAR = textReturnID.slice(0,4)
    RETURN_ID = textReturnID
    renderChecklist(checklistData, importedHistory);

    if (importedHistory && importedHistory.length) {
        console.log("check123")
        importedHistory.forEach(entity => {
            const result = {
                recognized_documents: [entity], // mỗi entity là 1 "doc"
                file_url: entity.pdf_path || ""
            };
            appendRecognizedDocsToTable(result);
        });
    }

    //Set table display
    const tableBody = document.getElementById("table-body")
    if (tableBody.children.length === 0) {
        console.log("zo")
        toggleVisibility("table-scroll-container", "hide")
        toggleVisibility("confirm-btn", "hide")
    } else {
        toggleVisibility("table-scroll-container", "show")
        toggleVisibility("confirm-btn", "show")
        renderUploadedDocuments(importedHistory)
    }


});




function renderChecklist2(data, importedHistory) {
    console.log("checklist")
    const ulThisYear = document.querySelector(".result_checklist1");
    const ulNewFound = document.querySelector(".result_checklist-new-found1");
    ulThisYear.innerHTML = '';
    ulNewFound.innerHTML = '';

    // 📌 1. Show Return Header thông tin trước
    // const header = data.ReturnHeader;
    // if (header) {
    //     console.log(1)
    //     console.log(header)
    //     const headerBox = document.createElement("div");
    //     headerBox.className = "return-header-box";  // CSS thêm cho đẹp

    //     headerBox.innerHTML = `
    //         <div><strong>Tax Year:</strong> ${header.TaxYear || "(missing)"}</div>
    //         <div><strong>Return Type:</strong> ${header.ReturnType || "(missing)"}</div>
    //         <div><strong>Version:</strong> ${header.ReturnVersion || "(missing)"}</div>
    //         <div><strong>Client ID:</strong> ${header.ClientID || "(missing)"}</div>
    //         <div><strong>Return Group:</strong> ${header.ReturnGroupName || "(missing)"}</div>
    //         <div><strong>Office Business Unit:</strong> ${header.OfficeBusinessUnit || "(missing)"}</div>
    //     `;

    //     // headerBox.innerHTML = `
    //     //     <div class="return-header-row">
    //     //         <div class="return-header-item"><strong>Tax Year:</strong> ${header.TaxYear || "(missing)"}</div>
    //     //         <div class="return-header-item"><strong>Return Type:</strong> ${header.ReturnType || "(missing)"}</div>
    //     //         <div class="return-header-item"><strong>Version:</strong> ${header.ReturnVersion || "(missing)"}</div>
    //     //     </div>
    //     //     <div class="return-header-row">
    //     //         <div class="return-header-item"><strong>Client ID:</strong> ${header.ClientID || "(missing)"}</div>
    //     //         <div class="return-header-item"><strong>Return Group:</strong> ${header.ReturnGroupName || "(missing)"}</div>
    //     //         <div class="return-header-item"><strong>Office Business Unit:</strong> ${header.OfficeBusinessUnit || "(missing)"}</div>
    //     //     </div>
    //     // `;

    //     ulThisYear.appendChild(headerBox);
    // }

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

    const reasons = [
        "Already reviewed",
        "N/A-Confirmed with client",
        "Auto-imported from IRS",
        "Manually verified",
        "Not applicable"
    ];

    const keyFieldMapping = {
        "W-2": {
            data: ["Employer name", "Employee social security no"],
            import: ["Employer_Name", "SocialSecurityNumber"]
        },
        "1099-DIV": {
            data: ["Payer's name"], //"Account number"
            import: ["Payer_Name"] //"Account_Number"
        }
        // Thêm loại form khác nếu cần
    };

    // === 1. Duyệt importedHistory => tạo Set để tra nhanh
    const importedMap = new Map();

    const latestImportedByForm = new Map();

    (importedHistory || []).forEach((historyItem) => {
        const importedForms = historyItem.imported_json_data || [];

        importedForms.forEach(form => {
            const formType = form.form_type;
            const mapping = keyFieldMapping[formType];
            if (!mapping) return;

            const importFields = mapping.import;
            const status = form.status;

            // ✅ Gộp form theo form_type (nhiều lần import W-2 vẫn gom về 1)
            if (!latestImportedByForm.has(formType)) {
                latestImportedByForm.set(formType, {
                    form_type: formType,
                    status,
                    data: [...form.data],
                });
            } else {
                const existing = latestImportedByForm.get(formType);
                existing.data.push(...form.data);
            }

            // ✅ Set vào map dùng để so sánh sau
            form.data.forEach(item => {
                const key = formType + "|" + importFields.map(f => String(item[f] || "").trim().toLowerCase()).join("|");
                importedMap.set(key, status);
            });
        });
    });

    // 👉 Đây là latestImported gộp theo form
    const latestImported = Array.from(latestImportedByForm.values());

    const currentOCRKeys = new Set();
    // === 2. Duyệt từng worksheet trong data
    for (const worksheet in data) {
        const entities = data[worksheet].data || [];
        if (entities.length === 0) continue;

        const displayFields = displayFieldMapping[worksheet];
        const mapping = keyFieldMapping[worksheet];

        entities.forEach(entity => {
            const pk = entity["General primary key"] || entity["General"] || entity;
            const displayText = displayFields.map(f => pk?.[f] || "(missing)").join(" - ");
            const li = document.createElement("li");

            if (mapping) {
                const dataKey = mapping.data.map(f => String(pk?.[f] || "").trim().toLowerCase()).join("|");
                const fullKey = worksheet + "|" + dataKey;

                currentOCRKeys.add(fullKey); // ✅ lưu lại key OCR hiện có

                if (importedMap.has(fullKey)) {
                    li.innerHTML = `<input type="checkbox" checked> ${worksheet} (${displayText})`;
                } else {
                    li.innerHTML = `<input type="checkbox"> ${worksheet} (${displayText})`;
                }

                li.setAttribute("data-key", fullKey);
                ulThisYear.appendChild(li);
            } else {
                li.innerHTML = `<input type="checkbox"> ${worksheet} (${displayText})`;
                ulThisYear.appendChild(li);
            }
        });

    }

    // === 3. Duyệt new found trong import history
    // === Duyệt imported_history để thêm những new found bị thiếu trong checklist ===

    const displayFieldMappingImport = {
        "W-2": ["Employer_Name", "SocialSecurityNumber"],
        "1099-DIV": ["Payer_Name"],
    };
    latestImported.forEach(form => {
        const formType = form.form_type;
        const status = form.status;
        const mapping = keyFieldMapping[formType];
        const displayFields = displayFieldMappingImport[formType];

        if (status !== "new found" || !mapping || !displayFields) return;

        form.data.forEach(item => {
            const key = formType + "|" + mapping.import.map(f => String(item[f] || "").trim().toLowerCase()).join("|");

            // Nếu chưa được render ở bước trước
            if (!document.querySelector(`li[data-key="${key}"]`)) {
                const displayText = displayFields.map(f => item[f] || "(missing)").join(" - ");
                const li = document.createElement("li");
                li.innerHTML = `<input type="checkbox" checked> ${formType} (${displayText})`;
                li.classList.add("new-found");
                li.setAttribute("data-key", key); // đánh dấu để không bị trùng lần nữa
                ulNewFound.appendChild(li);
            }
        });
    });

    //  Show new found
    const labelNewFound = document.querySelector(".new-found-label1");

    if (ulNewFound.children.length > 0) {
        labelNewFound.style.display = "block";
    } else {
        labelNewFound.style.display = "none";
    }
}


function renderChecklist(jsonData, importHistory) {
    if (!jsonData) {
        console.log("do")
        renderNewItem(importHistory)
        return
    }
    console.log("start render on the right");
    const ulThisYear = document.querySelector(".result_checklist1");
    const ulNewFound = document.querySelector(".result_checklist-new-found1");
    ulThisYear.innerHTML = '';
    ulNewFound.innerHTML = '';

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

    let year = '';
    const returnHeader = jsonData.ReturnHeader || {};
    if (returnHeader) {
        year = returnHeader.TaxYear;
    }
    console.log("check123")
    console.log(year)

    // === 1. Duyệt JSON OCR để render checklist chính ===
    for (const worksheet in jsonData) {
        const entities = jsonData[worksheet]?.data || [];
        const displayFields = displayFieldMapping[worksheet] || [];

        entities.forEach(entity => {
            const pk = entity["General primary key"] || entity["General"] || entity;
            const displayText = displayFields.map(f => pk?.[f] || "(missing)").join(" - ");
            const fullKey = worksheet + " - " + displayText;

            let isChecked = false;

            // ✅ So sánh trực tiếp với từng entity trong importHistory (flat)
            importHistory.forEach(doc => {
                const isSameType = doc.form_type === worksheet;
                const isSameLink = doc.link?.toLowerCase() === fullKey.toLowerCase();
                const isThisYear = Array.isArray(doc.data)
                    && doc.data.every(d => String(d.tax_year) === String(year));

                if (isSameType && isSameLink && isThisYear) {
                    isChecked = true;
                }
            });

            const li = document.createElement("li");
            li.innerHTML = `<input type="checkbox" ${isChecked ? "checked" : ""}> ${worksheet} (${displayText})`;
            li.setAttribute("data-key", fullKey);
            ulThisYear.appendChild(li);
        });
    }

    // === 2. Duyệt importHistory để tìm các entity "mới được OCR", chưa có trong JSON ===
    importHistory.forEach(entity => {
        const { form_type, link, data, status } = entity;
        const matchField = linkFieldMapping[form_type];

        const isThisYear = Array.isArray(data) && data.every(d => String(d.tax_year) === String(year));

        if (!isThisYear || !Array.isArray(data) || !matchField) return;

        const isNew = !link || link === "New Item";
        const entityData = data[0] || {};
        const displayText = (entityData[matchField] || "(missing)").toString();
        const fullKey = form_type + " - " + displayText;

        // ✅ Nếu là "New Item" và chưa có ở danh sách chính thì thêm vào New Found
        const alreadyRendered = !!ulThisYear.querySelector(`li[data-key="${fullKey}"]`);
        if (isNew && !alreadyRendered) {
            const li = document.createElement("li");
            li.innerHTML = `<input type="checkbox" checked> ${form_type} (${displayText})`;
            li.classList.add("new-found");
            li.setAttribute("data-key", fullKey);
            ulNewFound.appendChild(li);
        }
    });

    const labelNewFound = document.querySelector(".new-found-label1");
    labelNewFound.style.display = ulNewFound.children.length > 0 ? "block" : "none";

    console.log("end render 123");
}

function renderNewItem(importHistory){

    if(importHistory == [] || !importHistory) return

    const linkFieldMapping = {
        "W-2": "Employer_Name",
        "1099-DIV": "Payer_Name"
    };

    const ulNewFound = document.querySelector(".result_checklist-new-found1");
    ulNewFound.innerHTML = '';

    importHistory.forEach(entity => {
        const { form_type, link, data, status } = entity;
        const matchField = linkFieldMapping[form_type];

        const isThisYear = Array.isArray(data) && data.every(d => String(d.tax_year) === String(TAX_YEAR));
        
        if (!isThisYear || !Array.isArray(data) || !matchField) return;

        const isNew = true //!link || link === "New Item";
        const entityData = data[0] || {};
        const displayText = (entityData[matchField] || "(missing)").toString();
        const fullKey = form_type + " - " + displayText;

        // ✅ Nếu là "New Item" và chưa có ở danh sách chính thì thêm vào New Found
        // const alreadyRendered = !!ulThisYear.querySelector(`li[data-key="${fullKey}"]`);
        if (isNew) {
            const li = document.createElement("li");
            li.innerHTML = `<input type="checkbox" checked> ${form_type} (${displayText})`;
            li.classList.add("new-found");
            li.setAttribute("data-key", fullKey);
            ulNewFound.appendChild(li);
        }
    });

    const labelNewFound = document.querySelector(".new-found-label1");
    labelNewFound.style.display = ulNewFound.children.length > 0 ? "block" : "none";
}



//==============================upload file==================================
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const uploadText = document.getElementById('uploadText');

// // Cho phép click vùng box để chọn file
// uploadBox.addEventListener('click', () => {
//     fileInput.click();
// });

// // Hiển thị file khi drag & drop
// uploadBox.addEventListener('dragover', (e) => {
//     e.preventDefault();
//     uploadBox.style.backgroundColor = '#e5e7eb';
// });

// uploadBox.addEventListener('dragleave', () => {
//     uploadBox.style.backgroundColor = '';
// });

// uploadBox.addEventListener('drop', (e) => {
//     e.preventDefault();
//     uploadBox.style.backgroundColor = '';
//     const file = e.dataTransfer.files[0];
//     if (file) {
//         uploadText.innerHTML = `📄 ${file.name}`;
//     }
// });

// // Hiển thị file khi chọn từ file input
// fileInput.addEventListener('change', (e) => {
//     const file = e.target.files[0];
//     if (file) {
//         uploadText.innerHTML = `📄 ${file.name}`;
//     }
// });



//=======================OCR pdf file==========================
// const uplaod_btn = document.getElementById("note-button")

const checklistOverlay = document.getElementById("checklistOverlay");
const uploadBtn = document.getElementById("uploadBtn");
const closeOverlay = document.getElementById("closeOverlay");
const checklistContainer = document.querySelector(".result_checklist");

//==============================================================
uploadBtn.addEventListener("click", async () => {
    const result = await uploadAndAnalyzeFile();
    // const result = get_data()
    if (result) {
        console.log("link")
        console.log(result)
        console.log("link")
        // Save to localStorage
        localStorage.setItem('upload_result', JSON.stringify(result));
    }
    console.log(1)

    // const recognizedDocs = result.recognized_documents;

    // const saved = localStorage.getItem('checklistData');

    // if (saved) {
    //     const checklistData = JSON.parse(saved);
    //     compareAndRenderChecklist(checklistData, recognizedDocs)
    // }

    // document.getElementById('download-excel-btn').style.display = 'block'

});

//====================================================

function flattenChecklistData(localData) {
    const flattened = [];

    for (const type in localData) {
        const entries = localData[type]?.data || [];
        for (const entry of entries) {
            const primaryKey = entry["General primary key"];
            if (!primaryKey) continue;

            flattened.push({
                type,
                ...primaryKey
            });
        }
    }

    return flattened;
}

function categorizeForms(flatChecklist, recognizedDocs) {
    const thisYearForms = [];
    const newForms = [];
    const missingForms = [];

    const matchedKeys = new Set();

    function buildKey(type, name, ssn) {
        return `${type.toUpperCase()}||${name?.trim()}||${ssn?.trim()}`;
    }
    console.log("check1")
    console.log(flatChecklist)
    // ✅ B1: map từ recognizedDocs → tìm trong checklist
    recognizedDocs.forEach(doc => {
        const key = buildKey(doc.type, doc.name, doc.SSN);
        // const matched = flatChecklist.some(item =>
        //     item.type.toUpperCase() === doc.type.toUpperCase() &&
        //     item["Employer name"]?.trim() === doc.name?.trim() &&
        //     item["Employee social security no"]?.trim() === doc.SSN?.trim()
        // );
        const matched = flatChecklist.some(item => {
            const type = doc.type.toUpperCase();
            const itemType = item.type.toUpperCase();

            if (type === "1099-DIV") {
                return itemType === "1099-DIV" &&
                    item["Payer's name"]?.trim() === doc.name?.trim();
            }

            return itemType === "W-2" &&
                item["Employer name"]?.trim() === doc.name?.trim() &&
                item["Employee social security no"]?.trim() === doc.SSN?.trim();
        });

        if (matched) {
            thisYearForms.push(doc);
            matchedKeys.add(key);
        } else {
            newForms.push(doc);
        }
    });

    // ✅ B2: các item còn lại trong checklist là missing
    flatChecklist.forEach(item => {
        const key = buildKey(item.type, item["Employer name"], item["Employee social security no"]);
        if (!matchedKeys.has(key)) {
            missingForms.push(item);
        }
    });

    return {
        thisYearForms,
        newForms,
        missingForms
    };
}

function renderChecklistGroups({ thisYearForms, newForms, missingForms }) {
    const matchedUL = document.querySelector(".result_checklist1");
    const unmatchedUL = document.querySelector(".result_checklist-new-found1");
    const label = document.querySelector(".new-found-label1");

    matchedUL.innerHTML = '';
    unmatchedUL.innerHTML = '';




    const reasons = [
        "Already reviewed",
        "N/A-Confirmed with client",
        "Auto-imported from IRS",
        "Manually verified",
        "Not applicable"
    ];

    const keyFieldMappingShow = {
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




    function createChecklistItem(docType, displayValue, isChecked = false, defaultReason = "") {
        const li = document.createElement("li");
        li.style.marginBottom = "10px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = isChecked;

        const label = document.createElement("span");
        label.innerText = ` ${docType} (${displayValue})`;

        const select = document.createElement("select");
        select.style.marginTop = "5px";
        select.style.marginLeft = "25px";
        select.style.display = isChecked ? "inline-block" : "none";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-- Select reason --";
        select.appendChild(defaultOption);

        const reasons = [
            "Already reviewed",
            "N/A-Confirmed with client",
            "Auto-imported from IRS",
            "Manually verified",
            "Not applicable"
        ];

        reasons.forEach(reason => {
            const option = document.createElement("option");
            option.value = reason;
            option.textContent = reason;
            if (reason === defaultReason) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        checkbox.addEventListener("change", () => {
            select.style.display = checkbox.checked ? "inline-block" : "none";
        });

        li.appendChild(checkbox);
        li.appendChild(label);
        li.appendChild(document.createElement("br"));
        li.appendChild(select);

        return li;
    }


    function buildDisplayString(type, source, mapping) {
        const fields = mapping[type] || [];
        return fields.map(field => {
            // Các alias cho "name" của form
            if (field === "Employer name") return source["Employer name"] || source.name || "(missing)";
            if (field === "Payer's name") return source["Payer's name"] || source.name || "(missing)";
            if (field === "Payer name") return source["Payer name"] || source.name || "(missing)";
            if (field === "Name of k-1 entity") return source["Name of k-1 entity"] || source.name || "(missing)";
            if (field === "Corporation's name") return source["Corporation's name"] || source.name || "(missing)";
            if (field === "Partnership's name") return source["Partnership's name"] || source.name || "(missing)";

            // Các alias cho TS
            if (field === "TS") return source["TS"] || source["TSJ"] || "(missing)";
            if (field === "TSJ") return source["TSJ"] || source["TS"] || "(missing)";

            return source[field] || "(missing)";
        }).join(" - ");
    }

    // 🟡 New Found
    newForms.forEach(doc => {
        const display = buildDisplayString(doc.type.toUpperCase(), doc, keyFieldMappingShow);
        unmatchedUL.appendChild(createChecklistItem(doc.type.toUpperCase(), display));
    });

    // 🟢 This Year
    thisYearForms.forEach(doc => {
        const display = buildDisplayString(doc.type.toUpperCase(), doc, keyFieldMappingShow);
        matchedUL.appendChild(createChecklistItem(doc.type.toUpperCase(), display, true, "Already reviewed"));
    });

    // 🔴 Missing
    missingForms.forEach(item => {
        const display = buildDisplayString(item.type.toUpperCase(), item, keyFieldMappingShow);
        matchedUL.appendChild(createChecklistItem(item.type.toUpperCase(), display, false));
    });

    // ✅ Toggle new found label
    label.style.display = newForms.length > 0 ? 'block' : 'none';
}





function compareAndRenderChecklist(localData, recognizedDocs) {
    const matchedUL = document.querySelector(".result_checklist1");
    const unmatchedUL = document.querySelector(".result_checklist-new-found1");
    const label = document.querySelector(".new-found-label1");

    const keyFieldMappingShow = {
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

    const reasons = [
        "Already reviewed",
        "N/A-Confirmed with client",
        "Auto-imported from IRS",
        "Manually verified",
        "Not applicable"
    ];

    const recognizedSet = new Set();
    const existingItems = new Set();

    const flatChecklist = flattenChecklistData(localData);
    console.log(flatChecklist)
    const categorized = categorizeForms(flatChecklist, recognizedDocs);
    console.log(categorized)
    renderChecklistGroups(categorized);

    localStorage.setItem('renderedChecklistData', JSON.stringify(categorized));
    //return

}




//==================================================================
//async 
async function uploadAndAnalyzeFile() {
    showLoading()
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    var returnid = document.getElementById('client-line-returnID').innerText
    console.log(returnid)

    if (!file) {
        alert("Please choose a pdf file to upload");
        hideLoading()
        return null;
    }

    uploadBtn.disabled = true;
    document.body.style.cursor = 'wait';

    const formData = new FormData();
    formData.append("file", file);
    formData.append("return_id", returnid);

    try {
        const response = await fetch(`${API_BASE_URL}/api/cch-import/upload-ocr-pdf/`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        // const result = get_data()
        if (!result.success)
            return

        // 1. Lấy dữ liệu cũ từ localStorage
        const oldHistoryStr = localStorage.getItem("importHistory");
        const oldHistory = JSON.parse(oldHistoryStr) || [];

        console.log("checked")
        console.log(result)
        console.log(oldHistory)
        // 3. Lấy bản ghi hiện tại đang được hiển thị (thường là phần tử đầu tiên)

        function appendImportToHistory(importedHistory, ocrResponse) {
            const recognizedDocuments = ocrResponse.recognized_documents || [];
            if (recognizedDocuments.length === 0) return importedHistory;

            const newEntities = recognizedDocuments.map(doc => ({
                form_type: doc.form_type,
                page_number: doc.page_number,
                data: doc.data,
                status: doc.status || "2",
                link: doc.link || "",
                imported_at: new Date().toISOString(),
                is_imported_to_cch: false,
                cch_import_status: "pending",
                imported_to_cch_at: null,
                pdf_path: ocrResponse.file_url || "",
                id: doc.id || null, // 👈 Nếu bạn muốn chờ backend trả về ID thì để null
            }));

            return [...newEntities, ...importedHistory]; // prepend vào đầu
        }

        //  need check
        const updatedHistory = appendImportToHistory(oldHistory, result);
        localStorage.setItem('importHistory', JSON.stringify(updatedHistory));

        console.log(11111)
        console.log(result)
        //  show table
        appendRecognizedDocsToTable(result)


        return result;

    } catch (error) {

        console.error("Upload failed:", error);
        alert("An error occurred while uploading the file.");
        return null;

    } finally {
        uploadBtn.disabled = false;
        document.body.style.cursor = 'default';
        hideLoading()
        toggleVisibility("table-scroll-container", "show")
        toggleVisibility("confirm-btn", "show")
    }
}

function displayChecklist(result) {
    if (!(result.success && Array.isArray(result.recognized_documents))) {
        alert("No data available to display the checklist.");
        return;
    }

    const checklistContainer = document.querySelector(".result_checklist");
    checklistContainer.innerHTML = ""; // clear cũ

    const ul = document.createElement("ul");
    ul.classList.add("checklist-list");

    const localChecklist = JSON.parse(localStorage.getItem("checklistData") || "{}");
    const keyFieldMapping = {
        "W-2": "Employer name",
        "1099-R": "Payer's name",
        "1099-SSA": "TSJ",
        "1099-INT": "Payer's name",
        "1099-DIV": "Payer's name",
        "Consolidated 1099": "Payer name",
        "K-1 1041": "TSJ",
        "K-1 1065": "TSJ",
        "K-1 1120S": "TSJ"
    };

    const newItems = [];
    const existingItems = [];

    result.recognized_documents.forEach(item => {
        const name = item.name?.trim();
        if (!name) return;

        const keyField = keyFieldMapping[item.type];
        const knownEntities = (localChecklist[item.type]?.data || []).map(e => {
            return e["General primary key"]?.[keyField];
        });

        const isNew = !knownEntities.includes(name);

        const li = document.createElement("li");
        li.className = "checklist-item";
        // li.innerHTML = `<input type="checkbox" ${isNew ? "" : "checked"} disabled> ${item.type} (${item.name})`;
        li.innerHTML = `<input type="checkbox" ${isNew ? "disabled" : "checked"}> ${item.type} (${item.name})`;

        if (isNew) {
            newItems.push(li);
        } else {
            existingItems.push(li);
        }
    });

    if (newItems.length > 0) {
        const title = document.createElement("li");
        title.className = "checklist-title";
        title.innerText = "🆕 New Entity Found:";
        ul.appendChild(title);
        newItems.forEach(item => ul.appendChild(item));
    }

    existingItems.forEach(item => ul.appendChild(item));
    checklistContainer.appendChild(ul);

    const checklistOverlay = document.getElementById("checklistOverlay");
    checklistOverlay.classList.remove("hidden");

    // const downloadBtn = document.querySelector(".download-excel");
    // if (downloadBtn && result.file_url) {
    //     downloadBtn.href = result.file_url;
    //     downloadBtn.classList.remove("hidden");
    // }

    // ✅ Đặt link download tại đây — vì lúc này đã có `result.file_url`
    const downloadLink = document.querySelector(".download-excel");
    if (downloadLink) {
        if (result.file_url) {
            downloadLink.href = result.file_url;
            downloadLink.setAttribute("download", result.file_url.split("/").pop());
            downloadLink.classList.remove("hidden");
        } else {
            downloadLink.classList.add("hidden");
        }
    }
}

//===============================================================
closeOverlay.addEventListener("click", () => {
    checklistOverlay.classList.add("hidden");
});




function get_data() {
    return {
        "success": true,
        "file_url": "http://127.0.0.1:8000/mediafiles/generate_excel_to_import/file1%202024_05-13-2025%2018-43-20.pdf",
        "recognized_documents": [
            {
                "page_number": 100,
                "form_type": "W-2",
                "data": [
                    {
                        "type": "w2",
                        "tax_year": "2024",
                        "document_number": 1,
                        "SocialSecurityNumber": "987-65-4321",
                        "TS": "T",
                        "Employer_IdNumber": "12-3456789",
                        "Employer_Name": "APPLE INC.",
                        "Employer_Address_StreetAddress": "1234 EMPIRE AVENUE",
                        "Employer_Address_City": "BURBANK",
                        "Employer_Address_State": "CA",
                        "Employer_Address_PostalCode": "91504",
                        "ControlNumber": "",
                        "WagesTipsAndOtherCompensation": 39928.93,
                        "FederalIncomeTaxWithheld": 9882.68,
                        "SocialSecurityWages": 39928.93,
                        "SocialSecurityTaxWithheld": 2475.59,
                        "MedicareWagesAndTips": 39928.93,
                        "MedicareTaxWithheld": 578.97,
                        "SocialSecurityTips": "",
                        "AllocatedTips": "",
                        "DependentCareBenefits": "",
                        "NonQualifiedPlans": "",
                        "IsStatutoryEmployee": "false",
                        "IsRetirementPlan": "true",
                        "IsThirdPartySickPay": "false",
                        "StateTaxInfos": [
                            {
                                "State": "NY",
                                "StateWagesTipsEtc": 39928.93,
                                "StateIncomeTax": 2728.48
                            },
                            {
                                "State": "",
                                "StateWagesTipsEtc": "",
                                "StateIncomeTax": ""
                            }
                        ],
                        "LocalTaxInfos": [
                            {
                                "LocalWagesTipsEtc": 39928.93,
                                "LocalIncomeTax": 1605.87
                            },
                            {
                                "LocalWagesTipsEtc": "",
                                "LocalIncomeTax": ""
                            }
                        ]
                    }
                ],
                "link": "",
                "status": ""
            }
        ]
    }
}



//=============================handle view detail JSON==============================


//  Display json

// function displayJsonOverlay(data) {
//     const jsonBox = document.getElementById("result-overview");

//     // Chuyển JSON thành HTML dạng tree
//     jsonBox.innerHTML = generateJsonTree(data);

//     // Bắt sự kiện toggle sau khi đã render
//     jsonBox.querySelectorAll(".json-toggle").forEach(toggle => {
//         toggle.addEventListener("click", function () {
//             const content = this.nextElementSibling;
//             if (content) {
//                 const isCollapsed = content.classList.contains("json-collapsed");
//                 content.classList.toggle("json-collapsed", !isCollapsed);
//                 this.textContent = isCollapsed ? "[-] " : "[+] ";
//             }
//         });
//     });

//     const btnDownload = document.getElementById("btn-download-json");
//     btnDownload.onclick = () => {
//         const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
//         const url = URL.createObjectURL(blob);

//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "tax_data.json";
//         a.click();

//         URL.revokeObjectURL(url);
//     };
// }


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


function get_JSON() {
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



document.getElementById('btn-selected-checklist').addEventListener('click', function (e) {
    e.preventDefault();

    const allCheckboxes = document.querySelectorAll('.checklist input[type="checkbox"]');

    const nonable = [];
    const newFound = [];
    const missing = [];

    allCheckboxes.forEach(checkbox => {
        const li = checkbox.closest('li');
        if (!li) return;

        const span = li.querySelector('span');
        if (!span) return;

        const text = span.textContent.trim();  // Ví dụ: "W-2 (S Corp 1)"
        const match = text.match(/^(.+?)\s+\((.+?)\)$/);
        if (!match) return;

        const form = match[1].trim();
        const entity_name = match[2].trim();

        const isNewFound = li.closest('.result_checklist-new-found1') !== null;
        const reason = li.querySelector('select')?.value || '';

        if (checkbox.checked) {
            nonable.push({
                form,
                entity_name,
                status: 'N/A-Confirmed with client',
                reason
            });
        } else {
            if (isNewFound) {
                newFound.push({
                    form,
                    entity_name,
                    status: 'New this year'
                });
            } else {
                missing.push({
                    form,
                    entity_name,
                    status: 'Missing'
                });
            }
        }
    });

    const summary_checklist = {
        nonable,
        new_found: newFound,
        missing
    };

    console.log('✅ Checklist Summary:', summary_checklist);
    localStorage.setItem('summary_checklist', JSON.stringify(summary_checklist));

    window.location.href = '../templete/upload_summary.html';
});

//=============================handle upload pdf=============================
const globalEntityOptions = [];

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

// 🔁 Khi page load, generate list
function generateEntityListFromOCR(jsonData) {
    for (const formType in displayFieldMapping) {
        const displayFields = displayFieldMapping[formType];
        const formData = jsonData[formType];
        if (!formData || !Array.isArray(formData.data)) continue;

        formData.data.forEach(item => {
            const pk = item["General primary key"] || item["General"] || item;
            const displayText = displayFields.map(f => pk?.[f] || "(missing)").join(" - ");
            globalEntityOptions.push({
                formType,
                label: `${formType} - ${displayText}`
            });
        });
    }
}

//=======================handle confirm btn======================
document.getElementById('confirm-btn').addEventListener('click', () => {
    const importHistory = localStorage.getItem("importHistory");
    handle_confirm_btn(importHistory)
    const jsonData = localStorage.getItem('jsonData');
    const importHistoryNew = localStorage.getItem("importHistory");
    renderChecklist(JSON.parse(jsonData), JSON.parse(importHistoryNew))
    renderUploadedDocuments(JSON.parse(importHistoryNew))
})

async function handle_confirm_btn(importHistory) {
    const data = JSON.parse(importHistory)

    const displayFieldMapping = {
        "W-2": "Employer_Name",
        "1099-DIV": "Payer_Name"
    };

    const rows = document.querySelectorAll(".validation-table tbody tr");
    rows.forEach(row => {
        const formType = row.children[2]?.textContent?.trim();
        const entityKey = row.dataset.entityKey?.toLowerCase();
        const isValid = row.children[4]?.textContent?.trim();
        const select = row.querySelector("select.link-select");
        const selectedLabel = select?.value;

        if (!formType || !entityKey || !selectedLabel || isValid !== "Valid") return;

        const matchField = displayFieldMapping[formType];

        // ✅ Lặp trực tiếp qua các entity (importHistory là flat list)
        data.forEach(entity => {
            if (entity.form_type !== formType || !Array.isArray(entity.data)) return;

            const fieldValue = entity.data[0]?.[matchField]?.toLowerCase();
            if (fieldValue === entityKey) {
                entity.link = selectedLabel;
            }
        });
    });

    console.log(data)
    console.log(RETURN_ID)
    localStorage.setItem('importHistory', JSON.stringify(data));

    //==============================update import========================
    const update_imports = await fetch(`${API_BASE_URL}/api/cch-import/update-imports/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            return_id: RETURN_ID,
            data: data
        }),
    })
        .then(res => res.json())
        .then(data => console.log("✅ Success:", data))
        .catch(err => console.error("❌ Error:", err));

}


//=====================================extract filename from url========================
function extractOriginalFilename(url) {

    const encodedFilename = url.split('/').pop(); // file1%202024_05-13-2025%2018-43-20.pdf
    const decoded = decodeURIComponent(encodedFilename); // file1 2024_05-13-2025 18-43-20.pdf
    const original = decoded.replace(/_\d{2}-\d{2}-\d{4} \d{2}-\d{2}-\d{2}\.pdf$/, ".pdf");
    return original;

}
//=================================render table after import============================
const seen = new Set(); // ✅ Dùng để tránh render trùng

function appendRecognizedDocsToTable(result) {

    const tableBody = document.querySelector(".validation-table tbody");
    if (!tableBody) return;

    const displayFieldMapping = {
        "W-2": ["Employer_Name", "TS"],
        "1099-DIV": ["Payer_Name"]
    };

    const file_name = result.file_url ? extractOriginalFilename(result.file_url) : "";

    const returnid = document.getElementById('client-line-returnID').innerText;

    result.recognized_documents.forEach(doc => {
        const page = doc.page_number;
        const formType = doc.form_type;
        const linkFromDoc = doc.link || "";
        const entities = doc.data || [];

        if (typeof doc.data === 'object' && !Array.isArray(doc.data) && Object.keys(doc.data).length === 0) {
            return;
        }

        entities.forEach(entity => {
            const displayFields = displayFieldMapping[formType] || [];
            const key = formType + "|" + displayFields.map(f => entity[f] || "").join("|").toLowerCase();

            if (seen.has(key)) return;
            seen.add(key);

            const isValid = entity.tax_year == returnid.slice(0, 4);

            const displayText = displayFields.map(f => entity[f] || "(missing)").join(" - ");

            const tr = document.createElement("tr");
            const entityKeyField = formType === "W-2" ? entity["Employer_Name"]
                : formType === "1099-DIV" ? entity["Payer_Name"]
                    : "";
            tr.setAttribute("data-entity-key", (entityKeyField || "").toLowerCase());

            tr.innerHTML = `
                <td>${page}</td>
                <td>${file_name}</td>
                <td>${formType}</td>
                <td>${displayText}</td>
                <td class="${isValid ? 'valid' : 'invalid'}">
                    ${isValid ? 'Valid' : `Invalid Tax Year (${entity.tax_year || 'N/A'})`}
                </td>
                <td></td>
            `;

            const select = document.createElement("select");
            select.className = "link-select";

            if (globalEntityOptions?.length) {
                let matched = false;
                const filteredOptions = globalEntityOptions.filter(opt => opt.formType === formType);

                filteredOptions.forEach(opt => {
                    const option = document.createElement("option");
                    option.textContent = opt.label;

                    const full_key = `${formType} - ${displayText}`.toLowerCase();
                    const optionLabel = opt.label.toLowerCase();
                    console.log(optionLabel)
                    console.log(full_key)
                    console.log(linkFromDoc)

                    if (
                        optionLabel === linkFromDoc.toLowerCase() ||
                        (linkFromDoc === "" && optionLabel === full_key)
                    ) {
                        option.selected = true;
                        matched = true;
                    }

                    select.appendChild(option);
                });

                select.appendChild(new Option("──────────", "", false, false)).disabled = true;
                const newItem = new Option("New Item", "New Item");
                const invalidItem = new Option("Cancel", "Cancel");

                select.appendChild(newItem);
                select.appendChild(invalidItem);

                if (!matched) newItem.selected = true;
                if (!isValid) invalidItem.selected = true;
            }
            else {
                const newItem = new Option("New Item", "New Item");
                const invalidItem = new Option("Cancel", "Cancel");

                select.appendChild(newItem);
                select.appendChild(invalidItem);

                if (isValid) {
                    newItem.selected = true;
                } else {
                    invalidItem.selected = true;
                }
            }

            tr.querySelector("td:last-child").appendChild(select);
            tableBody.appendChild(tr);
        });
    });
}


function renderUploadedDocuments(importHistory) {
    const container = document.querySelector(".uploaded-documents .document-group");
    container.innerHTML = ''; // Xóa nội dung cũ

    const seenKeys = new Set(); // Dùng để lọc trùng

    const displayFieldMappingImport = {
        "W-2": ["Employer_Name", "TS"],
        "1099-INT": ["Payer_Name", "Account_Number"],
        "1099-DIV": ["Payer_Name", "Account_Number"],
        "1099-R": ["Payer_Name"],
        "Consolidated 1099": ["Payer name"],
        "1099-SSA": ["TSJ"],
        "K-1 1041": ["TSJ", "Name of k-1 entity"],
        "K-1 1065": ["TSJ", "Partnership's name"],
        "K-1 1120S": ["TSJ", "Corporation's name"]
    };

    importHistory.forEach(importItem => {
        const fileName = importItem.pdf_path?.split("/").pop() || "(unknown)";
        const details = document.createElement("details");
        details.open = true;

        const summary = document.createElement("summary");
        summary.textContent = fileName;
        summary.dataset.url = importItem.pdf_path;
        summary.style.cursor = "pointer";

        summary.addEventListener("click", function (e) {
            e.preventDefault();
            const fileUrl = summary.dataset.url;
            if (!fileUrl) return;
            window.open(`../templete/detail_pdf.html?file_url=${encodeURIComponent(fileUrl)}`, "_blank");
        });

        details.appendChild(summary);
        const ul = document.createElement("ul");
        ul.className = "entity-list";

        const docList = Array.isArray(importItem.data) ? [importItem] : [];

        docList.forEach(docItem => {
            const formType = docItem.form_type;
            const entities = Array.isArray(docItem.data) ? docItem.data : [];
            const mappingFields = displayFieldMappingImport[formType] || [];

            entities.forEach(entity => {
                // Bỏ qua nếu tax_year không khớp
                if (TAX_YEAR && entity.tax_year && entity.tax_year != TAX_YEAR) return;

                const key = formType + "|" + mappingFields.map(f => (entity[f] || "").toLowerCase()).join("|");
                if (seenKeys.has(key)) return;
                seenKeys.add(key);

                const displayText = mappingFields.map(f => entity[f] || "(missing)").join(" - ");
                const li = document.createElement("li");
                li.textContent = `${formType} - ${displayText}`;
                ul.appendChild(li);
            });
        });

        if (ul.children.length > 0) {
            details.appendChild(ul);
            container.appendChild(details);
        }
    });
}




//=====================toggle show json=======================
// const btn_show_JSON = document.getElementById('btn-show-json')

// btn_show_JSON.addEventListener('click', () => {
//     const overview = document.getElementById("result-overview");

//     // Toggle hiển thị
//     if (overview.style.display === "none" || !overview.style.display) {
//         overview.style.display = "block";
//         btn_show_JSON.textContent = "Show JSON"; // 👈 đổi tên button nếu muốn
//     } else {
//         overview.style.display = "none";
//         btn_show_JSON.textContent = "Hide JSON"; // 👈 đổi tên button nếu muốn
//     }
// })


//download excel file

// const btn_download_excel = document.getElementById('download-excel-btn')

// btn_download_excel.addEventListener('click', () => {
//     const upload_result = localStorage.getItem('upload_result');

//     if (!upload_result) {
//         alert("❌ No upload result found.");
//         return;
//     }

//     try {
//         const parsed = JSON.parse(upload_result);
//         const fileUrl = parsed.file_url;
//         console.log(parsed)
//         if (!fileUrl) {
//             alert("❌ File URL not found in upload result.");
//             return;
//         }

//         // ✅ Tạo thẻ <a> để tải
//         const link = document.createElement('a');
//         link.href = fileUrl;
//         link.download = ""; // để trình duyệt tự xử lý
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     } catch (error) {
//         console.error("❌ Failed to parse upload_result:", error);
//         alert("❌ Failed to process upload result.");
//     }
// })

