const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const http = require('http');
const https = require('https');

// Load env variables
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(path.dirname(__dirname), '.env'),
  path.join(path.dirname(path.dirname(__dirname)), '.env')
];

let STORE_URL = '';
let ACCESS_TOKEN = '';

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading env from ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const parts = line.trim().split('=', 2);
      if (parts.length === 2 && !parts[0].startsWith('#')) {
        const key = parts[0].trim();
        const val = parts[1].trim();
        if (key === 'SHOPIFY_STORE_URL') STORE_URL = val;
        if (key === 'SHOPIFY_ACCESS_TOKEN') ACCESS_TOKEN = val;
      }
    });
    break;
  }
}

// Clean store URL
if (STORE_URL.startsWith('http://')) STORE_URL = STORE_URL.slice(7);
if (STORE_URL.startsWith('https://')) STORE_URL = STORE_URL.slice(8);
if (STORE_URL.endsWith('/')) STORE_URL = STORE_URL.slice(0, -1);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create upload directory if not exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer for receipt uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Helper to normalize phone numbers (retains last 10 digits for Indian standard)
function normalizePhone(phone) {
  if (!phone) return "";
  const cleaned = phone.toString().replace(/\D/g, "");
  if (cleaned.length >= 10) {
    return cleaned.slice(-10); // get last 10 digits
  }
  return cleaned;
}

// Local WhatsApp orders helper
const dbPath = path.join(__dirname, 'data', 'whatsapp_orders.json');
function getWhatsAppOrders() {
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB, returning empty', err);
    return [];
  }
}

function saveWhatsAppOrders(orders) {
  fs.writeFileSync(dbPath, JSON.stringify(orders, null, 2), 'utf-8');
}

// Mock Shopify Data Fallbacks
const MOCK_SHOPIFY_PRODUCTS = [
  {
    id: 99001,
    title: "Super 120 Royal Navy Blue Suiting Fabric",
    body_html: "<p>Premium wool-blend suiting fabric, ideal for suits and trousers.</p>",
    vendor: "House of Martin",
    product_type: "Fabric",
    images: [{ src: "/assets/navy_suiting.png" }],
    variants: [
      { id: 11, title: "1.2 meters", price: "696" },
      { id: 12, title: "2 meters", price: "1160" },
      { id: 13, title: "3 meters", price: "1740" },
      { id: 14, title: "3.5 meters", price: "2030" }
    ]
  },
  {
    id: 99002,
    title: "Super 120 Dark Green Dobby Suiting Fabric",
    body_html: "<p>Premium textured dobby weave suiting, rich dark forest green.</p>",
    vendor: "House of Martin",
    product_type: "Fabric",
    images: [{ src: "/assets/green_suiting.png" }],
    variants: [
      { id: 21, title: "1.2 meters", price: "696" },
      { id: 22, title: "2 meters", price: "1160" },
      { id: 23, title: "3 meters", price: "1740" },
      { id: 24, title: "3.5 meters", price: "2030" }
    ]
  },
  {
    id: 99003,
    title: "Counts Luxury White Cotton Fabric",
    body_html: "<p>100% fine cotton shirting fabric, breathable and crisp finish.</p>",
    vendor: "House of Martin",
    product_type: "Fabric",
    images: [{ src: "/assets/white_cotton.png" }],
    variants: [
      { id: 31, title: "1.2 meters", price: "696" },
      { id: 32, title: "2 meters", price: "1160" },
      { id: 33, title: "3 meters", price: "1740" },
      { id: 34, title: "3.5 meters", price: "2030" }
    ]
  },
  {
    id: 99004,
    title: "Premium Linen Charcoal Black Fabric",
    body_html: "<p>High grade flax linen fabric, light and luxurious feel.</p>",
    vendor: "House of Martin",
    product_type: "Fabric",
    images: [{ src: "/assets/charcoal_linen.png" }],
    variants: [
      { id: 41, title: "1.2 meters", price: "696" },
      { id: 42, title: "2 meters", price: "1160" },
      { id: 43, title: "3 meters", price: "1740" },
      { id: 44, title: "3.5 meters", price: "2030" }
    ]
  }
];

const MOCK_SHOPIFY_ORDERS = [
  {
    id: "HOM-7781",
    customer: {
      first_name: "Rajesh",
      last_name: "Kumar",
      phone: "+919876543210",
      email: "rajesh@gmail.com"
    },
    created_at: "2026-06-05T10:11:00.000Z",
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    total_price: "1740",
    line_items: [
      {
        title: "Counts Luxury White Cotton Fabric",
        quantity: 1,
        variant_title: "3 meters",
        price: "1740"
      }
    ],
    shipping_address: {
      address1: "Flat 402, Golden Heights",
      city: "Noida",
      zip: "201301"
    }
  }
];

