#!/usr/bin/env node
const readline = require('readline');

const API_ENDPOINT = process.env.STATUSPULSE_URL || 'https://statuspulse-iq65sj8ed-kotralingaraju25-4094.vercel.app/api/mcp';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

rl.on('line', async (line) => {
  if (!line.trim()) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch (err) {
    return;
  }

  const { id, method, params } = request;

  // 1. Initial Handshake
  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'statuspulse', version: '1.0.0' }
      }
    });
    return;
  }

  // 2. Initialized notification
  if (method === 'notifications/initialized') {
    return;
  }

  // 3. Ping
  if (method === 'ping') {
    send({ jsonrpc: '2.0', id, result: {} });
    return;
  }

  // 4. Handle tools/list and tools/call
  if (method === 'tools/list' || method === 'tools/call') {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      const data = await response.json();

      // Ensure data is not double-nested
      const payload = data.result !== undefined ? data.result : data;

      send({
        jsonrpc: '2.0',
        id,
        result: payload
      });
    } catch (err) {
      send({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: err.message }
      });
    }
    return;
  }

  // Fallback
  send({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: 'Method not found' }
  });
});