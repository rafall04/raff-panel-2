const axios = require('axios');
const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    delay,
    fetchLatestWaWebVersion
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require("fs");
const path = require('path');
const express = require('express');
const qrcode = require('qrcode')
const figlet = require('figlet');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const phpExpress = require('php-express')({binPath: 'php'});
const { Boom } = require('@hapi/boom');
const { color } = require('./lib/color');
const { Server } = require("socket.io");
const { createServer } = require('node:http');
const { exec } = require('child_process');
const cookieParser = require('cookie-parser');
const convertRupiah = require('rupiah-format');
const cors = require('cors');
const pay = require("./lib/ipaymu")
const { faker } = require('@faker-js/faker');

const { getSSIDInfo, getCustomerRedaman, getDeviceCoreInfo, rebootRouter, getvoucher } = require("./lib/wifi");
const { updatePPPoEProfile, getPPPProfiles, getPPPUsers, getHotspotProfiles, deleteActivePPPoEUser } = require('./lib/mikrotik');

global.config = JSON.parse(fs.readFileSync(path.join("./config.json")));
// global db
global.paymentMethod = JSON.parse(fs.readFileSync(path.join("./database/payment-method.json")));
global.accounts = JSON.parse(fs.readFileSync(path.join("./database/accounts.json")));
global.users = JSON.parse(fs.readFileSync(path.join("./database/users.json")));
global.requests = JSON.parse(fs.readFileSync(path.join("database/requests.json")));
global.packages = JSON.parse(fs.readFileSync(path.join("./database/packages.json")));
global.statik = JSON.parse(fs.readFileSync(path.join('./database/statik.json')));
global.voucher = JSON.parse(fs.readFileSync(path.join('./database/voucher.json')));
global.atm = JSON.parse(fs.readFileSync(path.join('./database/user/atm.json')));
global.payment = JSON.parse(fs.readFileSync(path.join('./database/payment.json')));
global.cronConfig = JSON.parse(fs.readFileSync(path.join('./database/cron.json')));

const requests = JSON.parse(fs.readFileSync('./database/requests.json', 'utf8'));

// --- AWAL PENAMBAHAN LAPORAN/TIKET ---
global.reports = [];
const reportsDbPath = path.join(__dirname, './database/reports.json');

try {
    if (fs.existsSync(reportsDbPath)) {
        const reportsData = fs.readFileSync(reportsDbPath, 'utf8');
        global.reports = JSON.parse(reportsData);
    } else {
        fs.writeFileSync(reportsDbPath, JSON.stringify([], null, 2), 'utf8');
        console.log('[DB_INIT] File database/reports.json dibuat.');
    }
} catch (error) {
    console.error('[DB_LOAD_ERROR] Gagal memuat atau membuat database/reports.json:', error);
    global.reports = []; // Fallback ke array kosong jika ada error
}
// --- AKHIR PENAMBAHAN LAPORAN/TIKET ---

function updateOdpPortUsage(odpId, increment = true, assetsArray) {
    const odpIndex = assetsArray.findIndex(asset => String(asset.id) === String(odpId) && asset.type === 'ODP');
    if (odpIndex !== -1) {
        if (increment) {
            assetsArray[odpIndex].ports_used = (parseInt(assetsArray[odpIndex].ports_used) || 0) + 1;
        } else {
            assetsArray[odpIndex].ports_used = Math.max(0, (parseInt(assetsArray[odpIndex].ports_used) || 0) - 1);
        }
        console.log(`[ODP_PORT_UPDATE] ODP ID ${odpId} ports_used diupdate menjadi ${assetsArray[odpIndex].ports_used}`);
        return true; // Berhasil
    } else {
        console.warn(`[ODP_PORT_UPDATE_WARN] ODP ID ${odpId} tidak ditemukan untuk update port.`);
        return false; // Gagal
    }
}

const networkAssetsDbPath = path.join(__dirname, 'database', 'network_assets.json');

// Fungsi loadNetworkAssets, saveNetworkAssets, generateAssetId (diasumsikan sudah benar dari sebelumnya)
function loadNetworkAssets() {
    console.log(`[ASSET_LOAD] Mencoba memuat aset dari: ${networkAssetsDbPath}`);
    try {
        if (fs.existsSync(networkAssetsDbPath)) {
            const fileContent = fs.readFileSync(networkAssetsDbPath, 'utf-8');
            if (fileContent.trim() === '') {
                console.log("[ASSET_LOAD] File ada tapi kosong. Mengembalikan array kosong.");
                return [];
            }
            try {
                const jsonData = JSON.parse(fileContent);
                if (!Array.isArray(jsonData)) {
                    console.error("[ASSET_LOAD_ERROR] Data di network_assets.json bukan array. Membuat backup dan file baru.");
                    fs.copyFileSync(networkAssetsDbPath, `${networkAssetsDbPath}.corrupted.${Date.now()}.bak`);
                    fs.writeFileSync(networkAssetsDbPath, JSON.stringify([], null, 2), 'utf-8');
                    return [];
                }
                console.log(`[ASSET_LOAD] Berhasil memuat ${jsonData.length} aset.`);
                return jsonData;
            } catch (parseError) {
                console.error("[ASSET_LOAD_ERROR] Gagal parse JSON dari network_assets.json:", parseError);
                fs.copyFileSync(networkAssetsDbPath, `${networkAssetsDbPath}.corrupted.${Date.now()}.bak`);
                fs.writeFileSync(networkAssetsDbPath, JSON.stringify([], null, 2), 'utf-8');
                return [];
            }
        } else {
            console.log("[ASSET_LOAD] File tidak ditemukan. Membuat file baru dengan array kosong.");
            fs.writeFileSync(networkAssetsDbPath, JSON.stringify([], null, 2), 'utf-8');
            return [];
        }
    } catch (error) {
        console.error("[ASSET_LOAD_FATAL_ERROR] Gagal menangani file network_assets.json:", error);
        return [];
    }
}

function saveNetworkAssets(assets) {
    console.log(`[ASSET_SAVE] Mencoba menyimpan ${Array.isArray(assets) ? assets.length : 'data invalid'} aset ke: ${networkAssetsDbPath}`);
    if (!Array.isArray(assets)) {
        console.error("[ASSET_SAVE_ERROR] Data yang akan disimpan bukan array:", assets);
        throw new Error("Data aset yang akan disimpan harus berupa array.");
    }
    try {
        fs.writeFileSync(networkAssetsDbPath, JSON.stringify(assets, null, 2), 'utf-8');
        console.log("[ASSET_SAVE] Data aset jaringan berhasil disimpan.");
    } catch (error) {
        console.error("[ASSET_SAVE_ERROR] Gagal menyimpan data aset jaringan:", error);
        throw new Error(`Gagal menyimpan data aset jaringan ke file: ${error.message}`);
    }
}

function generateAssetId(type, parentOdcId = null, existingAssets = [], assetName = "") {
    let prefix = "";
    let baseCode = "XXX";
    let sequenceNumber = 1;

    if (type === 'ODC') { prefix = "ODC"; }
    else if (type === 'ODP') { prefix = "ODP"; }
    else { return `ASSET-UNKNOWN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`; }

    if (type === 'ODP' && parentOdcId) {
        const parentMatch = parentOdcId.match(/^ODC-([A-Z0-9]+(?:-[0-9]+)?)/i);
        if (parentMatch && parentMatch[1]) { baseCode = parentMatch[1].replace(/-/g, "");  }
        else if (parentOdcId.length >= 3) { baseCode = parentOdcId.substring(0, Math.min(parentOdcId.length, 7)).toUpperCase().replace(/[^A-Z0-9]/gi, ''); if(baseCode.length === 0) baseCode = "PARENT"; }
    } else if (assetName) {
        const nameParts = assetName.trim().toUpperCase().split(/\s+|_|-/);
        let generatedBase = "";
        if (nameParts.length > 1 && nameParts[0].length > 0 && nameParts[1].length > 0) {
            generatedBase = (nameParts[0].substring(0, Math.min(nameParts[0].length, 3)) + nameParts[1].substring(0, Math.min(nameParts[1].length, 2)));
        } else if (nameParts[0].length >= 3) {
            generatedBase = nameParts[0].substring(0, 3);
        } else if (nameParts[0].length > 0) {
            generatedBase = nameParts[0];
            while(generatedBase.length < 3 && generatedBase.length > 0) generatedBase += "X";
        }
        baseCode = generatedBase.substring(0, 7).replace(/[^A-Z0-9]/gi, '');
    }
    if(baseCode.length === 0) baseCode = "GEN";

    let relevantAssets;
    if (type === 'ODP' && parentOdcId) {
        relevantAssets = existingAssets.filter(asset => asset.type === 'ODP' && asset.parent_odc_id === parentOdcId);
    } else {
        relevantAssets = existingAssets.filter(asset => asset.type === type && asset.id.startsWith(`${prefix}-${baseCode}-`));
    }
    sequenceNumber = relevantAssets.length + 1;
    const formattedSequence = String(sequenceNumber).padStart(3, '0');
    let newPotentialId = `${prefix}-${baseCode}-${formattedSequence}`;

    let uniquenessCounter = 0;
    let finalId = newPotentialId;
    while (existingAssets.some(asset => asset.id === finalId)) {
        uniquenessCounter++;
        finalId = `${newPotentialId}_${uniquenessCounter}`;
        if (uniquenessCounter > 20) {
            finalId = `${newPotentialId}_${Math.random().toString(36).substring(2, 7)}`;
            if (existingAssets.some(asset => asset.id === finalId)) {
                 finalId = `${newPotentialId}_${Date.now().toString().slice(-5)}`;
            }
            break;
        }
    }
    return finalId;
}

// --- AWAL PENAMBAHAN KOMPENSASI ---
global.compensations = [];
const compensationsDbPath = path.join(__dirname, './database/compensations.json');

try {
    if (fs.existsSync(compensationsDbPath)) {
        const compensationsData = fs.readFileSync(compensationsDbPath, 'utf8');
        global.compensations = JSON.parse(compensationsData);
    } else {
        fs.writeFileSync(compensationsDbPath, JSON.stringify([], null, 2), 'utf8');
        console.log('[DB_INIT] File database/compensations.json dibuat.');
    }
} catch (error) {
    console.error('[DB_LOAD_ERROR] Gagal memuat atau membuat database/compensations.json:', error);
    global.compensations = [];
}
// --- AKHIR PENAMBAHAN KOMPENSASI ---

function generateAdminTicketId(length = 7) {
    const characters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${result}`; // Prefix ADMLP untuk tiket via Admin
}

function saveReports() {
    try {
        fs.writeFileSync(reportsDbPath, JSON.stringify(global.reports, null, 2), 'utf8');
        // console.log('[DB_SAVE_SUCCESS] Data laporan berhasil disimpan.'); // Bisa di-uncomment untuk debugging
    } catch (error) {
        console.error('[DB_SAVE_ERROR] Gagal menyimpan data laporan:', error);
    }
}

function loadJSON(filePath) {
    const fullPath = path.join(__dirname, filePath);
    try {
        if (fs.existsSync(fullPath)) {
            const fileData = fs.readFileSync(fullPath, 'utf8');
            return JSON.parse(fileData);
        }
        console.warn(`[JSON_LOAD_WARN] File tidak ditemukan, membuat file baru jika data utama: ${fullPath}`);
        // Buat file array kosong jika itu adalah file data utama yang diharapkan array
        if (filePath.endsWith('requests.json') || filePath.endsWith('users.json') || filePath.endsWith('accounts.json') || filePath.endsWith('packages.json')) {
            fs.writeFileSync(fullPath, JSON.stringify([], null, 2), 'utf8');
            return [];
        }
        // Untuk file config atau lainnya yang mungkin objek
        fs.writeFileSync(fullPath, JSON.stringify({}, null, 2), 'utf8');
        return {};
    } catch (error) {
        console.error(`[JSON_LOAD_ERROR] Gagal memuat atau parse JSON dari ${fullPath}:`, error);
        if (filePath.endsWith('requests.json') || filePath.endsWith('users.json') || filePath.endsWith('accounts.json') || filePath.endsWith('packages.json')) {
            return [];
        }
        return {};
    }
}

function saveJSON(filePath, data) {
    const fullPath = path.join(__dirname, filePath);
    try {
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`[JSON_SAVE_SUCCESS] Data berhasil disimpan ke ${fullPath}`);
    } catch (error) {
        console.error(`[JSON_SAVE_ERROR] Gagal menyimpan data ke ${fullPath}:`, error);
        // Anda bisa throw error di sini jika ingin operasi gagal jika save tidak berhasil
        // throw error; 
    }
}

// Fungsi untuk mendapatkan profile berdasarkan subscription
function getProfileBySubscription(subscription) {
    const matchedPackage = global.packages.find(pkg => pkg.name === subscription);
    return matchedPackage ? matchedPackage.profile : null;
}

// Fungsi untuk mengonversi harga menjadi format Rupiah
function formatRupiah(price) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  }
  
  // Fungsi untuk menghasilkan dataMsg berdasarkan data pengguna
  function generateDataMsg(user) {
    let package = global.packages.find(p => p.name === user.subscription);
    return {
      name: user.name || "Tidak tersedia",
      paket: user.subscription || "Tidak tersedia",
      alamat: user.address || "Tidak tersedia",
      harga: package?.price ? formatRupiah(package.price) : "Tidak tersedia"
    };
  }

function replacer(str, dataMsg = {}) {
  for (let msg in dataMsg) {
    str = str.replaceAll(`%${msg}`, dataMsg[msg]); // Menggunakan backticks agar msg bisa dikenali sebagai variabel
  }
  return str;
}

// --- AWAL PENAMBAHAN FUNGSI SAVE KOMPENSASI ---
function saveCompensations() {
    try {
        fs.writeFileSync(compensationsDbPath, JSON.stringify(global.compensations, null, 2), 'utf8');
        // console.log('[DB_SAVE_SUCCESS] Data kompensasi berhasil disimpan.'); // Bisa di-uncomment untuk debugging
    } catch (error) {
        console.error('[DB_SAVE_ERROR] Gagal menyimpan data kompensasi:', error);
    }
}
// --- AKHIR PENAMBAHAN FUNGSI SAVE KOMPENSASI ---

const msgHandler = require('./message/raf');
const { compareSign } = require('./lib/myfunc');
const { addKoinUser, addATM, checkATMuser } = require('./lib/saldo');
const { updateStatusPayment, checkStatusPayment, delPayment, addPayBuy, addPayment, updateKetPayment } = require('./lib/payment');
const { isprofvc, checkprofvc, checkdurasivc, checkhargavc } = require('./lib/voucher');

const cronValidator = require('cron-validator'); // pastikan Anda menginstal modul ini dengan `npm install cron-validator`


function isValidCron(cronExpression) {
    return cronValidator.isValidCron(cronExpression, { alias: true, allowBlankDay: true });
}



console.log(color(figlet.textSync('Raf BOT MD', {
    font: 'Standard',
    horizontalLayout: 'default',
    vertivalLayout: 'default',
    whitespaceBreak: false
}), 'cyan'));
console.log(color('[ By Raf ]'));

let conn;
let cronTaskSetUnpaid = null;
let cronTaskReminder = null;
let cronTaskUnpaidAction = null;
let cronTaskIsolirNotification = null;
let cronTaskCompensationRevert = null;
let checkTask = null;
const PORT = process.env.PORT || 3100;

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser('rweutkhdrt'))
app.set('views', 'views');
app.use(express.static('static'));

const exclude = ["/callback/payment", "/app"];

// Move app routes to top to bypass authorization
app.get('/app/:type/:id?', async (req, res) => {
    const { type, id } = req.params;
    try {
        switch(type) {
            case "buy": {
                const { phone, email } = req.query;
                if (!phone) return res.status(400).json({ status: 400, message: "Nomor telepon diperlukan!" })
                if (!email) return res.status(400).json({ status: 400, message: "Email diperlukan!" })
                const reff = Math.floor(Math.random() * 1677721631342).toString(16);
                let hargavc = checkhargavc(id);
                hargavc = parseInt(hargavc);
                let result = await pay({
                    amount: hargavc,
                    reffId: reff,
                    comment: `pembelian voucher ${id} sebesar Rp. ${hargavc} melalui web`,
                    name: email?.split('@')?.[0] || "Anonymous",
                    phone: parseInt(phone),
                    email,
                });
                addPayment(reff, result.id, phone, `buynowweb`, hargavc, 'QRIS', ``, { qrStr: result.qrString, priceTotal: result.total, fee: result.fee, subtotal: result.subTotal });
                res.status(200).json({ status: 200, message: 'Success', data: reff });
            }
            break;
            case 'detailtrx': {
                res.status(200).json({ status: 200, message: 'Success', data: payment.find(h => h.reffId == id) || null });
            } break;
            case 'statustrx': {
                let pay = payment.find(d => d.reffId == id);
                if (!pay) return res.status(404).json({ status: 404, message: "" });
                if (!pay.status) return res.status(400).json({ status: 400, message: "menunggu pembayaran!" });
                res.status(200).json({ status: 200, message: 'Success', data: payment.find(h => h.reffId == id) || null });
            } break;
            default: {
                res.json({ data: type == 'packages' ? packages : type == 'voucher' ? voucher : [] })
            }
        }
    } catch(err) {
        if (typeof err === "string") return res.json({ status: 400, message: err });
        console.log(err);
        res.json({
            status: 500,
            message: "Internal server error"
        });
    }
})

// Middleware untuk otentikasi admin/owner/teknisi (sesuaikan dengan sistem Anda)
function ensureAuthenticatedStaff(req, res, next) {
    if (!req.user || !['admin', 'owner', 'superadmin', 'teknisi'].includes(req.user.role)) {
        return res.status(403).json({ status: 403, message: "Akses ditolak." });
    }
    next();
}

app.use(async (req, res, next) => {
    if(req.url.match(/.+\.php/)) return next();
    if(!req.cookies.token && !["/login", "/api/login", "/api/otp", "/api/otpverify"].includes(req.path) && !exclude.includes(req.path)) return res.redirect("/login");
    
    if(req.cookies.token) {
        const decoded = decode(req.cookies.token);
        if(decoded){
            req.user = decoded;
            // PERBAIKAN LOGIKA AKSES TEKNISI
            if(decoded.role == "teknisi") {
                const allowedTeknisiPages = [
                    "/pembayaran/teknisi",
                    "/teknisi-tiket",
                    "/teknisi-map-viewer", // Halaman baru untuk peta teknisi
                    "/logout"
                    // Tambahkan path halaman HTML lain yang spesifik diizinkan untuk teknisi jika ada
                ];
                // Izinkan akses jika path adalah API (dimulai dengan /api/) 
                // ATAU jika path ada dalam daftar halaman yang diizinkan secara eksplisit.
                if (!req.path.startsWith("/api/") && !allowedTeknisiPages.includes(req.path)) {
                    console.log(`[AUTH_REDIRECT_TEKNISI] Role: ${decoded.role}, Path: ${req.path}. Tidak diizinkan. Redirecting...`);
                    return res.redirect("/pembayaran/teknisi");
                }
                // Jika lolos dari kondisi di atas (artinya path adalah /api/... atau ada di allowedTeknisiPages),
                // maka request akan diteruskan ke handler selanjutnya (next()).
            }
        } else {
            res.cookie("token", "", {
                httpOnly: true,
                maxAge: 0
            });
            return res.redirect("/login");
        }
    }
    next();
});

app.get('/', (req, res) => {
    res.sendFile('sb-admin/index.html', { root: 'views' })
});

app.get('/kompensasi', (req, res) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'superadmin')) { 
    }
    res.sendFile('sb-admin/kompensasi.html', { root: 'views' });
});

app.get('/api/device-details/:deviceId', ensureAuthenticatedStaff, async (req, res) => {
    const { deviceId } = req.params;
    if (!deviceId) {
        console.log("[API_DEVICE_DETAILS] Permintaan buruk: Device ID tidak ada.");
        return res.status(400).json({ status: 400, message: "Device ID diperlukan." });
    }
    console.log(`[API_DEVICE_DETAILS] Menerima permintaan detail perangkat untuk Device ID: ${deviceId}`);

    try {
        const deviceInfo = await getDeviceCoreInfo(deviceId); // Memanggil fungsi yang sudah diperbarui

        console.log(`[API_DEVICE_DETAILS] Hasil dari getDeviceCoreInfo untuk ${deviceId}:`, deviceInfo);

        // deviceInfo akan berisi:
        // { modemType, serialNumber, softwareVersion, hardwareVersion, manufacturer, message }
        // atau akan melempar error jika deviceId tidak ada sama sekali di ACS atau terjadi error lain.
        // Jika parameter tidak ditemukan tapi device ada, message akan diisi oleh getDeviceCoreInfo.

        // Berhasil mengambil data, meskipun beberapa field mungkin null
        res.status(200).json({
            status: 200,
            message: deviceInfo.message || "Detail perangkat berhasil diambil.", // Gunakan message dari getDeviceCoreInfo jika ada
            data: {
                modemType: deviceInfo.modemType || null,
                serialNumber: deviceInfo.serialNumber || null,
                softwareVersion: deviceInfo.softwareVersion || null,
                hardwareVersion: deviceInfo.hardwareVersion || null,
                manufacturer: deviceInfo.manufacturer || null
            }
        });

    } catch (error) {
        // Tangani error yang dilempar oleh getDeviceCoreInfo
        console.error(`[API_DEVICE_DETAILS_ERROR] Gagal mengambil detail perangkat untuk ${deviceId}: ${error.message}`);
        let statusCode = 500;
        let publicMessage = "Terjadi kesalahan internal server saat mengambil detail perangkat.";

        if (error.message.toLowerCase().includes("data perangkat tidak ditemukan di genieacs")) {
            statusCode = 404;
            publicMessage = `Perangkat dengan ID ${deviceId} tidak ditemukan di sistem.`;
        } else if (error.message.toLowerCase().includes("parameter inti perangkat tidak ditemukan") ||
                   error.message.toLowerCase().includes("parameter inti tidak dapat diekstrak")) {
            statusCode = 404; // Dianggap data tidak lengkap = tidak ditemukan
            publicMessage = `Parameter inti (seperti tipe modem/serial) tidak ditemukan untuk perangkat ID ${deviceId}.`;
        } else if (error.message.toLowerCase().includes("tidak ada respons dari server manajemen perangkat")) {
            statusCode = 503; // Service Unavailable
            publicMessage = "Server manajemen perangkat tidak merespons atau timeout.";
        } else if (error.message.toLowerCase().includes("permintaan ke server manajemen perangkat gagal")) {
            const statusMatch = error.message.match(/Status: (\d+)/);
            if (statusMatch && statusMatch[1]) {
                const gStatus = parseInt(statusMatch[1]);
                if (gStatus === 404) statusCode = 404;
                else if (gStatus >= 400 && gStatus < 500) statusCode = gStatus;
                else if (gStatus >= 500) statusCode = 502; // Bad Gateway
            } else {
                statusCode = 502; // Gagal komunikasi umum dengan ACS
            }
            publicMessage = "Gagal berkomunikasi dengan server manajemen perangkat.";
        }

        res.status(statusCode).json({
            status: statusCode,
            message: publicMessage,
            error_detail: error.message, // Untuk debugging sisi server
            data: { modemType: null } // Pastikan struktur data.modemType ada dan null saat error
        });
    }
});

app.get('/api/customer-wifi-info/:deviceId', async (req, res) => {
    const { deviceId } = req.params;
    if (!deviceId) {
        console.log("[API_WIFI_INFO] Permintaan buruk: Device ID tidak ada.");
        return res.status(400).json({ status: 400, message: "Device ID diperlukan." });
    }
    console.log(`[API_WIFI_INFO] Menerima permintaan info WiFi untuk Device ID: ${deviceId}`);

    try {
        // Langkah 1: Kirim perintah refreshObject ke GenieACS
        console.log(`[API_WIFI_INFO] Mengirim perintah refreshObject untuk device: ${deviceId}, path: InternetGatewayDevice.LANDevice.1.WLANConfiguration`);
        try {
            // Anda bisa memilih objectName yang lebih spesifik jika hanya ingin me-refresh bagian tertentu.
            // "InternetGatewayDevice.LANDevice.1.WLANConfiguration." (dengan titik di akhir) akan me-refresh semua di bawah path tersebut.
            // "InternetGatewayDevice.LANDevice.1." juga bisa digunakan untuk cakupan yang lebih luas di LAN.
            // Untuk info WiFi yang melibatkan uptime juga, mungkin lebih baik me-refresh path yang lebih tinggi atau beberapa path.
            // Kita akan coba refresh WLANConfiguration dan VirtualParameters secara terpisah jika diperlukan,
            // atau path umum seperti "InternetGatewayDevice."
            // Untuk awal, kita coba "InternetGatewayDevice.LANDevice.1.WLANConfiguration." dan "VirtualParameters."

            await axios.post(`${config.genieacsBaseUrl}/devices/${encodeURIComponent(deviceId)}/tasks?connection_request`, {
                name: "refreshObject",
                objectName: "InternetGatewayDevice.LANDevice.1.WLANConfiguration." // Refresh semua parameter di bawah WLANConfiguration
            });
            console.log(`[API_WIFI_INFO] Perintah refreshObject untuk WLANConfiguration berhasil dikirim ke device: ${deviceId}`);
            
            // Tambahan: Refresh VirtualParameters untuk uptime jika perlu
            await axios.post(`${config.genieacsBaseUrl}/devices/${encodeURIComponent(deviceId)}/tasks?connection_request`, {
                name: "refreshObject",
                objectName: "VirtualParameters." // Refresh semua VirtualParameters
            });
            console.log(`[API_WIFI_INFO] Perintah refreshObject untuk VirtualParameters berhasil dikirim ke device: ${deviceId}`);

            // Beri sedikit jeda agar CPE sempat merespons dan ACS memperbarui datanya
            // Jeda ini mungkin perlu disesuaikan tergantung kecepatan respons sistem Anda
            await new Promise(resolve => setTimeout(resolve, 2000)); // Jeda 2 detik

        } catch (refreshError) {
            // Jika refresh gagal, kita tetap coba ambil data (mungkin data cache dari ACS)
            // tapi beri peringatan di log server.
            console.warn(`[API_WIFI_INFO_WARN] Gagal mengirim perintah refreshObject ke device ${deviceId}: ${refreshError.message}. Melanjutkan untuk mengambil data cache...`);
            if (refreshError.response) {
                 console.warn(`[API_WIFI_INFO_WARN] Detail error refresh: Status ${refreshError.response.status}, Data: ${JSON.stringify(refreshError.response.data)}`);
            }
        }

        // Langkah 2: Ambil data WiFi setelah mencoba refresh
        console.log(`[API_WIFI_INFO] Mengambil info WiFi setelah refresh untuk device: ${deviceId}`);
        const wifiInfo = await getSSIDInfo(deviceId); 
        
        console.log(`[API_WIFI_INFO] Berhasil mengambil info WiFi untuk ${deviceId}.`);
        res.status(200).json({ status: 200, message: "Info WiFi berhasil diambil.", data: wifiInfo });

    } catch (error) { 
        console.error(`[API_WIFI_INFO_ERROR] Gagal total mengambil info WiFi untuk device ${deviceId}: ${error.message}`);
        let statusCode = 500;
        let publicMessage = "Terjadi kesalahan internal server saat mengambil info WiFi.";

        if (error.message.toLowerCase().includes("device data not found") || error.message.toLowerCase().includes("tidak ditemukan")) {
            statusCode = 404;
            publicMessage = error.message; 
        } else if (error.message.toLowerCase().includes("no response from") || error.message.toLowerCase().includes("tidak ada respons")) {
            statusCode = 503; 
            publicMessage = error.message;
        } else if (error.message.toLowerCase().includes("request to device management server failed")) {
            const statusMatch = error.message.match(/Status: (\d+)/);
            if (statusMatch && statusMatch[1]) {
                const gStatus = parseInt(statusMatch[1]);
                if (gStatus >= 400 && gStatus < 500) statusCode = gStatus;
                else if (gStatus >=500) statusCode = 502; 
            }
            publicMessage = error.message;
        }
        
        res.status(statusCode).json({ 
            status: statusCode, 
            message: publicMessage, 
            error_detail: error.message 
        });
    }
});

app.get('/api/mikrotik/ppp-active-users', ensureAuthenticatedStaff, async (req, res) => {
    console.log("[API_PPP_ACTIVE] Menerima permintaan untuk status PPPoE aktif.");

    // Pastikan path ke php dan skrip PHP sudah benar
    // Sesuaikan 'php' jika binary PHP Anda ada di path lain atau perlu path absolut
    // Sesuaikan path ke 'get_ppp_active.php' jika berbeda
    const phpScriptPath = path.join(__dirname, 'views/get_ppp_active.php'); // Asumsi skrip PHP ada di root project

    exec(`php ${phpScriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`[API_PPP_ACTIVE_ERROR] Error executing PHP script: ${error.message}`);
            console.error(`[API_PPP_ACTIVE_ERROR] PHP stderr: ${stderr}`);
            return res.status(500).json({ status: 500, message: "Gagal mengambil data PPPoE aktif dari Mikrotik.", error: error.message, stderr: stderr });
        }
        try {
            // stdout akan berisi output JSON dari skrip PHP
            const activeUsers = JSON.parse(stdout);
            console.log(`[API_PPP_ACTIVE] Pengguna PPPoE aktif berhasil diambil: ${activeUsers.length} pengguna.`);
            res.status(200).json({ status: 200, message: "Data PPPoE aktif berhasil diambil.", data: activeUsers });
        } catch (parseError) {
            console.error(`[API_PPP_ACTIVE_ERROR] Gagal parse JSON dari output PHP: ${parseError.message}`);
            console.error(`[API_PPP_ACTIVE_ERROR] PHP stdout: ${stdout}`);
            res.status(500).json({ status: 500, message: "Format data PPPoE aktif tidak valid.", error: parseError.message, stdout: stdout });
        }
    });
});

