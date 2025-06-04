const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5001';
let authToken = '';

const testRoutes = async () => {
  try {
    console.log('Starting route verification...\n');

    // Test Auth Routes
    console.log('Testing Auth Routes:');
    
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@latavola.com',
      password: 'admin1'
    });
    authToken = loginResponse.data.token;
    console.log('✓ Login successful');

    // Get current user
    await axios.get(`${BASE_URL}/api/auth/user`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✓ Get current user successful\n');

    // Test Department Routes
    console.log('Testing Department Routes:');
    const departmentsResponse = await axios.get(`${BASE_URL}/api/admin/departments`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✓ Get departments successful');
    console.log(`✓ Found ${departmentsResponse.data.length} departments\n`);

    // Test Employee Routes
    console.log('Testing Employee Routes:');
    const employeesResponse = await axios.get(`${BASE_URL}/api/admin/employees`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✓ Get employees successful');
    console.log(`✓ Found ${employeesResponse.data.length} employees\n`);

    // Test Attendance Routes
    console.log('Testing Attendance Routes:');
    const attendanceResponse = await axios.get(`${BASE_URL}/api/attendance`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✓ Get attendance records successful');
    console.log(`✓ Found ${attendanceResponse.data.length} attendance records\n`);

    // Test QR Code Routes
    console.log('Testing QR Code Routes:');
    const qrResponse = await axios.get(`${BASE_URL}/api/admin/qr/codes`, {
      headers: { 'x-auth-token': authToken }
    });
    console.log('✓ Get QR codes successful');
    console.log(`✓ Found ${qrResponse.data.length} QR codes\n`);

    // Test Manager Login
    const managerLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'manager1@latavola.com',
      password: 'manager1'
    });
    console.log('✓ Manager login successful');

    // Test Employee Login
    const employeeLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'employee01@latavola.com',
      password: 'employee1'
    });
    console.log('✓ Employee login successful\n');

    console.log('All routes verified successfully! ✓');
    process.exit(0);
  } catch (error) {
    console.error('\nError during route verification:');
    console.error('Route:', error.config?.url);
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    process.exit(1);
  }
};

// Ensure server is running before testing
setTimeout(testRoutes, 1000); 