// Promise-based request wrapper for Shopify Admin API
function makeShopifyRequest(pathQuery) {
  return new Promise((resolve, reject) => {
    if (!STORE_URL || !ACCESS_TOKEN) {
      return reject(new Error('Shopify credentials missing'));
    }

    const options = {
      hostname: STORE_URL,
      path: `/admin/api/2024-04/${pathQuery}`,
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Shopify API error: ${res.statusCode} - ${body}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

// OTP store cache (in-memory)
const otpStore = {};

// Endpoint: Generate and Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  const cleanPhone = normalizePhone(phone);
  
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number is required.' });
  }

  // Generate a random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  otpStore[cleanPhone] = { otp, expires };
  console.log(`[OTP] Generated OTP ${otp} for phone ${cleanPhone}. Expires in 5 mins.`);

  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    // Call Fast2SMS API (Indian SMS gateway)
    const options = {
      method: 'POST',
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      headers: {
        'authorization': fast2smsKey,
        'Content-Type': 'application/json'
      }
    };
    const smsReq = https.request(options, (smsRes) => {
      let body = '';
      smsRes.on('data', chunk => body += chunk);
      smsRes.on('end', () => console.log('Fast2SMS Response:', body));
    });
    smsReq.on('error', err => console.error('Fast2SMS Error:', err));
    smsReq.write(JSON.stringify({
      route: 'otp',
      variables_values: otp,
      numbers: cleanPhone
    }));
    smsReq.end();
  }

  res.json({
    success: true,
    testMode: !fast2smsKey,
    otp: !fast2smsKey ? otp : undefined, // return OTP code for testing if no API key is configured
    message: fast2smsKey ? 'OTP sent via SMS' : 'OTP generated (demo mode)'
  });
});

// Endpoint: Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const cleanPhone = normalizePhone(phone);
  
  if (!cleanPhone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const record = otpStore[cleanPhone];
  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this phone number' });
  }

  if (Date.now() > record.expires) {
    delete otpStore[cleanPhone];
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({ error: 'Invalid OTP. Please check the code and try again.' });
  }

  // Success: delete OTP from store
  delete otpStore[cleanPhone];

  // Try to find the user's name to personalize the welcome message
  let customerName = "Valued Guest";
  const localOrders = getWhatsAppOrders();
  const matchedLocal = localOrders.find(o => normalizePhone(o.customer_phone) === cleanPhone);
  
  if (matchedLocal) {
    customerName = matchedLocal.customer_name;
  } else {
    const matchedMock = MOCK_SHOPIFY_ORDERS.find(o => o.customer && normalizePhone(o.customer.phone) === cleanPhone);
    if (matchedMock) {
      customerName = `${matchedMock.customer.first_name} ${matchedMock.customer.last_name}`;
    }
  }

  res.json({
    success: true,
    phone: cleanPhone,
    customerName
  });
});

// Endpoint: Fetch Shopify Products
app.get('/api/products', async (req, res) => {
  try {
    console.log("Fetching products from Shopify...");
    const data = await makeShopifyRequest('products.json?limit=50');
    res.json(data.products || []);
  } catch (err) {
    console.warn("Shopify Product Fetch failed, serving Mock fabrics:", err.message);
    res.json(MOCK_SHOPIFY_PRODUCTS);
  }
});