// === API ENDPOINT GET ASET JARINGAN (DENGAN PERBAIKAN KALKULASI ports_used ODC) ===
app.get('/api/map/network-assets', ensureAuthenticatedStaff, (req, res) => {
    console.log(`[API_GET_ASSETS] Menerima request dari user: ${req.user ? req.user.username : 'Tidak diketahui (ensureAuthenticatedStaff perlu dicek)'}`);
    try {
        const assetsFromFile = loadNetworkAssets();
        if (!Array.isArray(assetsFromFile)) {
            console.error("[API_GET_ASSETS_ERROR] Fatal: loadNetworkAssets tidak mengembalikan array!");
            return res.status(500).json({ status: 500, message: "Format data aset internal tidak valid.", data: [] });
        }

        let processedAssets = JSON.parse(JSON.stringify(assetsFromFile)); // Deep copy

        const odcPortUsageCount = {};
        processedAssets.forEach(asset => {
            if (asset.type === 'ODP' && asset.parent_odc_id) {
                odcPortUsageCount[asset.parent_odc_id] = (odcPortUsageCount[asset.parent_odc_id] || 0) + 1;
            }
        });

        processedAssets = processedAssets.map(asset => {
            if (asset.type === 'ODC') {
                const calculatedPortsUsed = odcPortUsageCount[asset.id] || 0;
                // console.log(`ODC: ${asset.name} (ID: ${asset.id}), Calculated ports_used: ${calculatedPortsUsed}`); // Untuk debugging
                return { ...asset, ports_used: calculatedPortsUsed };
            }
            return asset;
        });

        console.log(`[API_GET_ASSETS] Mengirim ${processedAssets.length} aset ke klien (dengan port ODC terkalkulasi).`);
        res.status(200).json({ status: 200, message: "Data aset jaringan berhasil diambil.", data: processedAssets });

    } catch (error) {
        console.error("[API_GET_ASSETS_FATAL_ERROR] Kesalahan tidak tertangani:", error);
        res.status(500).json({ status: 500, message: "Gagal memuat data aset jaringan karena kesalahan server."});
    }
});

app.get('/api/customer-redaman/:deviceId', ensureAuthenticatedStaff, async (req, res) => {
    const { deviceId } = req.params;
    if (!deviceId) {
        console.log("[API_REDAMAN_INFO] Permintaan buruk: Device ID tidak ada.");
        return res.status(400).json({ status: 400, message: "Device ID diperlukan." });
    }
    console.log(`[API_REDAMAN_INFO] Menerima permintaan info redaman untuk Device ID: ${deviceId}`);

    try {
        const redamanInfo = await getCustomerRedaman(deviceId); // This function now handles refresh and fetch

        // redamanInfo could be { redaman: value } or { redaman: null, message: "Parameter..." }
        console.log(`[API_REDAMAN_INFO] Hasil dari getCustomerRedaman untuk ${deviceId}:`, redamanInfo);

        if (redamanInfo && typeof redamanInfo.redaman !== 'undefined') {
             res.status(200).json({
                status: 200,
                message: redamanInfo.message || "Info redaman berhasil diambil.",
                data: { redaman: redamanInfo.redaman }
            });
        } else {
            // This case should ideally be handled by getCustomerRedaman resolving with a specific structure
            // or rejecting, which is caught below.
            // For safety, if redamanInfo is not as expected:
            console.warn(`[API_REDAMAN_INFO_WARN] Struktur data redaman tidak sesuai untuk ${deviceId}.`);
            res.status(404).json({
                status: 404,
                message: "Data redaman tidak ditemukan atau format tidak sesuai.",
                data: { redaman: null }
            });
        }

    } catch (error) {
        console.error(`[API_REDAMAN_INFO_ERROR] Gagal mengambil info redaman untuk device ${deviceId}: ${error.message}`);
        let statusCode = 500;
        let publicMessage = "Terjadi kesalahan internal server saat mengambil info redaman.";

        // More specific error handling based on error message content
        if (error.message.toLowerCase().includes("data perangkat tidak ditemukan")) {
            statusCode = 404;
            publicMessage = error.message;
        } else if (error.message.toLowerCase().includes("parameter redaman tidak tersedia")) {
            statusCode = 404; // Or 200 with data: { redaman: null } for graceful frontend
            publicMessage = error.message;
        } else if (error.message.toLowerCase().includes("tidak ada respons dari server")) {
            statusCode = 503; // Service Unavailable
            publicMessage = error.message;
        } else if (error.message.toLowerCase().includes("manajemen perangkat gagal")) { // From getCustomerRedaman's reject
             const statusMatch = error.message.match(/Status: (\d+)/);
            if (statusMatch && statusMatch[1]) {
                const gStatus = parseInt(statusMatch[1]);
                if (gStatus === 404) statusCode = 404; // Device not found on GenieACS
                else if (gStatus >= 400 && gStatus < 500) statusCode = gStatus;
                else if (gStatus >=500) statusCode = 502; // Bad Gateway
            } else {
                statusCode = 502; // Generic if specific ACS status not parsed
            }
            publicMessage = error.message;
        }

        res.status(statusCode).json({
            status: statusCode,
            message: publicMessage,
            error_detail: error.message, // Keep detailed error for server logs/debugging
            data: { redaman: null } // Ensure data object with redaman: null for consistent frontend
        });
    }
});

app.post('/api/map/network-assets', ensureAuthenticatedStaff, (req, res) => {
    try {
        const { type, name, address, latitude, longitude, capacity_ports, notes, parent_odc_id } = req.body;
        // ports_used untuk ODC akan diabaikan/diset server, untuk ODP akan diambil dari req.body.ports_used

        console.log("[API_POST_ASSET_RECEIVED_BODY]:", req.body);

        if (!type || !name || latitude == null || longitude == null) {
            return res.status(400).json({ status: 400, message: "Tipe, Nama, Latitude, dan Longitude wajib diisi." });
        }
        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);
        if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
            return res.status(400).json({ status: 400, message: "Latitude dan Longitude harus berupa angka yang valid." });
        }

        const currentAssets = loadNetworkAssets();
        // console.log(`[API_POST_ASSET] Jumlah aset sebelum ditambah: ${currentAssets.length}`);

        if (type === 'ODP' && parent_odc_id) {
            const parentExists = currentAssets.some(asset => asset.id === parent_odc_id && asset.type === 'ODC');
            if (!parentExists) {
                return res.status(400).json({ status: 400, message: `ODC Induk dengan ID "${parent_odc_id}" tidak ditemukan.` });
            }
        }

        const newAssetId = generateAssetId(type, parent_odc_id, currentAssets, name);

        const newAsset = {
            id: newAssetId,
            type,
            name: name.trim(),
            address: address ? address.trim() : '',
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            capacity_ports: parseInt(capacity_ports) || 0,
            notes: notes ? notes.trim() : '',
            parent_odc_id: type === 'ODP' ? (parent_odc_id || null) : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.username
        };

        if (type === 'ODC') {
            newAsset.ports_used = 0; // Inisialisasi ports_used untuk ODC baru ke 0
        } else if (type === 'ODP') {
            newAsset.ports_used = parseInt(req.body.ports_used) || 0; // Ambil dari form jika ODP
        }

        currentAssets.push(newAsset);
        // console.log(`[API_POST_ASSET] Jumlah aset setelah ditambah (sebelum disimpan): ${currentAssets.length}`);
        
        saveNetworkAssets(currentAssets);

        console.log(`[MAP_ASSET_ADD] Aset ${newAsset.type} "${newAsset.name}" (ID: ${newAsset.id}) ditambahkan oleh ${req.user.username}`);
        res.status(201).json({ status: 201, message: `${type} "${name}" berhasil ditambahkan.`, data: newAsset });

    } catch (error) { 
        console.error("[API_MAP_ASSET_ADD_ERROR]", error);
        res.status(500).json({ status: 500, message: error.message || "Terjadi kesalahan internal pada server saat menambah aset." });
    }
});

app.put('/api/map/network-assets/:id', ensureAuthenticatedStaff, (req, res) => {
    try {
        const assetId = req.params.id;
        const updates = req.body; 

        if (updates.latitude == null || updates.longitude == null || !updates.name || !updates.type) {
            return res.status(400).json({ status: 400, message: "Tipe, Nama, Latitude, dan Longitude wajib diisi untuk update." });
        }
        const parsedLatitude = parseFloat(updates.latitude);
        const parsedLongitude = parseFloat(updates.longitude);
        if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
            return res.status(400).json({ status: 400, message: "Latitude dan Longitude harus berupa angka yang valid." });
        }
        
        const assets = loadNetworkAssets();
        const assetIndex = assets.findIndex(asset => asset.id === assetId);

        if (assetIndex === -1) {
            return res.status(404).json({ status: 404, message: "Aset jaringan tidak ditemukan." });
        }

        const originalAsset = assets[assetIndex];
        
        if (updates.type === 'ODP' && updates.parent_odc_id) {
            const parentExists = assets.some(asset => asset.id === updates.parent_odc_id && asset.type === 'ODC');
            if (!parentExists && updates.parent_odc_id !== null && updates.parent_odc_id !== '') { // Tambah cek jika parent_odc_id valid
                return res.status(400).json({ status: 400, message: `ODC Induk dengan ID "${updates.parent_odc_id}" tidak ditemukan.` });
            }
        }
        
        const updatedAssetData = { 
            ...originalAsset,
            type: updates.type,
            name: updates.name.trim(),
            address: updates.address ? updates.address.trim() : '',
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            capacity_ports: parseInt(updates.capacity_ports) || 0,
            notes: updates.notes ? updates.notes.trim() : '',
            parent_odc_id: updates.type === 'ODP' ? (updates.parent_odc_id || null) : null,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.username 
        };

        if (updates.type === 'ODC') {
            // Pertahankan nilai ports_used yang ada dari originalAsset (yang seharusnya sudah hasil kalkulasi sebelumnya jika pernah di-GET),
            // atau bisa juga diset 0 jika ingin server selalu menghitung ulang dari awal saat GET.
            // Mengabaikan updates.ports_used dari klien untuk ODC.
            updatedAssetData.ports_used = originalAsset.ports_used; 
        } else if (updates.type === 'ODP') {
            updatedAssetData.ports_used = parseInt(updates.ports_used) || 0;
        }
        
        assets[assetIndex] = updatedAssetData;
        
        saveNetworkAssets(assets);
        console.log(`[MAP_ASSET_UPDATE] Aset ID ${assetId} ("${assets[assetIndex].name}") diupdate oleh ${req.user.username}`);
        res.status(200).json({ status: 200, message: `Aset "${assets[assetIndex].name}" berhasil diupdate.`, data: assets[assetIndex] });
    } catch (error) {
        console.error("[API_MAP_ASSET_UPDATE_ERROR]", error);
        res.status(500).json({ status: 500, message: error.message || "Terjadi kesalahan internal pada server saat mengupdate aset." });
    }
});


app.delete('/api/map/network-assets/:id', ensureAuthenticatedStaff, (req, res) => {
    try {
        const assetId = req.params.id;
        let assets = loadNetworkAssets();
        const assetToDelete = assets.find(asset => asset.id === assetId);

        if (!assetToDelete) {
            return res.status(404).json({ status: 404, message: "Aset jaringan tidak ditemukan untuk dihapus." });
        }
        
        const assetsKept = assets.filter(asset => asset.id !== assetId);
        
        let finalAssets = assetsKept;
        if (assetToDelete.type === 'ODC') {
            finalAssets = assetsKept.map(asset => {
                if (asset.type === 'ODP' && asset.parent_odc_id === assetId) {
                    console.log(`[MAP_ASSET_DELETE_INFO] ODP ${asset.id} parent_odc_id direset karena ODC ${assetId} dihapus.`);
                    return { ...asset, parent_odc_id: null, updatedAt: new Date().toISOString(), updatedBy: req.user.username };
                }
                return asset;
            });
        }

        saveNetworkAssets(finalAssets);
        console.log(`[MAP_ASSET_DELETE] Aset ID ${assetId} ("${assetToDelete.name}") dihapus oleh ${req.user.username}`);
        res.status(200).json({ status: 200, message: `Aset "${assetToDelete.name}" berhasil dihapus.` });
    } catch (error) {
        console.error("[API_MAP_ASSET_DELETE_ERROR]", error);
        res.status(500).json({ status: 500, message: error.message || "Terjadi kesalahan internal pada server saat menghapus aset." });
    }
});

// Route untuk menyajikan halaman peta (pastikan sudah ada dan sesuai)
app.get('/map-viewer', ensureAuthenticatedStaff, (req, res) => {
    res.sendFile('sb-admin/map-viewer.html', { root: 'views' });
});

app.get('/pembayaran/teknisi', (req, res) => {
    res.sendFile('sb-admin/pembayaran/teknisi.html', { root: 'views' })
})

app.get('/teknisi-tiket', (req, res) => {
    // Pastikan req.user ada dan memiliki role yang sesuai (middleware harusnya sudah menangani ini)
    if (!req.user || (req.user.role !== 'teknisi' && req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'superadmin')) {
        // Meskipun middleware mungkin sudah redirect, ini sebagai fallback atau jika logic middleware berubah
        return res.status(403).send("Akses ditolak"); 
    }
    res.sendFile('sb-admin/teknisi-tiket.html', { root: 'views' });
});

// API endpoint untuk mengambil tiket (hanya yang belum selesai)
app.get('/api/tickets', async (req, res) => {
    if (!req.user || (req.user.role !== 'teknisi' && req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'superadmin')) {
        return res.status(403).json({ status: 403, message: "Akses ditolak." });
    }
    try {
        // Ambil tiket yang statusnya 'baru' ATAU 'diproses teknisi'
        const activeTickets = global.reports.filter(
            ticket => ticket.status === 'baru' || ticket.status === 'diproses teknisi'
        );
        // Urutkan berdasarkan tanggal dibuat, terbaru dulu
        activeTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Debugging: Lihat apa yang akan dikirim
        // console.log("Tiket yang dikirim ke klien:", JSON.stringify(activeTickets, null, 2));

        res.json({ status: 200, message: "Data tiket aktif berhasil diambil.", data: activeTickets });
    } catch (error) {
        console.error("[API_TICKETS_ERROR]", error);
        res.status(500).json({ status: 500, message: "Terjadi kesalahan internal server." });
    }
});

app.get('/admin/daftar-tiket', (req, res) => {
    // Pastikan hanya role yang sesuai yang bisa akses
    if (!req.user || !['admin', 'owner', 'superadmin'].includes(req.user.role)) {
        // Jika bukan admin/owner, mungkin redirect ke halaman login atau halaman default mereka
        // Untuk contoh ini, kita kirim 403 jika teknisi mencoba akses,
        // karena middleware Anda mungkin sudah mengarahkan teknisi ke halaman defaultnya.
        if (req.user && req.user.role === 'teknisi') {
             return res.status(403).send("Akses ditolak. Halaman ini khusus Administrator.");
        }
        return res.redirect('/login'); // Jika tidak ada user atau role tidak sesuai
    }
    res.sendFile('sb-admin/admin-daftar-tiket.html', { root: 'views' });
});

