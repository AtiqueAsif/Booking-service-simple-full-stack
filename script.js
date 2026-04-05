// ==================== DOM Elements ====================
const form = document.getElementById('bookingForm');
const nameInput = document.getElementById('fullname');
const serviceSelect = document.getElementById('service');
const dateInput = document.getElementById('bookingDate');
const notesInput = document.getElementById('notes');
const currentBookingDiv = document.getElementById('currentBooking');
const recentList = document.getElementById('recentList');
const totalSpan = document.getElementById('totalBookings');
const activeSpan = document.getElementById('activeBookings');
const tableBody = document.getElementById('bookingsTableBody');
const exportBtn = document.getElementById('exportBtn');
const darkToggle = document.getElementById('darkModeToggle');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const analyticsTotal = document.getElementById('analyticsTotal');
const popularServiceSpan = document.getElementById('popularService');
const monthlySpan = document.getElementById('monthlyBookings');

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const logoBtn = document.getElementById('logoBtn');
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');

// ==================== Configuration ====================
const API_URL = 'http://localhost:5000/api/book';
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

// ==================== Data Store ====================
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];

// ==================== Navigation Functions ====================
function switchPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId.replace('Page', '')) {
            link.classList.add('active');
        }
    });
    
    if (pageId === 'bookingsPage') renderTable();
    if (pageId === 'analyticsPage') updateAnalytics();
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        switchPage(link.dataset.page + 'Page');
    });
});

logoBtn.addEventListener('click', () => switchPage('dashboardPage'));

// User Dropdown
userMenuBtn.addEventListener('click', () => userDropdown.classList.toggle('show'));
document.addEventListener('click', (e) => {
    if (!userMenuBtn.contains(e.target)) userDropdown.classList.remove('show');
});

document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.dataset.action === 'profile') alert('Profile feature coming soon!');
        if (item.dataset.action === 'logout') {
            if (confirm('Logout?')) location.reload();
        }
        userDropdown.classList.remove('show');
    });
});

// ==================== Helper Functions ====================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function updateStats() {
    totalSpan.textContent = bookings.length;
    activeSpan.textContent = bookings.length;
    if (analyticsTotal) analyticsTotal.textContent = bookings.length;
}

// ==================== Render Functions ====================
function renderRecent() {
    if (bookings.length === 0) {
        recentList.innerHTML = '<li class="empty-item">No bookings yet</li>';
        updateStats();
        return;
    }
    
    recentList.innerHTML = bookings.slice(0, 5).map(booking => `
        <li>
            <div>
                <div class="booking-name">${escapeHtml(booking.name)}</div>
                <div class="booking-service">${escapeHtml(booking.service)}</div>
            </div>
            <div class="booking-date">${formatDate(booking.date)}</div>
        </li>
    `).join('');
    
    updateStats();
}

function renderTable() {
    if (bookings.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No bookings found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = bookings.map((booking, index) => `
        <tr>
            <td>${escapeHtml(booking.name)}</td>
            <td>${escapeHtml(booking.service)}</td>
            <td>${formatDate(booking.date)}</td>
            <td><span style="color: var(--green);">Confirmed</span></td>
            <td><button class="delete-btn" data-index="${index}">Delete</button></td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.index);
            if (confirm('Delete this booking?')) {
                bookings.splice(idx, 1);
                localStorage.setItem('bookings', JSON.stringify(bookings));
                renderRecent();
                renderTable();
                updateCurrentBookingDisplay();
                updateAnalytics();
            }
        });
    });
}

function updateCurrentBookingDisplay() {
    if (bookings.length === 0) {
        currentBookingDiv.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <p>No active booking</p>
            </div>
        `;
        return;
    }
    
    const latest = bookings[0];
    currentBookingDiv.innerHTML = `
        <div style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="color: var(--gray-500);">Customer</span>
                <strong>${escapeHtml(latest.name)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="color: var(--gray-500);">Service</span>
                <strong>${escapeHtml(latest.service)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                <span style="color: var(--gray-500);">Date</span>
                <strong>${formatDate(latest.date)}</strong>
            </div>
            ${latest.notes ? `
            <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--gray-500);">Notes</span>
                <span>${escapeHtml(latest.notes)}</span>
            </div>
            ` : ''}
        </div>
    `;
}

