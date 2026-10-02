const Counter = require('../models/Counter');

/**
 * Atomically generates next sequential ticket ID formatted as NT-0001, NT-0002, etc.
 */
async function generateTicketId() {
  const counter = await Counter.findByIdAndUpdate(
    'ticket',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return 'NT-' + String(counter.seq).padStart(4, '0');
}

module.exports = generateTicketId;
