# Razorpay Integration - Webhooks & Callbacks Guide

## 📡 Overview: How Razorpay Works with Your Dashboard

When you integrate **Razorpay API**, the payment flow involves three main actors:

```
┌──────────────────────┐
│   Frontend (User)    │
│   (Your Dashboard)   │
└──────────┬───────────┘
           │
           │ 1. User initiates payment
           │ 2. Frontend opens Razorpay modal/redirect
           │
           ▼
┌──────────────────────────┐         ┌─────────────────────┐
│  Your Backend Server     │◄────────│  Razorpay Servers   │
│  (Node.js/Express)       │  4.Webhook  (Payment Gateway) │
│                          │────────►│                     │
│                          │  5.Verify Signature          │
└──────────┬───────────────┘         └─────────────────────┘
           │
           │ 3. After payment at Razorpay
           │    Razorpay sends webhook
           │
           ▼
┌──────────────────────────┐
│   Database (MySQL)       │
│  - Store transaction     │
│  - Store payment details │
└──────────────────────────┘
```

---

## 🔄 Complete Payment Flow with Razorpay

### **Phase 1: User Initiates Payment (Frontend)**

```
User Dashboard
    ↓
User clicks "Pay" button → Frontend requests payment link/order from Backend
    ↓
Backend (Controller) receives request:
  - Create Razorpay Order via Razorpay API
  - Order ID + Amount returned to Frontend
    ↓
Frontend opens Razorpay Checkout Modal:
  - Shows payment form
  - User enters card/UPI details
  - User completes payment at Razorpay
```

### **Phase 2: Payment at Razorpay (On Razorpay Servers)**

```
Razorpay Checkout Modal
    ↓
User enters payment details
    ↓
Razorpay processes payment:
  - Validates card/UPI
  - Contacts payment gateway (bank, UPI provider)
  - Payment succeeds/fails
    ↓
Razorpay returns to Frontend:
  - Success: Payment ID, Order ID
  - Failure: Error message
```

### **Phase 3: Webhook & Callback (Backend)**

```
Razorpay Server
    ↓
After payment success/failure:
  1. Razorpay sends Webhook to your Backend
     POST /api/payments/webhook
     Body: {
       event: "payment.authorized" or "payment.failed",
       payload: { payment: {...}, order: {...} }
     }
    ↓
  2. Your Backend receives webhook:
     - Verify webhook signature (security check)
     - Verify payment amount matches order
     - Store payment in database
     - Update transaction status
    ↓
  3. Trigger User's Callback:
     - Get stored callback URL for this user
     - Send POST request to user's callback URL
     - Payload: { order_id, payment_id, status, amount, ... }
    ↓
  4. Send notification to Frontend:
     - WebSocket or Polling
     - UI updates payment status
```

---

## 🔐 Webhook Security: Signature Verification

**Important:** Always verify webhook signatures to ensure Razorpay sent the webhook, not an attacker!

### Signature Verification Process

```javascript
// Razorpay sends:
{
  event: "payment.authorized",
  payload: {...},
  signature: "abcd1234xyz..." // HMAC SHA256 signature
}

// Your Backend does:
const crypto = require('crypto');

const secret = process.env.RAZORPAY_WEBHOOK_SECRET; // From Razorpay Dashboard

// Create signature from received data
const generatedSignature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

// Compare signatures
if (generatedSignature === webhook.signature) {
  console.log('✅ Webhook is authentic from Razorpay');
  // Process payment
} else {
  console.log('❌ Webhook is fake/tampered');
  // Reject webhook
}
```

---

## 📊 Database Structure Changes Needed

### Current Setup
```sql
transactions table:
- Has: payer_id, payee_id, amount, status
- Missing: Third-party payment details
```

### Enhanced Setup (with Razorpay)
```sql
transactions table:
  ├── id
  ├── payer_id
  ├── payee_id
  ├── amount
  ├── status ('pending', 'processing', 'success', 'failed')
  ├── razorpay_order_id    ← Link to Razorpay
  ├── razorpay_payment_id   ← Razorpay payment ID
  ├── razorpay_signature    ← Webhook signature for audit
  ├── payment_method        ← 'card', 'upi', 'netbanking'
  ├── payment_gateway       ← 'razorpay'
  ├── created_at
  └── updated_at

razorpay_webhooks table (optional - audit log):
  ├── id
  ├── event_id (from Razorpay)
  ├── event_type           ← 'payment.authorized', 'payment.failed'
  ├── payload              ← Full webhook JSON
  ├── signature
  ├── processed (bool)     ← If we processed this
  ├── received_at
  └── processed_at
```

---

## 🛠️ Implementation Code Structure

### 1. **Razorpay Configuration**

```javascript
// config/razorpay.js
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       // Public key
  key_secret: process.env.RAZORPAY_KEY_SECRET // Secret key
});

module.exports = razorpay;
```

### 2. **Create Order API (Backend)**

