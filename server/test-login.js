/**
 * Login Test Script - Verify authentication works
 * Tests: Admin, Faculty, and Student login
 */

const http = require('http');

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLogin() {
  console.log('\n🧪 TESTING LOGIN ENDPOINTS\n');
  console.log('═'.repeat(50));

  const testCases = [
    {
      name: '👨‍💼 ADMIN LOGIN',
      email: 'admin@iec.ac.in',
      password: 'Admin@123',
    },
    {
      name: '👨‍🏫 FACULTY LOGIN',
      email: 'faculty1@iec.ac.in',
      password: 'Faculty@123',
    },
    {
      name: '👨‍🎓 STUDENT LOGIN',
      email: 'student1@iec.ac.in',
      password: 'Student@123',
    },
    {
      name: '❌ INVALID LOGIN',
      email: 'admin@iec.ac.in',
      password: 'WrongPassword',
    },
  ];

  for (const test of testCases) {
    try {
      console.log(`\n${test.name}`);
      console.log(`Email: ${test.email}`);
      console.log(`Password: ${test.password}`);

      const response = await makeRequest('POST', '/api/auth/login', {
        email: test.email,
        password: test.password,
      });

      console.log(`Status: ${response.status}`);

      if (response.data.success) {
        console.log(`✅ Login Successful`);
        console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
        console.log(`   Role: ${response.data.data.user.role}`);
        console.log(`   Name: ${response.data.data.user.name}`);
        console.log(`   Dashboard: ${response.data.data.dashboardUrl}`);
      } else {
        console.log(`❌ Login Failed: ${response.data.message}`);
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('\n✨ LOGIN TESTS COMPLETE\n');
  process.exit(0);
}

// Wait for server to be ready
setTimeout(testLogin, 2000);
