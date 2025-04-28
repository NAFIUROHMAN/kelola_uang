// LOGIN HANDLER
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const hashedPassword = hashCode(password);

    const validUsername = 'napnap';
    const validPasswordHash = hashCode('napik.565napik');

    if (username === validUsername && hashedPassword === validPasswordHash) {
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        alert('Username atau password salah!');
    }
});

// HASH FUNCTION
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash.toString();
}

// CEK LOGIN DASHBOARD
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('dashboard.html')) {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
            window.location.href = 'index.html';
        }
    }
});

// LOGOUT
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
});

// MODAL TRANSAKSI - FINAL FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('transactionModal');
    const addBtn = document.getElementById('addTransactionBtn');
    const closeBtn = document.querySelector('.modal-close');
    
    // Pastikan elemen ada sebelum menambahkan event listener
    if (addBtn && modal) {
        addBtn.addEventListener('click', function() {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            document.getElementById('transactionDate').valueAsDate = new Date();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }

    if (modal) {
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }

    // Transaction type handler
    const transactionType = document.getElementById('transactionType');
    const categoryGroup = document.getElementById('categoryGroup');
    const transactionCategory = document.getElementById('transactionCategory');
    
    if (transactionType && categoryGroup && transactionCategory) {
        transactionType.addEventListener('change', function() {
            categoryGroup.style.display = this.value === 'expense' ? 'block' : 'none';
            transactionCategory.required = this.value === 'expense';
        });
    }

    // Form submission
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const transactionData = {
                type: document.getElementById('transactionType').value,
                category: document.getElementById('transactionType').value === 'expense' ? 
                          document.getElementById('transactionCategory').value : '',
                date: document.getElementById('transactionDate').value,
                name: document.getElementById('transactionName').value,
                amount: Number(document.getElementById('transactionAmount').value)
            };

            saveTransaction(transactionData);
            
            this.reset();
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
});

// SAVE TRANSACTION
async function saveTransaction(data) {
    const API_URL = 'https://script.google.com/macros/s/AKfycby2jWNETGwfH3tUe6ikEbaW8y-APRJz9iU7S_qCAzePVEcb1ELcoX5b2eA8gFBvFOWLyw/exec';

    const formData = new URLSearchParams();
    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('date', data.date);
    formData.append('name', data.name);
    formData.append('amount', data.amount);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal menyimpan transaksi: ${response.status} - ${errorText}`);
        }

        const result = await response.text();
        console.log(result);
        alert('Transaksi berhasil disimpan!');
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    } catch (error) {
        console.error('Error Transaksi:', error);
        alert(`Terjadi kesalahan saat menyimpan: ${error.message}`);
    }
}

// LOAD DASHBOARD
function loadDashboardData() {
    const webAppUrl = 'https://script.google.com/macros/s/AKfycby2jWNETGwfH3tUe6ikEbaW8y-APRJz9iU7S_qCAzePVEcb1ELcoX5b2eA8gFBvFOWLyw/exec?action=getData';

    fetch(webAppUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('saldoBulanan').textContent = formatCurrency(data.saldo);
            document.getElementById('totalPemasukan').textContent = formatCurrency(data.totalPemasukan);
            document.getElementById('totalPengeluaran').textContent = formatCurrency(data.totalPengeluaran);

            const tableBody = document.querySelector('#transactionsTable tbody');
            tableBody.innerHTML = '';

            data.transaksiTerakhir.forEach(transaksi => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(transaksi.tanggal)}</td>
                    <td>${transaksi.jenis}</td>
                    <td>${transaksi.kategori || '-'}</td>
                    <td>${transaksi.deskripsi}</td>
                    <td class="${transaksi.jenis === 'Pemasukan' ? 'text-success' : 'text-danger'}">${formatCurrency(transaksi.nominal)}</td>
                `;
                tableBody.appendChild(row);
            });

            updateCharts(data);
        })
        .catch(error => {
            console.error('Load dashboard error:', error);
            alert('Gagal memuat data dashboard!');
        });
}

// FORMAT CURRENCY
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// FORMAT DATE
function formatDate(dateString) {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// UPDATE CHARTS
function updateCharts(data) {
    const expenseCtx = document.getElementById('expenseChart').getContext('2d');
    if (window.expenseChart) {
        window.expenseChart.destroy();
    }
    window.expenseChart = new Chart(expenseCtx, {
        type: 'doughnut',
        data: {
            labels: ['Kebutuhan', 'Keinginan'],
            datasets: [{
                data: [data.pengeluaranKebutuhan, data.pengeluaranKeinginan],
                backgroundColor: ['#4361ee', '#f72585'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    const incomeVsExpenseCtx = document.getElementById('incomeVsExpenseChart').getContext('2d');
    if (window.incomeVsExpenseChart) {
        window.incomeVsExpenseChart.destroy();
    }
    window.incomeVsExpenseChart = new Chart(incomeVsExpenseCtx, {
        type: 'bar',
        data: {
            labels: ['Pemasukan', 'Pengeluaran'],
            datasets: [{
                label: 'Jumlah',
                data: [data.totalPemasukan, data.totalPengeluaran],
                backgroundColor: ['#4cc9f0', '#f8961e'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
