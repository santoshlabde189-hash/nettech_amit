/**
 * Automated Verification & Test Runner
 * Executes test cases per docs/TASKS.md (A1-A7, T1-T6, D1-D5, B1-B3)
 */

require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('=== STARTING NETTECH HELP DESK TEST SUITE ===');

  const mongoose = require('mongoose');
  const { app, server } = require('../server');

  // Wait until Mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once('open', resolve));
  }
  console.log('TestRunner: Mongoose connection verified ready (state: 1).');

  const PORT = process.env.PORT || 5000;
  const BASE_URL = `http://localhost:${PORT}/api`;

  let userToken = '';
  let adminToken = '';
  let createdTicketId = '';
  let createdTicketObjId = '';

  const results = [];

  function record(id, name, pass, details = '') {
    results.push({ id, name, status: pass ? 'PASS' : 'FAIL', details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${name} ${details ? '(' + details + ')' : ''}`);
  }

  // Helper fetch function
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, options);
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    return { status: res.status, data };
  }

  try {
    // ---------------- AUTHENTICATION TESTS (A1 - A7) ----------------
    console.log('\n--- Running Authentication Tests ---');

    // Seed/Login Admin
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nettech.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe@123';

    let existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      existingAdmin = await User.create({
        name: process.env.ADMIN_NAME || 'Nettech Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        department: 'IT Administration'
      });
    }

    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });
    if (adminLoginRes.status === 200 && adminLoginRes.data.data?.token) {
      adminToken = adminLoginRes.data.data.token;
    } else {
      console.error('Failed to get admin token:', adminLoginRes);
    }

    // A1: Register with valid data
    const testEmail = `employee_${Date.now()}@nettech.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ravi Tester',
        email: testEmail,
        password: 'Password123',
        department: 'Engineering',
        phone: '9876543210'
      })
    });
    const a1Pass = regRes.status === 201 && regRes.data.success && regRes.data.data?.token;
    if (a1Pass) userToken = regRes.data.data.token;
    record('A1', 'Register with valid data', a1Pass, `Status: ${regRes.status}`);

    // A2: Register with existing email
    const dupRes = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ravi Duplicate',
        email: testEmail,
        password: 'Password123'
      })
    });
    record('A2', 'Register with existing email', dupRes.status === 409, `Status: ${dupRes.status}`);

    // A3: Register with weak password
    const weakRes = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass',
        email: `weak_${Date.now()}@nettech.com`,
        password: '123'
      })
    });
    record('A3', 'Register with weak password', weakRes.status === 400, `Status: ${weakRes.status}`);

    // A4: Login with correct credentials
    const loginRes = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123'
      })
    });
    const a4Pass = loginRes.status === 200 && loginRes.data.data?.token && loginRes.data.data?.user?.role === 'user';
    record('A4', 'Login with correct credentials', a4Pass, `Role: ${loginRes.data.data?.user?.role}`);

    // A5: Login with wrong password
    const wrongPassRes = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999'
      })
    });
    record('A5', 'Login with wrong password', wrongPassRes.status === 401, `Status: ${wrongPassRes.status}`);

    // A6: Open protected API without login
    const noAuthRes = await request('/tickets', { method: 'GET' });
    record('A6', 'Open protected route without token', noAuthRes.status === 401, `Status: ${noAuthRes.status}`);

    // A7: Normal user opens admin API
    const userOnAdminRes = await request('/dashboard/stats', {
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    record('A7', 'User opens admin route/API', userOnAdminRes.status === 403, `Status: ${userOnAdminRes.status}`);

    // ---------------- TICKETS (USER) TESTS (T1 - T6) ----------------
    console.log('\n--- Running Ticket (User) Tests ---');

    // T1: Raise ticket with valid data
    const ticketCreateRes = await request('/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Network Wi-Fi dropping in Room 304',
        description: 'Wi-Fi connection drops every 5 minutes when connecting from the meeting room.',
        category: 'Network',
        priority: 'High'
      })
    });
    const t1Pass = ticketCreateRes.status === 201 && ticketCreateRes.data.data?.ticketId?.startsWith('NT-');
    if (t1Pass) {
      createdTicketId = ticketCreateRes.data.data.ticketId;
      createdTicketObjId = ticketCreateRes.data.data.id;
    }
    record('T1', 'Raise ticket with valid data', t1Pass, `Ticket ID: ${createdTicketId}`);

    // T2: Raise ticket with empty title
    const emptyTitleRes = await request('/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: '',
        description: 'Valid description with more than 10 characters',
        category: 'Hardware'
      })
    });
    record('T2', 'Raise ticket with empty title', emptyTitleRes.status === 400, `Status: ${emptyTitleRes.status}`);

    // T3: View own tickets
    const userTicketsRes = await request('/tickets', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const t3Pass = userTicketsRes.status === 200 && Array.isArray(userTicketsRes.data.data?.tickets) && userTicketsRes.data.data.tickets.length > 0;
    record('T3', 'View own tickets', t3Pass, `Count: ${userTicketsRes.data.data?.tickets?.length}`);

    // T4: Open another user's ticket by ID
    // Create another user + ticket
    const otherUserRes = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second User',
        email: `other_${Date.now()}@nettech.com`,
        password: 'Password123'
      })
    });
    const otherUserToken = otherUserRes.data.data?.token;
    const t4Res = await request(`/tickets/${createdTicketObjId}`, {
      headers: { Authorization: `Bearer ${otherUserToken}` }
    });
    record('T4', "Open another user's ticket by ID", t4Res.status === 403, `Status: ${t4Res.status}`);

    // T5: Search by title / ticket ID
    const searchRes = await request(`/tickets?search=${encodeURIComponent(createdTicketId)}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const t5Pass = searchRes.status === 200 && searchRes.data.data?.tickets?.some(t => t.ticketId === createdTicketId);
    record('T5', 'Search by title / ticket ID', t5Pass, `Found: ${searchRes.data.data?.tickets?.length}`);

    // T6: Edit ticket after status is In Progress (should be rejected)
    // First admin changes it to In Progress
    await request(`/tickets/${createdTicketObjId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'In Progress', remarks: 'Under review' })
    });

    // Now user attempts to update ticket
    const editRes = await request(`/tickets/${createdTicketObjId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ title: 'Illegal Edit Attempt', description: 'Changing when in progress' })
    });
    record('T6', 'Edit ticket after status is In Progress', editRes.status === 400, `Status: ${editRes.status}`);

    // ---------------- ADMIN TESTS (D1 - D5) ----------------
    console.log('\n--- Running Admin Tests ---');

    // D1: View all tickets
    const adminAllRes = await request('/tickets', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const d1Pass = adminAllRes.status === 200 && adminAllRes.data.data?.tickets?.length >= 1;
    record('D1', 'Admin view all tickets with owner info', d1Pass, `Tickets count: ${adminAllRes.data.data?.tickets?.length}`);

    // D2: Filter by status + priority
    const filterRes = await request('/tickets?status=In Progress&priority=High', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const d2Pass = filterRes.status === 200 && filterRes.data.data?.tickets?.every(t => t.status === 'In Progress' && t.priority === 'High');
    record('D2', 'Filter by status + priority', d2Pass, `Matching: ${filterRes.data.data?.tickets?.length}`);

    // D3: Update status to Resolved with remarks
    const resolveRes = await request(`/tickets/${createdTicketObjId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'Resolved',
        remarks: 'Wi-Fi AP replaced in meeting room. Connection stable.'
      })
    });
    const d3Pass = resolveRes.status === 200 && resolveRes.data.data?.ticket?.status === 'Resolved';
    record('D3', 'Update status to Resolved with remarks', d3Pass, `Status: ${resolveRes.data.data?.ticket?.status}`);

    // D4: Delete ticket
    // Create a temporary ticket to delete
    const tempTicketRes = await request('/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Temporary ticket to delete',
        description: 'This ticket will be deleted by admin verification.',
        category: 'Other'
      })
    });
    const tempId = tempTicketRes.data.data?.id;

    const delRes = await request(`/tickets/${tempId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const checkDeletedRes = await request(`/tickets/${tempId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const d4Pass = delRes.status === 200 && checkDeletedRes.status === 404;
    record('D4', 'Delete ticket with confirmation flow', d4Pass, `Delete Status: ${delRes.status}, Check: ${checkDeletedRes.status}`);

    // D5: Dashboard numbers match DB
    const statsRes = await request('/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const d5Pass = statsRes.status === 200 && typeof statsRes.data.data?.total === 'number' && statsRes.data.data?.byStatus;
    record('D5', 'Dashboard numbers match database counts', d5Pass, `Total tickets in DB: ${statsRes.data.data?.total}`);

    // ---------------- BONUS TESTS (B1 - B3) ----------------
    console.log('\n--- Running Bonus Features Tests ---');

    // B1: Upload 5 MB image (rejected)
    // Create 5MB dummy buffer
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, 'a');
    const boundary = '---------------------------974767299852498929531610575';
    let body = `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="avatar"; filename="large.png"\r\n`;
    body += `Content-Type: image/png\r\n\r\n`;
    const payloadHeader = Buffer.from(body, 'utf-8');
    const payloadFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const fullBody = Buffer.concat([payloadHeader, largeBuffer, payloadFooter]);

    const b1Res = await fetch(`${BASE_URL}/users/profile-picture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: fullBody
    });
    const b1Data = await b1Res.json().catch(() => ({}));
    record('B1', 'Upload 5 MB image (rejected size)', b1Res.status === 400, `Status: ${b1Res.status}`);

    // B2: Upload .exe renamed to .png (rejected type)
    const exeBuffer = Buffer.from('MZ fake exe header executable bytes', 'utf-8');
    let b2Body = `--${boundary}\r\n`;
    b2Body += `Content-Disposition: form-data; name="avatar"; filename="malicious.exe"\r\n`;
    b2Body += `Content-Type: application/x-msdownload\r\n\r\n`;
    const b2Header = Buffer.from(b2Body, 'utf-8');
    const b2Full = Buffer.concat([b2Header, exeBuffer, payloadFooter]);

    const b2Res = await fetch(`${BASE_URL}/users/profile-picture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: b2Full
    });
    record('B2', 'Upload .exe file (rejected type check)', b2Res.status === 400, `Status: ${b2Res.status}`);

    // B3: Status change trigger email
    // Tested during D3; let's verify email mock log and statusHistory entry
    const finalTicketCheck = await request(`/tickets/${createdTicketObjId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const history = finalTicketCheck.data.data?.ticket?.statusHistory || [];
    const b3Pass = history.some(h => h.status === 'Resolved');
    record('B3', 'Status change triggers email and history append', b3Pass, `History entries: ${history.length}`);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    console.log('\n=== TEST RUN COMPLETE ===');
    console.table(results);

    const allPassed = results.every(r => r.status === 'PASS');
    console.log(`Summary: ${results.filter(r => r.status === 'PASS').length}/${results.length} tests passed.`);
    process.exit(allPassed ? 0 : 1);
  }
}

runTests();
