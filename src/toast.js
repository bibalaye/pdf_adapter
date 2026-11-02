/**
 * Toast notification system
 */
import { icon } from './icon.js';

const MAX_VISIBLE = 3;

let toastContainer = null;

function getContainer() {
    if (!toastContainer) {
        toastContainer = document.getElementById('toastContainer');
    }
    return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration - ms
 * @param {{label: string, onClick: Function}} [action] - optional button, e.g. "Annuler"
 */
export function showToast(message, type = 'info', duration = 4000, action = null) {
    const container = getContainer();
    if (!container) return;

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = icon(icons[type] || 'info');

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    const dismiss = () => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    };

    if (action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'toast-action';
        button.textContent = action.label;
        button.addEventListener('click', () => {
            action.onClick();
            dismiss();
        });
        toast.appendChild(button);
    }

    while (container.children.length >= MAX_VISIBLE) container.firstElementChild.remove();
    container.appendChild(toast);
    setTimeout(dismiss, duration);
}
