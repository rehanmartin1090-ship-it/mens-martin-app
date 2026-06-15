// --- APP STATE ---
const state = {
  userPhone: '',
  userName: 'Guest User',
  userEmail: '',
  userAddress: '',
  loyaltyTier: 'Silver Club',
  orders: [],
  metrics: {
    spentThisMonth: 0,
    spentThisYear: 0,
    pendingCount: 0,
    inTransitCount: 0,
    deliveredCount: 0
  },
  products: [],
  selectedFabric: null,
  activeVideoId: 'video1',
  whatsappOrdersAll: [] // Admin view
};

// Config
const API_URL = ''; // Local relative paths
const ADMIN_PASSCODE = 'admin'; // simple demo switch

// YouTube tagged mapping
const videoTaggedFabrics = {
  video1: [99001, 99002], // Navy blue & Green Dobby
  video2: [99003, 99004]  // White Cotton & Charcoal Linen
};

// Dominant colors mapping for Visualizer SVG fills
const fabricColorsMap = {
  99001: '#1e3a8a', // Royal Navy Blue
  99002: '#064e3b', // Dark Forest Green
  99003: '#f8fafc', // Crisp White Cotton
  99004: '#334155'  // Charcoal Grey
};

// --- DOM ELEMENTS ---
const el = {
  loginContainer: document.getElementById('login-container'),
  appContainer: document.getElementById('app-container'),
  loginPhone: document.getElementById('login-phone'),
  btnLogin: document.getElementById('btn-login'),
  btnAdminToggle: document.getElementById('btn-admin-login-toggle'),
  
  // OTP Elements
  phoneSection: document.getElementById('phone-section'),
  otpSection: document.getElementById('otp-section'),
  loginOtp: document.getElementById('login-otp'),
  btnVerifyOtp: document.getElementById('btn-verify-otp'),
  btnBackToPhone: document.getElementById('btn-back-to-phone'),
  btnResendOtp: document.getElementById('btn-resend-otp'),
  otpTimer: document.getElementById('otp-timer'),
  otpHintMessage: document.getElementById('otp-hint-message'),
  
  // Navigation & Profile
  menuItems: document.querySelectorAll('.menu-item'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  sidebarTier: document.getElementById('sidebar-tier'),
  userNameDisplay: document.getElementById('user-name-display'),
  userPhoneDisplay: document.getElementById('user-phone-display'),
  btnLogout: document.getElementById('btn-logout'),
  adminMenuItem: document.getElementById('admin-menu-item'),
  
  // Dashboard
  welcomeName: document.getElementById('welcome-name'),
  loyaltyTierName: document.getElementById('loyalty-tier-name'),
  spentMonth: document.getElementById('metric-spent-month'),
  spentYear: document.getElementById('metric-spent-year'),
  pendingCount: document.getElementById('status-pending-count'),
  transitCount: document.getElementById('status-transit-count'),
  deliveredCount: document.getElementById('status-delivered-count'),
  spendingSvg: document.getElementById('spending-svg-chart'),
  ordersTableBody: document.getElementById('orders-table-body'),
  filterButtons: document.querySelectorAll('.filter-btn'),
  
  // Active Delivery tracker
  activeTrackerContainer: document.getElementById('active-tracker-container'),
  noActiveOrdersMsg: document.getElementById('no-active-orders-msg'),
  trackOrderId: document.getElementById('track-order-id'),
  latestOrderSourceBadge: document.getElementById('latest-order-source-badge'),
  carrierLogo: document.getElementById('carrier-logo'),
  carrierNameDisplay: document.getElementById('carrier-name-display'),
  trackingNumDisplay: document.getElementById('tracking-number-display'),
  btnTrackAction: document.getElementById('btn-track-action'),
  
  // Timeline Steps
  stepPlaced: document.getElementById('step-placed'),
  stepPaidVerify: document.getElementById('step-paid-verify'),
  stepTransit: document.getElementById('step-transit'),
  stepDelivered: document.getElementById('step-delivered'),

  // Catalog
  fabricsGrid: document.getElementById('fabrics-grid-list'),
  catFilterBtns: document.querySelectorAll('.cat-filter-btn'),
  youtubeThumbnail: document.getElementById('youtube-thumbnail'),
  videoTabs: document.querySelectorAll('.video-tab'),
  
  // Visualizer
  visualizerSvg: document.getElementById('visualizer-svg-outline'),
  visFabricTitle: document.getElementById('vis-fabric-title'),
  btnModeSuit: document.getElementById('btn-mode-suit'),
  btnModeShirt: document.getElementById('btn-mode-shirt'),
  btnModePants: document.getElementById('btn-mode-pants'),
  
  // Admin Form & Actions
  adminOrderForm: document.getElementById('admin-order-form'),
  adminCustPhone: document.getElementById('admin-cust-phone'),
  adminCustName: document.getElementById('admin-cust-name'),
  adminCustEmail: document.getElementById('admin-cust-email'),
  adminCustAddress: document.getElementById('admin-cust-address'),
  adminSelectFabric: document.getElementById('admin-select-fabric'),
  adminSelectLength: document.getElementById('admin-select-length'),
  adminCustomPrice: document.getElementById('admin-custom-price'),
  adminOrderNotes: document.getElementById('admin-order-notes'),
  btnExportShiprocket: document.getElementById('btn-export-shiprocket'),
  manifestCsvFile: document.getElementById('manifest-csv-file'),
  csvDropzone: document.getElementById('csv-dropzone'),
  csvFileName: document.getElementById('csv-file-name'),
  btnImportManifest: document.getElementById('btn-import-manifest'),
  adminOrdersQueueBody: document.getElementById('admin-orders-queue-body'),

  // Checkout Modal
  checkoutModal: document.getElementById('checkout-modal'),
  modalCheckoutAmount: document.getElementById('modal-checkout-amount'),
  receiptFileInput: document.getElementById('receipt-file-input'),
  receiptFileName: document.getElementById('receipt-file-name'),
  btnSubmitOrderReceipt: document.getElementById('btn-submit-order-receipt'),
  btnCloseModal: document.querySelector('.btn-close-modal')
};

// Temp holder for order being checked out
let activeCheckoutOrderId = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadProducts();
  registerServiceWorker();
});

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Login & OTP Buttons
  el.btnLogin.addEventListener('click', handleSendOTP);
  el.btnVerifyOtp.addEventListener('click', handleVerifyOTP);
  el.btnBackToPhone.addEventListener('click', handleBackToPhone);
  el.btnResendOtp.addEventListener('click', handleResendOTP);
  el.btnAdminToggle.addEventListener('click', handleAdminBypass);
  el.btnLogout.addEventListener('click', handleLogout);

  // Sidebar Tabs Navigation
  el.menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Mobile Bottom Navigation Bindings
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  bottomNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Table filtering
  el.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      el.filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderOrdersTable(btn.getAttribute('data-filter'));
    });
  });

  // Catalog filtering
  el.catFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      el.catFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCatalog(btn.getAttribute('data-cat'));
    });
  });

  // YouTube Spotlight Video selector
  el.videoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      el.videoTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const videoId = tab.getAttribute('data-video');
      state.activeVideoId = videoId;
      
      if (videoId === 'video1') {
        el.youtubeThumbnail.src = "/assets/navy_suiting.png"; // beautiful custom preview
      } else {
        el.youtubeThumbnail.src = "/assets/charcoal_linen.png";
      }
      
      // Auto-filter catalog based on video tags
      renderCatalog('all');
    });
  });

  // Fabric Visualizer options
  el.btnModeSuit.addEventListener('click', () => setVisualizerOutfit('suit'));
  el.btnModeShirt.addEventListener('click', () => setVisualizerOutfit('shirt'));
  el.btnModePants.addEventListener('click', () => setVisualizerOutfit('pants'));

  // Admin: Order creation
  el.adminOrderForm.addEventListener('click', (e) => {
    if (e.target.type === 'submit') {
      e.preventDefault();
      submitWhatsAppOrder();
    }
  });

  // Admin: Export Shiprocket CSV
  el.btnExportShiprocket.addEventListener('click', exportShiprocketCSV);

  // Admin: Manifest Drag and Drop / Upload
  el.csvDropzone.addEventListener('click', () => el.manifestCsvFile.click());
  el.manifestCsvFile.addEventListener('change', handleManifestFileSelect);

  el.csvDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.csvDropzone.classList.add('dragover');
  });
  el.csvDropzone.addEventListener('dragleave', () => {
    el.csvDropzone.classList.remove('dragover');
  });
  el.csvDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    el.csvDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      el.manifestCsvFile.files = e.dataTransfer.files;
      handleManifestFileSelect();
    }
  });

  el.btnImportManifest.addEventListener('click', uploadManifestCSV);

  // Modal checkout receipt upload
  el.receiptFileInput.addEventListener('change', () => {
    if (el.receiptFileInput.files.length > 0) {
      el.receiptFileName.textContent = el.receiptFileInput.files[0].name;
      el.btnSubmitOrderReceipt.removeAttribute('disabled');
    } else {
      el.receiptFileName.textContent = 'Awaiting file...';
      el.btnSubmitOrderReceipt.setAttribute('disabled', 'true');
    }
  });

  el.btnSubmitOrderReceipt.addEventListener('click', submitReceiptImage);
  el.btnCloseModal.addEventListener('click', hideCheckoutModal);
}

