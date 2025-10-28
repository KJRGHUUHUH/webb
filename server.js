const express = require('express');
const cors = require('cors');
// Use 'axios' or 'node-fetch' to make the real API call to Cashfree
const axios = require('axios'); 

const app = express();
// --- FIX: Use the port from the environment variables for deployment ---
const port = process.env.PORT || 4000;

// --- !!! IMPORTANT: READ KEYS FROM ENVIRONMENT VARIABLES !!! ---
// We will set these variables in our hosting platform, not here.
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;

// Use a variable for the API URL so we can switch between test and live
const CASHFREE_API_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.cashfree.com/pg/orders'         // Production URL
    : 'https://sandbox.cashfree.com/pg/orders'; // Sandbox URL

// --- Configure CORS for your deployed frontend ---
// Replace 'https://your-frontend-url.com' with your actual frontend's URL
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? 'https://your-frontend-url.com' // e.g., 'https://my-payment-page.netlify.app'
        : 'http://localhost:5500'       // Allow local testing (or 127.0.0.1)
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Removed the duplicate, hardcoded keys that were here ---

/**
 * This endpoint simulates creating an order with Cashfree.
 * In a real app, this is where you securely call the Cashfree API.
 */
app.post('/create-payment-session', async (req, res) => {
    console.log('Request received to create payment session...');

    // --- !!! THIS IS THE REAL BACKEND LOGIC YOU NEED TO BUILD !!! ---
    // 1. Define order details (amount, currency, customer info, etc.)
    const orderDetails = {
        order_id: `order_${Date.now()}`,
        order_amount: 99.00,
        order_currency: "INR", // Change as needed
        customer_details: {
            customer_id: `customer_${Date.now()}`,
            customer_email: "customer@example.com",
            customer_phone: "9876543210"
        },
        order_meta: {
            return_url: "https://your-website.com/return?order_id={order_id}"
        }
    };

    try {
        // 2. Make the secure API call to Cashfree
        
        // --- REAL API CALL (Now using environment variables) ---
        const response = await axios.post(
            CASHFREE_API_URL,
            orderDetails,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': CASHFREE_CLIENT_ID,
                    'x-client-secret': CASHFREE_CLIENT_SECRET,
                    'x-api-version': '2022-09-01' // Use the API version you are targeting
                }
            }
        );
        
        const data = response.data;
        
        // 3. Send the REAL payment_session_id to the frontend
        console.log("Real session created:", data.payment_session_id);
        res.json({ paymentSessionId: data.payment_session_id });
        
        // --- MOCK RESPONSE (You should remove this) ---
        /*
        console.log("Simulating backend API call...");
        const mockPaymentSessionId = "session_mock_" + Date.now() + "_" + Math.random().toString(36).substring(2);
        console.log("Generated Mock Payment Session ID:", mockPaymentSessionId);
        res.json({ paymentSessix onId: mockPaymentSessionId });
        */
        // --- END MOCK RESPONSE ---

    } catch (error) {
        console.error("Error creating Cashfree order:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to create payment session" });
    }
    // --- !!! END OF REAL BACKEND LOGIC ---
});

app.listen(port, () => {
    console.log(`http://localhost:3000`);
});