```javascript
// routes/payment.routes.js
router.post('/create-order', auth, createRazorpayOrder);

// controllers/payment.controller.js
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, user_id } = req.body;
    
    // Create order on Razorpay
    const order = await razorpay.orders.create({
      amount: amount * 100,  // Amount in paise (smallest unit)
      currency: 'INR',
      receipt: `receipt_${user_id}_${Date.now()}`,
      notes: {
        user_id,
        purpose: 'wallet_topup'
      }
    });

    // Store order in database
    await Transaction.create({
      payer_id: user_id,
      payee_id: null,
      amount: amount,
      status: 'pending',
      razorpay_order_id: order.id,
      payment_gateway: 'razorpay'
    });

    res.json({
      order_id: order.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3. **Webhook Endpoint (Backend)**

```javascript
// routes/payment.routes.js (Public - NO auth needed)
router.post('/webhook', handleRazorpayWebhook);

// controllers/payment.controller.js
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhook = req.body;
    const signature = req.headers['x-razorpay-signature'];

    // ✅ VERIFY SIGNATURE
    const body = JSON.stringify(webhook.payload);
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // ✅ SIGNATURE VERIFIED - Process webhook
    const event = webhook.event;
    const payload = webhook.payload;

    if (event === 'payment.authorized') {
      await handlePaymentSuccess(payload);
    } else if (event === 'payment.failed') {
      await handlePaymentFailure(payload);
    }

    // ✅ Always return 200 to Razorpay (acknowledge receipt)
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

const handlePaymentSuccess = async (payload) => {
  const { payment, order } = payload;

  // Update transaction status
  await Transaction.update(
    {
      status: 'success',
      razorpay_payment_id: payment.id,
      razorpay_signature: payment.signature,
      payment_method: payment.method
    },
    {
      where: { razorpay_order_id: order.id }
    }
  );

  // Get transaction details
  const transaction = await Transaction.findOne({
    where: { razorpay_order_id: order.id },
    include: ['Payer', 'Payee']
  });

  // ✅ SEND USER CALLBACK
  await sendUserCallback(transaction, 'success');

  // ✅ UPDATE WALLET (add funds)
  await updateUserWallet(transaction.payer_id, transaction.amount);

  // ✅ LOG EVENT
  logger.info(`Payment successful: ${order.id}`);
};

const handlePaymentFailure = async (payload) => {
  const { payment, order } = payload;

  await Transaction.update(
    {
      status: 'failed',
      razorpay_payment_id: payment.id
    },
    {
      where: { razorpay_order_id: order.id }
    }
  );

  const transaction = await Transaction.findOne({
    where: { razorpay_order_id: order.id }
  });

  // ✅ SEND USER CALLBACK
  await sendUserCallback(transaction, 'failed');

  logger.warn(`Payment failed: ${order.id}`);
};
```

### 4. **Send Callback to User**

```javascript
// services/callback.service.js
const sendUserCallback = async (transaction, status) => {
  try {
    // Get user's callback URL from MerchantDetails
    const user = await User.findByPk(transaction.payer_id);
    const merchantDetails = await user.getMerchantDetails();

    if (!merchantDetails || !merchantDetails.callback_url) {
      logger.warn(`No callback URL for user ${transaction.payer_id}`);
      return;
    }

    const callbackPayload = {
      order_id: transaction.razorpay_order_id,
      payment_id: transaction.razorpay_payment_id,
      status: status,
      amount: transaction.amount,
      currency: 'INR',
      timestamp: new Date().toISOString(),
      signature: generateCallbackSignature({
        order_id: transaction.razorpay_order_id,
        status: status,
        amount: transaction.amount
      })
    };

    // Send POST request to user's callback URL
    const response = await axios.post(
      merchantDetails.callback_url,
      callbackPayload,
      { timeout: 5000 }
    );

    logger.info(`Callback sent to ${merchantDetails.callback_url}`, response.status);

  } catch (error) {
    logger.error(`Callback failed for user ${transaction.payer_id}:`, error.message);
    // Store failed callback for retry
    await storeFailedCallback(transaction, error);
  }
};
```

### 5. **Frontend: Payment Modal**

```typescript
// frontend/src/components/PaymentModal.tsx
import { loadScript } from '@razorpay/razorpay-js';