// Endpoint: Fetch unified orders
app.get('/api/orders', async (req, res) => {
  const customerPhone = req.query.phone;
  if (!customerPhone) {
    return res.status(400).json({ error: 'Phone parameter is required' });
  }

  const cleanTargetPhone = normalizePhone(customerPhone);
  console.log(`Searching orders for clean phone: ${cleanTargetPhone}`);

  // 1. Fetch Shopify Orders
  let shopifyOrders = [];
  try {
    console.log("Fetching orders from Shopify...");
    const data = await makeShopifyRequest('orders.json?status=any&limit=100');
    const rawOrders = data.orders || [];

    // Filter by phone match
    shopifyOrders = rawOrders.filter(order => {
      const custPhone = order.customer ? normalizePhone(order.customer.phone) : "";
      const shipPhone = order.shipping_address ? normalizePhone(order.shipping_address.phone) : "";
      const billPhone = order.billing_address ? normalizePhone(order.billing_address.phone) : "";

      return (custPhone && custPhone === cleanTargetPhone) ||
             (shipPhone && shipPhone === cleanTargetPhone) ||
             (billPhone && billPhone === cleanTargetPhone);
    }).map(order => {
      // Map Shopify structure to our uniform dashboard structure
      const isDelivered = order.fulfillment_status === 'fulfilled';
      
      return {
        id: `HOM-${order.order_number || order.id}`,
        customer_name: order.customer ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim() : "Website Customer",
        customer_phone: customerPhone,
        customer_email: order.customer ? order.customer.email : "",
        customer_address: order.shipping_address ? `${order.shipping_address.address1 || ""}, ${order.shipping_address.city || ""}, ${order.shipping_address.zip || ""}` : "",
        date: order.created_at,
        status: isDelivered ? "delivered" : "in_transit", // Assume active shopify orders are in-transit if paid
        total_price: parseFloat(order.total_price),
        source: "website",
        items: (order.line_items || []).map(li => ({
          title: li.title,
          quantity: li.quantity,
          variant: li.variant_title || "Standard",
          price: parseFloat(li.price)
        })),
        payment_status: order.financial_status === 'paid' ? 'approved' : 'pending_approval',
        carrier: "Website Logistics",
        tracking_number: "Shopify Standard",
        tracking_url: "#"
      };
    });
  } catch (err) {
    console.warn("Shopify Orders Fetch failed, trying mock fallback:", err.message);
    // Fallback using mock orders filtered by phone
    shopifyOrders = MOCK_SHOPIFY_ORDERS.filter(order => {
      const phone = order.customer ? normalizePhone(order.customer.phone) : "";
      return phone === cleanTargetPhone;
    }).map(order => ({
      id: order.id,
      customer_name: `${order.customer.first_name} ${order.customer.last_name}`,
      customer_phone: customerPhone,
      customer_email: order.customer.email,
      customer_address: `${order.shipping_address.address1}, ${order.shipping_address.city}, ${order.shipping_address.zip}`,
      date: order.created_at,
      status: order.fulfillment_status === 'fulfilled' ? "delivered" : "in_transit",
      total_price: parseFloat(order.total_price),
      source: "website",
      items: order.line_items.map(li => ({
        title: li.title,
        quantity: li.quantity,
        variant: li.variant_title,
        price: parseFloat(li.price)
      })),
      payment_status: 'approved',
      carrier: "Delhivery",
      tracking_number: "DHLV8817263",
      tracking_url: "https://www.delhivery.com"
    }));
  }

  // 2. Fetch local WhatsApp orders
  const allWhatsApp = getWhatsAppOrders();
  const matchedWhatsApp = allWhatsApp.filter(order => normalizePhone(order.customer_phone) === cleanTargetPhone);

  // 3. Merge and Sort
  const unifiedOrders = [...shopifyOrders, ...matchedWhatsApp].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 4. Calculate Customer Metrics
  let spentThisMonth = 0;
  let spentThisYear = 0;
  let pendingCount = 0;
  let inTransitCount = 0;
  let deliveredCount = 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  unifiedOrders.forEach(order => {
    const orderDate = new Date(order.date);
    const orderYear = orderDate.getFullYear();
    const orderMonth = orderDate.getMonth();

    if (orderYear === currentYear) {
      spentThisYear += order.total_price;
      if (orderMonth === currentMonth) {
        spentThisMonth += order.total_price;
      }
    }

    if (order.status === 'pending') pendingCount++;
    else if (order.status === 'in_transit') inTransitCount++;
    else if (order.status === 'delivered') deliveredCount++;
  });

  res.json({
    orders: unifiedOrders,
    metrics: {
      spentThisMonth,
      spentThisYear,
      pendingCount,
      inTransitCount,
      deliveredCount
    }
  });
});

// Endpoint: Admin fetch ALL whatsapp orders (for manage panel)
app.get('/api/admin/whatsapp-orders', (req, res) => {
  const orders = getWhatsAppOrders();
  res.json(orders);
});

// Endpoint: Admin log new WhatsApp order
app.post('/api/whatsapp-order', (req, res) => {
  const { customer_name, customer_phone, customer_email, customer_address, items, notes, receipt_filename } = req.body;

  if (!customer_name || !customer_phone || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing name, phone or items' });
  }

  const orders = getWhatsAppOrders();
  
  // Calculate total price
  let total_price = 0;
  items.forEach(it => {
    total_price += parseFloat(it.price) * parseInt(it.quantity || 1);
  });

  const newId = "WA-" + (orders.length > 0 ? (parseInt(orders[0].id.split('-')[1]) + 1) : 1001);

  const newOrder = {
    id: newId,
    customer_name,
    customer_phone,
    customer_email: customer_email || "",
    customer_address: customer_address || "",
    date: new Date().toISOString(),
    status: "pending",
    total_price,
    source: "whatsapp",
    items,
    payment_status: receipt_filename ? "pending_approval" : "approved", // default prepaid approved if no receipt upload required
    payment_receipt: receipt_filename || "",
    carrier: "",
    tracking_number: "",
    tracking_url: "",
    notes: notes || ""
  };

  // Prepend to show latest first
  orders.unshift(newOrder);
  saveWhatsAppOrders(orders);

  res.json({ success: true, order: newOrder });
});

