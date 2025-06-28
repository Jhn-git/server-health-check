#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Load configuration
const config = JSON.parse(fs.readFileSync('config/monitoring.json', 'utf8'));

// Get server details from environment or command line
const SERVER_HOST = process.env.SERVER_HOST || process.argv[2] || 'localhost';
const SERVER_PORT = process.env.SERVER_PORT || process.argv[3] || '8746';
const ENDPOINT = config.monitoring.endpoint || '/api/health';

const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}${ENDPOINT}`;

console.log('🔍 Server Health Check');
console.log('='.repeat(50));
console.log(`Server: ${SERVER_URL}`);
console.log(`Timeout: ${config.monitoring.timeout_seconds}s`);
console.log(`Max Response Time: ${config.health_check.max_response_time_ms}ms`);
console.log(`Retry Attempts: ${config.monitoring.retry_attempts}`);
console.log('='.repeat(50));

async function makeRequest(url, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: timeout * 1000,
      headers: {
        'User-Agent': config.health_check.user_agent || 'Server-Health-Monitor/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data: data.toString(),
          headers: res.headers
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}s`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function healthCheck() {
  const maxAttempts = config.monitoring.retry_attempts;
  const timeout = config.monitoring.timeout_seconds;
  const maxResponseTime = config.health_check.max_response_time_ms;
  const expectedStatus = config.health_check.expected_status || 200;
  
  let lastError = null;
  let attempt = 1;
  
  while (attempt <= maxAttempts) {
    try {
      console.log(`\n📡 Attempt ${attempt}/${maxAttempts}`);
      
      const result = await makeRequest(SERVER_URL, timeout);
      
      console.log(`   Status: ${result.statusCode}`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      
      // Check status code
      if (result.statusCode !== expectedStatus) {
        lastError = `Unexpected status code: ${result.statusCode} (expected ${expectedStatus})`;
        console.log(`   ❌ ${lastError}`);
      }
      // Check response time
      else if (result.responseTime > maxResponseTime) {
        lastError = `Response time ${result.responseTime}ms exceeds maximum ${maxResponseTime}ms`;
        console.log(`   ⚠️  ${lastError}`);
      }
      // Success!
      else {
        console.log(`   ✅ Health check passed!`);
        console.log(`\n🎉 Server is healthy!`);
        console.log(`   Final Status: ${result.statusCode}`);
        console.log(`   Final Response Time: ${result.responseTime}ms`);
        
        if (config.notifications.include_response_time && result.data) {
          try {
            const responseData = JSON.parse(result.data);
            console.log(`   Response Data:`, responseData);
          } catch (e) {
            console.log(`   Response Body: ${result.data.substring(0, 200)}${result.data.length > 200 ? '...' : ''}`);
          }
        }
        
        return { status: 'success', result };
      }
      
    } catch (error) {
      lastError = error.message;
      console.log(`   ❌ ${lastError}`);
    }
    
    if (attempt < maxAttempts) {
      console.log(`   ⏳ Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    attempt++;
  }
  
  console.log(`\n💥 Health check failed after ${maxAttempts} attempts`);
  console.log(`   Last Error: ${lastError}`);
  
  return { status: 'failure', error: lastError };
}

// Run the health check
healthCheck()
  .then(result => {
    process.exit(result.status === 'success' ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  });