// --- ROUTING / NAVIGATION ---
function switchTab(tabId) {
  // Sidebar states
  el.menuItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Bottom Nav states
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  bottomNavItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  el.tabPanels.forEach(panel => {
    if (panel.id === `tab-${tabId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Tab specific refreshes
  if (tabId === 'dashboard') {
    loadCustomerDashboard();
  } else if (tabId === 'admin') {
    loadAdminConsole();
  }
}

// --- LOGIN OPERATIONS ---
let otpTimerInterval = null;

async function handleSendOTP() {
  const phone = el.loginPhone.value.trim();
  if (phone.length < 10) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }

  el.btnLogin.setAttribute('disabled', 'true');
  el.btnLogin.textContent = 'Sending...';

  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || 'Failed to send OTP. Please try again.');
      el.btnLogin.removeAttribute('disabled');
      el.btnLogin.innerHTML = '<span>Send OTP</span> <i class="fa-solid fa-paper-plane"></i>';
      return;
    }

    // Switch screen to OTP section
    el.phoneSection.style.display = 'none';
    el.otpSection.style.display = 'block';
    el.loginOtp.value = '';
    el.loginOtp.focus();

    // If in demo mode (no SMS gateway configured), display the OTP for testing convenience
    if (data.testMode) {
      el.otpHintMessage.innerHTML = `<strong>Demo Mode:</strong> Use code <span style="color: #c5a880; font-size: 1.1em; font-weight: bold; border-bottom: 2px dashed #c5a880;">${data.otp}</span> to log in.`;
    } else {
      el.otpHintMessage.textContent = 'Enter the verification code sent to your phone.';
    }

    // Start timer countdown
    startOtpCountdown();

  } catch (err) {
    console.error('Error sending OTP', err);
    alert('Network error. Please try again.');
  } finally {
    el.btnLogin.removeAttribute('disabled');
    el.btnLogin.innerHTML = '<span>Send OTP</span> <i class="fa-solid fa-paper-plane"></i>';
  }
}

async function handleVerifyOTP() {
  const phone = el.loginPhone.value.trim();
  const otp = el.loginOtp.value.trim();

  if (otp.length < 4) {
    alert("Please enter the 4-digit verification code.");
    return;
  }

  el.btnVerifyOtp.setAttribute('disabled', 'true');
  el.btnVerifyOtp.textContent = 'Verifying...';

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.error || 'Invalid verification code. Please check and try again.');
      return;
    }

    // OTP Verified! Log user in
    state.userPhone = phone;
    state.userName = data.customerName || localStorage.getItem(`mm_name_${phone}`) || "Valued Guest";
    state.loyaltyTier = "Silver Club";

    // Hide login container, show App
    el.loginContainer.classList.remove('active');
    el.appContainer.classList.add('active');
    el.adminMenuItem.classList.add('hidden'); // Hide admin tab for normal users

    const adminBtmNav = document.getElementById('admin-bottom-nav-item');
    if (adminBtmNav) adminBtmNav.classList.add('hidden'); // Hide in mobile too

    // Clean up login inputs & screen state for next logout
    handleBackToPhone();

    // Load customer dashboard
    loadCustomerDashboard();
    switchTab('dashboard');

  } catch (err) {
    console.error('Error verifying OTP', err);
    alert('Network error. Please try again.');
  } finally {
    el.btnVerifyOtp.removeAttribute('disabled');
    el.btnVerifyOtp.innerHTML = '<span>Verify & Login</span> <i class="fa-solid fa-circle-check"></i>';
  }
}

function handleBackToPhone() {
  // Clear intervals
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  
  el.otpSection.style.display = 'none';
  el.phoneSection.style.display = 'block';
  el.loginOtp.value = '';
}

function handleResendOTP(e) {
  if (e) e.preventDefault();
  handleSendOTP();
}

function startOtpCountdown() {
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  
  let timeLeft = 60;
  el.otpTimer.style.display = 'inline';
  el.btnResendOtp.style.display = 'none';
  el.otpTimer.textContent = `Resend OTP in ${timeLeft}s`;

  otpTimerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(otpTimerInterval);
      el.otpTimer.style.display = 'none';
      el.btnResendOtp.style.display = 'inline';
    } else {
      el.otpTimer.textContent = `Resend OTP in ${timeLeft}s`;
    }
  }, 1000);
}

function handleAdminBypass() {
  // Clear any active OTP timers
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  handleBackToPhone();

  state.userPhone = "9999999999";
  state.userName = "Brand Admin";
  state.loyaltyTier = "Luxe Designer";

  el.loginContainer.classList.remove('active');
  el.appContainer.classList.add('active');
  el.adminMenuItem.classList.remove('hidden'); // Show admin tab
  
  const adminBtmNav = document.getElementById('admin-bottom-nav-item');
  if (adminBtmNav) adminBtmNav.classList.remove('hidden'); // Show in mobile too

  loadCustomerDashboard();
  switchTab('admin');
}

function handleLogout() {
  state.userPhone = '';
  state.orders = [];
  el.appContainer.classList.remove('active');
  el.loginContainer.classList.add('active');
  el.loginPhone.value = '';
  handleBackToPhone();
}

// --- PRODUCT SYNC & CATALOG RENDER ---
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    state.products = data;
    
    // Set default visualizer fabric
    if (data.length > 0) {
      selectFabricForVisualizer(data[0]);
    }
    
    renderCatalog('all');
    populateAdminFabricSelect();
  } catch (err) {
    console.error("Failed to load fabrics catalogue", err);
  }
}

// Helper to get dominant hex color dynamically based on title keywords
function getDominantFabricColor(p) {
  const title = p.title.toLowerCase();
  
  if (title.includes('navy') || title.includes('blue')) return '#1e3a8a';
  if (title.includes('green') || title.includes('olive') || title.includes('emerald')) return '#064e3b';
  if (title.includes('white') || title.includes('ivory') || title.includes('cream')) return '#f8fafc';
  if (title.includes('black') || title.includes('charcoal') || title.includes('grey') || title.includes('dark')) return '#2e2e33';
  if (title.includes('red') || title.includes('burgundy') || title.includes('plaid') || title.includes('checks')) return '#7f1d1d';
  if (title.includes('sand') || title.includes('khaki') || title.includes('beige')) return '#d6c3b0';
  
  // Default to a luxurious gold/bronze outline fill
  return '#4a3e3d';
}

function renderCatalog(filter) {
  el.fabricsGrid.innerHTML = '';
  
  // Filters mapping
  let filtered = state.products;
  if (filter === 'suiting') {
    filtered = state.products.filter(p => p.title.toLowerCase().includes('suiting') || p.title.toLowerCase().includes('blazer') || p.title.toLowerCase().includes('checks'));
  } else if (filter === 'linen') {
    filtered = state.products.filter(p => p.title.toLowerCase().includes('linen'));
  } else if (filter === 'cotton') {
    filtered = state.products.filter(p => p.title.toLowerCase().includes('cotton') || p.title.toLowerCase().includes('shirting'));
  }

  // Under-video highlighter filter
  const taggedIds = videoTaggedFabrics[state.activeVideoId];

  filtered.forEach(p => {
    const isTagged = taggedIds ? taggedIds.includes(p.id) : false;
    const card = document.createElement('div');
    card.className = `fabric-card glass ${isTagged ? 'glass-gold' : ''} ${state.selectedFabric && state.selectedFabric.id === p.id ? 'selected-for-visualizer' : ''}`;
    card.setAttribute('data-id', p.id);
    
    const imageSrc = p.images && p.images[0] ? p.images[0].src : '/assets/navy_suiting.png';
    const basePrice = p.variants && p.variants[0] ? parseFloat(p.variants[0].price) : 580;

    // Generate dynamic variant list directly from Shopify values
    let selectHtml = `<select class="length-select" id="len-select-${p.id}">`;
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v, index) => {
        const isSelected = index === 1 || p.variants.length === 1 ? 'selected' : '';
        const priceFloat = parseFloat(v.price);
        selectHtml += `<option value="${v.title}" data-price="${priceFloat}" ${isSelected}>${v.title} - ₹${priceFloat.toFixed(0)}</option>`;
      });
    } else {
      selectHtml += `
        <option value="1.25 meters" data-price="${basePrice * 1.2}">1.25 meters - ₹${(basePrice * 1.2).toFixed(0)}</option>
        <option value="2 meters" data-price="${basePrice * 2.0}" selected>2 meters - ₹${(basePrice * 2.0).toFixed(0)}</option>
        <option value="3 meters" data-price="${basePrice * 3.0}">3 meters - ₹${(basePrice * 3.0).toFixed(0)}</option>
        <option value="3.5 meters" data-price="${basePrice * 3.5}">3.5 meters - ₹${(basePrice * 3.5).toFixed(0)}</option>
      `;
    }
    selectHtml += `</select>`;

    card.innerHTML = `
      <div class="fabric-img-wrap">
        <img src="${imageSrc}" alt="${p.title}">
        <div class="fabric-price-badge">₹${basePrice.toFixed(0)}+</div>
      </div>
      <h3 class="fabric-title">${p.title}</h3>
      <div class="fabric-options-row">
        ${selectHtml}
        <div class="fabric-action-buttons">
          <button class="btn btn-outline-gold btn-sm btn-wa-buy"><i class="fa-brands fa-whatsapp"></i> Buy</button>
          <button class="btn btn-gold btn-sm btn-app-buy">In App</button>
        </div>
      </div>
    `;

    // Click card selects for visualizer (except actions)
    card.addEventListener('click', (e) => {
      if (!e.target.closest('select') && !e.target.closest('button')) {
        selectFabricForVisualizer(p);
        document.querySelectorAll('.fabric-card').forEach(c => c.classList.remove('selected-for-visualizer'));
        card.classList.add('selected-for-visualizer');
      }
    });

    // Buy Button Click logic
    const lenSelect = card.querySelector('.length-select');
    card.querySelector('.btn-wa-buy').addEventListener('click', () => {
      const selectedOption = lenSelect.options[lenSelect.selectedIndex];
      const priceVal = selectedOption.getAttribute('data-price');
      const meters = lenSelect.value;
      const urlText = `Hi Mens Martin! I watched your YouTube video. I want to buy this fabric:\n- Name: ${p.title}\n- Length: ${meters}\n- Same Price: ₹${parseFloat(priceVal).toFixed(0)}\nPlease confirm QR code for payment. My phone: ${state.userPhone}`;
      const waLink = `https://api.whatsapp.com/send?phone=919129963645&text=${encodeURIComponent(urlText)}`;
      window.open(waLink, '_blank');
    });

    card.querySelector('.btn-app-buy').addEventListener('click', () => {
      const selectedOption = lenSelect.options[lenSelect.selectedIndex];
      const price = parseFloat(selectedOption.getAttribute('data-price'));
      const lengthText = selectedOption.text.split(' - ')[0];
      
      triggerInAppCheckout(p, lengthText, price);
    });

    el.fabricsGrid.appendChild(card);
  });
}