const PaymentModal = ({ amount, userId }: Props) => {
  const handlePayment = async () => {
    try {
      // Step 1: Create order from backend
      const orderResponse = await axios.post('/api/payments/create-order', {
        amount,
        user_id: userId
      });

      const { order_id, key_id } = orderResponse.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: key_id,
        amount: amount * 100,
        currency: 'INR',
        order_id: order_id,
        handler: (response) => {
          // Step 3: After payment, verify on backend
          verifyPayment(response);
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error('Failed to initiate payment');
    }
  };

  const verifyPayment = async (response) => {
    try {
      const verifyResponse = await axios.post('/api/payments/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      if (verifyResponse.data.success) {
        toast.success('Payment successful!');
        // Refresh wallet balance
        fetchWalletBalance();
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      toast.error('Verification error');
    }
  };

  return (
    <button onClick={handlePayment}>
      Pay ₹{amount}
    </button>
  );
};
```

---

## 📥 **User's Callback Configuration**

In your **Admin Dashboard**, users can configure where they want to receive payment notifications:

### Admin Page to Configure User Callbacks
```
/admin/users/:userId/callbacks

Form:
┌─────────────────────────────────────────┐
│ Payment Callback URL                    │
│ https://user-domain.com/payment-webhook │
│                                         │
│ [Test Webhook]  [Save]  [Delete]       │
└─────────────────────────────────────────┘
```

### What User Receives at Their Callback

```javascript
// User receives POST request at their callback URL
POST https://user-domain.com/payment-webhook

Headers:
  Content-Type: application/json
  X-Signature: abcd1234xyz (your signature for security)

Body:
{
  "order_id": "order_1234567890",
  "payment_id": "pay_9876543210",
  "status": "success",  // or "failed"
  "amount": 1000,
  "currency": "INR",
  "timestamp": "2026-07-21T10:30:45.000Z",
  "signature": "user_callback_signature_here"
}
```

---

## 🔄 **Callback Flow Diagram**

```
Your Backend                    Razorpay              User's Backend
     │                            │                         │
     │  1. User pays             │                         │
     ├───────────────────────────►│                         │
     │                            │                         │
     │  2. Payment success        │                         │
     │◄───────────────────────────┤                         │
     │  (Webhook)                 │                         │
     │                            │                         │
     │  3. Verify signature       │                         │
     │  4. Update database        │                         │
     │  5. Send callback          │                         │
     ├────────────────────────────────────────────────────►│
     │  POST /payment-webhook     │                         │
     │  { order_id, payment_id,   │                         │
     │    status, amount, ... }   │                         │
     │                            │                         │
     │                            │  6. User's backend     │
     │                            │  processes callback    │
     │                            │                         │
     │  7. User's backend acks    │                         │
     │◄────────────────────────────────────────────────────┤
     │  { status: 200, received } │                         │
     │                            │                         │
```

---

## 🚨 **Error Handling & Retries**

### If User's Callback URL is Down

```javascript
// Failed callback storage
CREATE TABLE failed_callbacks (
  id INT PRIMARY KEY,
  transaction_id INT,
  callback_url VARCHAR(255),
  payload JSON,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP
);

// Retry mechanism (using Bull queue)
const failedCallbackQueue = new Queue('failed-callbacks', {
  redis: { host: 'localhost', port: 6379 }
});

// Retry 5 times with exponential backoff
failedCallbackQueue.process(async (job) => {
  const { transactionId, callbackUrl } = job.data;
  try {
    await sendCallback(transactionId, callbackUrl);
    await job.remove();
  } catch (error) {
    if (job.attemptsMade < 5) {
      throw error; // Bull will retry
    } else {
      // Give up after 5 attempts
      logger.error(`Callback failed permanently: ${transactionId}`);
    }
  }
});
```

---

## 🔐 **Security Checklist**

- ✅ Always verify webhook signature
- ✅ Verify payment amount matches order amount
- ✅ Use HTTPS for all URLs
- ✅ Store Razorpay credentials in `.env` (never hardcode)
- ✅ Use API keys for authentication (user-specific)
- ✅ Log all webhook events for audit trail
- ✅ Implement rate limiting on webhook endpoint
- ✅ Handle webhook idempotency (same event might arrive twice)

---

## 📝 **Razorpay Keys Setup**

```env
# .env file
RAZORPAY_KEY_ID=rzp_live_abc123xyz...      # Public key
RAZORPAY_KEY_SECRET=abc123xyz...           # Secret key (keep safe!)
RAZORPAY_WEBHOOK_SECRET=webhook_secret...  # For webhook verification

# Frontend (can be public)
VITE_RAZORPAY_KEY_ID=rzp_live_abc123xyz...
```

---

## ✅ **Complete Integration Checklist**

- [ ] Get Razorpay account
- [ ] Get API credentials (Key ID & Secret)
- [ ] Setup webhook URL in Razorpay Dashboard
- [ ] Create `/api/payments/create-order` endpoint
- [ ] Create `/api/payments/webhook` endpoint
- [ ] Implement signature verification
- [ ] Add payment fields to Transaction model
- [ ] Create user callback system
- [ ] Add callback retry mechanism
- [ ] Test with Razorpay sandbox
- [ ] Add logging & monitoring
- [ ] Test edge cases (payment failure, timeout, etc.)

---

## 🧪 **Testing Razorpay Integration**

### Sandbox Testing
```
1. Use Razorpay Test credentials (not live)
2. Test cards provided by Razorpay:
   - 4111111111111111 (visa) → Success
   - 4222222222222220 (visa) → Failure
3. Test your webhook with Razorpay's webhook simulator
```

### Webhook Testing
```bash
# Test your webhook endpoint
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test_signature" \
  -d '{
    "event": "payment.authorized",
    "payload": {
      "payment": { "id": "pay_123", "method": "card" },
      "order": { "id": "order_123" }
    }
  }'
```

---

## 📚 **References**

- Razorpay Docs: https://razorpay.com/docs/
- API Reference: https://razorpay.com/docs/api/
- Webhook Events: https://razorpay.com/docs/webhooks/
- Test Cards: https://razorpay.com/docs/development/sandbox/

---

**Ready to integrate Razorpay? Let me know if you need help setting up any specific part!** 🚀
