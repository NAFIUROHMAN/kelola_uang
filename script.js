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
        } else {
            loadDashboardData(); // <- Panggil load setelah login OK
        }
    }
});

// LOGOUT
document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
});

// MODAL TRANSAKSI
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('transactionModal');
    const addBtn = document.getElementById('addTransactionBtn');
    const closeBtn = document.querySelector('.modal-close');
    
    if (addBtn && modal) {
        addBtn.addEventListener('click', function() {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
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

    const transactionType = document.getElementById('transactionType');
    const categoryGroup = document.getElementById('categoryGroup');
    const transactionCategory = document.getElementById('transactionCategory');
    
    if (transactionType && categoryGroup && transactionCategory) {
        transactionType.addEventListener('change', function() {
            categoryGroup.style.display = this.value === 'expense' ? 'block' : 'none';
            transactionCategory.required = this.value === 'expense';
        });
    }

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

            // Panggil fungsi untuk mengirim data ke Google Apps Script
            saveTransactionToGoogle(transactionData);

            // Reset form dan tutup modal
            this.reset();
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
});

// SAVE TRANSACTION TO GOOGLE (KE GOOGLE SCRIPT)
function saveTransactionToGoogle(data) {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbzjgIm3T25tOPcVkBTLjK41Ip81V-7tEkz_IUjEI_VVBvp-zTVJfL3kL-4REn_qSyZi5A/exec'; // Ganti dengan URL Apps Script kamu

    // Mengirim data ke Google Apps Script menggunakan POST
    fetch(scriptUrl, {
        method: 'POST',
        contentType: 'application/json',
        body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(result => {
        alert('Transaksi berhasil disimpan!');
        loadDashboardData(); // Refresh dashboard setelah transaksi disimpan
    })
    .catch(error => {
        console.error('Terjadi kesalahan:', error);
        alert('Gagal menyimpan transaksi');
    });
}

// LOAD DASHBOARD (LOCAL)
function loadDashboardData() {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    let saldo = 0;
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let pengeluaranKebutuhan = 0;
    let pengeluaranKeinginan = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            saldo += tx.amount;
            totalPemasukan += tx.amount;
        } else if (tx.type === 'expense') {
            saldo -= tx.amount;
            totalPengeluaran += tx.amount;
            if (tx.category === 'Kebutuhan') {
                pengeluaranKebutuhan += tx.amount;
            } else {
                pengeluaranKeinginan += tx.amount;
            }
        }
    });

    document.getElementById('saldoBulanan').textContent = formatCurrency(saldo);
    document.getElementById('totalPemasukan').textContent = formatCurrency(totalPemasukan);
    document.getElementById('totalPengeluaran').textContent = formatCurrency(totalPengeluaran);

    const tableBody = document.querySelector('#transactionsTable tbody');
    tableBody.innerHTML = '';

    // Tampilkan 10 transaksi terakhir
    transactions.slice(-10).reverse().forEach(transaksi => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaksi.date)}</td>
            <td>${transaksi.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
            <td>${transaksi.category || '-'}</td>
            <td>${transaksi.name}</td>
            <td class="${transaksi.type === 'income' ? 'text-success' : 'text-danger'}">${formatCurrency(transaksi.amount)}</td>
        `;
        tableBody.appendChild(row);
    });

    updateCharts({ pengeluaranKebutuhan, pengeluaranKeinginan, totalPemasukan, totalPengeluaran });
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
    if (window.expenseChart) window.expenseChart.destroy();
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
            plugins: { legend: { position: 'bottom' } }
        }
    });

    const incomeVsExpenseCtx = document.getElementById('incomeVsExpenseChart').getContext('2d');
    if (window.incomeVsExpenseChart) window.incomeVsExpenseChart.destroy();
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
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}