function selectFabricForVisualizer(fabric) {
  state.selectedFabric = fabric;
  el.visFabricTitle.textContent = fabric.title;
  
  // Apply dominant color dynamically matching title keywords
  const color = getDominantFabricColor(fabric);
  document.querySelectorAll('.visual-fillable').forEach(path => {
    path.style.fill = color;
  });
}

function setVisualizerOutfit(mode) {
  el.btnModeSuit.classList.remove('active');
  el.btnModeShirt.classList.remove('active');
  el.btnModePants.classList.remove('active');

  const fabricColor = state.selectedFabric ? getDominantFabricColor(state.selectedFabric) : '#334155';

  if (mode === 'suit') {
    el.btnModeSuit.classList.add('active');
    document.getElementById('model-jacket').style.fill = fabricColor;
    document.getElementById('model-sleeve-left').style.fill = fabricColor;
    document.getElementById('model-sleeve-right').style.fill = fabricColor;
    document.getElementById('model-pants').style.fill = fabricColor;
  } else if (mode === 'shirt') {
    el.btnModeShirt.classList.add('active');
    document.getElementById('model-jacket').style.fill = '#e2e8f0'; // white shirt proxy jacket
    document.getElementById('model-sleeve-left').style.fill = '#e2e8f0';
    document.getElementById('model-sleeve-right').style.fill = '#e2e8f0';
    document.getElementById('model-pants').style.fill = '#1a1a1c'; // neutral dark pant
  } else if (mode === 'pants') {
    el.btnModePants.classList.add('active');
    document.getElementById('model-jacket').style.fill = '#1a1a1c'; // neutral jacket
    document.getElementById('model-sleeve-left').style.fill = '#1a1a1c';
    document.getElementById('model-sleeve-right').style.fill = '#1a1a1c';
    document.getElementById('model-pants').style.fill = fabricColor; // fabric pants
  }
}

