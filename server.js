const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 4000;

// Environment variables for Cashfree
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development'; // 'development' or 'production'

// Determine Cashfree API URL based on environment
const CASHFREE_API_URL = NODE_ENV === 'production'
  ? 'https://api.cashfree.com/pg' // Production URL
  : 'https://sandbox.cashfree.com/pg'; // Sandbox (Test) URL

// Define allowed origins
const allowedOrigins = [
  'http://localhost:5500', // For local dev with VS Code Live Server
  'http://127.0.0.1:5500', // Alias for Live Server
  'http://localhost:3000', // For npx serve
  'http://localhost:4000', // In case backend is also on 4000
  'file://' // Allow testing from local files (though fetch may be blocked by browser)
  // Add your deployed frontend URL here, e.g., 'https://your-frontend.netlify.app'
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      // Origin is in the allowed list
      callback(null, true);
    } else {
      // Origin is not allowed
      console.warn(`CORS: Blocked origin - ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // For legacy browser support
};

// Use CORS middleware
app.use(cors(corsOptions));

// Simple middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Endpoint to create a payment session
app.post('/create-payment-session', async (req, res) => {
  console.log('Attempting to create payment session...');
  
  if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
    console.error('Missing Cashfree credentials. Check environment variables.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Generate a unique order_id (e.g., using a timestamp or UUID)
    const orderId = `ORDER_${Date.now()}`;
    const orderAmount = 1.00; // Example amount
    const orderCurrency = 'INR';

    console.log(`Requesting session for Order ID: ${orderId}`);

    // Make the POST request to Cashfree to get an auth token
    const authResponse = await axios.post(
      `${CASHFREE_API_URL}/orders`,
      {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: orderCurrency,
        customer_details: {
          customer_id: 'CUST_123', // Replace with a real customer ID
          customer_email: 'customer@example.com',
          customer_phone: '9876543210'
        },
        order_meta: {
          // URLs to redirect to after payment
          return_url: 'https://your-frontend.com/return?order_id={order_id}', // Replace with your frontend URL
        },
        order_note: 'Test order from miracleapparels'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CASHFREE_CLIENT_ID,
          'x-client-secret': CASHFREE_CLIENT_SECRET,
          'x-api-version': '2023-08-01' // Use a current API version
        }
      }
    );

    // Log success and extract session ID
    console.log('Cashfree API response received:', authResponse.data);
    const paymentSessionId = authResponse.data.payment_session_id;

    if (!paymentSessionId) {
      console.error('Failed to get payment_session_id from Cashfree');
      return res.status(500).json({ error: 'Failed to create payment session' });
    }

    // Send the payment_session_id back to the frontend
    res.json({ payment_session_id: paymentSessionId });

  } catch (error) {
    // Handle errors from the Cashfree API
    console.error('Error creating payment session:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: 'Failed to create payment session',
      details: error.response ? error.response.data : error.message
    });
  }
});

// Root endpoint for health checks
app.get('/', (req, res) => {
  res.send('Payment backend is running!');
});

// Start the server
app.listen(port, () => {
  // Use '0.0.0.0' to bind to all available interfaces, which is crucial for containers
  console.log(`Backend server running at http://localhost:${port}`);
});

