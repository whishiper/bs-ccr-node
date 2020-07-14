'use strict';

process.stdin.resume();
process.stdin.setEncoding('utf8');

const WebSocket = require('ws');
const pako = require('pako');

process.stdin.on('data', function(data) {

  let symbol_json_string;
  try {
    symbol_json_string = JSON.parse(data.trim());
  } catch (e) {
    console.log('{"error":"传入格式错误，应该传入Json字符串"}');
    return;
  }

  const ws = new WebSocket('wss://api.huobi.pro/ws');

  ws.onopen = function() {
    symbol_json_string.forEach(symbol => {
      const subscribe = { sub: `market.${symbol}.depth.step0`, id: symbol };
      ws.send(JSON.stringify(subscribe));
    });
  };

  ws.onmessage = function(event) {

    // console.log(event.data);
    const { data } = event;

    if (data instanceof String) {
      console.log(data);
    } else {
      try {
        const string_data = pako.inflate(data, { to: 'string' });


        if (JSON.parse(string_data).ping) {
          ws.send(JSON.stringify({ pong: 'ping' }));
          return;
        }


        console.log(string_data);
      } catch (err) {
        console.log(err);
      }
    }
  };

  ws.onclose = function() {
    console.log('connection closed');
  };


});