// --- CUSTOMER DASHBOARD POPULATOR ---
async function loadCustomerDashboard() {
  if (!state.userPhone) return;

  try {
    const res = await fetch(`/api/orders?phone=${state.userPhone}`);
    const data = await res.json();
    
    state.orders = data.orders;
    state.metrics = data.metrics;

    // Extract name dynamically from latest order if present, fallback to localStorage, then Guest
    if (state.orders && state.orders.length > 0) {
      state.userName = state.orders[0].customer_name || "Valued Customer";
    } else {
      const savedName = localStorage.getItem(`mm_name_${state.userPhone}`);
      state.userName = savedName || "Valued Guest";
    }

    // Display updates
    el.welcomeName.textContent = state.userName.split(' ')[0];
    el.welcomeName.style.cursor = 'pointer';
    el.welcomeName.title = 'Click to edit your name';
    
    // Add single event listener for personalization
    if (!el.welcomeName.hasAttribute('data-edit-bound')) {
      el.welcomeName.setAttribute('data-edit-bound', 'true');
      el.welcomeName.addEventListener('click', () => {
        const newName = prompt("Personalize your dashboard - Enter your name:", state.userName);
        if (newName && newName.trim()) {
          state.userName = newName.trim();
          localStorage.setItem(`mm_name_${state.userPhone}`, state.userName);
          el.welcomeName.textContent = state.userName.split(' ')[0];
          el.userNameDisplay.textContent = state.userName;
          el.welcomeName.title = 'Click to edit your name';
        }
      });
    }

    el.userNameDisplay.textContent = state.userName;
    el.userPhoneDisplay.textContent = `+91 ${state.userPhone}`;

    // Update loyalty badges based on yearly spent
    let tier = 'Silver Club Member';
    if (state.metrics.spentThisYear >= 10000) tier = 'Platinum Elite Member';
    else if (state.metrics.spentThisYear >= 5000) tier = 'Gold Club Member';

    state.loyaltyTier = tier;
    el.sidebarTier.textContent = tier.split(' ')[0] + " Tier";
    el.loyaltyTierName.textContent = tier;

    // Update numbers
    el.spentMonth.textContent = `₹${state.metrics.spentThisMonth.toFixed(2)}`;
    el.spentYear.textContent = `₹${state.metrics.spentThisYear.toFixed(2)}`;
    el.pendingCount.textContent = state.metrics.pendingCount;
    el.transitCount.textContent = state.metrics.inTransitCount;
    el.deliveredCount.textContent = state.metrics.deliveredCount;

    // Draw chart
    drawSpendingChart();

    // Render Order lists
    renderOrdersTable('all');

    // Update latest active shipment tracker
    renderTimelineTracker();

  } catch (err) {
    console.error("Error loading dashboard data", err);
  }
}