// API Endpoint untuk mengambil semua tiket (dengan filter) untuk Admin/Owner
app.get('/api/admin/tickets', async (req, res) => {
    if (!req.user || !['admin', 'owner', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ status: 403, message: "Akses ditolak." });
    }
    try {
        let ticketsToReturn = [...global.reports]; // Salin semua laporan

        const { status, startDate, endDate, pppoeName, ticketId } = req.query;

        // Filter berdasarkan status
        if (status && status !== 'all' && status !== '') {
            ticketsToReturn = ticketsToReturn.filter(ticket => ticket.status === status);
        }

        // Filter berdasarkan rentang tanggal (createdAt)
        if (startDate) {
            ticketsToReturn = ticketsToReturn.filter(ticket => 
                new Date(ticket.createdAt) >= new Date(new Date(startDate).setHours(0,0,0,0))
            );
        }
        if (endDate) {
            ticketsToReturn = ticketsToReturn.filter(ticket => 
                new Date(ticket.createdAt) <= new Date(new Date(endDate).setHours(23,59,59,999))
            );
        }

        // Filter berdasarkan nama PPPoE pelanggan (case-insensitive)
        if (pppoeName && pppoeName.trim() !== '') {
            ticketsToReturn = ticketsToReturn.filter(ticket =>
                ticket.pelangganDataSystem &&
                ticket.pelangganDataSystem.pppoe_username &&
                ticket.pelangganDataSystem.pppoe_username.toLowerCase().includes(pppoeName.toLowerCase().trim())
            );
        }
        
        // Filter berdasarkan ID Tiket (case-insensitive)
        if (ticketId && ticketId.trim() !== '') {
            ticketsToReturn = ticketsToReturn.filter(ticket =>
                ticket.ticketId &&
                ticket.ticketId.toLowerCase().includes(ticketId.toLowerCase().trim())
            );
        }


        // Urutkan berdasarkan tanggal dibuat, terbaru dulu (default)
        ticketsToReturn.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({ status: 200, message: "Data semua tiket berhasil diambil.", data: ticketsToReturn });
    } catch (error) {
        console.error("[API_ADMIN_TICKETS_ERROR]", error);
        res.status(500).json({ status: 500, message: "Terjadi kesalahan internal server mengambil data tiket." });
    }
});

app.get('/api/me', (req, res) => {
    if (req.user && req.user.username) {
        res.json({
            status: 200,
            message: "User details fetched successfully.",
            data: {
                id: req.user.id,
                username: req.user.username,
                role: req.user.role
            }
        });
    } else {
        res.status(401).json({ status: 401, message: "Not authenticated or user details not found." });
    }
});

// --- AWAL ENDPOINT API BARU UNTUK DAFTAR KOMPENSASI AKTIF ---
app.get('/api/compensations/active', async (req, res) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Akses ditolak. Hanya peran tertentu yang diizinkan." });
    }

    try {
        const activeCompensations = global.compensations.filter(comp => comp.status === 'active');
        const detailedActiveCompensations = activeCompensations.map(comp => {
            const user = global.users.find(u => u.id.toString() === comp.userId.toString());
            return {
                compensationId: comp.id,
                userId: comp.userId,
                userName: user ? user.name : 'User Tidak Ditemukan',
                pppoeUsername: user ? user.pppoe_username : comp.pppoeUsername, // Ambil dari kompensasi jika user tidak ada
                originalProfile: comp.originalProfile,
                compensatedProfile: comp.compensatedProfile,
                startDate: comp.startDate,
                endDate: comp.endDate,
                durationDays: comp.durationDays,
                durationHours: comp.durationHours,
                notes: comp.notes,
                processedBy: comp.processedBy
            };
        }).sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // Urutkan berdasarkan yang terbaru dimulai

        return res.status(200).json({
            message: "Data kompensasi aktif berhasil diambil.",
            data: detailedActiveCompensations
        });

    } catch (error) {
        console.error("[API_COMPENSATIONS_ACTIVE_ERROR] Gagal mengambil daftar kompensasi aktif:", error);
        return res.status(500).json({ message: "Terjadi kesalahan internal server saat mengambil data." });
    }
});
// --- AKHIR ENDPOINT API BARU UNTUK DAFTAR KOMPENSASI AKTIF ---

app.get('/api/:type/:id?', async (req, res) => {
    const { type, id } = req.params;
    try {
        switch(type){
            case "start":
                if(!conn) connect();
                return res.json({ message: !!conn ? 'bot is online' : 'starting bot'});
            break;
            case "stop":
                if(!!conn) {
                    conn.end();
                    conn = null;
                }
                return res.json({ message: 'Bot is offline' });
            break
            case "stats":
                const totalUsers = users.length;
                const paidUsers = users.filter(user => user.paid).length;
                const unpaidUsers = users.filter(user => !user.paid).length;

                return res.json({ 
                    users: totalUsers, 
                    paidUsers: paidUsers, 
                    unpaidUsers: unpaidUsers, 
                    botStatus: !!conn 
                });
            break;
            case "ssid":
                const data = await getSSIDInfo(id);
                return res.json({ data });
            break;
            case "reboot":
                try {
                    // Ensure req.params.id is correctly passed to rebootRouter
                    // The original code had req.params.id which is correct.
                    await rebootRouter(req.params.id); 
                    console.log(`[API_REBOOT] Perintah reboot untuk device ID ${req.params.id} berhasil dikirim.`);
                    return res.status(200).json({ status: 200, message: `Perintah reboot untuk device ID ${req.params.id} berhasil dikirim.` });
                } catch (error) {
                    // Log the error on the server for debugging
                    console.error(`[API_REBOOT_ERROR] Gagal reboot device ${req.params.id}:`, error.response ? error.response.data : error.message);
                    
                    // Determine a more specific error message if possible
                    let errorMessage = `Gagal mengirim perintah reboot untuk device ${req.params.id}.`;
                    if (error.response && error.response.data && error.response.data.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.response && typeof error.response.data === 'string' && error.response.data.length > 0 && error.response.data.length < 150) {
                        errorMessage = `Error dari server perangkat: ${error.response.data}`;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    return res.status(500).json({ status: 500, message: errorMessage });
                }
            break;
            case "requests":
                const currentRequestsFromFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'database/requests.json'), 'utf8'));
                
                let requestsToSend = currentRequestsFromFile; // Defaultnya adalah semua request

                // === TAMBAHAN LOGIKA FILTER UNTUK TEKNISI ===
                if (req.user && req.user.role === 'teknisi') {
                    // req.user seharusnya tersedia dari middleware otentikasi Anda
                    console.log(`[API_LOGS] '/api/requests': Memfilter permintaan untuk teknisi ID: ${req.user.id} (Username: ${req.user.username})`);
                    requestsToSend = currentRequestsFromFile.filter(request => {
                        // Pastikan perbandingan ID konsisten (misalnya, keduanya string)
                        return String(request.requested_by_teknisi_id) === String(req.user.id);
                    });
                    console.log(`[API_LOGS] '/api/requests': Ditemukan ${requestsToSend.length} permintaan untuk teknisi ID: ${req.user.id}`);
                } else if (req.user) {
                    // Untuk peran lain (misal admin/owner), kirim semua request
                    console.log(`[API_LOGS] '/api/requests': Peran pengguna adalah '${req.user.role}'. Mengirim semua permintaan.`);
                } else {
                    // Jika tidak ada user yang login (misalnya, akses publik jika ada)
                    console.log(`[API_LOGS] '/api/requests': Tidak ada pengguna login. Mengirim semua permintaan (sesuaikan kebijakan keamanan jika perlu).`);
                }
                // === AKHIR TAMBAHAN LOGIKA FILTER ===
                
                return res.json({ 
                    // Gunakan requestsToSend (yang sudah difilter jika perlu) untuk mapping
                    data: requestsToSend.map(v => {
                        // Pastikan perbandingan ID konsisten di dalam map juga
                        const findUserPelanggan = global.users.find(u => String(u.id) === String(v.userId)); 
                        const findPackageInfo = global.packages.find(p => p.name == findUserPelanggan?.subscription); 
                        const findTeknisiRequestor = global.accounts.find(acc => String(acc.id) === String(v.requested_by_teknisi_id)); 
                        
                        let packagePrice = 0;
                        if (findPackageInfo && findPackageInfo.price && 
                            findPackageInfo.price !== "N/A" && 
                            !isNaN(parseFloat(findPackageInfo.price))) {
                            packagePrice = parseFloat(findPackageInfo.price);
                        }

                        return {
                            ...v, 
                            requestorName: findTeknisiRequestor?.username || "Teknisi Tidak Diketahui",
                            userName: v.userName || findUserPelanggan?.name || "Pelanggan Tidak Ditemukan",
                            packageName: findPackageInfo?.name || "Unknown",
                            packagePrice: packagePrice,
                            updated_by_name: global.accounts.find(adminAcc => String(adminAcc.id) === String(v.updated_by))?.username || "-",
                        };
                    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                });
            break;
            case "config":
                return res.json({
                    data: {
                        genieacsBaseUrl: config.genieacsBaseUrl,
                        accessLimit: config.accessLimit,
                        check_schedule: config.check_schedule,
                        rx_tolerance: config.rx_tolerance,
                        unpaid_schedule: cronConfig.unpaid_schedule,
                        status_unpaid_schedule: cronConfig.status_unpaid_schedule,
                        schedule: cronConfig.schedule,
                        message: cronConfig.message,
                        status_schedule: cronConfig.status_schedule,
                        message_paid_notification: cronConfig.message_paid_notification,
                        status_message_paid_notification: cronConfig.status_message_paid_notification,
                        schedule_unpaid_action: cronConfig.schedule_unpaid_action,
                        status_schedule_unpaid_action: cronConfig.status_schedule_unpaid_action,
                        schedule_isolir_notification: cronConfig.schedule_isolir_notification,
                        message_isolir_notification: cronConfig.message_isolir_notification,
                        status_message_isolir_notification: cronConfig.status_message_isolir_notification,
                        isolir_profile: cronConfig.isolir_profile,
                        allow_paid_update_day : cronConfig.allow_paid_update_day,
                        ipaymuSecret: config.ipaymuSecret,
                        ipaymuVA: config.ipaymuVA,
                        ipaymuCallback: config.ipaymuCallback,
                        ipaymuProduction: config.ipaymuProduction,
                    }
                });
            break
            default:
                return res.json({ data: type == 'users' ? users : type == 'packages' ? packages : type == 'payment' ? payment : type == 'payment-method' ? paymentMethod : type == 'statik' ? statik : type == 'voucher' ? voucher : type == 'atm' ? atm : type == 'cron' ? cronConfig : type == 'accounts' ? accounts : [] })
            break
        }
    } catch (e){
        console.log(e);
        res.json({
            status: 500,
            message: "Internal server error"
        });
    }
});

// Endpoint untuk Teknisi membatalkan pengajuan mereka sendiri
app.post('/api/request/cancel', async (req, res) => {
    if (!req.user || req.user.role !== 'teknisi') {
        return res.status(403).json({ status: 403, message: "Akses ditolak. Hanya teknisi yang dapat mengakses fitur ini." });
    }

    const { requestId } = req.body;
    const technicianId = req.user.id; // ID teknisi yang sedang login (dari token JWT)

    if (!requestId) {
        return res.status(400).json({ status: 400, message: "Request ID diperlukan." });
    }

    let allRequests = loadJSON('database/requests.json');
    const requestIndex = allRequests.findIndex(r => 
        String(r.id) === String(requestId) && 
        String(r.requested_by_teknisi_id) === String(technicianId) // Pastikan teknisi ini yang buat request
    );

    if (requestIndex === -1) {
        return res.status(404).json({ status: 404, message: 'Pengajuan tidak ditemukan atau Anda tidak berhak membatalkannya.' });
    }

    const requestToUpdate = allRequests[requestIndex];

    if (requestToUpdate.status !== 'pending') {
        return res.status(400).json({ status: 400, message: `Pengajuan dengan ID ${requestId} tidak dapat dibatalkan karena statusnya bukan 'pending' (Status saat ini: ${requestToUpdate.status}).` });
    }

    // Ubah status menjadi 'dibatalkan oleh teknisi'
    requestToUpdate.status = 'cancelled_by_technician'; 
    requestToUpdate.updated_at = new Date().toISOString();
    // updated_by bisa diisi dengan ID teknisi itu sendiri, atau biarkan null jika pembatalan dianggap aksi sistemik oleh pembuatnya
    requestToUpdate.updated_by = technicianId; 

    allRequests[requestIndex] = requestToUpdate;
    saveJSON('database/requests.json', allRequests);

    console.log(`[REQUEST_CANCEL_LOG] Teknisi ID ${technicianId} membatalkan pengajuan ID ${requestId}.`);

    // (Opsional) Notifikasi ke Owner/Admin bahwa ada pengajuan yang dibatalkan oleh teknisi
    if (conn && global.config.ownerNumber && Array.isArray(global.config.ownerNumber) && global.config.ownerNumber.length > 0) {
        const userPelanggan = global.users.find(u => String(u.id) === String(requestToUpdate.userId));
        const namaPelanggan = userPelanggan ? userPelanggan.name : `ID ${requestToUpdate.userId}`;
        const teknisiPembuat = global.accounts.find(acc => String(acc.id) === String(requestToUpdate.requested_by_teknisi_id));
        const namaTeknisi = teknisiPembuat ? teknisiPembuat.username : `ID ${requestToUpdate.requested_by_teknisi_id}`;
        
        const messageToOwner = `🔔 *Info: Pengajuan Dibatalkan Teknisi* 🔔\n\nTeknisi *${namaTeknisi}* telah membatalkan pengajuan perubahan status pembayaran untuk pelanggan:\n\n👤 *Nama Pelanggan:* ${namaPelanggan}\n🆔 *ID Request:* ${requestToUpdate.id}\n⏰ *Waktu Pembatalan:* ${new Date(requestToUpdate.updated_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\nStatus pengajuan kini: Dibatalkan oleh Teknisi.`;
        
        for (const singleOwnerNum of global.config.ownerNumber) {
            const ownerNumberJid = singleOwnerNum.endsWith('@s.whatsapp.net') ? singleOwnerNum : `${singleOwnerNum}@s.whatsapp.net`;
            try { 
                await delay(1000);
                await conn.sendMessage(ownerNumberJid, { text: messageToOwner }); 
            } catch (error) {
                console.error(`[REQUEST_CANCEL_NOTIF_OWNER_ERROR] Gagal kirim notif pembatalan ke owner ${ownerNumberJid}:`, error);
            }
        }
    }

    return res.status(200).json({ status: 200, message: `Pengajuan dengan ID ${requestId} berhasil dibatalkan.` });
});

app.post('/api/action', async (req, res) => {
    const { action, username, newProfile } = req.body;
    switch (action) {
        case "update-pppoe-profile": {
            if (!username || !newProfile) {
                return res.status(400).json({ message: "Username and new profile are required." });
            }

            try {
                const result = await updatePPPoEProfile(username, newProfile);
                console.log(`Updated PPPoE profile for user ${username} to ${newProfile}`);
                res.json({ message: `PPPoE profile updated for ${username} to ${newProfile}`, result });
            } catch (error) {
                console.error("Failed to update PPPoE profile:", error);
                res.status(500).json({ message: "Failed to update PPPoE profile" });
            }
            break;
        }

        default:
            res.status(400).json({ message: "Invalid action specified." });
    }
});

app.post('/api/ticket/process', async (req, res) => {
    if (!req.user || (req.user.role !== 'teknisi' && req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'superadmin')) {
        return res.status(403).json({ status: 403, message: "Akses ditolak." });
    }

    const { ticketId } = req.body;
    const teknisiProcessor = req.user;

    if (!ticketId) {
        return res.status(400).json({ status: 400, message: "ID Tiket diperlukan." });
    }

    const reportIndex = global.reports.findIndex(r => r.ticketId === ticketId);

    if (reportIndex === -1) {
        return res.status(404).json({ status: 404, message: `Tiket dengan ID "${ticketId}" tidak ditemukan.` });
    }

    const report = global.reports[reportIndex];

    if (report.status !== 'baru') {
        return res.status(400).json({ status: 400, message: `Tiket "${ticketId}" tidak dalam status 'baru'. Status saat ini: ${report.status}.` });
    }

    report.status = 'diproses teknisi';
    report.processingStartedAt = new Date().toISOString();
    report.processedByTeknisiId = teknisiProcessor.id;
    const displayNameTeknisiProses = teknisiProcessor.namaLengkap || teknisiProcessor.username;
    report.processedByTeknisiName = displayNameTeknisiProses;

    report.resolvedAt = null;
    report.resolvedByTeknisiId = null;
    report.resolvedByTeknisiName = null;

    global.reports[reportIndex] = report;

    try {
        fs.writeFileSync(reportsDbPath, JSON.stringify(global.reports, null, 2), 'utf8');
        console.log(`[TICKET_PROCESS] Tiket ${ticketId} mulai diproses oleh ${displayNameTeknisiProses}`);

        if (conn && report.pelangganId) {
            const namaPelangganUntukNotif = report.pelangganPushName || (report.pelangganDataSystem ? report.pelangganDataSystem.name : "Pelanggan");
            
            // ===== PERBAIKAN: DEFINISIKAN layananPelanggan DI SINI =====
            const layananPelanggan = (report.pelangganDataSystem && report.pelangganDataSystem.subscription) ? report.pelangganDataSystem.subscription : "Tidak diketahui";
            const cuplikanLaporan = report.laporanText.substring(0, 75); 

            const optionsDateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' };
            const tanggalDibuatFormatted = new Date(report.createdAt).toLocaleString('id-ID', optionsDateFormat);
            const waktuMulaiProsesFormatted = new Date(report.processingStartedAt).toLocaleString('id-ID', optionsDateFormat);

            const messageToPelanggan = `⏳ *Laporan Anda Sedang Ditangani Teknisi* ⏳\n\nHalo ${namaPelangganUntukNotif},\n\nKabar baik! Laporan Anda telah kami terima dan saat ini sedang dalam penanganan oleh teknisi kami.\n\nBerikut detail laporan Anda:\n-----------------------------------\n🧾 *Nomor Tiket:* ${report.ticketId}\n📦 *Layanan/Paket Anda:* ${layananPelanggan}\n📅 *Dilaporkan Pada:* ${tanggalDibuatFormatted}\n🗒️ *Keluhan Anda (Ringkasan):*\n"${cuplikanLaporan}"\n-----------------------------------\n✅ *Status Saat Ini:* DIPROSES TEKNISI\n👨‍🔧 *Ditangani Oleh:* Teknisi ${displayNameTeknisiProses}\n🕒 *Mulai Diproses Pada:* ${waktuMulaiProsesFormatted}\n\nMohon kesabarannya selagi teknisi kami bekerja untuk menyelesaikan kendala Anda. Kami akan segera menghubungi Anda kembali setelah laporan selesai ditangani atau jika memerlukan informasi tambahan.\n\nTerima kasih atas pengertiannya.\nTim Layanan ${global.config.nama}`;
            
            try {
                await delay(1000);
                await conn.sendMessage(report.pelangganId, { text: messageToPelanggan });
                console.log(`[TICKET_PROCESS_NOTIF] Notifikasi proses (detail) terkirim ke ${report.pelangganId}`);
            } catch (err) {
                console.error(`[TICKET_PROCESS_NOTIF_ERROR] Gagal kirim notif proses (detail) ke pelanggan ${report.pelangganId}:`, err.message);
            }
        }
        return res.status(200).json({ status: 200, message: `Tiket ${ticketId} berhasil diubah statusnya menjadi "diproses teknisi".`, data: report });
    } catch (error) {
        console.error("[API_TICKET_PROCESS_ERROR] Gagal menyimpan perubahan tiket:", error);
        report.status = 'baru'; 
        report.processingStartedAt = null;
        report.processedByTeknisiId = null;
        report.processedByTeknisiName = null;
        global.reports[reportIndex] = report; 
        return res.status(500).json({ status: 500, message: "Terjadi kesalahan internal saat menyimpan perubahan tiket." });
    }
});

// API endpoint untuk teknisi MENYELESAIKAN tiket
app.post('/api/ticket/resolve', async (req, res) => {
    if (!req.user || (req.user.role !== 'teknisi' && req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'superadmin')) {
        return res.status(403).json({ status: 403, message: "Akses ditolak." });
    }

    const { ticketId } = req.body;
    const teknisiResolver = req.user; 

    if (!ticketId) {
        return res.status(400).json({ status: 400, message: "ID Tiket diperlukan." });
    }

    const reportIndex = global.reports.findIndex(r => r.ticketId === ticketId);

    if (reportIndex === -1) {
        return res.status(404).json({ status: 404, message: `Tiket dengan ID "${ticketId}" tidak ditemukan.` });
    }

    const report = global.reports[reportIndex];

    if (report.status === 'selesai') {
        return res.status(400).json({ status: 400, message: `Tiket "${ticketId}" sudah ditandai selesai sebelumnya.` });
    }
    if (report.status !== 'baru' && report.status !== 'diproses teknisi') {
        return res.status(400).json({ status: 400, message: `Tiket "${ticketId}" tidak bisa diselesaikan dari status '${report.status}'.` });
    }

    report.status = 'selesai'; 
    report.resolvedAt = new Date().toISOString(); 
    const displayNameResolver = teknisiResolver.namaLengkap || teknisiResolver.username;
    report.resolvedByTeknisiId = teknisiResolver.id; 
    report.resolvedByTeknisiName = displayNameResolver; 

    global.reports[reportIndex] = report; 
    
    try {
        fs.writeFileSync(reportsDbPath, JSON.stringify(global.reports, null, 2), 'utf8');
        console.log(`[TICKET_RESOLVE] Tiket ${ticketId} diselesaikan oleh ${displayNameResolver}`);

        if (conn && report.pelangganId) {
            const namaPelangganUntukNotif = report.pelangganPushName || (report.pelangganDataSystem ? report.pelangganDataSystem.name : "Pelanggan");
            
            // ===== PERBAIKAN: DEFINISIKAN layananPelanggan DI SINI =====
            const layananPelanggan = (report.pelangganDataSystem && report.pelangganDataSystem.subscription) ? report.pelangganDataSystem.subscription : "Tidak diketahui";
            
            const optionsDateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' };
            const tanggalDibuatFormatted = new Date(report.createdAt).toLocaleString('id-ID', optionsDateFormat);
            const tanggalSelesaiFormatted = new Date(report.resolvedAt).toLocaleString('id-ID', optionsDateFormat);

            const messageToPelanggan = `✨ *Laporan Anda Telah Selesai Ditangani* ✨\n\nHalo ${namaPelangganUntukNotif},\n\nKami informasikan bahwa laporan Anda dengan detail berikut telah berhasil ditangani dan diselesaikan:\n\n🧾 *Nomor Tiket:* ${report.ticketId}\n👤 *Nama Pelanggan:* ${namaPelangganUntukNotif}\n📦 *Layanan/Paket:* ${layananPelanggan}\n📅 *Dilaporkan Pada:* ${tanggalDibuatFormatted}\n🗒️ *Keluhan Anda:*\n${report.laporanText}\n\n-----------------------------------\n✅ *Status Saat Ini:* SELESAI\n👨‍🔧 *Ditangani Oleh:* Teknisi ${displayNameResolver}\n🕒 *Diselesaikan Pada:* ${tanggalSelesaiFormatted}\n-----------------------------------\n\nTerima kasih telah menggunakan layanan ${global.config.nama}.\nJika Anda masih mengalami kendala terkait laporan ini atau memiliki pertanyaan lebih lanjut, jangan ragu untuk menghubungi kami kembali.`;
            
            try {
                await delay(1000);
                await conn.sendMessage(report.pelangganId, { text: messageToPelanggan });
                console.log(`[TICKET_RESOLVE_NOTIF] Notifikasi penyelesaian (detail) terkirim ke ${report.pelangganId}`);
            } catch (err) {
                console.error(`[TICKET_RESOLVE_NOTIF_ERROR] Gagal mengirim notifikasi penyelesaian (detail) ke ${report.pelangganId}:`, err.message);
            }
        }        
        return res.status(200).json({ status: 200, message: `Tiket ${ticketId} berhasil ditandai sebagai SELESAI.` });

    } catch (error) {
        console.error("[API_TICKET_RESOLVE_ERROR] Gagal menyimpan atau notifikasi tiket:", error);
        // Pertimbangkan rollback jika perlu
        return res.status(500).json({ status: 500, message: "Terjadi kesalahan internal saat menyimpan perubahan tiket." });
    }
});