function updateAnalytics() {
    if (!analyticsTotal) return;
    
    analyticsTotal.textContent = bookings.length;
    
    // Most popular service
    const serviceCount = {};
    bookings.forEach(b => serviceCount[b.service] = (serviceCount[b.service] || 0) + 1);
    let popular = '-', max = 0;
    for (const [service, count] of Object.entries(serviceCount)) {
        if (count > max) { max = count; popular = service; }
    }
    popularServiceSpan.textContent = popular;
    
    // This month
    const now = new Date();
    const thisMonth = bookings.filter(b => {
        const d = new Date(b.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    monthlySpan.textContent = thisMonth.length;
}

// ==================== Validation ====================
function clearErrors() {
    document.getElementById('nameError').innerHTML = '';
    document.getElementById('serviceError').innerHTML = '';
    document.getElementById('dateError').innerHTML = '';
}

function validateForm(name, service, date) {
    let valid = true;
    clearErrors();
    
    if (!name.trim()) {
        document.getElementById('nameError').innerHTML = 'Name is required';
        valid = false;
    } else if (name.length < 2) {
        document.getElementById('nameError').innerHTML = 'Name must be at least 2 characters';
        valid = false;
    }
    
    if (!service) {
        document.getElementById('serviceError').innerHTML = 'Select a service';
        valid = false;
    }
    
    if (!date) {
        document.getElementById('dateError').innerHTML = 'Select a date';
        valid = false;
    } else if (date < today) {
        document.getElementById('dateError').innerHTML = 'Date cannot be in the past';
        valid = false;
    }
    
    return valid;
}

// ==================== Storage ====================
function saveToLocal(booking) {
    bookings.unshift(booking);
    if (bookings.length > 20) bookings.pop();
    localStorage.setItem('bookings', JSON.stringify(bookings));
    renderRecent();
    renderTable();
    updateCurrentBookingDisplay();
    updateAnalytics();
}

async function sendToBackend(booking) {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        const data = await res.json();
        console.log('Backend:', data);
        return res.ok;
    } catch (err) {
        console.log('Backend not available:', err);
        return false;
    }
}

// ==================== Form Submit ====================
async function handleSubmit(e) {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const service = serviceSelect.value;
    const date = dateInput.value;
    const notes = notesInput.value.trim();
    
    if (!validateForm(name, service, date)) return;
    
    const newBooking = { name, service, date, notes, created: new Date().toISOString() };
    
    saveToLocal(newBooking);
    await sendToBackend(newBooking);
    
    nameInput.value = '';
    serviceSelect.value = '';
    dateInput.value = '';
    notesInput.value = '';
}

// ==================== Event Listeners ====================
form.addEventListener('submit', handleSubmit);

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all booking history?')) {
        bookings = [];
        localStorage.removeItem('bookings');
        renderRecent();
        renderTable();
        updateCurrentBookingDisplay();
        updateAnalytics();
    }
});

exportBtn.addEventListener('click', () => {
    const data = JSON.stringify(bookings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

deleteAllBtn.addEventListener('click', () => {
    if (confirm('WARNING: Delete ALL data permanently?')) {
        bookings = [];
        localStorage.removeItem('bookings');
        renderRecent();
        renderTable();
        updateCurrentBookingDisplay();
        updateAnalytics();
        alert('All data deleted');
    }
});

// Dark Mode
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark');
    darkToggle.checked = true;
}
darkToggle.addEventListener('change', () => {
    if (darkToggle.checked) {
        document.body.classList.add('dark');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('darkMode', 'disabled');
    }
});

// ==================== Initial Render ====================
renderRecent();
renderTable();
updateCurrentBookingDisplay();
updateAnalytics();