// --- TIMELINE TRACKER DRAWING ---
function renderTimelineTracker() {
  // Find latest in_transit or pending order, fallback to latest delivered
  const activeOrder = state.orders.find(o => o.status === 'in_transit' || o.status === 'pending') 
                      || state.orders[0];

  if (!activeOrder) {
    el.activeTrackerContainer.classList.add('hidden');
    el.noActiveOrdersMsg.classList.remove('hidden');
    return;
  }

  el.activeTrackerContainer.classList.remove('hidden');
  el.noActiveOrdersMsg.classList.add('hidden');

  el.trackOrderId.textContent = `#${activeOrder.id}`;
  
  // Set source badge
  el.latestOrderSourceBadge.textContent = activeOrder.source;
  if (activeOrder.source === 'whatsapp') {
    el.latestOrderSourceBadge.style.color = '#25d366';
    el.latestOrderSourceBadge.style.borderColor = '#25d366';
  } else {
    el.latestOrderSourceBadge.style.color = '#38bdf8';
    el.latestOrderSourceBadge.style.borderColor = '#38bdf8';
  }

  // Stepper highlights
  el.stepPlaced.className = 'step';
  el.stepPaidVerify.className = 'step';
  el.stepTransit.className = 'step';
  el.stepDelivered.className = 'step';

  const status = activeOrder.status;

  if (status === 'pending') {
    el.stepPlaced.className = 'step step-completed';
    // If prepaid is verified
    if (activeOrder.payment_status === 'approved') {
      el.stepPaidVerify.className = 'step step-completed';
      el.stepTransit.className = 'step step-active';
    } else {
      el.stepPaidVerify.className = 'step step-active';
    }
  } else if (status === 'in_transit') {
    el.stepPlaced.className = 'step step-completed';
    el.stepPaidVerify.className = 'step step-completed';
    el.stepTransit.className = 'step step-completed';
    el.stepDelivered.className = 'step step-active';
  } else if (status === 'delivered') {
    el.stepPlaced.className = 'step step-completed';
    el.stepPaidVerify.className = 'step step-completed';
    el.stepTransit.className = 'step step-completed';
    el.stepDelivered.className = 'step step-completed';
  }

  // Logistics widget updates
  if (activeOrder.tracking_number) {
    document.querySelector('.tracking-logistics-info').classList.remove('hidden');
    el.trackingNumDisplay.textContent = activeOrder.tracking_number;
    el.carrierNameDisplay.textContent = activeOrder.carrier || "Courier Partner";
    el.btnTrackAction.href = activeOrder.tracking_url || "#";
    
    // Set custom logos mockups
    const c = (activeOrder.carrier || "").toLowerCase();
    if (c.includes('delhivery')) {
      el.carrierLogo.src = "https://placehold.co/80x30/000000/ffffff?text=Delhivery";
    } else if (c.includes('shiprocket')) {
      el.carrierLogo.src = "https://placehold.co/80x30/7c3aed/ffffff?text=Shiprocket";
    } else {
      el.carrierLogo.src = "https://placehold.co/80x30/1e293b/ffffff?text=BlueDart";
    }
  } else {
    // Hide details area if not shipped yet
    document.querySelector('.tracking-logistics-info').classList.add('hidden');
  }
}