// Endpoint: Customer uploads receipt for a pending order
app.post('/api/upload-receipt', upload.single('receipt'), (req, res) => {
  const { order_id } = req.body;
  if (!req.file || !order_id) {
    return res.status(400).json({ error: 'Missing receipt image or order ID' });
  }

  const orders = getWhatsAppOrders();
  const orderIdx = orders.findIndex(o => o.id === order_id);
  if (orderIdx === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders[orderIdx].payment_receipt = req.file.filename;
  orders[orderIdx].payment_status = 'pending_approval';
  saveWhatsAppOrders(orders);

  res.json({ success: true, filename: req.file.filename });
});

// Endpoint: Admin approve payment
app.post('/api/admin/approve-payment', (req, res) => {
  const { order_id } = req.body;
  const orders = getWhatsAppOrders();
  const orderIdx = orders.findIndex(o => o.id === order_id);

  if (orderIdx === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders[orderIdx].payment_status = 'approved';
  saveWhatsAppOrders(orders);

  res.json({ success: true });
});

// Endpoint: Admin bulk update tracking info via CSV upload
// Expected structure: JSON array representing parsed CSV rows
app.post('/api/admin/bulk-tracking', (req, res) => {
  const { trackingRows } = req.body; // Array of { orderId, trackingNumber, carrier }
  if (!trackingRows || !Array.isArray(trackingRows)) {
    return res.status(400).json({ error: 'Invalid tracking rows payload' });
  }

  const orders = getWhatsAppOrders();
  let updatedCount = 0;

  trackingRows.forEach(row => {
    if (!row.orderId || !row.trackingNumber) return;

    const orderIdx = orders.findIndex(o => o.id.toString().trim().toLowerCase() === row.orderId.toString().trim().toLowerCase());
    if (orderIdx !== -1) {
      const carrier = row.carrier || 'Delhivery';
      let trackingUrl = '#';

      if (carrier.toLowerCase().includes('delhivery')) {
        trackingUrl = `https://www.delhivery.com/track/package/${row.trackingNumber}`;
      } else if (carrier.toLowerCase().includes('shiprocket')) {
        trackingUrl = `https://www.shiprocket.in/shipment-tracking/${row.trackingNumber}`;
      } else if (carrier.toLowerCase().includes('bluedart') || carrier.toLowerCase().includes('blue dart')) {
        trackingUrl = `https://www.bluedart.com/tracking?trackid=${row.trackingNumber}`;
      }

      orders[orderIdx].tracking_number = row.trackingNumber;
      orders[orderIdx].carrier = carrier;
      orders[orderIdx].tracking_url = trackingUrl;
      orders[orderIdx].status = 'in_transit';
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    saveWhatsAppOrders(orders);
  }

  res.json({ success: true, updatedCount });
});

// Endpoint: Admin update single order tracking / status manually
app.patch('/api/whatsapp-order/:id', (req, res) => {
  const orderId = req.params.id;
  const { status, carrier, tracking_number, tracking_url } = req.body;

  const orders = getWhatsAppOrders();
  const orderIdx = orders.findIndex(o => o.id === orderId);

  if (orderIdx === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (status) orders[orderIdx].status = status;
  if (carrier) orders[orderIdx].carrier = carrier;
  if (tracking_number) orders[orderIdx].tracking_number = tracking_number;
  
  if (tracking_number && !tracking_url) {
    // Generate simple tracker URL
    const c = (carrier || "").toLowerCase();
    if (c.includes('delhivery')) {
      orders[orderIdx].tracking_url = `https://www.delhivery.com/track/package/${tracking_number}`;
    } else if (c.includes('shiprocket')) {
      orders[orderIdx].tracking_url = `https://www.shiprocket.in/shipment-tracking/${tracking_number}`;
    } else {
      orders[orderIdx].tracking_url = `https://track.shiprocket.co/tracking/${tracking_number}`;
    }
  } else if (tracking_url) {
    orders[orderIdx].tracking_url = tracking_url;
  }

  saveWhatsAppOrders(orders);
  res.json({ success: true, order: orders[orderIdx] });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mens Martin Unified Server running on http://localhost:${PORT}`);
});
