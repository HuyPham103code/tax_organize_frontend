export function getReturnID() {
    const jsonData = localStorage.getItem('jsonData');
    if (!jsonData) return null;

    const data = JSON.parse(jsonData);
    const returnHeader = data.ReturnHeader || {};
    return `${returnHeader.TaxYear}${returnHeader.ReturnType}:${returnHeader.ClientID}:V${returnHeader.ReturnVersion}`;
}

export function getTaxYear() {
    const jsonData = localStorage.getItem('jsonData');
    if (!jsonData) return null;

    const data = JSON.parse(jsonData);
    const returnHeader = data.ReturnHeader || {};
    return returnHeader.TaxYear || null;
}