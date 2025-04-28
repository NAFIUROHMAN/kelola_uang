// Google Apps Script untuk integrasi dengan Spreadsheet

// Konfigurasi
const SPREADSHEET_PREFIX = "Laporan Keuangan";
const FOLDER_ID = "ID_FOLDER_ANDA"; // Ganti dengan ID folder Google Drive Anda

/**
 * Membuat spreadsheet baru untuk bulan dan tahun saat ini
 * jika belum ada
 */
function getCurrentMonthSpreadsheet() {
  const now = new Date();
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                     "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  const monthName = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const spreadsheetName = `${SPREADSHEET_PREFIX} ${monthName} ${year}`;
  
  // Cek apakah spreadsheet sudah ada
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(spreadsheetName);
  
  if (files.hasNext()) {
    // Spreadsheet sudah ada, buka yang ada
    return SpreadsheetApp.open(files.next());
  } else {
    // Buat spreadsheet baru
    const newSpreadsheet = SpreadsheetApp.create(spreadsheetName);
    const file = DriveApp.getFileById(newSpreadsheet.getId());
    
    // Pindahkan ke folder yang ditentukan
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    
    // Setup sheet dan header
    setupSpreadsheet(newSpreadsheet);
    
    return newSpreadsheet;
  }
}

/**
 * Setup spreadsheet dengan sheet dan header yang diperlukan
 */
function setupSpreadsheet(spreadsheet) {
  // Sheet untuk transaksi
  let transactionSheet = spreadsheet.getSheetByName("Transaksi");
  if (!transactionSheet) {
    transactionSheet = spreadsheet.insertSheet("Transaksi");
    
    // Set header
    transactionSheet.getRange("A1:E1").setValues([
      ["Tanggal", "Jenis", "Kategori", "Deskripsi", "Nominal"]
    ]);
    
    // Format header
    transactionSheet.getRange("A1:E1").setFontWeight("bold");
    transactionSheet.setFrozenRows(1);
  }
  
  // Sheet untuk ringkasan
  let summarySheet = spreadsheet.getSheetByName("Ringkasan");
  if (!summarySheet) {
    summarySheet = spreadsheet.insertSheet("Ringkasan");
    
    // Setup ringkasan bulanan
    summarySheet.getRange("A1:B6").setValues([
      ["Ringkasan Bulanan", ""],
      ["Total Pemasukan", "=SUMIF(Transaksi!B2:B, \"Pemasukan\", Transaksi!E2:E)"],
      ["Total Pengeluaran", "=SUMIF(Transaksi!B2:B, \"Pengeluaran\", Transaksi!E2:E)"],
      ["Saldo", "=B2-B3"],
      ["Pengeluaran Kebutuhan", "=SUMIFS(Transaksi!E2:E, Transaksi!B2:B, \"Pengeluaran\", Transaksi!C2:C, \"Kebutuhan\")"],
      ["Pengeluaran Keinginan", "=SUMIFS(Transaksi!E2:E, Transaksi!B2:B, \"Pengeluaran\", Transaksi!C2:C, \"Keinginan\")"]
    ]);
    
    // Format ringkasan
    summarySheet.getRange("A1:B1").merge().setFontWeight("bold");
    summarySheet.getRange("A2:A6").setFontWeight("bold");
    summarySheet.getRange("B2:B6").setNumberFormat("[$Rp] #,##0");
  }
}

/**
 * Menambahkan transaksi baru ke spreadsheet
 */
function addTransaction(transactionData) {
  const spreadsheet = getCurrentMonthSpreadsheet();
  const sheet = spreadsheet.getSheetByName("Transaksi");
  
  // Format data untuk spreadsheet
  const rowData = [
    transactionData.date,
    transactionData.type === "income" ? "Pemasukan" : "Pengeluaran",
    transactionData.type === "income" ? "" : (transactionData.category === "kebutuhan" ? "Kebutuhan" : "Keinginan"),
    transactionData.name,
    transactionData.amount
  ];
  
  // Tambahkan ke baris terakhir
  sheet.appendRow(rowData);
  
  // Format baris baru
  const lastRow = sheet.getLastRow();
  sheet.getRange(`A${lastRow}`).setNumberFormat("yyyy-mm-dd");
  sheet.getRange(`E${lastRow}`).setNumberFormat("[$Rp] #,##0");
  
  return {
    success: true,
    message: "Transaksi berhasil dicatat"
  };
}

/**
 * Mendapatkan data untuk dashboard
 */
function getDashboardData() {
  const spreadsheet = getCurrentMonthSpreadsheet();
  const transactionSheet = spreadsheet.getSheetByName("Transaksi");
  const summarySheet = spreadsheet.getSheetByName("Ringkasan");
  
  // Ambil data ringkasan
  const saldo = summarySheet.getRange("B4").getValue();
  const totalPemasukan = summarySheet.getRange("B2").getValue();
  const totalPengeluaran = summarySheet.getRange("B3").getValue();
  const pengeluaranKebutuhan = summarySheet.getRange("B5").getValue();
  const pengeluaranKeinginan = summarySheet.getRange("B6").getValue();
  
  // Ambil 5 transaksi terakhir
  const lastRow = transactionSheet.getLastRow();
  const startRow = Math.max(lastRow - 4, 2);
  const numRows = lastRow - startRow + 1;
  
  let transaksiTerakhir = [];
  if (numRows > 0) {
    const dataRange = transactionSheet.getRange(startRow, 1, numRows, 5);
    const dataValues = dataRange.getValues();
    
    transaksiTerakhir = dataValues.map(row => ({
      tanggal: row[0],
      jenis: row[1],
      kategori: row[2],
      deskripsi: row[3],
      nominal: row[4]
    })).reverse(); // Urutkan dari yang terbaru
  }
  
  return {
    saldo,
    totalPemasukan,
    totalPengeluaran,
    pengeluaranKebutuhan,
    pengeluaranKeinginan,
    transaksiTerakhir
  };
}

/**
 * Fungsi untuk menangani request dari web app
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const result = addTransaction(data);
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(application/json);
}

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "getData") {
    const data = getDashboardData();
    
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(application/json);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ error: "Action tidak valid" }))
    .setMimeType(application/json);
}