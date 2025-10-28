const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
// Use port from environment or default to 4000
const port = process.env.PORT || 4000;

// --- CORS Configuration ---
// Define allowed origins
const allowedOrigins = [
    'http://localhost:5500', // For local dev with VS Code Live Server
    'http://127.0.0.1:5500', // Alias for Live Server
    'http://localhost:3000'  // For local dev with `npx serve`
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};

app.use(cors(corsOptions));
app.use(express.json());

// *** FIX: Add Security & Content-Type Headers ***
app.use((req, res, next) => {
    // Fixes 'x-content-type-options' missing header
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// --- API Endpoints ---

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Backend server is healthy and running.');
});

// Endpoint to create a payment session
app.post('/create-payment-session', async (req, res) => {
    
    // *** FIX: Add Cache-Control Header ***
    // This API response should not be cached by the browser
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    console.log('Attempting to create payment session...');
    
    const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
    const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    const url = (NODE_ENV === 'production')
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

    // Check if credentials are loaded
    if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
        console.error('Missing Cashfree credentials. Check environment variables.');
        // Set charset for error response
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const orderId = `ORDER_${Date.now()}`;
    console.log(`Requesting session for Order ID: ${orderId}`);

    const headers = {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_CLIENT_ID,
        'x-client-secret': CASHFREE_CLIENT_SECRET
    };

    const body = {
        "order_id": orderId,
        "order_amount": 1.00,
        "order_currency": "INR",
        "customer_details": {
            "customer_id": "CUST_123",
            "customer_email": "customer@example.com",
            "customer_phone": "9876543210"
        },
        "order_meta": {
            "return_url": "https://your-frontend.com/return?order_id={order_id}"
        },
        "order_note": "Test order from miracleapparels"
    };

    try {
        const response = await axios.post(url, body, { headers });
        console.log('Cashfree API response received:', response.data);
        
        // *** FIX: Set charset for success response ***
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Cashfree API Error:', error.response ? error.response.data : error.message);
        // *** FIX: Set charset for error response ***
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(500).json({ error: 'Failed to create payment session' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});

