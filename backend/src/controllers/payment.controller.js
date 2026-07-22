const { v4: uuidv4 } = require('uuid');
const { payinQueue, DEFAULT_JOB_OPTIONS } = require('../config/queue.config');
const Transaction = require('../models/transaction.model');
const { PaymentProvider } = require('../models');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { setValidationResult, setThirdPartyApiInfo } = require('../middleware/apiLogger.middleware');
const { getActivePayinProvider, paymentProviderNotConfiguredResponse } = require('../payment-gateways/provider.service');

/**
 * Validate payment request
 * @param {Object} req - Express request object
 * @returns {Object} - Validation result
 */
const validatePaymentRequest = (req) => {
  const errors = [];
  const { account_number, account_ifsc, bank_name, beneficiary_name, request_type, amount, reference_number } = req.body;


  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number');
  }
  // Validate recipient
  if (!account_number) {
    errors.push('Account number is required');
  }

  if (!bank_name || !account_ifsc || !beneficiary_name || !request_type || !reference_number) {
    errors.push('All fields are required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};



/**
 * Initiate a payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const initiatePayment = async (req, res) => {
  try {
    // Gate: no active provider = controlled error, no queue entry, no balance deduction
    const active = await getActivePayinProvider(PaymentProvider);
    if (!active) {
      return paymentProviderNotConfiguredResponse(res);
    }

    const { amount, currency = 'INR' } = req.body;
    const transaction_id = uuidv4();

    const jobData = { transaction_id, amount, currency };

    // jobId=transaction_id prevents Bull from enqueuing a second job for the
    // SAME transaction_id if this endpoint is called twice (e.g. network retry).
    // This is Bull-level deduplication only — it does NOT protect against
    // duplicate charges at the payment gateway layer.
    // When Razorpay/PhonePe is integrated, idempotency keys MUST also be sent
    // to the gateway API (e.g. Razorpay receipt_id = transaction_id).
    const job = await payinQueue.add(jobData, {
      ...DEFAULT_JOB_OPTIONS,
      jobId: transaction_id
    });

    // Send immediate acknowledgement
    res.status(202).json({
      success: true,
      message: 'Payment task queued',
      transaction_id,
      job_id: job.id
    });
  } catch (error) {
    logger.error('Error queuing payment task', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: 'Error queuing payment task' 
    });
  }
};

/**
 * Get transaction status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTransactionStatus = async (req, res) => {
  try {
    const { transaction_id } = req.params;

    const transaction = await Transaction.findById(transaction_id);
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    // Check if user has access to this transaction
    const isAdmin = req.user.userType === 'admin';
    const isSender = transaction.sender.id.toString() === req.user._id.toString();
    const isRecipient = transaction.recipient.id.toString() === req.user._id.toString();
    const isAgentOfRecipient = req.user.userType === 'agent' && 
                              transaction.recipient.model === 'User' &&
                              transaction.recipient.id.toString() === req.user._id.toString();

    if (!isAdmin && !isSender && !isRecipient && !isAgentOfRecipient) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have access to this transaction' 
      });
    }

    res.json({
      success: true,
      transaction: {
        transaction_id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
        gateway_response: transaction.gateway_response
      }
    });
  } catch (error) {
    logger.error('Error getting transaction status', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: 'Error getting transaction status' 
    });
  }
};

module.exports = {
  initiatePayment,
  getTransactionStatus,
  validatePaymentRequest
}; 