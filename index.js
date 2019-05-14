// Generated by CoffeeScript 2.4.0
(function() {
  // openssl genrsa -out private.pem 2048
  // openssl rsa -in private.pem -pubout -out public.pem
  // ios -> openssl pkcs8 -topk8 -inform PEM -in rsa_private_key.pem -outform PEM -nocrypt 
  var PORT, config, crypto, fs, iconv, moment, polka, sign, snakeCaseKeys, uuidv1;

  polka = require('polka');

  fs = require('fs');

  uuidv1 = require('uuid/v1');

  PORT = 8000;

  config = {
    appId: '2016072400106012',
    gateway: 'https://openapi.alipaydev.com/gateway.do',
    signType: 'RSA2',
    charset: 'utf-8',
    version: '1.0',
    privateKey: fs.readFileSync('./private.pem', 'ascii'),
    alipayPublicKey: fs.readFileSync('./alipay_pubkey.pem', 'ascii'),
    timeout: 8000
  };

  crypto = require("crypto");

  moment = require("moment");

  iconv = require("iconv-lite");

  snakeCaseKeys = require("snakecase-keys");

  sign = function(method, params = {}, config) {
    var bizContent, decamelizeParams, encodeSignStr, signParams, signStr;
    bizContent = params.bizContent || null;
    delete params.bizContent;
    signParams = Object.assign({
      method: method,
      appId: config.appId,
      charset: config.charset,
      version: config.version,
      signType: config.signType,
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
    }, params);
    if (bizContent) {
      signParams.bizContent = JSON.stringify(snakeCaseKeys(bizContent));
    }
    decamelizeParams = snakeCaseKeys(signParams);
    console.log(decamelizeParams);
    signStr = Object.keys(decamelizeParams).sort().map((key) => {
      var data;
      data = decamelizeParams[key];
      if (Array.prototype.toString.call(data) !== '[object String]') {
        data = JSON.stringify(data);
      }
      return `${key}=${iconv.encode(data, config.charset)}`;
    }).join('&');
    sign = crypto.createSign("RSA-SHA256").update(signStr, 'utf8').sign(config.privateKey, 'base64');
    encodeSignStr = Object.keys(decamelizeParams).sort().map((key) => {
      var data;
      data = decamelizeParams[key];
      if (Array.prototype.toString.call(data) !== '[object String]') {
        data = JSON.stringify(data);
      }
      return `${key}=${encodeURIComponent(data)}`;
    }).join('&');
    return encodeSignStr + '&sign=' + encodeURIComponent(sign);
  };

  polka().get('/', (req, res) => {
    return res.end("pay server");
  }).get('/create_order', function(req, res) {
    var data, e, name, params;
    try {
      name = 'alipay.trade.app.pay';
      params = {
        notify_url: "http://nodelover.me/callback",
        biz_content: {
          out_trade_no: uuidv1(),
          subject: "test",
          body: "9911",
          product_code: 'QUICK_MSECURITY_PAY',
          total_amount: 0.01
        }
      };
      data = sign(name, params, config);
      console.log(data);
      return res.end(data);
    } catch (error) {
      e = error;
      return console.log(e);
    }
  }).get('/callback', function(req, res) {
    console.log(req);
    return res.end("success");
  }).get('/success', function(req, res) {
    console.log(req);
    return res.end("success");
  }).listen(PORT, function(err) {
    return console.log("server started!");
  });

}).call(this);