// --- COMPREHENSIVE ORDERS TABLE ---
function renderOrdersTable(filter) {
  el.ordersTableBody.innerHTML = '';
  
  let list = state.orders;
  if (filter !== 'all') {
    list = state.orders.filter(o => o.source === filter);
  }

  if (list.length === 0) {
    el.ordersTableBody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--text-muted);">No orders found for this source filter.</td></tr>`;
    return;
  }

  list.forEach(order => {
    const formattedDate = new Date(order.date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    const isWa = order.source === 'whatsapp';
    const sourceBadge = isWa ? 
      `<span class="order-badge-wa"><i class="fa-brands fa-whatsapp"></i> WhatsApp</span>` :
      `<span class="order-badge-web"><i class="fa-solid fa-globe"></i> Website</span>`;

    // Render items line
    const itemsDescription = order.items.map(it => `${it.title} (${it.variant}) x${it.quantity}`).join('<br>');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${order.id}</strong></td>
      <td>${formattedDate}</td>
      <td>${sourceBadge}</td>
      <td><span class="item-line-desc">${itemsDescription}</span></td>
      <td><strong>₹${order.total_price.toFixed(2)}</strong></td>
      <td><span class="status-badge ${order.status}">${order.status.replace('_', ' ')}</span></td>
      <td>
        ${order.status === 'pending' && order.payment_status === 'pending_approval' ? 
          `<button class="btn btn-outline-gold btn-sm" onclick="showCheckoutModal('${order.id}', ${order.total_price})">Upload Pay Receipt</button>` : 
          `<button class="btn btn-outline-gold btn-sm" onclick="alert('Order Items:\\n${order.items.map(i => i.title).join('\\n')}\\n\\nCarrier: ${order.carrier || 'Pending'}\\nTracking ID: ${order.tracking_number || 'Awaiting dispatch'}')">View Details</button>`
        }
      </td>
    `;
    el.ordersTableBody.appendChild(tr);
  });
}

// --- DYNAMIC SVG CHART DRAWING ---
function drawSpendingChart() {
  el.spendingSvg.innerHTML = '';
  
  // Calculate aggregate sales per month for current year (2026)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyAmounts = new Array(12).fill(0);
  
  state.orders.forEach(o => {
    const d = new Date(o.date);
    if (d.getFullYear() === 2026) {
      monthlyAmounts[d.getMonth()] += o.total_price;
    }
  });

  // Find max value to scale chart height
  const maxVal = Math.max(...monthlyAmounts, 2000);
  const chartHeight = 160;
  const chartWidth = 560;
  const paddingX = 40;
  const paddingY = 20;

  // Draw Grid Lines & Months Labels
  let gridLinesHtml = '';
  let labelsHtml = '';
  
  // 4 Y-Axis indicators
  for (let i = 0; i <= 4; i++) {
    const yVal = paddingY + (chartHeight / 4) * i;
    const priceIndicator = Math.round(maxVal - (maxVal / 4) * i);
    gridLinesHtml += `<line x1="${paddingX}" y1="${yVal}" x2="${chartWidth}" y2="${yVal}" class="chart-grid-line" />`;
    gridLinesHtml += `<text x="${paddingX - 10}" y="${yVal + 3}" class="chart-axis-text" text-anchor="end">₹${priceIndicator}</text>`;
  }

  // Draw Gradient Defs
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="chart-gradient-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--gold-light)" stop-opacity="0.4" />
      <stop offset="100%" stop-color="var(--gold-dark)" stop-opacity="0.0" />
    </linearGradient>
  `;
  el.spendingSvg.appendChild(defs);

  // Calculate coordinates for curve
  const segmentSpacing = (chartWidth - paddingX - 20) / 11; // 11 spaces for 12 months
  const points = [];
  
  monthlyAmounts.forEach((amt, idx) => {
    const x = paddingX + 10 + segmentSpacing * idx;
    const y = paddingY + chartHeight - (amt / maxVal) * chartHeight;
    points.push({ x, y, amt, month: monthNames[idx] });
    
    // Month Label
    labelsHtml += `<text x="${x}" y="${paddingY + chartHeight + 20}" class="chart-axis-text" text-anchor="middle">${monthNames[idx]}</text>`;
  });

  // Build Bezier curve path
  let pathD = '';
  let areaD = '';
  
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      // Midpoint control curves for organic spline feel
      const cpX = p0.x + (p1.x - p0.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    
    // Close area to the bottom axis
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`;
  }

  let pathsHtml = '';
  if (pathD) {
    // Area fill gradient
    pathsHtml += `<path d="${areaD}" fill="url(#chart-gradient-gold)" />`;
    // Top border stroke
    pathsHtml += `<path d="${pathD}" fill="none" stroke="var(--gold)" stroke-width="2.5" />`;
  }

  // Draw data dots
  let dotsHtml = '';
  points.forEach(pt => {
    dotsHtml += `
      <g class="chart-dot-group">
        <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="var(--bg-primary)" stroke="var(--gold)" stroke-width="2" class="chart-dot" />
        <circle cx="${pt.x}" cy="${pt.y}" r="8" fill="transparent" class="chart-dot-overlay">
          <title>${pt.month}: ₹${pt.amt.toFixed(0)}</title>
        </circle>
      </g>
    `;
  });

  el.spendingSvg.innerHTML += gridLinesHtml + pathsHtml + dotsHtml + labelsHtml;
}

// --- CHECKOUT MODAL LOGIC ---
function triggerInAppCheckout(fabric, lengthText, price) {
  // Submit order first to API in "pending" status, then open upload prompt
  const items = [{
    title: fabric.title,
    quantity: 1,
    variant: lengthText,
    price: price
  }];

  fetch('/api/whatsapp-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: state.userName,
      customer_phone: state.userPhone,
      customer_email: state.userEmail,
      customer_address: state.userAddress || 'Awaiting shipping address verification',
      items: items,
      receipt_filename: 'pending_receipt_upload.jpg', // mark it requires upload
      notes: "App in-app cart check-out"
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showCheckoutModal(data.order.id, price);
    } else {
      alert("Order checkout error, please try again.");
    }
  })
  .catch(err => {
    console.error("Order placing error", err);
  });
}

window.showCheckoutModal = function(orderId, amount) {
  activeCheckoutOrderId = orderId;
  el.modalCheckoutAmount.textContent = amount.toFixed(2);
  el.checkoutModal.classList.remove('hidden');
  
  // reset file input
  el.receiptFileInput.value = '';
  el.receiptFileName.textContent = 'Awaiting file...';
  el.btnSubmitOrderReceipt.setAttribute('disabled', 'true');
};

function hideCheckoutModal() {
  el.checkoutModal.classList.add('hidden');
  activeCheckoutOrderId = null;
}

function submitReceiptImage() {
  if (!activeCheckoutOrderId || el.receiptFileInput.files.length === 0) return;

  const file = el.receiptFileInput.files[0];
  const formData = new FormData();
  formData.append('receipt', file);
  formData.append('order_id', activeCheckoutOrderId);

  el.btnSubmitOrderReceipt.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
  el.btnSubmitOrderReceipt.setAttribute('disabled', 'true');

  fetch('/api/upload-receipt', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Payment receipt uploaded successfully! Admin will verify and dispatch within 24 hours.");
      hideCheckoutModal();
      loadCustomerDashboard(); // reload statistics
    } else {
      alert("Upload failed. Error: " + data.error);
    }
  })
  .catch(err => {
    console.error(err);
    alert("Server error uploading screenshot receipt.");
  })
  .finally(() => {
    el.btnSubmitOrderReceipt.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Payment Receipt`;
  });
}

// --- ADMIN MANAGEMENT PORTAL ---
function populateAdminFabricSelect() {
  el.adminSelectFabric.innerHTML = '';
  state.products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.title;
    opt.text = p.title;
    opt.setAttribute('data-id', p.id);
    el.adminSelectFabric.appendChild(opt);
  });
  
  // bind change listener to auto-update base price mockup
  el.adminSelectFabric.addEventListener('change', () => {
    const baseVal = 580; // default suiting base
    const multMap = { '1.2 meters': 1.2, '2 meters': 2, '3 meters': 3, '3.5 meters': 3.5 };
    const factor = multMap[el.adminSelectLength.value] || 2.0;
    el.adminCustomPrice.value = Math.round(baseVal * factor);
  });
  
  el.adminSelectLength.addEventListener('change', () => {
    const baseVal = 580;
    const multMap = { '1.2 meters': 1.2, '2 meters': 2, '3 meters': 3, '3.5 meters': 3.5 };
    const factor = multMap[el.adminSelectLength.value] || 2.0;
    el.adminCustomPrice.value = Math.round(baseVal * factor);
  });
}

