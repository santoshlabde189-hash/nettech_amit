const express = require('express');
const { body } = require('express-validator');
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  updateTicketStatus,
  deleteTicket
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const ticketCreateValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Ticket title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['Hardware', 'Software', 'Network', 'Account', 'Other'])
    .withMessage('Category must be one of: Hardware, Software, Network, Account, Other'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  validate
];

const ticketUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['Hardware', 'Software', 'Network', 'Account', 'Other'])
    .withMessage('Category must be one of: Hardware, Software, Network, Account, Other'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  validate
];

const statusUpdateValidation = [
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Resolved', 'Closed'])
    .withMessage('Status must be Pending, In Progress, Resolved, or Closed'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  validate
];

// All ticket routes require authentication
router.use(protect);

router.route('/')
  .post(ticketCreateValidation, createTicket)
  .get(getTickets);

router.route('/:id')
  .get(getTicketById)
  .put(ticketUpdateValidation, updateTicket)
  .delete(authorize('admin'), deleteTicket);

router.patch('/:id/status', authorize('admin'), statusUpdateValidation, updateTicketStatus);

module.exports = router;
