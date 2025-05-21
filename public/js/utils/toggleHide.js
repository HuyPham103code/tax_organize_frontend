export function toggleVisibility(id, mode = null) {
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