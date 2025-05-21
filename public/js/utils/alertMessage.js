

export function showUploadAlertUpload(type, message, id) {
    const container = document.getElementById(id);

    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;
    alert.innerHTML = `
        ${message}
        <span class="close-alert">&times;</span>
    `;

    Object.assign(alert.style, {
        position: 'relative',
        padding: '10px 12px',
        marginTop: '15px',
        borderRadius: '6px',
        fontSize: '15px',
        fontWeight: '500',
        fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 0.3s ease-in-out',
    });

    const colorMap = {
        success: {
            backgroundColor: '#d4edda',
            color: '#155724',
            borderLeft: '5px solid #28a745',
        },
        warning: {
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderLeft: '5px solid #ffc107',
        },
        danger: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderLeft: '5px solid #dc3545',
        }
    };

    Object.assign(alert.style, colorMap[type] || colorMap.success);

    const closeBtn = alert.querySelector('.close-alert');
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '10px',
        right: '12px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'inherit',
        cursor: 'pointer'
    });

    closeBtn.addEventListener('click', () => {
        alert.remove();
    });

    container.innerHTML = '';
    container.appendChild(alert);
}