async function loadAdminConsole() {
  try {
    const res = await fetch('/api/admin/whatsapp-orders');
    const data = await res.json();
    state.whatsappOrdersAll = data;
    renderAdminOrdersQueue();
  } catch (err) {
    console.error("Admin orders loading failed", err);
  }
}

function renderAdminOrdersQueue() {
  el.adminOrdersQueueBody.innerHTML = '';
  
  if (state.whatsappOrdersAll.length === 0) {
    el.adminOrdersQueueBody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: var(--text-muted)">No offline WhatsApp orders logged.</td></tr>`;
    return;
  }

  state.whatsappOrdersAll.forEach(order => {
    const itemsText = order.items.map(i => `${i.title} (${i.variant})`).join(', ');
    
    // Receipt upload preview button
    let receiptCol = 'Prepaid Approved';
    if (order.payment_receipt) {
      if (order.payment_status === 'approved') {
        receiptCol = `<span style="color:var(--accent-green)"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
      } else {
        receiptCol = `
          <button class="btn btn-outline-gold btn-sm" onclick="window.open('/uploads/${order.payment_receipt}', '_blank')">View Receipt</button>
          <button class="btn btn-gold btn-sm" onclick="approveReceiptDirect('${order.id}')">Approve</button>
        `;
      }
    }

    // Controls Column for status updating
    const controls = `
      <div class="admin-btn-action">
        <select class="select-table-carrier" id="carrier-${order.id}">
          <option value="Delhivery" ${order.carrier === 'Delhivery' ? 'selected':''}>Delhivery</option>
          <option value="Shiprocket" ${order.carrier === 'Shiprocket' ? 'selected':''}>Shiprocket</option>
          <option value="BlueDart" ${order.carrier === 'BlueDart' ? 'selected':''}>BlueDart</option>
        </select>
        <input type="text" class="input-table-tracking" id="track-id-${order.id}" value="${order.tracking_number || ''}" placeholder="Tracking ID">
        <button class="btn btn-gold btn-sm" onclick="updateTrackingDirect('${order.id}')"><i class="fa-solid fa-check"></i></button>
      </div>
    `;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${order.id}</strong></td>
      <td>${order.customer_phone}</td>
      <td>${order.customer_name}</td>
      <td><span class="item-line-desc">${itemsText}</span></td>
      <td>₹${order.total_price.toFixed(0)}</td>
      <td>${receiptCol}</td>
      <td><span class="status-badge ${order.status}">${order.status.replace('_', ' ')}</span></td>
      <td>${controls}</td>
    `;
    el.adminOrdersQueueBody.appendChild(tr);
  });
}

window.approveReceiptDirect = function(orderId) {
  fetch('/api/admin/approve-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Payment Receipt approved successfully.");
      loadAdminConsole();
    }
  });
};

window.updateTrackingDirect = function(orderId) {
  const carrier = document.getElementById(`carrier-${orderId}`).value;
  const trackingNumber = document.getElementById(`track-id-${orderId}`).value.trim();

  if (!trackingNumber) {
    alert("Please enter a tracking number before saving.");
    return;
  }

  fetch(`/api/whatsapp-order/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'in_transit',
      carrier,
      tracking_number: trackingNumber
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(`Order #${orderId} marked In-Transit via ${carrier}`);
      loadAdminConsole();
    }
  });
};

