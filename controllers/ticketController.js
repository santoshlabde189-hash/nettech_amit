const Ticket = require('../models/Ticket');
const generateTicketId = require('../utils/generateTicketId');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Create / Raise a support ticket
 * @route   POST /api/tickets
 * @access  Private (User/Admin)
 */
exports.createTicket = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;

    // Generate atomic sequential human-readable ID (NT-0001, etc.)
    const ticketId = await generateTicketId();

    const ticket = await Ticket.create({
      ticketId,
      title,
      description,
      category: category || 'Other',
      priority: priority || 'Medium',
      status: 'Pending',
      createdBy: req.user.id,
      adminRemarks: '',
      statusHistory: [
        {
          status: 'Pending',
          remarks: 'Ticket created by user',
          changedBy: req.user.id,
          changedAt: new Date()
        }
      ]
    });

    // Send email asynchronously (non-blocking)
    sendEmail({
      to: req.user.email,
      subject: `[${ticket.ticketId}] Support Ticket Created: ${ticket.title}`,
      html: `
        <h3>Hello ${req.user.name},</h3>
        <p>Your support ticket <strong>${ticket.ticketId}</strong> has been successfully registered.</p>
        <p><strong>Title:</strong> ${ticket.title}</p>
        <p><strong>Category:</strong> ${ticket.category}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Status:</strong> ${ticket.status}</p>
        <br/>
        <p>Our technical team has been notified and will attend to your request shortly.</p>
        <p>Regards,<br/>Nettech Help Desk Team</p>
      `
    });

    res.status(201).json({
      success: true,
      data: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all tickets (User sees own tickets; Admin sees all tickets with search & filters)
 * @route   GET /api/tickets
 * @access  Private
 */
exports.getTickets = async (req, res, next) => {
  try {
    const {
      search,
      status,
      priority,
      category,
      user,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    // Role-based scoping: normal users only see tickets created by themselves
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    } else if (user) {
      query.createdBy = user;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search query matching ticketId, title, description
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticketId: searchRegex },
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .populate('createdBy', 'name email department phone profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single ticket details
 * @route   GET /api/tickets/:id
 * @access  Private (Owner or Admin)
 */
exports.getTicketById = async (req, res, next) => {
  try {
    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: req.params.id } : { ticketId: req.params.id };

    const ticket = await Ticket.findOne(query)
      .populate('createdBy', 'name email department phone profilePicture')
      .populate('statusHistory.changedBy', 'name email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check ownership if user is not admin
    if (req.user.role !== 'admin' && ticket.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this ticket'
      });
    }

    res.status(200).json({
      success: true,
      data: { ticket }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update ticket content (User can edit only while status is Pending)
 * @route   PUT /api/tickets/:id
 * @access  Private (Owner only)
 */
exports.updateTicket = async (req, res, next) => {
  try {
    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: req.params.id } : { ticketId: req.params.id };

    let ticket = await Ticket.findOne(query);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Ownership check
    if (ticket.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this ticket'
      });
    }

    // Status check per PRD/TRD/Test T6
    if (ticket.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Tickets can only be edited while status is Pending. Current status is ${ticket.status}.`
      });
    }

    const { title, description, category, priority } = req.body;
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (category) ticket.category = category;
    if (priority) ticket.priority = priority;

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update ticket status, priority, and remarks (Admin only)
 * @route   PATCH /api/tickets/:id/status
 * @access  Private (Admin)
 */
exports.updateTicketStatus = async (req, res, next) => {
  try {
    const { status, remarks, priority } = req.body;

    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: req.params.id } : { ticketId: req.params.id };

    const ticket = await Ticket.findOne(query).populate('createdBy', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const previousStatus = ticket.status;

    if (status) {
      ticket.status = status;
    }
    if (priority) {
      ticket.priority = priority;
    }
    if (remarks !== undefined) {
      ticket.adminRemarks = remarks;
    }

    // Add status history entry
    ticket.statusHistory.push({
      status: ticket.status,
      remarks: remarks || `Status changed to ${ticket.status}`,
      changedBy: req.user.id,
      changedAt: new Date()
    });

    await ticket.save();

    // Trigger non-blocking email notification to ticket owner (BON-2 / B3)
    if (ticket.createdBy && ticket.createdBy.email) {
      sendEmail({
        to: ticket.createdBy.email,
        subject: `[${ticket.ticketId}] Status Updated: ${ticket.status}`,
        html: `
          <h3>Hello ${ticket.createdBy.name},</h3>
          <p>The status of your ticket <strong>${ticket.ticketId} (${ticket.title})</strong> has been updated.</p>
          <p><strong>Previous Status:</strong> ${previousStatus}</p>
          <p><strong>Current Status:</strong> <span style="font-weight:bold; color:#0d6efd;">${ticket.status}</span></p>
          <p><strong>Priority:</strong> ${ticket.priority}</p>
          <p><strong>Remarks from Support:</strong> ${ticket.adminRemarks || 'None'}</p>
          <br/>
          <p>Log in to your help desk dashboard to review updates or view complete history.</p>
          <p>Regards,<br/>Nettech Help Desk Team</p>
        `
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: { ticket }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a ticket (Admin only)
 * @route   DELETE /api/tickets/:id
 * @access  Private (Admin)
 */
exports.deleteTicket = async (req, res, next) => {
  try {
    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: req.params.id } : { ticketId: req.params.id };

    const ticket = await Ticket.findOneAndDelete(query);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket deleted'
    });
  } catch (err) {
    next(err);
  }
};