app.post('/api/admin/ticket/create', async (req, res) => {
    if (!req.user || !['admin', 'owner', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ status: 403, message: "Akses ditolak. Fitur ini hanya untuk Administrator." });
    }

    const { customerUserId, laporanText } = req.body;
    const adminCreator = req.user; // Admin/Owner yang membuat tiket

    if (!customerUserId || !laporanText || laporanText.trim() === "") {
        return res.status(400).json({ status: 400, message: "Pelanggan dan Deskripsi Laporan wajib diisi." });
    }

    const selectedCustomer = global.users.find(u => String(u.id) === String(customerUserId));
    if (!selectedCustomer) {
        return res.status(404).json({ status: 404, message: "Pelanggan yang dipilih tidak ditemukan." });
    }

    // Cek apakah pelanggan ini sudah memiliki laporan aktif
    const pelangganPlainNumbers = selectedCustomer.phone_number ? selectedCustomer.phone_number.split('|').map(n => n.trim()) : [];
    const pelangganJids = pelangganPlainNumbers.map(n => {
        if (n.startsWith("0")) return `62${n.substring(1)}@s.whatsapp.net`;
        if (n.startsWith("62")) return `${n}@s.whatsapp.net`;
        return null; // Atau format lain jika ada
    }).filter(j => j);


    const laporanAktifPelanggan = global.reports.find(
        report => pelangganJids.includes(report.pelangganId) &&
                  (report.status === 'baru' || report.status === 'diproses teknisi')
    );

    if (laporanAktifPelanggan) {
        return res.status(400).json({ 
            status: 400, 
            message: `Pelanggan ${selectedCustomer.name} sudah memiliki laporan aktif dengan ID: ${laporanAktifPelanggan.ticketId} (Status: ${laporanAktifPelanggan.status}). Selesaikan dulu laporan tersebut.` 
        });
    }

    const ticketId = generateAdminTicketId(7); // Menggunakan fungsi ID tiket khusus admin atau fungsi yg sama dari raf.js
    const nowISO = new Date().toISOString();

    const newReport = {
        ticketId,
        pelangganId: pelangganJids[0] || `${selectedCustomer.phone_number.split('|')[0].replace(/\D/g, '')}@s.whatsapp.net` || null, // Ambil JID pertama atau buat dari nomor pertama
        pelangganPushName: selectedCustomer.name, // Gunakan nama dari sistem sebagai default pushname
        pelangganDataSystem: { 
            id: selectedCustomer.id,
            name: selectedCustomer.name, 
            address: selectedCustomer.address, 
            subscription: selectedCustomer.subscription,
            pppoe_username: selectedCustomer.pppoe_username 
        },
        laporanText: laporanText.trim(),
        status: "baru",
        createdAt: nowISO,
        createdBy: { // Informasi siapa yang membuat tiket ini
            type: 'admin', // atau 'owner', 'superadmin' sesuai role
            userId: adminCreator.id,
            username: adminCreator.username
        },
        // Field lain diisi null atau default
        assignedTeknisiId: null,
        processingStartedAt: null,
        processedByTeknisiId: null,
        processedByTeknisiName: null,
        resolvedAt: null,
        resolvedByTeknisiId: null,
        resolvedByTeknisiName: null,
        cancellationReason: null,
        cancellationTimestamp: null,
        cancelledBy: null
    };

    global.reports.unshift(newReport); // Tambah ke awal array agar tampil teratas jika di-sort by default
    
    try {
        fs.writeFileSync(reportsDbPath, JSON.stringify(global.reports, null, 2), 'utf8');
        console.log(`[ADMIN_TICKET_CREATE] Tiket ${ticketId} untuk pelanggan ${selectedCustomer.name} dibuat oleh Admin: ${adminCreator.username}`);

        // Notifikasi ke Pelanggan bahwa tiket telah dibuatkan
        if (conn && newReport.pelangganId) {
            const dataForMsgPelanggan = generateDataMsg(selectedCustomer); // generateDataMsg perlu user object
            const cuplikanLaporanUntukPelanggan = newReport.laporanText.substring(0,100) + (newReport.laporanText.length > 100 ? "..." : "");
            
            // Pesan konfirmasi ke pelanggan
            const pesanKonfirmasiKePelanggan = `✨ *Laporan Anda Telah Dibuatkan Oleh Admin* ✨\n\nHalo Kak ${selectedCustomer.name},\n\nAdmin kami telah membuatkan tiket laporan untuk Anda terkait kendala yang disampaikan.\n\nBerikut adalah detail laporan Anda:\n-----------------------------------\n*Nomor Tiket Anda:* *${newReport.ticketId}*\n*Layanan/Paket:* ${dataForMsgPelanggan.paket}\n*Isi Laporan (Ringkasan):*\n"${cuplikanLaporanUntukPelanggan}"\n*Dibuat Oleh:* Admin ${adminCreator.username}\n-----------------------------------\n\nMohon simpan Nomor Tiket ini. Tim teknisi kami akan segera meninjau laporan Anda.\n\nTerima kasih,\nTim ${global.config.nama || "Layanan Kami"}`;

            const customerPhoneNumbers = selectedCustomer.phone_number.split('|');
            for (let number of customerPhoneNumbers) {
                if (!number || number.trim() === "") continue;
                let normalizedNumber = number.trim();
                if (normalizedNumber.startsWith("0")) {
                    normalizedNumber = "62" + normalizedNumber.substring(1);
                }
                if (!normalizedNumber.endsWith("@s.whatsapp.net")) {
                    normalizedNumber += "@s.whatsapp.net";
                }
                if (normalizedNumber.length > 8) {
                    try {
                        await delay(1000);
                        await conn.sendMessage(normalizedNumber, { text: pesanKonfirmasiKePelanggan });
                        if (typeof delay === 'function') await delay(1000);
                    } catch (err) {
                        console.error(`[ADMIN_TICKET_CREATE_NOTIF_CUST_ERROR] Gagal kirim notif ke pelanggan ${normalizedNumber}:`, err);
                    }
                }
            }
        }

        // Notifikasi ke Teknisi (mirip seperti di raf.js)
        const teknisiAccounts = global.accounts.filter(acc => acc.role === 'teknisi' && acc.phone_number && acc.phone_number.trim() !== "");
        if (teknisiAccounts.length > 0) {
            let detailPelangganUntukNotifTeknisi = `Dari (System via Admin ${adminCreator.username}): ${selectedCustomer.name} (${newReport.pelangganId ? newReport.pelangganId.split('@')[0] : 'No WA'})`;
            detailPelangganUntukNotifTeknisi += `\nNama Terdaftar: ${selectedCustomer.name || "N/A"}`;
            detailPelangganUntukNotifTeknisi += `\nAlamat: ${selectedCustomer.address || "N/A"}`;
            detailPelangganUntukNotifTeknisi += `\nPaket: ${selectedCustomer.subscription || "N/A"}`;
            if (selectedCustomer.pppoe_username) detailPelangganUntukNotifTeknisi += `\nPPPoE: ${selectedCustomer.pppoe_username}`;
            
            const waktuLaporFormatted = new Date(newReport.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
            const linkWaPelanggan = newReport.pelangganId ? `https://wa.me/${newReport.pelangganId.split('@')[0]}` : 'Tidak ada nomor WA valid';

           const messageToTeknisi = `🔔 *LAPORAN BARU DIBUAT ADMIN - SEGERA TINDAKLANJUTI* 🔔\n\nLaporan baru telah dibuat oleh Admin untuk pelanggan dan membutuhkan perhatian Anda. Mohon periksa dashboard teknisi Anda untuk detail lengkap dan ID tiketnya.\n\n*Informasi Pelanggan:*\n${detailPelangganUntukNotifTeknisi}\n*Kontak Pelanggan (WhatsApp):* ${linkWaPelanggan}\n\n*Isi Laporan Lengkap:*\n${newReport.laporanText}\n\n*Waktu Lapor (Dibuat Admin):* ${waktuLaporFormatted}\n-----------------------------------\n*LANGKAH SELANJUTNYA UNTUK TEKNISI:*\n\n1.  *Periksa Dashboard Teknisi:*\n    - Buka halaman *Manajemen Tiket Teknisi* di web.\n    - Anda akan menemukan laporan baru ini (biasanya di paling atas jika diurutkan berdasarkan terbaru). Catat ID Tiketnya dari sana untuk tindakan selanjutnya.\n\n2.  *Hubungi Pelanggan & Tangani Laporan:*\n    - Anda bisa menghubungi pelanggan (menggunakan link WA di atas) untuk konfirmasi atau jika perlu detail tambahan.\n\n3.  *Update Status ke "Diproses" (via Web):*\n    - Klik tombol "Proses Tiket" pada laporan ini di dashboard web Anda (gunakan ID Tiket yang Anda lihat di web).\n\n4.  *Selesaikan Laporan (Setelah Pekerjaan Selesai):*\n    - *PENTING:* Setelah masalah pelanggan teratasi, mintalah *Nomor Tiket* kepada pelanggan (yang mereka terima saat awal melapor).\n    - *Via WhatsApp:* Kirim perintah: \`selesaikantiket ID_TIKET_YANG_DIDAPAT\`\n    - *Via Web:* Pada halaman Manajemen Tiket, masukkan ID Tiket yang didapat pada form "Selesaikan Tiket".\n\nMohon segera ditangani. Terima kasih.\nTim Layanan ${global.config.nama || "Kami"}`;

            for (const teknisi of teknisiAccounts) {
                // ... (logika kirim ke teknisi sama seperti di raf.js)
                 let teknisiJid = teknisi.phone_number.trim();
                if (!teknisiJid.endsWith('@s.whatsapp.net')) {
                    if (teknisiJid.startsWith('0')) teknisiJid = `62${teknisiJid.substring(1)}@s.whatsapp.net`;
                    else if (teknisiJid.startsWith('62')) teknisiJid = `${teknisiJid}@s.whatsapp.net`;
                    else continue;
                }
                try {
                    await delay(1000);
                    await conn.sendMessage(teknisiJid, { text: messageToTeknisi });
                    if (typeof delay === 'function') await delay(1000);
                } catch (err) {
                    console.error(`[ADMIN_TICKET_CREATE_NOTIF_TECH_ERROR] Gagal kirim notif ke teknisi ${teknisi.username}:`, err);
                }
            }
        }

        return res.status(201).json({ status: 201, message: `Tiket ${ticketId} untuk pelanggan ${selectedCustomer.name} berhasil dibuat oleh Admin.`, data: newReport });

    } catch (error) {
        console.error("[API_ADMIN_TICKET_CREATE_ERROR] Gagal menyimpan tiket baru:", error);
        return res.status(500).json({ status: 500, message: "Terjadi kesalahan internal saat membuat tiket baru." });
    }
});

