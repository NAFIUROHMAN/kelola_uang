// Cek status login
window.addEventListener('DOMContentLoaded', () => {
    if(sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
    
    // Inisialisasi dashboard
    initDashboard();
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
});

// Variabel global untuk chart
let expenseChart;

// Inisialisasi dashboard
function initDashboard() {
    // Set tanggal hari ini sebagai default di form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    
    // Load data dari spreadsheet (simulasi)
    loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Inisialisasi chart
    initChart();
}

function loadData() {
    // Ini adalah data dummy untuk simulasi
    // Pada implementasi nyata, data akan diambil dari Google Spreadsheet
    
    const dummyData = {
        currentBalance: 4500000,
        totalIncome: 7500000,
        totalExpense: 3000000,
        balanceComparison: 12.5,
        incomeComparison: 8.3,
        expenseComparison: -5.2,
        recentTransactions: [
            { date: '2023-06-15', category: 'Pemasukan', description: 'Gaji Bulanan', amount: 7500000 },
            { date: '2023-06-10', category: 'Kebutuhan', description: 'Belanja Bulanan', amount: 1200000 },
            { date: '2023-06-05', category: 'Keinginan', description: 'Makan di Restoran', amount: 350000 },
            { date: '2023-06-03', category: 'Kebutuhan', description: 'Tagihan Listrik', amount: 450000 },
            { date: '2023-06-01', category: 'Keinginan', description: 'Beli Buku', amount: 250000 }
        ],
        expenseDistribution: {
            kebutuhan: 65,
            keinginan: 35
        }
    };
    
    // Update UI dengan data
    updateDashboardUI(dummyData);
}

function updateDashboardUI(data) {
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };
    
    // Update summary cards
    document.getElementById('currentBalance').textContent = formatCurrency(data.currentBalance);
    document.getElementById('totalIncome').textContent = formatCurrency(data.totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(data.totalExpense);
    
    // Update comparison indicators
    const updateComparisonIndicator = (elementId, value) => {
        const element = document.getElementById(elementId);
        element.textContent = `${value > 0 ? '+' : ''}${value}%`;
        element.style.color = value > 0 ? '#2ecc71' : '#e74c3c';
    };
    
    updateComparisonIndicator('balanceComparison', data.balanceComparison);
    updateComparisonIndicator('incomeComparison', data.incomeComparison);
    updateComparisonIndicator('expenseComparison', data.expenseComparison);
    
    // Update recent transactions
    const transactionsTable = document.getElementById('recentTransactions');
    transactionsTable.innerHTML = '';
    
    data.recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(transaction.date).toLocaleDateString('id-ID');
        
        const categoryCell = document.createElement('td');
        categoryCell.textContent = transaction.category;
        
        const descCell = document.createElement('td');
        descCell.textContent = transaction.description;
        
        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(transaction.amount);
        amountCell.style.color = transaction.category === 'Pemasukan' ? '#2ecc71' : '#e74c3c';
        amountCell.style.fontWeight = '500';
        
        row.appendChild(dateCell);
        row.appendChild(categoryCell);
        row.appendChild(descCell);
        row.appendChild(amountCell);
        
        transactionsTable.appendChild(row);
    });
    
    // Update chart
    updateChart(data.expenseDistribution);
}

function setupEventListeners() {
    // Modal untuk tambah pemasukan
    document.getElementById('addIncomeBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Tambah Pemasukan';
        document.getElementById('transactionType').value = 'income';
        document.getElementById('expenseCategoryGroup').style.display = 'none';
        document.getElementById('transactionModal').style.display = 'block';
    });
    
    // Modal untuk tambah pengeluaran
    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Tambah Pengeluaran';
        document.getElementById('transactionType').value = 'expense';
        document.getElementById('expenseCategoryGroup').style.display = 'block';
        document.getElementById('transactionModal').style.display = 'block';
    });
    
    // Tutup modal
    document.querySelector('.close-btn').addEventListener('click', () => {
        document.getElementById('transactionModal').style.display = 'none';
    });
    
    // Tutup modal ketika klik di luar area modal
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('transactionModal')) {
            document.getElementById('transactionModal').style.display = 'none';
        }
    });
    
    // Submit form transaksi
    document.getElementById('transactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveTransaction();
    });
    
    // Filter chart
    document.getElementById('chartFilter').addEventListener('change', (e) => {
        // Pada implementasi nyata, ini akan memuat data berbeda berdasarkan filter
        console.log('Filter changed:', e.target.value);
    });
}

function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Kebutuhan', 'Keinginan'],
            datasets: [{
                data: [0, 0], // Data awal kosong
                backgroundColor: [
                    '#3498db',
                    '#e74c3c'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function updateChart(data) {
    expenseChart.data.datasets[0].data = [data.kebutuhan, data.keinginan];
    expenseChart.update();
}

function saveTransaction() {
    const form = document.getElementById('transactionForm');
    const formData = new FormData(form);
    
    const transaction = {
        type: formData.get('transactionType'),
        date: formData.get('transactionDate'),
        name: formData.get('transactionName'),
        amount: parseInt(formData.get('transactionAmount')),
        notes: formData.get('transactionNotes')
    };
    
    if (transaction.type === 'expense') {
        transaction.category = formData.get('expenseCategory');
    }
    
    console.log('Transaction to save:', transaction);
    
    // Pada implementasi nyata, data akan dikirim ke Google Spreadsheet
    // Simulasi: reload data setelah menyimpan
    setTimeout(() => {
        alert('Transaksi berhasil disimpan!');
        form.reset();
        document.getElementById('transactionModal').style.display = 'none';
        loadData();
    }, 1000);
}