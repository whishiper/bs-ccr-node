'use strict';

const WebSocket = require('ws');
const pako = require('pako');

process.stdin.resume();
process.stdin.setEncoding('utf8');

// Receive data from WebSocket - STDIN
process.stdin.on('data', function(data) {

  let symbol_json_string;
  try {
    symbol_json_string = JSON.parse(data.trim());
  } catch (e) {
    console.log('{"error":"传入格式错误，应该传入Json字符串"}');
    return;
  }

  const ws = new WebSocket(
    'wss://real.okex.com:8443/ws/v3'
  );
  ws.on('open', function open() {
    const symbols = symbol_json_string;
    // 现价相关
    const tickerArgs = symbols.map(symbol => `spot/ticker:${symbol}`);
    const tickerSubscribe = {
      op: 'subscribe',
      args: tickerArgs,
    };
    ws.send(JSON.stringify(tickerSubscribe));
    // 深度相关
    const depthArgs = symbols.map(symbol => `spot/depth:${symbol}`);
    const depthSubscribe = {
      op: 'subscribe',
      args: depthArgs,
    };
    ws.send(JSON.stringify(depthSubscribe));


    setTimeout(function() {
      ws.send('ping');
      ws.send('pong');
    }, 3000);
  });

  ws.on('message', function incoming(data) {
    // console.log(data);

    if (data instanceof String) {
      console.log(data);
    } else {
      try {
        console.log(pako.inflateRaw(data, { to: 'string' }));
      } catch (err) {
        console.log(err);
      }
    }
  });

  ws.on('error', function(err) {
    console.log('err', err);
  });

});

