# openssl genrsa -out private.pem 2048
# openssl rsa -in private.pem -pubout -out public.pem
# ios -> openssl pkcs8 -topk8 -inform PEM -in private.pem -outform PEM -nocrypt 
polka = require 'polka'
fs = require 'fs'
uuidv1 = require 'uuid/v1'

PORT = 8000

config =  
    appId: '2016090401847824'
    gateway: 'https://openapi.alipaydev.com/gateway.do'
    signType: 'RSA2'
    charset: 'utf-8'
    version: '1.0'
    privateKey: fs.readFileSync('./private.pem', 'ascii')
    alipayPublicKey: fs.readFileSync('./alipay_pubkey.pem', 'ascii')
    timeout: 8000

crypto = require "crypto"
moment = require "moment"
iconv = require "iconv-lite"
snakeCaseKeys = require "snakecase-keys"

sign_fn = (method, params = {}, config) ->
    bizContent = params.bizContent || null;
    delete params.bizContent;
    signParams = Object.assign(
        method: method,
        appId: config.appId,
        charset: config.charset,
        version: config.version,
        signType: config.signType,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    , params);
    if (bizContent) 
        signParams.bizContent = JSON.stringify(snakeCaseKeys(bizContent));

    decamelizeParams = snakeCaseKeys(signParams);

    console.log decamelizeParams

    # 排序，utf-8 编码
    signStr = Object.keys(decamelizeParams).sort().map((key) => 
        data = decamelizeParams[key];
        if (Array.prototype.toString.call(data) != '[object String]') 
            data = JSON.stringify(data);
        return "#{key}=#{iconv.encode(data, config.charset)}";
    ).join('&');

    # 签名
    sign = crypto.createSign("RSA-SHA256")
        .update(signStr, 'utf8').sign(config.privateKey, 'base64');

    # urlencode
    encodeSignStr = Object.keys(decamelizeParams).sort().map((key) => 
        data = decamelizeParams[key];
        if (Array.prototype.toString.call(data) != '[object String]') 
            data = JSON.stringify(data);
        
        return "#{key}=#{encodeURIComponent data}";
    ).join('&');

    return encodeSignStr+'&sign='+encodeURIComponent(sign);

polka()
    .get '/', (req, res) => res.end "pay server"
    .get '/create_order', (req, res) ->
        try
            name = 'alipay.trade.app.pay'
            params = 
                notify_url: "http://nodelover.me/callback"
                bizContent:    
                    out_trade_no: uuidv1()
                    subject: "test"
                    body: "9911"
                    product_code: 'QUICK_MSECURITY_PAY'
                    total_amount: 0.01
            data = sign_fn name, params, config
            console.log data
            res.end data
        catch e
            console.log e
    
    .get '/callback', (req, res) ->
        console.log req
        res.end "success"    

    .get '/success', (req, res) ->
        console.log req
        res.end "success"
        
    .listen PORT , (err) -> 
        console.log "server started!"