// API Endpoint untuk Admin/Owner membatalkan tiket
app.post('/api/admin/ticket/cancel', async (req, res) => {
    // Pastikan hanya role yang sesuai yang bisa akses
    if (!req.user || !['admin', 'owner', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({ status: 403, message: "Akses ditolak. Fitur ini hanya untuk Administrator." });
    }

    const { ticketId, cancellationReason } = req.body;
    const adminCanceller = req.user; // User admin/owner yang login dari token JWT

    if (!ticketId) {
        return res.status(400).json({ status: 400, message: "ID Tiket diperlukan untuk pembatalan." });
    }
    if (!cancellationReason || cancellationReason.trim() === "") {
        return res.status(400).json({ status: 400, message: "Alasan pembatalan tiket wajib diisi." });
    }

    const reportIndex = global.reports.findIndex(r => r.ticketId && r.ticketId.toLowerCase() === ticketId.toLowerCase());

    if (reportIndex === -1) {
        return res.status(404).json({ status: 404, message: `Tiket dengan ID "${ticketId}" tidak ditemukan.` });
    }

    const report = global.reports[reportIndex];

    // Tiket yang sudah selesai atau sudah dibatalkan tidak bisa dibatalkan lagi
    if (report.status === 'selesai' || report.status.startsWith('dibatalkan')) {
        return res.status(400).json({ status: 400, message: `Tiket ID "${ticketId}" sudah dalam status "${report.status}" dan tidak dapat dibatalkan lagi.` });
    }

    const oldStatus = report.status; // Simpan status lama jika perlu rollback
    const wasBeingProcessedBy = (oldStatus === 'diproses teknisi') ? report.processedByTeknisiName : null;
    const technicianJidToNotify = (oldStatus === 'diproses teknisi' && report.processedByTeknisiId) 
        ? global.accounts.find(acc => String(acc.id) === String(report.processedByTeknisiId))?.phone_number 
        : null;


    report.status = 'dibatalkan admin'; // Atau bisa juga 'dibatalkan owner', sesuaikan
    report.cancellationReason = cancellationReason;
    report.cancellationTimestamp = new Date().toISOString();
    report.cancelledBy = {
        id: adminCanceller.id,
        name: adminCanceller.username, // atau adminCanceller.namaLengkap jika ada
        type: adminCanceller.role 
    };
    // Reset info proses jika ada
    // report.processingStartedAt = null; // Biarkan saja agar tahu kapan sempat diproses
    // report.processedByTeknisiId = null;
    // report.processedByTeknisiName = null; // Biarkan saja nama teknisi yg sempat proses

    global.reports[reportIndex] = report;

    try {
        fs.writeFileSync(reportsDbPath, JSON.stringify(global.reports, null, 2), 'utf8');
        console.log(`[ADMIN_TICKET_CANCEL] Tiket ${ticketId} dibatalkan oleh Admin: ${adminCanceller.username}. Alasan: ${cancellationReason}`);

        // Notifikasi ke Pelanggan
        if (conn && report.pelangganId) {
            const namaPelangganNotif = report.pelangganPushName || (report.pelangganDataSystem ? report.pelangganDataSystem.name : "Pelanggan");
            const messageToCustomer = `ℹ️ *Informasi Tiket Dibatalkan Admin*\n\nHalo Kak ${namaPelangganNotif},\nDengan ini kami informasikan bahwa tiket laporan Anda dengan ID *${report.ticketId}* telah dibatalkan oleh tim Admin kami.\n\n*Alasan Pembatalan:*\n${cancellationReason}\n\nJika Anda memiliki pertanyaan lebih lanjut atau merasa ini adalah sebuah kekeliruan, silakan hubungi layanan pelanggan kami.\n\nTerima kasih atas pengertiannya.\nTim ${global.config.nama || "Layanan Kami"}`;
            try {
                await delay(1000);
                await conn.sendMessage(report.pelangganId, { text: messageToCustomer });
            } catch (err) {
                console.error(`[ADMIN_TICKET_CANCEL_NOTIF_CUST_ERROR] Gagal kirim notif ke pelanggan ${report.pelangganId}:`, err);
            }
        }

        // Notifikasi ke Teknisi jika tiket sedang diproses olehnya
        if (conn && technicianJidToNotify && wasBeingProcessedBy) {
            let targetTechnicianJid = technicianJidToNotify.trim();
            if (targetTechnicianJid.startsWith("0")) {
                targetTechnicianJid = "62" + targetTechnicianJid.substring(1);
            }
            if (!targetTechnicianJid.endsWith("@s.whatsapp.net")) {
                targetTechnicianJid += "@s.whatsapp.net";
            }

            if (targetTechnicianJid.length > 8) {
                const messageToTechnician = `⚠️ *TIKET DIBATALKAN ADMIN SAAT ANDA PROSES* ⚠️\n\nPerhatian Teknisi ${wasBeingProcessedBy},\nTiket dengan ID *${report.ticketId}* yang sedang Anda proses, telah dibatalkan oleh Admin.\n\n*Pelanggan:* ${report.pelangganPushName || 'N/A'} (${report.pelangganId.split('@')[0]})\n*Alasan Pembatalan Admin:*\n${cancellationReason}\n\nAnda tidak perlu melanjutkan penanganan untuk tiket ini. Mohon fokus pada tiket aktif lainnya.\n\nTerima kasih.`;
                try {
                    await delay(1000);
                    await conn.sendMessage(targetTechnicianJid, { text: messageToTechnician });
                } catch (err) {
                    console.error(`[ADMIN_TICKET_CANCEL_NOTIF_TECH_ERROR] Gagal kirim notif ke teknisi ${targetTechnicianJid}:`, err);
                }
            }
        }

        return res.status(200).json({ status: 200, message: `Tiket ${ticketId} berhasil dibatalkan.` });

    } catch (error) {
        console.error("[API_ADMIN_TICKET_CANCEL_ERROR] Gagal menyimpan atau notifikasi:", error);
        // Rollback perubahan jika gagal
        report.status = oldStatus;
        report.cancellationReason = null;
        report.cancellationTimestamp = null;
        report.cancelledBy = null;
        global.reports[reportIndex] = report; // Kembalikan state lama
        return res.status(500).json({ status: 500, message: "Terjadi kesalahan internal saat membatalkan tiket." });
    }
});

// --- AWAL KODE LENGKAP ENDPOINT /api/compensation/apply ---
app.post('/api/compensation/apply', async (req, res) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Akses ditolak. Hanya peran tertentu yang diizinkan." });
    }

    const { customerIds, speedProfile, durationDays, durationHours, notes } = req.body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json({ message: "Parameter 'customerIds' (array) diperlukan dan tidak boleh kosong." });
    }
    if (!speedProfile) {
        return res.status(400).json({ message: "Parameter 'speedProfile' (profil Mikrotik baru) diperlukan." });
    }

    const parsedDurationDays = parseInt(durationDays);
    const parsedDurationHours = parseInt(durationHours);

    if (isNaN(parsedDurationDays) || parsedDurationDays < 0) {
        return res.status(400).json({ message: "Parameter 'durationDays' harus angka non-negatif." });
    }
    if (isNaN(parsedDurationHours) || parsedDurationHours < 0 || parsedDurationHours >= 24) {
        return res.status(400).json({ message: "Parameter 'durationHours' harus angka antara 0 dan 23." });
    }
    if (parsedDurationDays === 0 && parsedDurationHours === 0) {
        return res.status(400).json({ message: "Total durasi kompensasi (hari atau jam) harus lebih dari 0." });
    }

    let notificationConfig;
    try {
        // Asumsi konfigurasi notifikasi ada di cron.json
        notificationConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './database/cron.json'), 'utf8'));
    } catch (e) {
        console.error("[KOMPENSASI_APPLY_ERROR] Gagal membaca konfigurasi (cron.json) untuk notifikasi:", e);
        notificationConfig = { // Default jika gagal baca
            status_message_compensation_applied_user: false,
            message_compensation_applied_user: "",
            date_locale_for_notification: "id-ID",
            date_options_for_notification: { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        };
    }

    const processedBy = req.user.username || req.user.id;
    const overallResults = [];
    let anyOperationFailedCritically = false;

    for (const userId of customerIds) {
        const user = global.users.find(u => u.id.toString() === userId.toString());
        
        let userResult = { 
            userId, 
            pppoeUsername: user ? (user.pppoe_username || 'N/A') : 'N/A', 
            status: 'pending',
            details: []
        };

        if (!user) {
            userResult.status = 'error_critical';
            userResult.details.push(`Pelanggan dengan ID ${userId} tidak ditemukan.`);
            anyOperationFailedCritically = true;
            overallResults.push(userResult);
            continue;
        }
        userResult.pppoeUsername = user.pppoe_username || 'N/A';

        if (!user.pppoe_username) {
            userResult.status = 'error_critical';
            userResult.details.push(`Pelanggan ${user.name} (ID: ${userId}) tidak memiliki username PPPoE.`);
            anyOperationFailedCritically = true;
            overallResults.push(userResult);
            continue;
        }

        // --- PERUBAHAN LOGIKA PENGAMBILAN ORIGINAL PROFILE ---
        const userPackageName = user.subscription;
        if (!userPackageName) {
            userResult.status = 'error_critical';
            userResult.details.push(`Pelanggan ${user.name} tidak memiliki paket langganan (user.subscription) yang terdefinisi.`);
            anyOperationFailedCritically = true;
            console.warn(`[KOMPENSASI_WARN] Pelanggan ${user.name} (ID: ${userId}) tidak memiliki 'subscription'.`);
            overallResults.push(userResult);
            continue;
        }

        const subscribedPackage = global.packages.find(pkg => pkg.name === userPackageName);
        if (!subscribedPackage || !subscribedPackage.profile) {
            userResult.status = 'error_critical';
            userResult.details.push(`Paket langganan '${userPackageName}' untuk pelanggan ${user.name} tidak ditemukan di packages.json atau tidak memiliki properti 'profile' (nama profil Mikrotik).`);
            anyOperationFailedCritically = true;
            console.warn(`[KOMPENSASI_WARN] Paket '${userPackageName}' untuk ${user.name} tidak ditemukan atau tidak ada 'profile' di packages.json.`);
            overallResults.push(userResult);
            continue;
        }
        const originalProfile = subscribedPackage.profile;
        console.log(`[KOMPENSASI_INFO] Pelanggan ${user.name}, Langganan: ${userPackageName}, Profil Asli dari Paket: ${originalProfile}`);
        // --- AKHIR PERUBAHAN LOGIKA PENGAMBILAN ORIGINAL PROFILE ---
        
        const existingActiveCompensation = global.compensations.find(comp => comp.userId === userId.toString() && comp.status === 'active');
        if (existingActiveCompensation) {
            userResult.status = 'error_critical'; 
            userResult.details.push(`Pelanggan ${user.name} sudah memiliki kompensasi aktif. Selesaikan atau tunggu hingga berakhir.`);
            anyOperationFailedCritically = true; 
            console.warn(`[KOMPENSASI_WARN] Pelanggan ${user.name} (ID: ${userId}) sudah memiliki kompensasi aktif.`);
            overallResults.push(userResult);
            continue;
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        if (parsedDurationDays > 0) {
            endDate.setDate(startDate.getDate() + parsedDurationDays);
        }
        if (parsedDurationHours > 0) {
            endDate.setHours(startDate.getHours() + parsedDurationHours);
        }

        const newCompensationId = `comp_${Date.now()}_${userId}`;
        const compensationEntry = {
            id: newCompensationId,
            userId: userId.toString(),
            pppoeUsername: user.pppoe_username,
            originalProfile: originalProfile,
            compensatedProfile: speedProfile,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            durationDays: parsedDurationDays,
            durationHours: parsedDurationHours,
            notes: notes || "",
            status: "pending_apply",
            processedBy,
            createdAt: new Date().toISOString()
        };

        try {
            console.log(`[KOMPENSASI_APPLY] [User: ${user.name}] Mencoba mengubah profil PPPoE dari ${originalProfile} ke ${speedProfile}`);
            await updatePPPoEProfile(user.pppoe_username, speedProfile);
            userResult.details.push(`Profil PPPoE berhasil diubah ke ${speedProfile}.`);
            console.log(`[KOMPENSASI_APPLY] [User: ${user.name}] Profil PPPoE berhasil diubah.`);

            compensationEntry.status = "active"; 
            
            try {
                console.log(`[KOMPENSASI_APPLY] [User: ${user.name}] Mencoba menghapus sesi aktif PPPoE.`);
                await deleteActivePPPoEUser(user.pppoe_username);
                userResult.details.push(`Sesi aktif PPPoE berhasil dihapus.`);
                console.log(`[KOMPENSASI_APPLY] [User: ${user.name}] Sesi aktif PPPoE berhasil dihapus.`);
            } catch (disconnectError) {
                const errMsg = `Gagal menghapus sesi aktif PPPoE: ${disconnectError.message || disconnectError}`;
                console.warn(`[KOMPENSASI_APPLY_WARN] [User: ${user.name}] ${errMsg}`);
                userResult.details.push(`Warning: ${errMsg}`);
                if (userResult.status !== 'error_critical') userResult.status = 'warning_partial';
            }

            if (user.device_id) {
                try {
                    console.log(`[KOMPENSASI_APPLY] [User: ${user.name}] Mencoba me-reboot router (ID: ${user.device_id}).`);
                    await rebootRouter(user.device_id);
                    userResult.details.push(`Perintah reboot untuk router ${user.device_id} berhasil dikirim.`);
                    console.log(`[KOMPENSASI_APPLY] [User: ${user.name}] Perintah reboot berhasil dikirim.`);
                } catch (rebootError) {
                    const errMsg = `Gagal me-reboot router ${user.device_id}: ${rebootError.message || rebootError}`;
                    console.warn(`[KOMPENSASI_APPLY_WARN] [User: ${user.name}] ${errMsg}`);
                    userResult.details.push(`Warning: ${errMsg}`);
                    if (userResult.status !== 'error_critical') userResult.status = 'warning_partial';
                }
            } else {
                userResult.details.push(`Reboot router dilewati (tidak ada Device ID).`);
                console.log(`[KOMPENSASI_APPLY] [User: ${user.name}] Tidak ada Device ID, reboot router dilewati.`);
            }
            
            global.compensations.push(compensationEntry); // Simpan kompensasi HANYA jika update profil utama berhasil
            if (userResult.status === 'pending') userResult.status = 'success'; 
            
            // --- AWAL BLOK NOTIFIKASI SAAT KOMPENSASI DITERAPKAN ---
            console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] Memulai pengecekan untuk mengirim notifikasi penerapan.`);
            console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] Config notif: status_active=${notificationConfig.status_message_compensation_applied_user}, message_template_exists=${!!notificationConfig.message_compensation_applied_user}, conn_active=${!!conn}`);

            if (notificationConfig.status_message_compensation_applied_user === true &&
                notificationConfig.message_compensation_applied_user &&
                conn) {
                
                console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] Kondisi pengiriman notifikasi penerapan TERPENUHI.`);
                if (user.phone_number && user.phone_number.trim() !== "") {
                    console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] Nomor telepon mentah: '${user.phone_number}'`);
                    
                    let durasiLengkapStr = "";
                    if (parsedDurationDays > 0) {
                        durasiLengkapStr += `${parsedDurationDays} hari`;
                    }
                    if (parsedDurationHours > 0) {
                        if (parsedDurationDays > 0) durasiLengkapStr += " ";
                        durasiLengkapStr += `${parsedDurationHours} jam`;
                    }
                    if (durasiLengkapStr === "") durasiLengkapStr = "Durasi tidak valid";

                    const locale = notificationConfig.date_locale_for_notification || 'id-ID';
                    const dateOptions = notificationConfig.date_options_for_notification || 
                        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };

                    const dataPesan = {
                        name: user.name,
                        profileBaru: global.packages.find(p => p.profile === speedProfile)?.name || speedProfile,
                        durasiLengkap: durasiLengkapStr,
                        tanggalAkhir: endDate.toLocaleDateString(locale, dateOptions)
                    };
                    console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] Data untuk pesan: ${JSON.stringify(dataPesan)}`);

                    const phoneNumbers = user.phone_number.split('|');
                    for (let number of phoneNumbers) {
                        if (!number || number.trim() === "") { console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] Nomor kosong dilewati.`); continue; }
                        let normalizedNumber = number.trim();
                        if (normalizedNumber.startsWith("0")) {
                            normalizedNumber = "62" + normalizedNumber.substring(1);
                        }
                        if (!normalizedNumber.endsWith("@s.whatsapp.net")) {
                            normalizedNumber += "@s.whatsapp.net";
                        }
                        console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] Normalisasi nomor: ${number} -> ${normalizedNumber}`);
                        
                        if (normalizedNumber.length > 8) {
                            try {
                                const teksPesan = replacer(notificationConfig.message_compensation_applied_user, dataPesan);
                                console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] MENGIRIM PESAN penerapan ke: ${normalizedNumber} dengan teks: "${teksPesan}"`);
                                await delay(1000);
                                await conn.sendMessage(normalizedNumber, { text: teksPesan });
                                const successMsg = `Notifikasi penerapan kompensasi BERHASIL dikirim ke ${normalizedNumber}.`;
                                console.log(`[KOMPENSASI_APPLY_NOTIF] [User: ${user.name}] ${successMsg}`);
                                userResult.details.push(successMsg);
                                if (typeof delay === 'function') await delay(1000);
                            } catch (msgError) {
                                const errMsg = `GAGAL mengirim notifikasi penerapan ke ${normalizedNumber}: ${msgError.message}`;
                                console.error(`[KOMPENSASI_APPLY_NOTIF_ERROR] [User: ${user.name}] ${errMsg}`, msgError.stack);
                                userResult.details.push(`Warning: ${errMsg}`);
                                if (userResult.status !== 'error_critical') userResult.status = 'warning_partial';
                            }
                        } else {
                            const warnMsg = `Nomor ${normalizedNumber} tidak valid (terlalu pendek) untuk user ${user.name}. Pesan penerapan tidak dikirim ke nomor ini.`;
                            console.warn(`[KOMPENSASI_APPLY_NOTIF_WARN] [User: ${user.name}] ${warnMsg}`);
                            userResult.details.push(`Warning: ${warnMsg}`);
                            if (userResult.status !== 'error_critical') userResult.status = 'warning_partial';
                        }
                    }
                } else { 
                    const warnMsg = `User ${user.name} tidak memiliki nomor telepon. Pesan penerapan kompensasi tidak dikirim.`;
                    console.warn(`[KOMPENSASI_APPLY_NOTIF_WARN] [User: ${user.name}] ${warnMsg}`);
                    userResult.details.push(`Warning: ${warnMsg}`);
                    if (userResult.status !== 'error_critical') userResult.status = 'warning_partial';
                }
            } else { 
                const logMsg = `Kondisi pengiriman notifikasi penerapan TIDAK TERPENUHI. Rincian: status_active=${notificationConfig.status_message_compensation_applied_user}, message_template_exists=${!!notificationConfig.message_compensation_applied_user}, conn_active=${!!conn}`;
                console.log(`[KOMPENSASI_APPLY_NOTIF_DEBUG] [User: ${user.name}] ${logMsg}`);
                if (notificationConfig.status_message_compensation_applied_user === true && !notificationConfig.message_compensation_applied_user) {
                    const warnMsg = "Fitur notifikasi penerapan aktif tapi template pesan kosong di konfigurasi.";
                    console.warn(`[KOMPENSASI_APPLY_NOTIF_WARN] [User: ${user.name}] ${warnMsg}`);
                    userResult.details.push(`Warning: ${warnMsg}`);
                    if (userResult.status !== 'error_critical') userResult.status = 'warning_partial';
                } else if (notificationConfig.status_message_compensation_applied_user === true && !conn) {
                    const warnMsg = "Fitur notifikasi penerapan aktif tapi koneksi WhatsApp tidak tersedia.";
                    console.warn(`[KOMPENSASI_APPLY_NOTIF_WARN] [User: ${user.name}] ${warnMsg}`);
                    userResult.details.push(`Warning: ${warnMsg}`);
                    if (userResult.status !== 'error_critical') userResult.status = 'warning_partial';
                }
            }
            // --- AKHIR BLOK NOTIFIKASI SAAT KOMPENSASI DITERAPKAN ---

        } catch (mikrotikError) { // Error utama dari updatePPPoEProfile
            const errMsg = `Gagal mengubah profil Mikrotik: ${mikrotikError.message || mikrotikError}`;
            console.error(`[KOMPENSASI_APPLY_ERROR] [User: ${user.name}] ${errMsg}`);
            
            // JANGAN push compensationEntry ke global.compensations jika update profil utama gagal
            // console.log("[KOMPENSASI_APPLY_DEBUG] compensationEntry yang gagal (error_apply) dan TIDAK disimpan:", compensationEntry);
            
            userResult.status = 'error_critical';
            userResult.details.push(errMsg);
            anyOperationFailedCritically = true;
        }
        overallResults.push(userResult);
    } // Akhir loop for (const userId of customerIds)

    saveCompensations(); // Simpan array global.compensations (hanya berisi entri yang berhasil)

    const allSucceeded = overallResults.every(r => r.status === 'success' && r.details.every(d => !d.toLowerCase().includes('gagal') && !d.toLowerCase().includes('warning')));
    const someSucceededOrPartial = overallResults.some(r => r.status === 'success' || r.status === 'warning_partial');

    if (allSucceeded && overallResults.length > 0) {
        return res.status(200).json({ message: "Semua kompensasi berhasil diproses sepenuhnya.", details: overallResults });
    } else if (someSucceededOrPartial && overallResults.length > 0) {
        return res.status(207).json({ message: "Beberapa operasi kompensasi mungkin menghasilkan warning atau ada yang gagal.", details: overallResults });
    } else if (overallResults.length > 0) { 
         return res.status(400).json({ message: "Semua operasi kompensasi gagal atau ada masalah validasi.", details: overallResults });
    } else { 
        return res.status(400).json({ message: "Tidak ada pelanggan yang diproses atau customerIds kosong.", details: overallResults });
    }
});
// --- AKHIR KODE LENGKAP ENDPOINT /api/compensation/apply ---

app.post('/callback/payment', async (req, res) => {
    const { reference_id, status_code } = req.body;
    try {
        const pay = payment.find(val => val.reffId == reference_id);
        if (!pay) throw !1;
        if (status_code == '1') {
            let isDone = checkStatusPayment(reference_id);
            if (isDone) throw !0;
            if (pay.tag == 'buynow') {
                const prof = checkprofvc(`${pay.amount}`);
                const durasivc = checkdurasivc(prof);
                const hargavc = checkhargavc(prof);
                // console.log(pay)
                // console.log({ prof, durasivc, hargavc, sender: pay.sender })
                await getvoucher(prof, pay.sender).then(async res => {
                    updateKetPayment(reference_id, `Voucher: ${res}`);
                    updateStatusPayment(reference_id, true);
                    if (pay.sender != "buynow" && conn) {
                        await conn.sendMessage(pay.sender, { text: `\n=============================\nPaket                    : *${durasivc}*\nHarga                    : *${convertRupiah.convert(hargavc)}*\nKode Voucher     : *${res}*\n=============================\nStatus Transaksi : *Berhasil*\n=============================\n_Terima Kasih Atas Pembelian Anda_` });
                    }
                    throw !0;
                })
                .catch(async err => {
                    console.log(err)
                    if (typeof err === "string") {
                        if (pay.sender != "buynow" && conn) {
                            updateStatusPayment(reference_id, true);
                            await conn.sendMessage(pay.sender, { text: err });
                            throw !0;
                        }
                    } else throw !1;
                })
            } else if (pay.tag == 'buynowweb') {
                const prof = checkprofvc(String(pay.amount));
                await getvoucher(prof, pay.sender).then(async res => {
                    updateKetPayment(reference_id, `${res}`);
                    updateStatusPayment(reference_id, true);
                    throw !0;
                })
                .catch(async err => {
                    console.log(err)
                    if (typeof err === "string") {
                        updateKetPayment(reference_id, `${err}`);
                        updateStatusPayment(reference_id, true);
                        throw !0;
                    } else throw !1;
                })
            } else if (pay.tag == 'topup') {
                const checkATM = checkATMuser(pay.sender)
                if (checkATM == undefined) addATM(pay.sender)
                addKoinUser(pay.sender, pay.amount)
                updateStatusPayment(reference_id, true);
                console.log("Trigger Last")
                if (conn) await conn.sendMessage(pay.sender, { text: `Topup saldo masuk!\n- Terbaca: ${convertRupiah.convert(pay.amount)}\n- Total saldo: ${convertRupiah.convert(checkATMuser(pay.sender))}` });
                throw !0;
            }
        }
    } catch(err) {
        res.status(err ? 200 : 500).json({ status: err })
    }
})