function submitWhatsAppOrder() {
  const customer_name = el.adminCustName.value.trim();
  const customer_phone = el.adminCustPhone.value.trim();
  const customer_email = el.adminCustEmail.value.trim();
  const customer_address = el.adminCustAddress.value.trim();
  const fabricTitle = el.adminSelectFabric.value;
  const variant = el.adminSelectLength.value;
  const price = parseFloat(el.adminCustomPrice.value);
  const notes = el.adminOrderNotes.value.trim();

  if (!customer_name || !customer_phone || !customer_address) {
    alert("Please fill name, phone and shipping address.");
    return;
  }

  const items = [{
    title: fabricTitle,
    quantity: 1,
    variant: variant,
    price: price
  }];

  fetch('/api/whatsapp-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name, customer_phone, customer_email, customer_address, items, notes
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(`Order ${data.order.id} logged successfully!`);
      el.adminOrderForm.reset();
      el.adminSelectLength.value = '2 meters';
      el.adminCustomPrice.value = 1160;
      loadAdminConsole();
    }
  });
}

// --- SHIPROCKET CSV EXPORT ---
function exportShiprocketCSV() {
  // Filter for pending orders that have approved payments
  const pendingOrders = state.whatsappOrdersAll.filter(o => o.status === 'pending' && o.payment_status === 'approved');
  
  if (pendingOrders.length === 0) {
    alert("Export ke liye koi pending paid orders nahi hain.");
    return;
  }

  // Shiprocket Template Columns
  const headers = [
    "Order ID", "Consignee Name", "Phone", "Email", "Address 1", "Address 2", "City", "State", "Pincode", 
    "Payment Method", "Product Name", "Quantity", "SKU", "Declared Value"
  ];

  let csvContent = headers.join(",") + "\n";

  pendingOrders.forEach(o => {
    // Escape commas in address
    const safeAddress = o.customer_address.replace(/"/g, '""');
    // Parse simplified parts for columns
    const cityMatch = safeAddress.match(/,\s*([^,]+),\s*(?:[^,]+)?\s*-\s*(\d{6})/);
    const city = cityMatch ? cityMatch[1] : "Noida";
    const pincode = cityMatch ? cityMatch[2] : "201301";
    
    o.items.forEach(it => {
      const row = [
        o.id,
        `"${o.customer_name}"`,
        o.customer_phone,
        o.customer_email || "no-email@mensmartin.com",
        `"${safeAddress}"`,
        `""`,
        `"${city}"`,
        `"Uttar Pradesh"`,
        pincode,
        "prepaid",
        `"${it.title}"`,
        it.quantity,
        `"HOM-FABRIC"`,
        it.price * it.quantity
      ];
      csvContent += row.join(",") + "\n";
    });
  });

  // Download browser trigger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Shiprocket_Bookings_MensMartin_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- BULK TRACKING IMPORT FLOW ---
function handleManifestFileSelect() {
  const file = el.manifestCsvFile.files[0];
  if (file) {
    el.csvFileName.textContent = file.name;
    el.btnImportManifest.removeAttribute('disabled');
  } else {
    el.csvFileName.textContent = '';
    el.btnImportManifest.setAttribute('disabled', 'true');
  }
}

function uploadManifestCSV() {
  const file = el.manifestCsvFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const trackingRows = parseManifestCSV(text);
    
    if (trackingRows.length === 0) {
      alert("CSV parse fail: Kuch validation checks invalid the. Formatting inspect karein.");
      return;
    }

    // Send payload to backend
    fetch('/api/admin/bulk-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingRows })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`Bulk Import Success! Total ${data.updatedCount} orders updated to In-Transit.`);
        el.manifestCsvFile.value = '';
        el.csvFileName.textContent = '';
        el.btnImportManifest.setAttribute('disabled', 'true');
        loadAdminConsole();
      } else {
        alert("Bulk updating error: " + data.error);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Server error uploading manifest file.");
    });
  };
  reader.readAsText(file);
}

// Simple CSV Parser logic
function parseManifestCSV(text) {
  const lines = text.split('\n');
  const trackingRows = [];
  
  if (lines.length <= 1) return [];

  // Parse Header to find indices
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  // Expected headers: "Order ID" (or "order_id"), "Tracking Number" (or "tracking_no"), "Courier" (or "carrier")
  const orderIdIdx = headers.findIndex(h => h.includes('order id') || h.includes('order_id') || h.includes('orderid'));
  const trackingNumIdx = headers.findIndex(h => h.includes('tracking') || h.includes('awb') || h.includes('waybill'));
  const carrierIdx = headers.findIndex(h => h.includes('courier') || h.includes('carrier') || h.includes('logistics'));

  if (orderIdIdx === -1 || trackingNumIdx === -1) {
    // Standard template fallback (Col 0 = ID, Col 1 = Tracking, Col 2 = Carrier)
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
      if (cols.length >= 2 && cols[0] && cols[1]) {
        trackingRows.push({
          orderId: cols[0],
          trackingNumber: cols[1],
          carrier: cols[2] || 'Shiprocket (Delhivery)'
        });
      }
    }
  } else {
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
      if (cols.length > Math.max(orderIdIdx, trackingNumIdx) && cols[orderIdIdx] && cols[trackingNumIdx]) {
        trackingRows.push({
          orderId: cols[orderIdIdx],
          trackingNumber: cols[trackingNumIdx],
          carrier: carrierIdx !== -1 ? cols[carrierIdx] : 'Shiprocket (Delhivery)'
        });
      }
    }
  }

  return trackingRows;
}