app.post('/api/:category/:id?', async (req, res) => {
    const { category, id } = req.params;
    try {
        switch (category) {
            case "ssid":
                try {
                    const { transmit_power } = req.body;
                    const deviceId = id; // Menggunakan 'id' dari req.params sebagai deviceId

                    if (!deviceId) {
                        console.error("[API_SSID_UPDATE_ERROR] Device ID tidak ada dalam parameter request.");
                        return res.status(400).json({ status: 400, message: "Device ID diperlukan." });
                    }

                    // Filter hanya key yang relevan dan memiliki value
                    const ssidUpdates = Object.keys(req.body)
                        .filter(key => key.startsWith("ssid_") && !key.startsWith("ssid_password_") && req.body[key] && req.body[key].trim() !== "")
                        .map(key => ({
                            path: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${key.replace("ssid_", "")}.SSID`,
                            value: req.body[key].trim(),
                            type: "xsd:string"
                        }));

                    const passwordUpdates = Object.keys(req.body)
                        .filter(key => key.startsWith("ssid_password_") && req.body[key] && req.body[key].trim() !== "") // Password boleh kosong jika tidak ingin diubah, tapi jika dikirim harus ada isinya
                        .map(key => ({
                            path: `InternetGatewayDevice.LANDevice.1.WLANConfiguration.${key.replace("ssid_password_", "")}.PreSharedKey.1.PreSharedKey`,
                            value: req.body[key].trim(), // Password dikirim jika diisi
                            type: "xsd:string"
                        }));
                    
                    const parameterValues = [];
                    if (transmit_power && transmit_power.trim() !== "") {
                        parameterValues.push(["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.TransmitPower", transmit_power.trim(), "xsd:string"]);
                    }
                    ssidUpdates.forEach(item => parameterValues.push([item.path, item.value, item.type]));
                    passwordUpdates.forEach(item => parameterValues.push([item.path, item.value, item.type]));


                    if (parameterValues.length === 0) {
                        console.log(`[API_SSID_UPDATE_INFO] Tidak ada parameter SSID, password, atau transmit power yang valid untuk diubah pada device: ${deviceId}`);
                        return res.status(400).json({ status: 400, message: "Tidak ada data valid yang dikirim untuk pembaruan SSID." });
                    }
                    
                    // Pastikan global.config dan genieacsBaseUrl ada
                    if (!global.config || !global.config.genieacsBaseUrl) {
                        console.error("[API_SSID_UPDATE_ERROR] Konfigurasi genieacsBaseUrl tidak ditemukan.");
                        return res.status(500).json({ status: 500, message: "Konfigurasi server GenieACS tidak lengkap." });
                    }
                    
                    console.log(`[API_SSID_UPDATE] Mengirim tugas ke GenieACS untuk device: ${deviceId} dengan parameter:`, JSON.stringify(parameterValues));
                    
                    // Panggilan ke GenieACS
                    await axios.post(`${global.config.genieacsBaseUrl}/devices/${deviceId}/tasks?connection_request`, {
                        name: 'setParameterValues',
                        parameterValues: parameterValues
                    }, { timeout: 20000 }); // Timeout ditingkatkan menjadi 20 detik

                    console.log(`[API_SSID_UPDATE] Perintah pembaruan SSID berhasil dikirim untuk perangkat: ${deviceId}`);
                    // **PENTING: Kirim respons JSON, bukan redirect**
                    return res.json({ status: 200, message: "Perintah pembaruan SSID berhasil dikirim ke perangkat." });

                } catch (axiosError) {
                    console.error(`[API_SSID_UPDATE_ERROR] Gagal saat update SSID untuk perangkat ${id}:`, axiosError);
                    let errorMessage = "Gagal mengirim perintah pembaruan SSID ke perangkat.";
                    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
                        errorMessage = "Koneksi ke server perangkat timeout. Perangkat mungkin offline atau tidak merespons dalam waktu yang ditentukan.";
                    } else if (axiosError.response) {
                        console.error('[AXIOS_ERROR_DATA]', axiosError.response.data);
                        console.error('[AXIOS_ERROR_STATUS]', axiosError.response.status);
                        errorMessage = `Error dari server perangkat: ${axiosError.response.status}.`;
                        // Coba ekstrak pesan error yang lebih spesifik jika ada
                        if (axiosError.response.data && typeof axiosError.response.data === 'string') {
                           errorMessage += ` Detail: ${axiosError.response.data.substring(0,150)}`; 
                        } else if (axiosError.response.data && axiosError.response.data.fault && axiosError.response.data.fault.faultString) {
                           errorMessage += ` Detail: ${axiosError.response.data.fault.faultString}`;
                        } else if (axiosError.response.data && axiosError.response.data.message) {
                           errorMessage += ` Detail: ${axiosError.response.data.message}`;
                        }
                    }
                    // **PENTING: Kirim respons JSON error**
                    return res.status(500).json({ status: 500, message: errorMessage });
                }
            break;
            case 'otp':
                if (!req.body.phoneNumber) return res.status(400).json({ message: "Nomor telepon diperlukan" });
                if (!conn) return res.status(500).json({ message: "Bot is offline" });

                const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate random 6-digit OTP
                const findUser = users.find(v => v.phone_number.split('|').includes(req.body.phoneNumber));
                if (!findUser) return res.status(404).json({ message: "User tidak ditemukan" });

                findUser.otp = otp; // Save OTP to user data
                saveUser(); // Save updated user data

                await conn.sendMessage(req.body.phoneNumber + "@s.whatsapp.net", {
                    text: `Kode OTP Anda: ${otp}`
                });
                return res.json({ message: "OTP berhasil dikirim" });
            break;
            case 'otpverify':
                if (!req.body.phoneNumber) return res.status(400).json({ message: "Nomor telepon diperlukan" });
                if (!req.body.otp) return res.status(400).json({ message: "OTP diperlukan" });

                const isCorrect = users.find(v => v.phone_number.split('|').includes(req.body.phoneNumber) && v.otp === req.body.otp);

                if (isCorrect) {
                    isCorrect.otp = ''
                    saveUser();
                    return res.json({ message: "OTP berhasil diverifikasi", user: {
                        deviceId: isCorrect.device_id,
                    } });
                } else {
                    return res.status(400).json({ message: "OTP tidak valid" });
                }
            break;
            case 'login':
                const account = accounts.find(v => v.username == req.body.username && v.password == req.body.password);
                if(!account) return res.redirect('/login');
                const token = jwt.sign({ id: account.id, username: account.username, role: account.role }, config.jwt, { expiresIn: '7d'});
                res.cookie("token", token, {
                    httpOnly: true,
                    maxAge: 6.048e+8
                });
                if(account.role == "teknisi") return res.redirect("/pembayaran/teknisi")
            break
            case 'broadcast':
                if (!conn) return res.json({
                    status: 500,
                    message: "the server is not connected to WhatsApp"
                });
                if(req.body?.all == "on"){
                    broadcast(req.body.text)
                }else{
                    const numbers = req.body.users.map(v => {
                        return users.find(u => u.id == v).phone_number.split('|').filter(v => !v.startsWith("0"))
                    })
                    broadcast(req.body.text, numbers)
                }
            break
            case "cron":
                const rawCronData = req.body;
                // Validasi jadwal cron terlebih dahulu
                if (
                    (rawCronData.unpaid_schedule && !isValidCron(rawCronData.unpaid_schedule)) ||
                    (rawCronData.schedule && !isValidCron(rawCronData.schedule)) ||
                    (rawCronData.schedule_unpaid_action && !isValidCron(rawCronData.schedule_unpaid_action)) ||
                    (rawCronData.schedule_isolir_notification && !isValidCron(rawCronData.schedule_isolir_notification))
                ) {
                    return res.status(400).json({ message: "Format jadwal cron tidak valid." });
                }

                // Fungsi untuk konversi ke boolean yang lebih fleksibel
                const convertToBoolean = (value) => {
                    if (typeof value === 'string') {
                        const lowerValue = value.toLowerCase();
                        return lowerValue === 'true' || lowerValue === 'on' || lowerValue === '1';
                    }
                    // Mengatasi jika frontend mengirim boolean sejati atau angka 1
                    return value === true || value === 1;
                };

                const statusUnpaidScheduleBool = convertToBoolean(rawCronData.status_unpaid_schedule);
                const statusScheduleBool = convertToBoolean(rawCronData.status_schedule);
                const statusMessagePaidNotificationBool = convertToBoolean(rawCronData.status_message_paid_notification);
                const statusScheduleUnpaidActionBool = convertToBoolean(rawCronData.status_schedule_unpaid_action);
                const statusMessageIsolirNotificationBool = convertToBoolean(rawCronData.status_message_isolir_notification);

                // Update global.cronConfig dengan nilai yang sudah diproses
                // Ambil nilai yang ada jika tidak disediakan di req.body untuk properti non-status
                // atau jika nilai yang disediakan adalah undefined (untuk menghindari penyimpanan "undefined" sebagai string)
                global.cronConfig = {
                    unpaid_schedule: rawCronData.unpaid_schedule !== undefined ? rawCronData.unpaid_schedule : global.cronConfig.unpaid_schedule,
                    status_unpaid_schedule: statusUnpaidScheduleBool,
                    schedule: rawCronData.schedule !== undefined ? rawCronData.schedule : global.cronConfig.schedule,
                    message: rawCronData.message !== undefined ? rawCronData.message : global.cronConfig.message,
                    status_schedule: statusScheduleBool,
                    message_paid_notification: rawCronData.message_paid_notification !== undefined ? rawCronData.message_paid_notification : global.cronConfig.message_paid_notification,
                    status_message_paid_notification: statusMessagePaidNotificationBool, // Menggunakan hasil konversi
                    schedule_unpaid_action: rawCronData.schedule_unpaid_action !== undefined ? rawCronData.schedule_unpaid_action : global.cronConfig.schedule_unpaid_action,
                    status_schedule_unpaid_action: statusScheduleUnpaidActionBool,
                    schedule_isolir_notification: rawCronData.schedule_isolir_notification !== undefined ? rawCronData.schedule_isolir_notification : global.cronConfig.schedule_isolir_notification,
                    message_isolir_notification: rawCronData.message_isolir_notification !== undefined ? rawCronData.message_isolir_notification : global.cronConfig.message_isolir_notification,
                    status_message_isolir_notification: statusMessageIsolirNotificationBool,
                    isolir_profile: rawCronData.isolir_profile !== undefined ? rawCronData.isolir_profile : global.cronConfig.isolir_profile,
                    allow_paid_update_day: rawCronData.allow_paid_update_day !== undefined ? rawCronData.allow_paid_update_day : global.cronConfig.allow_paid_update_day,
                };
    
                fs.writeFileSync('./database/cron.json', JSON.stringify(global.cronConfig, null, 2));
                initializeCronTasks(); // Panggil fungsi baru setelah memperbarui konfigurasi
                
                // Log kritis untuk verifikasi
                console.log("Cron configuration updated and re-initialized. Status paid notification (dari global.cronConfig):", global.cronConfig.status_message_paid_notification); 
                
                return res.json({ message: "Konfigurasi berhasil diperbarui." });
            break;
            case 'config':
                const beforeUpdate = config;
                config = {
                   ...config,
                   genieacsBaseUrl: req.body.genieacsBaseUrl,
                   accessLimit: parseInt(req.body.accessLimit),
                   check_schedule: req.body.check_schedule,
                   rx_tolerance: req.body.rx_tolerance,
                   ipaymuSecret: req.body.ipaymuSecret,
                   ipaymuVA: req.body.ipaymuVA,
                   ipaymuCallback: req.body.ipaymuCallback,
                   ipaymuProduction: req.body.ipaymuProduction == "yes" ? true : req.body.ipaymuProduction == "no" ? false : false,
                };
                fs.writeFileSync('./config.json', JSON.stringify(config));
                if(beforeUpdate.check_schedule != req.body.check_schedule && !!checkTask){
                    checkTask.stop();
                    startCheck();
                }
            break
            case 'users':
                // Validasi input dasar
                if (!req.body.name || !req.body.subscription) {
                    return res.status(400).json({ status: 400, message: "Nama dan Paket Langganan wajib diisi." });
                }
                const latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
                const longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;
                if ((req.body.latitude && req.body.latitude.toString().trim() !== '' && isNaN(latitude)) || 
                    (req.body.longitude && req.body.longitude.toString().trim() !== '' && isNaN(longitude))) {
                    return res.status(400).json({ status: 400, message: "Format latitude atau longitude tidak valid." });
                }
                
                // Ambil connected_odp_id dari request body
                const connected_odp_id = req.body.connected_odp_id || null;
                let networkAssets = loadNetworkAssets(); // Muat aset jaringan untuk update ODP

                if (id) { // Mode Edit User
                    const userIndex = global.users.findIndex(v => String(v.id) === String(id));
                    if (userIndex === -1) {
                        return res.status(404).json({ status: 404, message: "Pengguna tidak ditemukan." });
                    }

                    const userToUpdate = global.users[userIndex];
                    const previousPaidStatus = userToUpdate.paid;
                    const oldOdpId = userToUpdate.connected_odp_id; // ODP lama

                    // Update ODP port jika koneksi ODP berubah
                    if (oldOdpId !== connected_odp_id) {
                        if (oldOdpId) {
                            updateOdpPortUsage(oldOdpId, false, networkAssets);
                        }
                        if (connected_odp_id) {
                            updateOdpPortUsage(connected_odp_id, true, networkAssets);
                        }
                    }
                    
                    userToUpdate.name = req.body.name;
                    userToUpdate.phone_number = req.body.phone_number || ""; 
                    userToUpdate.device_id = req.body.device_id || "";
                    userToUpdate.address = req.body.address || "";
                    userToUpdate.latitude = latitude;
                    userToUpdate.longitude = longitude;
                    userToUpdate.subscription = req.body.subscription;
                    userToUpdate.paid = req.body.paid === true || String(req.body.paid).toLowerCase() === 'true';
                    userToUpdate.pppoe_username = req.body.pppoe_username || "";
                    userToUpdate.pppoe_password = req.body.pppoe_password || "";
                    userToUpdate.pppoe_profile = req.body.pppoe_profile || "";
                    userToUpdate.bulk = req.body.bulk || [];
                    userToUpdate.connected_odp_id = connected_odp_id; // Simpan ODP ID baru

                    global.users[userIndex] = userToUpdate;
                    saveUser();
                    saveNetworkAssets(networkAssets); // Simpan perubahan pada network_assets.json

                    // Logika notifikasi dan update router/PPPoE
                     if (userToUpdate.paid && !previousPaidStatus) {
                        console.log(`[USER_UPDATE_PAID_TRUE] Status paid untuk user ${userToUpdate.name} (ID: ${id}) diubah menjadi true.`);
                        const allowPaidUpdateDay = (global.cronConfig && typeof global.cronConfig.allow_paid_update_day !== 'undefined') ? parseInt(global.cronConfig.allow_paid_update_day) : 11;
                        const currentDay = new Date().getDate();
                        const profile = getProfileBySubscription(userToUpdate.subscription);

                        if (currentDay >= allowPaidUpdateDay) {
                            console.log(`[USER_UPDATE_PAID_TRUE] Menjalankan update router/PPPoE untuk ${userToUpdate.name}.`);
                            try {
                                if (userToUpdate.device_id) await rebootRouter(userToUpdate.device_id);
                                if (userToUpdate.pppoe_username && profile) await updatePPPoEProfile(userToUpdate.pppoe_username, profile);
                                if (userToUpdate.pppoe_username) await deleteActivePPPoEUser(userToUpdate.pppoe_username);
                            } catch (e) {
                                console.error(`[USER_UPDATE_PAID_TRUE_ERROR] Gagal update router/PPPoE untuk ${userToUpdate.name}:`, e);
                            }
                        } else {
                            console.log(`[USER_UPDATE_PAID_TRUE] Update router/PPPoE untuk ${userToUpdate.name} dilewati karena currentDay (${currentDay}) < allowPaidUpdateDay (${allowPaidUpdateDay}).`);
                        }

                        // Kirim Notifikasi "Sudah Bayar"
                        if (conn && global.cronConfig && global.cronConfig.status_message_paid_notification === true && global.cronConfig.message_paid_notification && userToUpdate.phone_number) {
                            console.log(`[PAID_NOTIFICATION] Attempting to send 'Sudah Bayar' notification to ${userToUpdate.name} (ID: ${userToUpdate.id})`);
                            const dataForMsg = generateDataMsg(userToUpdate);
                            const messageText = replacer(global.cronConfig.message_paid_notification, dataForMsg);
                            const phoneNumbers = userToUpdate.phone_number.split("|");

                            for (let number of phoneNumbers) {
                                if (!number || number.trim() === "") continue;
                                let normalizedNumber = number.trim();
                                if (normalizedNumber.startsWith("0")) {
                                    normalizedNumber = "62" + normalizedNumber.substring(1);
                                }
                                if (!normalizedNumber.endsWith("@s.whatsapp.net")) {
                                    normalizedNumber += "@s.whatsapp.net";
                                }

                                if (normalizedNumber.length > 8) { // Basic validation
                                    try {
                                        await delay(1000); // Delay before sending
                                        await conn.sendMessage(normalizedNumber, { text: messageText });
                                        console.log(`[PAID_NOTIFICATION] 'Sudah Bayar' notification sent to ${normalizedNumber} for user ${userToUpdate.name}.`);
                                    } catch (waError) {
                                        console.error(`[PAID_NOTIFICATION_ERROR] Failed to send 'Sudah Bayar' notification to ${normalizedNumber} for user ${userToUpdate.name}:`, waError.message);
                                    }
                                } else {
                                    console.warn(`[PAID_NOTIFICATION_WARN] Invalid phone number for 'Sudah Bayar' notification: ${normalizedNumber} for user ${userToUpdate.name}`);
                                }
                            }
                        } else {
                            if (!conn) console.warn(`[PAID_NOTIFICATION_SKIP_EDIT] WhatsApp connection not available. User: ${userToUpdate.name}`);
                            if (!(global.cronConfig && global.cronConfig.status_message_paid_notification === true)) console.warn(`[PAID_NOTIFICATION_SKIP_EDIT] 'Sudah Bayar' notification is disabled in cron_config. User: ${userToUpdate.name}`);
                            if (!(global.cronConfig && global.cronConfig.message_paid_notification)) console.warn(`[PAID_NOTIFICATION_SKIP_EDIT] 'Sudah Bayar' notification message is empty in cron_config. User: ${userToUpdate.name}`);
                            if (!userToUpdate.phone_number) console.warn(`[PAID_NOTIFICATION_SKIP_EDIT] User ${userToUpdate.name} has no phone number.`);
                        }
                    }
                    return res.status(200).json({ status: 200, message: "Data pengguna berhasil diperbarui", data: userToUpdate });

                } else { // Mode Tambah User Baru
                    const newId = (global.users.length > 0 && global.users[global.users.length - 1].id ? parseInt(global.users[global.users.length - 1].id) : 0) + 1;
                    const newUser = {
                        id: newId,
                        name: req.body.name,
                        phone_number: req.body.phone_number || "",
                        device_id: req.body.device_id || "",
                        address: req.body.address || "",
                        latitude: latitude,
                        longitude: longitude,
                        subscription: req.body.subscription,
                        paid: req.body.paid === true || String(req.body.paid).toLowerCase() === 'true',
                        pppoe_username: req.body.pppoe_username || "",
                        pppoe_password: req.body.pppoe_password || "",
                        pppoe_profile: req.body.pppoe_profile || "",
                        bulk: req.body.bulk || [],
                        connected_odp_id: connected_odp_id // Simpan ODP ID
                    };
                    global.users.push(newUser);
                    saveUser();

                    if (connected_odp_id) { // Update port ODP jika terhubung
                        updateOdpPortUsage(connected_odp_id, true, networkAssets);
                        saveNetworkAssets(networkAssets);
                    }

                    // Kirim Notifikasi "Sudah Bayar" jika pengguna baru langsung ditandai lunas
                    if (newUser.paid) {
                        console.log(`[NEW_USER_PAID] New user ${newUser.name} (ID: ${newUser.id}) created with paid status true.`);
                        if (conn && global.cronConfig && global.cronConfig.status_message_paid_notification === true && global.cronConfig.message_paid_notification && newUser.phone_number) {
                            console.log(`[PAID_NOTIFICATION] Attempting to send 'Sudah Bayar' notification to new user ${newUser.name} (ID: ${newUser.id})`);
                            const dataForMsg = generateDataMsg(newUser);
                            const messageText = replacer(global.cronConfig.message_paid_notification, dataForMsg);
                            const phoneNumbers = newUser.phone_number.split("|");

                            for (let number of phoneNumbers) {
                                if (!number || number.trim() === "") continue;
                                let normalizedNumber = number.trim();
                                if (normalizedNumber.startsWith("0")) {
                                    normalizedNumber = "62" + normalizedNumber.substring(1);
                                }
                                if (!normalizedNumber.endsWith("@s.whatsapp.net")) {
                                    normalizedNumber += "@s.whatsapp.net";
                                }

                                if (normalizedNumber.length > 8) {
                                    try {
                                        await delay(1000);
                                        await conn.sendMessage(normalizedNumber, { text: messageText });
                                        console.log(`[PAID_NOTIFICATION] 'Sudah Bayar' notification sent to ${normalizedNumber} for new user ${newUser.name}.`);
                                    } catch (waError) {
                                        console.error(`[PAID_NOTIFICATION_ERROR] Failed to send 'Sudah Bayar' notification to ${normalizedNumber} for new user ${newUser.name}:`, waError.message);
                                    }
                                } else {
                                    console.warn(`[PAID_NOTIFICATION_WARN] Invalid phone number for 'Sudah Bayar' notification: ${normalizedNumber} for new user ${newUser.name}`);
                                }
                            }
                        } else {
                            if (!conn) console.warn(`[PAID_NOTIFICATION_SKIP_CREATE] WhatsApp connection not available. User: ${newUser.name}`);
                            if (!(global.cronConfig && global.cronConfig.status_message_paid_notification === true)) console.warn(`[PAID_NOTIFICATION_SKIP_CREATE] 'Sudah Bayar' notification is disabled in cron_config. User: ${newUser.name}`);
                            if (!(global.cronConfig && global.cronConfig.message_paid_notification)) console.warn(`[PAID_NOTIFICATION_SKIP_CREATE] 'Sudah Bayar' notification message is empty in cron_config. User: ${newUser.name}`);
                            if (!newUser.phone_number) console.warn(`[PAID_NOTIFICATION_SKIP_CREATE] New user ${newUser.name} has no phone number.`);
                        }
                    }
                    return res.status(201).json({ status: 201, message: "Pengguna berhasil ditambahkan", data: newUser });
                }
                case "request-paid-change": { // Ketika Teknisi membuat pengajuan baru
                    const { userId, newStatus } = req.body; // newStatus adalah boolean
                    console.log(`[API_LOG] POST /api/request-paid-change: Pengajuan baru untuk userId: ${userId}, newStatus: ${newStatus}`);
    
                    let currentRequests = loadJSON('database/requests.json'); // Baca data requests terbaru
                    const userPelanggan = global.users.find(u => String(u.id) === String(userId));
    
                    if (!userPelanggan) {
                        console.warn(`[API_WARN] POST /api/request-paid-change: Pelanggan ID ${userId} tidak ditemukan.`);
                        return res.status(404).json({ message: 'User pelanggan tidak ditemukan.' });
                    }
                    if (!req.user || !req.user.id) { // req.user dari middleware otentikasi JWT
                        console.warn("[API_WARN] POST /api/request-paid-change: Teknisi tidak terautentikasi.");
                        return res.status(401).json({ message: 'Teknisi tidak terautentikasi.' });
                    }
    
                    const newId = (currentRequests.length > 0 && currentRequests[currentRequests.length -1].id ? currentRequests[currentRequests.length -1].id : 0) + 1;
    
                    const newRequest = {
                        id: newId,
                        userId: String(userId), // Konsistenkan tipe data
                        userName: userPelanggan.name, 
                        newStatus: newStatus, 
                        status: "pending",
                        created_at: new Date().toISOString(),
                        updated_at: null,
                        updated_by: null,
                        requested_by_teknisi_id: req.user.id // ID Teknisi yang login
                    };
    
                    currentRequests.push(newRequest);
                    saveJSON('database/requests.json', currentRequests); // Simpan array requests yang sudah diupdate ke file
                    
                    // Logika Notifikasi ke Owner Anda ...
                    if (conn && global.config.ownerNumber && Array.isArray(global.config.ownerNumber) && global.config.ownerNumber.length > 0) {
                        const statusText = newStatus ? "Sudah Bayar" : "Belum Bayar";
                        const messageToOwner = `🔔 *Notifikasi Permintaan Perubahan Status Pembayaran* 🔔\n\nAda permintaan baru untuk mengubah status pembayaran pelanggan:\n\n👤 *Nama Pelanggan:* ${userPelanggan.name}\n🆔 *ID Pelanggan:* ${userId}\n🔄 *Status Diajukan:* ${statusText}\n👨‍🔧 *Diajukan Oleh Teknisi:* ${req.user.username}\n⏰ *Waktu Request:* ${new Date(newRequest.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\nMohon untuk segera ditinjau dan di-approve/reject melalui dashboard.`;
                        for (const singleOwnerNum of global.config.ownerNumber) {
                            const ownerNumberJid = singleOwnerNum.endsWith('@s.whatsapp.net') ? singleOwnerNum : `${singleOwnerNum}@s.whatsapp.net`;
                            try { await conn.sendMessage(ownerNumberJid, { text: messageToOwner }); } catch (error) {console.error(`Gagal kirim notif ke owner ${ownerNumberJid}:`, error);}
                        }
                    }
                    
                    console.log(`[API_LOG] POST /api/request-paid-change: Pengajuan baru ID ${newRequest.id} berhasil dibuat.`);
                    return res.json({ message: 'Permintaan perubahan status berhasil diajukan.' });
                } // break tidak diperlukan karena ada return
            case "approve-paid-change": {
                const { requestId, approved } = req.body; // approved adalah boolean (true jika disetujui, false jika ditolak)
                console.log(`  [SUB_LOG] Action: approve-paid-change for requestId: ${requestId}, approved: ${approved}`);

                let allRequests = loadJSON('database/requests.json');
                const requestIndex = allRequests.findIndex(r => String(r.id) === String(requestId) && r.status === "pending");

                if (requestIndex === -1) {
                    console.warn(`  [SUB_WARN] Request ID ${requestId} tidak ditemukan atau status bukan 'pending'.`);
                    return res.status(404).json({ message: 'Permintaan tidak ditemukan atau sudah diproses.' });
                }
                
                let requestToUpdate = { ...allRequests[requestIndex] }; 

                requestToUpdate.status = approved ? "approved" : "rejected";
                requestToUpdate.updated_at = new Date().toISOString();
                requestToUpdate.updated_by = req.user ? req.user.id : null; 

                console.log(`  [SUB_LOG] Request ID ${requestId} status akan diubah menjadi ${requestToUpdate.status}`);

                let userPelangganDataForNotif = null; // Untuk notifikasi pelanggan

                if (approved) {
                    let currentUsers = loadJSON('database/users.json'); 
                    const userIndexToUpdate = currentUsers.findIndex(u => String(u.id) === String(requestToUpdate.userId));

                    if (userIndexToUpdate !== -1) {
                        // Hanya update status 'paid' jika permintaan adalah untuk mengubah menjadi 'Sudah Bayar'
                        // requestToUpdate.newStatus adalah boolean dari pengajuan teknisi (true jika 'Sudah Bayar')
                        if (requestToUpdate.newStatus === true) {
                             currentUsers[userIndexToUpdate].paid = true; 
                        } else if (requestToUpdate.newStatus === false) {
                             currentUsers[userIndexToUpdate].paid = false;
                        }
                        // Jika ada logika lain untuk newStatus yang bukan boolean, perlu penyesuaian
                        
                        saveJSON('database/users.json', currentUsers); 
                        global.users = currentUsers; 
                        userPelangganDataForNotif = currentUsers[userIndexToUpdate]; // Simpan data user untuk notif
                        
                        console.log(`  [SUB_LOG] Status 'paid' user ID: ${requestToUpdate.userId} diubah menjadi ${currentUsers[userIndexToUpdate].paid} berdasarkan pengajuan newStatus: ${requestToUpdate.newStatus}`);

                        const cronConfigData = global.cronConfig; 
                        const allowPaidUpdateDay = (cronConfigData && typeof cronConfigData.allow_paid_update_day !== 'undefined') ? parseInt(cronConfigData.allow_paid_update_day) : 11;
                        const currentDay = new Date().getDate();
                        const profile = getProfileBySubscription(userPelangganDataForNotif.subscription);

                        // Jalankan update router hanya jika status paid menjadi true dan tanggal memungkinkan
                        if (userPelangganDataForNotif.paid === true && currentDay >= allowPaidUpdateDay) {
                            console.log(`  [SUB_LOG] Memenuhi syarat untuk update router untuk ${userPelangganDataForNotif.name}`);
                            try {
                                if (userPelangganDataForNotif.device_id && typeof rebootRouter === 'function') await rebootRouter(userPelangganDataForNotif.device_id);
                                if (userPelangganDataForNotif.pppoe_username && profile && typeof updatePPPoEProfile === 'function') await updatePPPoEProfile(userPelangganDataForNotif.pppoe_username, profile);
                                if (userPelangganDataForNotif.pppoe_username && typeof deleteActivePPPoEUser === 'function') await deleteActivePPPoEUser(userPelangganDataForNotif.pppoe_username);
                            } catch (routerError) {
                                console.error(`  [SUB_ERROR] Error saat update router untuk ${userPelangganDataForNotif.name}:`, routerError);
                            }
                        }
                    } else {
                        console.warn(`  [SUB_WARN] User ID ${requestToUpdate.userId} tidak ditemukan di users.json untuk update status 'paid'.`);
                    }
                }
                
                allRequests[requestIndex] = requestToUpdate; 
                saveJSON('database/requests.json', allRequests); 
                
                // ---- AWAL BLOK NOTIFIKASI KE PELANGGAN SETELAH APPROVAL ----
                if (approved && requestToUpdate.newStatus === true && userPelangganDataForNotif) { // Hanya jika disetujui & status barunya adalah "Sudah Bayar"
                    if (conn && global.cronConfig.status_message_paid_notification === true && global.cronConfig.message_paid_notification) {
                        if (userPelangganDataForNotif.phone_number) {
                            const dataForMsg = generateDataMsg(userPelangganDataForNotif); // Fungsi Anda untuk membuat data placeholder
                            const messageText = replacer(global.cronConfig.message_paid_notification, dataForMsg); // Fungsi Anda untuk mengganti placeholder

                            const phoneNumbers = userPelangganDataForNotif.phone_number.split('|');
                            for (let number of phoneNumbers) {
                                if (!number || number.trim() === "") continue;
                                let normalizedNumber = number.trim();
                                if (normalizedNumber.startsWith("0")) {
                                    normalizedNumber = "62" + normalizedNumber.substring(1);
                                }
                                if (!normalizedNumber.endsWith("@s.whatsapp.net")) {
                                    normalizedNumber += "@s.whatsapp.net";
                                }

                                if (normalizedNumber.length > 8) {
                                    try {
                                        console.log(`  [CUSTOMER_PAY_NOTIF] Mengirim notifikasi 'Sudah Bayar' ke pelanggan ${userPelangganDataForNotif.name} di ${normalizedNumber}`);
                                        await delay(1000);
                                        await conn.sendMessage(normalizedNumber, { text: messageText });
                                        console.log(`  [CUSTOMER_PAY_NOTIF] Notifikasi 'Sudah Bayar' berhasil dikirim ke ${normalizedNumber}.`);
                                        if (typeof delay === 'function') await delay(1000); 
                                    } catch (waError) {
                                        console.error(`  [CUSTOMER_PAY_NOTIF_ERROR] Gagal mengirim notifikasi 'Sudah Bayar' ke ${normalizedNumber}:`, waError);
                                    }
                                } else {
                                    console.warn(`  [CUSTOMER_PAY_NOTIF_WARN] Nomor telepon pelanggan tidak valid untuk notifikasi 'Sudah Bayar': ${normalizedNumber}`);
                                }
                            }
                        } else {
                            console.warn(`  [CUSTOMER_PAY_NOTIF_WARN] Pelanggan ${userPelangganDataForNotif.name} tidak memiliki nomor telepon untuk notifikasi 'Sudah Bayar'.`);
                        }
                    } else {
                        if (!conn) console.warn("  [CUSTOMER_PAY_NOTIF_WARN] Koneksi WhatsApp tidak tersedia.");
                        if (global.cronConfig.status_message_paid_notification !== true) console.warn(`  [CUSTOMER_PAY_NOTIF_WARN] Fitur notifikasi 'Sudah Bayar' (status_message_paid_notification) NONAKTIF.`);
                        if (!global.cronConfig.message_paid_notification) console.warn("  [CUSTOMER_PAY_NOTIF_WARN] Template pesan notifikasi 'Sudah Bayar' (message_paid_notification) KOSONG.");
                    }
                }
                // ---- AKHIR BLOK NOTIFIKASI KE PELANGGAN ----
                
                // Logika Notifikasi ke Teknisi (kode Anda yang sudah ada sebelumnya)
                const userPelangganNotifTeknisi = global.users.find(u => String(u.id) === String(requestToUpdate.userId));
                const statusAwalTextNotif = requestToUpdate.newStatus ? "Sudah Bayar" : "Belum Bayar";
                const namaPelangganTextNotif = userPelangganNotifTeknisi ? userPelangganNotifTeknisi.name : `ID Pelanggan ${requestToUpdate.userId}`;
                const namaOwnerApprovalNotif = req.user?.username || "Owner/Admin";
                let detailPaketPelangganNotif = "Tidak diketahui";
                let hargaPaketPelangganFormattedNotif = "N/A";

                if (userPelangganNotifTeknisi && userPelangganNotifTeknisi.subscription) {
                    const paketPelangganNotif = global.packages.find(p => p.name === userPelangganNotifTeknisi.subscription);
                    if (paketPelangganNotif) {
                        detailPaketPelangganNotif = paketPelangganNotif.name;
                        if (paketPelangganNotif.price && !isNaN(parseFloat(paketPelangganNotif.price))) {
                            hargaPaketPelangganFormattedNotif = formatRupiah(parseFloat(paketPelangganNotif.price));
                        }
                    }
                }
                const waktuSekarangNotif = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
                let teknisiNotificationMessage = ""; 
                if (approved) {
                    teknisiNotificationMessage = `✨ *Status Pengajuan Pembayaran: DISETUJUI* ✨\n\nHalo Teknisi,\nPengajuan perubahan status pembayaran yang Anda buat telah *DISETUJUI*.\n\n📄 *Detail Pengajuan:*\n- *ID Request:* ${requestToUpdate.id}\n- *Nama Pelanggan:* ${namaPelangganTextNotif}\n- *Paket:* ${detailPaketPelangganNotif} (${hargaPaketPelangganFormattedNotif})\n- *Status Diajukan:* ${statusAwalTextNotif}\n- *Tanggal Pengajuan:* ${new Date(requestToUpdate.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}\n\n✅ *Status Saat Ini:* DISETUJUI\n👨‍💼 *Disetujui Oleh:* ${namaOwnerApprovalNotif}\n⏰ *Waktu Persetujuan:* ${waktuSekarangNotif}\n\nStatus pembayaran pelanggan *${namaPelangganTextNotif}* telah berhasil diubah menjadi *${statusAwalTextNotif}*.\n${userPelangganNotifTeknisi && userPelangganNotifTeknisi.paid === true && (new Date().getDate() >= (global.cronConfig.allow_paid_update_day || 11)) ? '\nProses update pada router pelanggan juga telah dijalankan.' : ''}\n\nTerima kasih.`;
                } else {
                    teknisiNotificationMessage = `🚫 *Status Pengajuan Pembayaran: DITOLAK* 🚫\n\nHalo Teknisi,\nMohon maaf, pengajuan perubahan status pembayaran yang Anda buat telah *DITOLAK*.\n\n📄 *Detail Pengajuan:*\n- *ID Request:* ${requestToUpdate.id}\n- *Nama Pelanggan:* ${namaPelangganTextNotif}\n- *Paket:* ${detailPaketPelangganNotif} (${hargaPaketPelangganFormattedNotif})\n- *Status Diajukan:* ${statusAwalTextNotif}\n- *Tanggal Pengajuan:* ${new Date(requestToUpdate.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}\n\n❌ *Status Saat Ini:* DITOLAK\n👨‍💼 *Ditolak Oleh:* ${namaOwnerApprovalNotif}\n⏰ *Waktu Penolakan:* ${waktuSekarangNotif}\n\nSilakan hubungi admin/owner jika memerlukan informasi lebih lanjut.\n\nTerima kasih.`;
                }
                
                if (typeof conn !== 'undefined' && conn && requestToUpdate.requested_by_teknisi_id && teknisiNotificationMessage) {
                    const teknisiAccount = global.accounts.find(acc => String(acc.id) === String(requestToUpdate.requested_by_teknisi_id));
                    if (teknisiAccount && teknisiAccount.phone_number) {
                        let targetPhoneNumber = teknisiAccount.phone_number.trim();
                        if (targetPhoneNumber.startsWith("0")) {
                            targetPhoneNumber = "62" + targetPhoneNumber.substring(1);
                        }
                        if (!targetPhoneNumber.endsWith("@s.whatsapp.net")) {
                            targetPhoneNumber += "@s.whatsapp.net";
                        }
                        if (targetPhoneNumber.length > 8) {
                            try {
                                console.log(`  [SUB_LOG] Mengirim notifikasi ke teknisi ${teknisiAccount.username} di ${targetPhoneNumber}`);
                                await delay(1000);
                                await conn.sendMessage(targetPhoneNumber, { text: teknisiNotificationMessage });
                                console.log(`  [SUB_LOG] Notifikasi berhasil dikirim ke teknisi ${targetPhoneNumber}.`);
                            } catch (waError) {
                                console.error(`  [SUB_ERROR] Gagal mengirim notifikasi WhatsApp ke teknisi ${targetPhoneNumber}:`, waError);
                            }
                        } else {
                            console.warn(`  [SUB_WARN] Nomor telepon teknisi tidak valid untuk notifikasi: ${targetPhoneNumber} (dari ${teknisiAccount.phone_number})`);
                        }
                    } else {
                        console.warn(`  [SUB_WARN] Akun teknisi dengan ID ${requestToUpdate.requested_by_teknisi_id} tidak ditemukan atau tidak memiliki nomor telepon.`);
                    }
                }
                
                console.log(`  [SUB_LOG] Aksi untuk requestId: ${requestId} selesai. Status: ${requestToUpdate.status}`);
                return res.json({ message: `Permintaan ${approved ? 'disetujui' : 'ditolak'}.` });
            }
            case 'accounts':
                if(id){
                    accounts = accounts.map(a => (a.id == id ? {...req.body, id: a.id} : a));
                }else {
                    accounts.push({...req.body, id: (accounts[accounts.length - 1]?.id || 0) + 1});
                }
                saveAccounts();
            break;
            case 'packages':
                if(id){
                    packages = packages.map(package => (package.id == id ? {...req.body, id: package.id, whitelist: req.body.whitelist == "on"} : package));
                }else packages.push({...req.body, id: packages.length + 1, whitelist: req.body.whitelist == "on"});
                savePackage();
            break;
            case 'statik':
                if(id){
                    statik = statik.map(v => (v.prof == id ? {...req.body, prof: v.prof} : v));
                }else statik.push(req.body);
                saveStatik();
            break;
            case 'payment-method':
                if(id){
                    paymentMethod = paymentMethod.map(v => (v.id == id ? {...req.body, id: v.id} : v));
                }else paymentMethod.push(req.body);
                savePaymentMethod();
            break;
            case 'voucher':
                if(id){
                    voucher = voucher.map(v => (v.prof == id ? {...req.body, prof: v.prof} : v));
                }else voucher.push(req.body);
                saveVoucher();
            break;
            case 'atm':
                if(id){
                    atm = atm.map(v => (v.id == id ? {saldo: parseInt(req.body.saldo), id: v.id} : v));
                }else atm.push({saldo: parseInt(req.body.saldo), id: req.body.id});
                saveAtm();
            break;
            default:
                return res.status(404).json({ message: 'category not found' });
            break;
        }
        return res.redirect('/' + (category == "login" ? "" : category));
        // return res.json({ message: id ? 'Successfully updated' : 'Successfully created' });
    }catch(e){
        console.log(e)
        res.json({
            status: 500,
            message: "Internal server error"
        });
    }
});

app.delete('/api/:category/:id', (req, res) => {
    const { category, id } = req.params;
    switch(category) {
        case 'users':
            const userIndexToDelete = global.users.findIndex(user => String(user.id) === String(id));
            if (userIndexToDelete !== -1) {
                const userToDelete = global.users[userIndexToDelete];
                const connectedOdpId = userToDelete.connected_odp_id;

                global.users.splice(userIndexToDelete, 1); // Hapus pengguna
                saveUser();

                if (connectedOdpId) { // Jika pengguna terhubung ke ODP, kurangi port terpakai
                    let networkAssets = loadNetworkAssets();
                    updateOdpPortUsage(connectedOdpId, false, networkAssets);
                    saveNetworkAssets(networkAssets);
                }
                return res.json({ status: 200, message: 'Pengguna berhasil dihapus' });
            } else {
                return res.status(404).json({ status: 404, message: 'Pengguna tidak ditemukan' });
            }
        break;
        case 'accounts':
            accounts = accounts.filter(a => a.id != id);
            saveAccounts();
        break;
        case 'payment':
            delPayment(id);
        break;
        case 'packages':
            packages = packages.filter(package => package.id != id);
            savePackage();
        break;
        case 'statik':
            statik = statik.filter(v => v.prof != id);
            saveStatik();
        break;
        case 'voucher':
            voucher = voucher.filter(v => v.prof != id);
            saveVoucher();
        break;
        case 'atm':
            atm = atm.filter(v => v.id != id);
            saveAtm();
        break;
        case 'payment':
            payment = payment.filter(v => v.reffId != id);
            savePayment();
        break;
        case 'payment-method':
            paymentMethod = paymentMethod.filter(v => v.id != id);
            savePaymentMethod();
        break;
    }
    return res.json({ message: 'Successfully deleted'})
});

app.get('/:type([^.]+)', (req, res) => {
    const { type } = req.params;
    if(type === "logout") {
        // Hapus token dengan mengatur cookie token menjadi kosong dan expired
        res.cookie("token", "", {
            httpOnly: true,
            maxAge: 0, // Cookie expired segera
            path: "/"  // Pastikan cookie tersedia untuk seluruh domain
        });
        return res.redirect("/login");
    }
    res.sendFile(`sb-admin/${type}.html`, { root: 'views' });
});



app.get("/send/:id/:text", async (req, reply) => {
    if (!conn) return reply.send({
        status: 500,
        message: "the server is not connected to WhatsApp"
    });
    try {
        if (req.params.id.endsWith("@g.us")) {
            let groups = Object.entries(await conn.groupFetchAllParticipating()).slice(0).map(entry => entry[1]);
            if (!groups.find(v => v.id === req.params.id)) return reply.send({
                status: 400,
                message: "Invalid group id"
            });
        } else if (req.params.id.endsWith("@c.us") || req.params.id.endsWith("@s.whatsapp.net")) {
            if (!(await conn.onWhatsApp(req.params.id))[0]) return reply.send({
                status: 400,
                message: "Invalid contact id"
            });
        } else return reply.send({
            status: 400,
            message: "Invalid id"
        });
        const send = await conn.sendMessage(req.params.id, {
            text: req.params.text
        });
        return reply.send({
            status: 200,
            message: `Success send message with text ${req.params.text}`,
            result: send
        });
    } catch (e) {
        return reply.send({
            status: 500,
            message: e
        });
    }
});


app.engine('php', phpExpress.engine);
app.set('view engine', 'php');
app.all(/.+\.php$/, phpExpress.router);

const server = createServer(app);
const io = new Server(server);

server.listen(PORT, async () => {
    if(fs.existsSync(path.join(`sessions/${config.sessionName}`))) connect();
    console.log('listening on port', PORT);
});


if(cronConfig.schedule?.length > 0){
    initializeCronTasks();
}

if(config.check_schedule?.length > 0){
    startCheck();
}

async function connect() {
    // let { version, isLatest } = await fetchLatestWaWebVersion();
    // console.log(`Using: ${version}, newer: ${isLatest}`);
    const { state, saveCreds: saveState } = await useMultiFileAuthState(`sessions/${config.sessionName}`)
    const raf = makeWASocket({
        // version,
        printQRInTerminal: true,
        logger: P({
            level: 'fatal'
        }),
        browser: ["RAF BOT MD BETA", "safari", "1.0.0"],
        auth: state
    });
    raf.multi = true
    raf.nopref = false
    raf.prefa = 'anjing'
    raf.mode = 'public'

    raf.ev.on('messages.upsert', async m => {
        if (!m.messages || !m.messages[0]?.message) return;
        msgHandler(raf, m.messages[0], m);
    });

    raf.ev.on('connection.update', async update => {
        const {
            connection,
            lastDisconnect
        } = update
        if (connection === 'open') {
            conn = raf;
            console.log("connected");
            io.emit('message', 'connected');
        } else if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.connectionReplaced) {
                console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
                raf.logout();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(`Device Logged Out, Please Scan Again`);
                fs.rmSync(path.join(`sessions/${config.sessionName}`), { recursive: true });
                conn = null;
            } else {
                console.log("reconnect");
                connect();
            }
        } else if (update.qr) {
            console.log("Please scan QR code");
            qrcode.toDataURL(update.qr, (err, url) => {
                io.emit('qr', url);
            });
        } else console.log(update);
    });
    raf.ev.on('creds.update', saveState);
    return raf;
}

function savePackage() {
    fs.writeFileSync('./database/packages.json', JSON.stringify(packages), 'utf-8');
}

function saveAccounts() {
    fs.writeFileSync('./database/accounts.json', JSON.stringify(accounts), 'utf-8');
}

function saveUser() {
    fs.writeFileSync('./database/users.json', JSON.stringify(users), 'utf-8');
}

function saveStatik() {
    fs.writeFileSync('./database/statik.json', JSON.stringify(statik), 'utf-8');
}

function saveVoucher() {
    fs.writeFileSync('./database/voucher.json', JSON.stringify(voucher), 'utf-8');
}

function saveAtm() {
    fs.writeFileSync('./database/user/atm.json', JSON.stringify(atm), 'utf-8');
}

function savePayment() {
    fs.writeFileSync('./database/payment.json', JSON.stringify(payment), 'utf-8');
}

function savePaymentMethod() {
    fs.writeFileSync('./database/payment-method.json', JSON.stringify(paymentMethod), 'utf-8');
}

function saveRequests(){
    fs.writeFileSync('./database/requests.json', JSON.stringify(requests), "utf-8");
}

function decode(token, secret = config.jwt){
    try{
        return jwt.verify(token, secret);
    }catch{
        return undefined;
    }
}

async function broadcast(text, numbers = users.map(v => v.phone_number.split("|")).flat().filter(v => !v.startsWith("0"))){
    for(let number of numbers){
        conn.sendMessage(number + "@s.whatsapp.net", {
            text
        });
        await delay(1000)
    }
}

function initializeCronTasks() {
    let whitelistedProfile = global.packages.filter(v => v.whitelist).map(v => v.profile);

    try {
        // Muat ulang konfigurasi terbaru dari file di awal fungsi
        // Pindahkan pemuatan global.cronConfig ke sini jika ingin lebih aman dari modifikasi file saat runtime
        try {
            global.cronConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './database/cron.json'), 'utf8'));
        } catch (e) {
            console.error("[CRON_INIT_ERROR] Gagal memuat cron.json:", e);
            // Set default config minimal agar tidak crash, atau throw error
            global.cronConfig = { 
                status_compensation_revert: false, 
                schedule_compensation_revert: "0 */1 * * *",
                status_message_compensation_reverted_user: false,
                message_compensation_reverted_user: "",
                date_locale_for_notification: "id-ID",
                date_options_for_notification: { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" },
                date_options_for_revert_notification: { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
            };
        }


        // 1. Main cron task (schedule & message) - Pengingat Tagihan
        if (cronTaskReminder) {
            cronTaskReminder.stop();
            console.log("[CRON_REMINDER] Stopped existing cronTaskReminder.");
        }
        if (global.cronConfig.status_schedule === true && isValidCron(global.cronConfig.schedule)) {
            console.log("[CRON_REMINDER] Starting/Restarting main cron task (Reminder) with schedule:", global.cronConfig.schedule);
            cronTaskReminder = cron.schedule(global.cronConfig.schedule, async () => {
                const currentStatusConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './database/cron.json'), 'utf8'));
                if (currentStatusConfig.status_schedule !== true) {
                    console.log("[CRON_REMINDER] Task is currently disabled inside callback, skipping execution.");
                    return;
                }
                console.log("[CRON_REMINDER] Task executed at:", new Date().toLocaleString('id-ID'));
                for (let user of global.users) {
                    if (!whitelistedProfile.includes(user.pppoe_profile) && !user.paid) {
                        let dataMsg = generateDataMsg(user);
                        if (user.phone_number && conn) {
                            const phoneNumbers = user.phone_number.split('|');
                            for (let number of phoneNumbers) {
                                let normalizedNumber = number.trim();
                                if (normalizedNumber.startsWith("0")) {
                                    normalizedNumber = "62" + normalizedNumber.substring(1);
                                }
                                if (!normalizedNumber.endsWith("@s.whatsapp.net")) {
                                    normalizedNumber += "@s.whatsapp.net";
                                }
                                if (normalizedNumber.length > 8) {
                                    try {
                                        await conn.sendMessage(normalizedNumber, { text: replacer(currentStatusConfig.message, dataMsg) });
                                        console.log(`[CRON_REMINDER] Reminder sent to ${user.name} at ${normalizedNumber}`);
                                        await delay(1000);
                                    } catch (e) {
                                        console.error(`[CRON_REMINDER_ERROR] Failed to send reminder to ${normalizedNumber} for user ${user.name}:`, e.message);
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } else {
            console.log("[CRON_REMINDER] Task is disabled or has an invalid schedule.");
        }

        // 2. Menjadwalkan tugas untuk reset status "paid" menjadi false (Unpaid Monthly)
        if (cronTaskSetUnpaid) {
            cronTaskSetUnpaid.stop();
            console.log("[CRON_UNPAID_RESET] Stopped existing cronTaskSetUnpaid.");
        }
        if (global.cronConfig.status_unpaid_schedule === true && isValidCron(global.cronConfig.unpaid_schedule)) {
            console.log("[CRON_UNPAID_RESET] Starting/Restarting unpaid monthly cron task with schedule:", global.cronConfig.unpaid_schedule);
            cronTaskSetUnpaid = cron.schedule(global.cronConfig.unpaid_schedule, async () => {
                const currentStatusConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './database/cron.json'), 'utf8'));
                if (currentStatusConfig.status_unpaid_schedule !== true) {
                    console.log("[CRON_UNPAID_RESET] Task is currently disabled inside callback, skipping execution.");
                    return;
                }
                console.log('[CRON_UNPAID_RESET] Menjalankan reset status paid (Unpaid Monthly)... at:', new Date().toLocaleString('id-ID'));
                let usersModified = false;
                global.users = global.users.map(user => {
                    if (!whitelistedProfile.includes(user.pppoe_profile) && user.paid === true) {
                        usersModified = true;
                        return { ...user, paid: false };
                    }
                    return user;
                });
                if (usersModified) {
                    saveUser();
                    console.log('[CRON_UNPAID_RESET] Status paid berhasil direset untuk pengguna yang tidak di-whitelist.');
                } else {
                    console.log('[CRON_UNPAID_RESET] Tidak ada status paid pengguna yang perlu direset.');
                }
            });
        } else {
            console.log("[CRON_UNPAID_RESET] Task is disabled or has an invalid schedule.");
        }

        // 3. Unpaid action cron task (Isolir Otomatis)
        if (cronTaskUnpaidAction) {
            cronTaskUnpaidAction.stop();
            console.log("[CRON_ISOLIR_ACTION] Stopped existing cronTaskUnpaidAction.");
        }
        if (global.cronConfig.status_schedule_unpaid_action === true && isValidCron(global.cronConfig.schedule_unpaid_action)) {
            console.log("[CRON_ISOLIR_ACTION] Starting/Restarting unpaid action cron task with schedule:", global.cronConfig.schedule_unpaid_action);
            cronTaskUnpaidAction = cron.schedule(global.cronConfig.schedule_unpaid_action, async () => {
                const currentStatusConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './database/cron.json'), 'utf8'));
                if (currentStatusConfig.status_schedule_unpaid_action !== true) {
                    console.log("[CRON_ISOLIR_ACTION] Task is currently disabled inside callback, skipping execution.");
                    return;
                }
                console.log('[CRON_ISOLIR_ACTION] Menjalankan unpaid action (Isolir Otomatis)... at:', new Date().toLocaleString('id-ID'));
                let tasks = [];
                const isolirProfileToUse = currentStatusConfig.isolir_profile;
                if (!isolirProfileToUse) {
                    console.warn("[CRON_ISOLIR_ACTION] Profil isolir tidak dikonfigurasi. Melewati aksi isolir.");
                    return;
                }
                for (let user of global.users) {
                    if (!user.paid && !whitelistedProfile.includes(user.pppoe_profile) && user.pppoe_profile !== isolirProfileToUse) { // Tambah cek agar tidak isolir ulang yg sudah terisolir
                        console.log(`[CRON_ISOLIR_ACTION] Processing unpaid action for user: ${user.name} (PPPoE: ${user.pppoe_username})`);
                        // if (user.device_id) tasks.push(rebootRouter(user.device_id).catch(e => console.error(`[CRON_ISOLIR_ACTION_ERROR] Failed to reboot router for ${user.name}:`, e.message)));
                        if (user.pppoe_username) {
                            tasks.push(updatePPPoEProfile(user.pppoe_username, isolirProfileToUse).then(() => {
                                console.log(`[CRON_ISOLIR_ACTION] Profile for ${user.pppoe_username} updated to ${isolirProfileToUse}`);
                                // Setelah profil diupdate, hapus sesi aktifnya
                                return deleteActivePPPoEUser(user.pppoe_username).catch(e => console.warn(`[CRON_ISOLIR_ACTION_WARN] Failed to delete active session for ${user.pppoe_username} after profile update:`, e.message));
                            }).catch(e => console.error(`[CRON_ISOLIR_ACTION_ERROR] Failed to update PPPoE profile for ${user.name} to ${isolirProfileToUse}:`, e.message)));
                        }
                    }
                }
                if (tasks.length > 0) {
                    try {
                        await Promise.all(tasks);
                        console.log("[CRON_ISOLIR_ACTION] Unpaid actions (isolir) completed for tasks initiated.");
                    } catch (error) {
                        console.error("[CRON_ISOLIR_ACTION_ERROR] Error during Promise.all for unpaid actions:", error);
                    }
                } else {
                    console.log("[CRON_ISOLIR_ACTION] Tidak ada pengguna yang memenuhi syarat untuk aksi isolir saat ini.");
                }
            });
        } else {
            console.log("[CRON_ISOLIR_ACTION] Task is disabled or has an invalid schedule.");
        }

        // 4. Isolir notification cron task (Notifikasi Setelah Isolir)
        if (cronTaskIsolirNotification) {
            cronTaskIsolirNotification.stop();
            console.log("[CRON_ISOLIR_NOTIF] Stopped existing cronTaskIsolirNotification.");
        }
        if (global.cronConfig.status_message_isolir_notification === true && isValidCron(global.cronConfig.schedule_isolir_notification)) {
            console.log("[CRON_ISOLIR_NOTIF] Starting/Restarting isolir notification cron task with schedule:", global.cronConfig.schedule_isolir_notification);
            cronTaskIsolirNotification = cron.schedule(global.cronConfig.schedule_isolir_notification, async () => {
                const currentStatusConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './database/cron.json'), 'utf8'));
                if (currentStatusConfig.status_message_isolir_notification !== true) {
                    console.log("[CRON_ISOLIR_NOTIF] Task is currently disabled inside callback, skipping notification.");
                    return;
                }
                console.log('[CRON_ISOLIR_NOTIF] Menjalankan isolir notification... at:', new Date().toLocaleString('id-ID'));
                const isolirProfileToUse = currentStatusConfig.isolir_profile;
                for (let user of global.users) {
                    if (!user.paid && !whitelistedProfile.includes(user.pppoe_profile) && user.pppoe_profile === isolirProfileToUse) {
                        let dataMsg = generateDataMsg(user);
                        if (user.phone_number && conn) {
                            const phoneNumbers = user.phone_number.split('|');
                            for (let number of phoneNumbers) {
                                let normalizedNumber = number.trim();
                                if (normalizedNumber.startsWith("0")) {
                                    normalizedNumber = "62" + normalizedNumber.substring(1);
                                }
                                if (!normalizedNumber.endsWith("@s.whatsapp.net")) {
                                    normalizedNumber += "@s.whatsapp.net";
                                }
                                if (normalizedNumber.length > 8) {
                                    try {
                                        await conn.sendMessage(normalizedNumber, { text: replacer(currentStatusConfig.message_isolir_notification, dataMsg) });
                                        console.log(`[CRON_ISOLIR_NOTIF] Sent isolir notification to ${user.name} at ${normalizedNumber}`);
                                        await delay(1000);
                                    } catch (e) {
                                        console.error(`[CRON_ISOLIR_NOTIF_ERROR] Failed to send isolir notification to ${normalizedNumber} for user ${user.name}:`, e.message);
                                    }
                                }
                            }
                        }
                    }
                }
            });
        } else {
            console.log("[CRON_ISOLIR_NOTIF] Task is disabled or has an invalid schedule.");
        }

    // --- AWAL CRON JOB KOMPENSASI (DENGAN PERBAIKAN NOTIFIKASI REVERT) ---
    if (global.cronTaskCompensationRevert) {
        global.cronTaskCompensationRevert.stop();
        console.log("[CRON_COMPENSATION] Stopped existing cronTaskCompensationRevert.");
    }

    if (global.cronConfig.status_compensation_revert === true && isValidCron(global.cronConfig.schedule_compensation_revert)) {
        console.log("[CRON_COMPENSATION] Starting/Restarting compensation revert cron task with schedule:", global.cronConfig.schedule_compensation_revert);
        global.cronTaskCompensationRevert = cron.schedule(global.cronConfig.schedule_compensation_revert, async () => {
            const currentRunTime = new Date();
            console.log(`[CRON_COMPENSATION] Running check for expired compensations at: ${currentRunTime.toLocaleString('id-ID')}`);
            console.log(`[CRON_COMPENSATION_DEBUG] Status variabel conn saat cron job dimulai: ${conn ? 'TERDEFINISI dan AKTIF' : 'NULL atau UNDEFINED'}`);

            let currentCronConfig; // Akan diisi dari cron.json
            try {
                currentCronConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './database/cron.json'), 'utf8'));
            } catch (e) {
                console.error("[CRON_COMPENSATION_ERROR] Error reading cron.json inside callback:", e);
                return; // Hentikan jika config tidak bisa dibaca
            }

            if (currentCronConfig.status_compensation_revert !== true) {
                console.log("[CRON_COMPENSATION] Revert task is currently disabled in config (inside callback). Skipping.");
                return;
            }
            
            let currentCompensationsData;
            try {
                currentCompensationsData = JSON.parse(fs.readFileSync(compensationsDbPath, 'utf8')); // pastikan compensationsDbPath terdefinisi global
            } catch (e) {
                console.error("[CRON_COMPENSATION_ERROR] Error reading compensations.json inside callback:", e);
                return; 
            }

            const now = new Date();
            let compensationsModifiedInThisRun = false;
            const compensationsToKeep = [];

            for (const comp of currentCompensationsData) {
                if (comp.status === 'active' && new Date(comp.endDate) <= now) {
                    const userToRevert = global.users.find(u => u.id.toString() === comp.userId.toString());
                    
                    if (!userToRevert) {
                        console.error(`[CRON_COMPENSATION_REVERT_ERROR] User dengan ID ${comp.userId} tidak ditemukan untuk kompensasi ID ${comp.id}. Kompensasi tidak dapat direvert sepenuhnya.`);
                        comp.status = 'error_revert_user_not_found';
                        compensationsToKeep.push(comp);
                        compensationsModifiedInThisRun = true;
                        continue; 
                    }

                    console.log(`[CRON_COMPENSATION_REVERT] Kompensasi untuk ${comp.pppoeUsername} (User: ${userToRevert.name}, ID: ${comp.id}) telah berakhir. Mencoba revert ke profil ${comp.originalProfile}.`);
                    try {
                        await updatePPPoEProfile(comp.pppoeUsername, comp.originalProfile);
                        console.log(`[CRON_COMPENSATION_REVERT_SUCCESS] Profil PPPoE untuk ${comp.pppoeUsername} berhasil dikembalikan ke ${comp.originalProfile}.`);

                        try { /* ... deleteActivePPPoEUser ... */ } catch (disconnectError) { /* ... handle ... */ }
                        if (userToRevert.device_id) { try { /* ... rebootRouter ... */ } catch (rebootError) { /* ... handle ... */ }
                        } else { /* ... log skip reboot ... */ }
                        
                        // --- AWAL BLOK PENGIRIMAN NOTIFIKASI REVERT (DENGAN DATA YANG BENAR) ---
                        console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] Memulai pengecekan untuk mengirim notifikasi revert.`);
                        console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] Config notif revert: status_active=${currentCronConfig.status_message_compensation_reverted_user}, message_template_exists=${!!currentCronConfig.message_compensation_reverted_user}, conn_active=${!!conn}`);

                        if (currentCronConfig.status_message_compensation_reverted_user === true &&
                            currentCronConfig.message_compensation_reverted_user &&
                            conn) {
                            
                            console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] Kondisi pengiriman notifikasi revert TERPENUHI.`);
                            if (userToRevert.phone_number && userToRevert.phone_number.trim() !== "") {
                                console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] Nomor telepon mentah: '${userToRevert.phone_number}'`);
                                
                                const locale = currentCronConfig.date_locale_for_notification || 'id-ID';
                                // Gunakan date_options_for_revert_notification jika ada, fallback ke date_options_for_notification
                                const dateOptionsForRevert = currentCronConfig.date_options_for_revert_notification || currentCronConfig.date_options_for_notification || { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

                                // Membuat objek dataPesanRevert untuk placeholder di message_compensation_reverted_user
                                const dataPesanRevert = {
                                    name: userToRevert.name,
                                    tanggalRevert: new Date().toLocaleDateString(locale, dateOptionsForRevert), // Tanggal saat ini (revert terjadi)
                                    profileAsli: global.packages.find(p => p.profile === comp.originalProfile)?.name || comp.originalProfile,
                                    // Anda bisa tambahkan placeholder lain jika dibutuhkan di template pesan revert
                                };
                                console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] Data untuk pesan revert: ${JSON.stringify(dataPesanRevert)}`);

                                const phoneNumbers = userToRevert.phone_number.split('|');
                                for (let number of phoneNumbers) {
                                    if (!number || number.trim() === "") { console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] Nomor kosong dilewati.`); continue; }
                                    let normalizedNumber = number.trim();
                                    if (normalizedNumber.startsWith("0")) {
                                        normalizedNumber = "62" + normalizedNumber.substring(1);
                                    }
                                    if (!normalizedNumber.endsWith("@s.whatsapp.net")) {
                                        normalizedNumber += "@s.whatsapp.net";
                                    }
                                    console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] Normalisasi nomor untuk revert: ${number} -> ${normalizedNumber}`);
                                    
                                    if (normalizedNumber.length > 8) {
                                        try {
                                            const teksPesanRevert = replacer(currentCronConfig.message_compensation_reverted_user, dataPesanRevert);
                                            console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] MENGIRIM PESAN REVERT ke: ${normalizedNumber} dengan teks: "${teksPesanRevert}"`);
                                            await conn.sendMessage(normalizedNumber, { text: teksPesanRevert });
                                            console.log(`[CRON_COMPENSATION_NOTIF] Pesan revert kompensasi BERHASIL dikirim ke ${userToRevert.name} di ${normalizedNumber}`);
                                            if (typeof delay === 'function') await delay(1000);
                                        } catch (msgError) {
                                            console.error(`[CRON_COMPENSATION_NOTIF_ERROR] GAGAL mengirim pesan revert ke ${normalizedNumber} (User: ${userToRevert.name}):`, msgError.message, msgError.stack);
                                        }
                                    } else {
                                        console.warn(`[CRON_COMPENSATION_WARN] Nomor ${normalizedNumber} tidak valid (terlalu pendek) untuk user ${userToRevert.name}. Pesan revert tidak dikirim ke nomor ini.`);
                                    }
                                }
                            } else { 
                                console.warn(`[CRON_COMPENSATION_WARN] User ${userToRevert.name} (ID: ${comp.userId}) tidak memiliki nomor telepon. Pesan revert tidak bisa dikirim.`);
                            }
                        } else { 
                            console.log(`[CRON_COMPENSATION_DEBUG] [User: ${userToRevert.name}] Kondisi pengiriman notifikasi revert TIDAK TERPENUHI.`);
                        }
                        // --- AKHIR BLOK PENGIRIMAN NOTIFIKASI REVERT ---
                        
                        compensationsModifiedInThisRun = true;
                        console.log(`[CRON_COMPENSATION_REVERT] Entri kompensasi ID ${comp.id} untuk ${comp.pppoeUsername} akan dihapus setelah semua proses revert selesai.`);

                    } catch (mikrotikError) {
                        console.error(`[CRON_COMPENSATION_REVERT_ERROR] Gagal mengembalikan profil Mikrotik untuk ${comp.pppoeUsername} ke ${comp.originalProfile}:`, mikrotikError.message);
                        comp.status = 'error_revert';
                        compensationsToKeep.push(comp);
                        compensationsModifiedInThisRun = true;
                    }
                } else {
                    compensationsToKeep.push(comp);
                }
            }

            if (compensationsModifiedInThisRun) {
                global.compensations = compensationsToKeep;
                saveCompensations();
            }
            console.log('[CRON_COMPENSATION] Pemeriksaan revert kompensasi selesai.');
        });
    } else {
        if (!global.cronConfig || global.cronConfig.status_compensation_revert === false) {
            console.log("[CRON_COMPENSATION] Revert task is disabled in config.");
        } else {
            console.log("[CRON_COMPENSATION] Revert task has an invalid schedule or schedule not found. Not starting.");
        }
    }
    // --- AKHIR CRON JOB KOMPENSASI ---

    } catch (e) {
        console.error("[CRON_INIT_ERROR] Error initializing cron tasks:", e);
    }
}




function startCheck() {
    try {
        // Ensure config.check_schedule is a valid cron string before scheduling
        if (!cron.validate(config.check_schedule)) {
            console.error(`[CRON_REDAMAN_ERROR] Invalid cron expression in config.check_schedule: "${config.check_schedule}". Task not started.`);
            return;
        }

        if (checkTask) {
            console.log("[CRON_REDAMAN] Stopping existing redaman check task before restarting.");
            checkTask.stop();
        }

        checkTask = cron.schedule(config.check_schedule, async () => {
            console.log(`[CRON_REDAMAN] Executing redaman check at: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);

            if (!conn && global.accounts && global.accounts.some(acc => acc.phone_number && acc.phone_number.trim() !== "")) {
                console.warn("[CRON_REDAMAN] WhatsApp connection (conn) is not available. Skipping redaman check notifications for this run.");
                return;
            }

            if (!global.config || !global.config.genieacsBaseUrl) {
                console.error("[CRON_REDAMAN_ERROR] GenieACS base URL is not configured.");
                return;
            }
            
            if (config.rx_tolerance === undefined || isNaN(parseFloat(config.rx_tolerance))) {
                console.error(`[CRON_REDAMAN_ERROR] rx_tolerance is not configured or is not a valid number: "${config.rx_tolerance}".`);
                return;
            }
            const rxTolerance = parseFloat(config.rx_tolerance);
            const REFRESH_DELAY_MS = 5000; // Jeda 5 detik setelah mengirim semua perintah refresh

            try {
                console.log(`[CRON_REDAMAN] Step 1: Fetching initial list of devices from: ${global.config.genieacsBaseUrl}/devices`);
                const initialDeviceListResponse = await axios.get(`${global.config.genieacsBaseUrl}/devices?projection=_id`);
                const deviceIds = initialDeviceListResponse.data.map(d => d._id);

                if (!deviceIds || deviceIds.length === 0) {
                    console.log("[CRON_REDAMAN] No devices found to refresh.");
                    return;
                }

                console.log(`[CRON_REDAMAN] Step 2: Sending refreshObject tasks for 'VirtualParameters.redaman.' for ${deviceIds.length} devices.`);
                let refreshPromises = [];
                for (const deviceId of deviceIds) {
                    const refreshUrl = `${global.config.genieacsBaseUrl}/devices/${encodeURIComponent(deviceId)}/tasks?connection_request`;
                    // Mengubah objectName menjadi lebih spesifik untuk redaman
                    const refreshPayload = { name: "refreshObject", objectName: "VirtualParameters.redaman." }; 
                    refreshPromises.push(
                        axios.post(refreshUrl, refreshPayload)
                            .catch(err => console.warn(`[CRON_REDAMAN_REFRESH_WARN] Failed to send refresh command for 'VirtualParameters.redaman.' to ${deviceId}: ${err.message}`))
                    );
                }
                
                await Promise.allSettled(refreshPromises); 

                await delay(REFRESH_DELAY_MS);

                const updatedDeviceDataResponse = await axios.get(`${global.config.genieacsBaseUrl}/devices`);
                const devices = updatedDeviceDataResponse.data;

                if (!devices || !Array.isArray(devices)) {
                    console.warn("[CRON_REDAMAN] No devices found or invalid format from GenieACS after refresh.");
                    return;
                }
                
                for (const device of devices) {
                    const redamanValuePath = device?.VirtualParameters?.redaman?._value;
                    
                    if (redamanValuePath === undefined) {
                        // console.log(`[CRON_REDAMAN_DEBUG] Device ${device._id}: Redaman data not available (device.VirtualParameters.redaman._value is undefined).`);
                        continue; 
                    }

                    const currentRedaman = parseFloat(redamanValuePath);

                    if (isNaN(currentRedaman)) {
                        console.warn(`[CRON_REDAMAN_WARN] Device ${device._id}: Redaman value is not a valid number: "${redamanValuePath}".`);
                        continue;
                    }

                    if (rxTolerance > currentRedaman) {
                        console.log(`[CRON_REDAMAN_ALERT] Device ${device._id} has problematic redaman: ${currentRedaman} dBm (Tolerance: ${rxTolerance} dBm).`);
                        
                        if (!conn) { 
                             console.warn(`[CRON_REDAMAN_ALERT_SKIP_NOTIF] Device ${device._id} has problematic redaman, but WhatsApp connection is unavailable. Skipping notification.`);
                             continue; 
                        }

                        const findUser = global.users.find(u => u.device_id === device._id);
                        
                        const userName = findUser?.name?.split("|")[0] || "(Tidak Terdaftar)";
                        const userPhone = findUser?.phone_number?.split("|")[0] || "(Tidak Terdaftar)";
                        const userAddress = findUser?.address?.split("|")[0] || "(Tidak Diketahui)";
                        const userPPPoE = findUser?.pppoe_username?.split("|")[0] || "(Tidak Diketahui)";

                        const messageText = `Terjadi gangguan redaman pada pelanggan:\nNama Pelanggan : ${userName}\nNo Hp : ${userPhone}\nAlamat : ${userAddress}\nUser PPPoE : ${userPPPoE}\nDevice ID : ${device._id}\nRedaman: ${currentRedaman} dBm\nBatas Normal: > ${rxTolerance} dBm`;
                        
                        console.log(`[CRON_REDAMAN_NOTIF_PREP] Preparing to notify admins for device ${device._id}. User: ${userName}`);

                        for (const account of global.accounts) {
                            if ((account.role === 'admin' || account.role === 'teknisi') && 
                                account.phone_number && account.phone_number.trim() !== "") {
                                
                                let staffPhoneNumber = account.phone_number.trim(); // Mengganti nama variabel
                                
                                // Normalisasi nomor telepon
                                if (staffPhoneNumber.startsWith("0")) {
                                    staffPhoneNumber = "62" + staffPhoneNumber.substring(1);
                                }
                                if (!staffPhoneNumber.endsWith("@s.whatsapp.net")) {
                                    staffPhoneNumber += "@s.whatsapp.net";
                                }

                                if (staffPhoneNumber.length > 8) { // Validasi dasar panjang nomor
                                    try {
                                        // Menggunakan peran dan username akun dalam log
                                        console.log(`[CRON_REDAMAN_NOTIF_SEND] Sending alert to ${account.role} ${account.username} (${staffPhoneNumber}) for device ${device._id}.`);
                                        await conn.sendMessage(staffPhoneNumber, { text: messageText });
                                        await delay(1000); // Jeda antar pengiriman notifikasi
                                    } catch (e) {
                                        console.error(`[CRON_REDAMAN_NOTIF_ERROR] Failed to send message to ${account.role} ${account.username} (${staffPhoneNumber}):`, e.message);
                                    }
                                } else {
                                    console.warn(`[CRON_REDAMAN_WARN] Invalid phone number format for ${account.role} ${account.username}: ${account.phone_number}`);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(`[CRON_REDAMAN_AXIOS_ERROR] Error during redaman check process: ${error.message}. Status: ${error.response?.status}`);
                    if (error.response?.data) {
                        console.error("[CRON_REDAMAN_AXIOS_ERROR_DATA]", JSON.stringify(error.response.data).substring(0, 500));
                    }
                } else {
                    console.error("[CRON_REDAMAN_UNEXPECTED_ERROR] An unexpected error occurred during redaman check:", error);
                }
            }
            console.log(`[CRON_REDAMAN] Redaman check finished at: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
        });
        console.log(`[CRON_REDAMAN] Redaman check task successfully scheduled with pattern: "${config.check_schedule}"`);
    } catch (e) {
        console.error("[CRON_REDAMAN_SETUP_ERROR] Error setting up redaman check cron job:", e);
    }
}
