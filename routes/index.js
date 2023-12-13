var express = require('express');
var router = express.Router();
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
var store = require('store');
var axios = require('axios');
var sha256 = require('sha256');
var uniqid = require('uniqid');
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
/* GET home page. */
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/', async function (req, res, next) {
  res.render('index', { page_respond_data: 'Please Pay & Repond From The Payment Gateway Will Come In This Section' });
});
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
//PAY
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/pay', async function (req, res, next) {
  //++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //Store IT IN DB ALSO
  //++++++++++++++++++++++++++++++++++++++++++++++++++++++
  let tx_uuid = uniqid();
  store.set('uuid', { tx: tx_uuid });
  //++++++++++++++++++++++++++++++++++++++++++++++++++++++
  let normalPayLoad = {
    "merchantId": "PGTESTPAYUAT",
    "merchantTransactionId": tx_uuid,
    "merchantUserId": "MUID123",
    "amount": 10000,
    "redirectUrl": "http://localhost:3000/pay-return-url/",
    "redirectMode": "POST",
    "callbackUrl": "http://localhost:3000/pay-return-url/",
    "mobileNumber": "9999999999",
    "paymentInstrument": {
      "type": "PAY_PAGE"
    }
  }
  let saltKey = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
  let saltIndex = 1
  //++++++++++++++++++++++++++++++++++++++++++++++++++++++
  let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
  let base64String = bufferObj.toString("base64");
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++
  //console.log(base64String)
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++
  let string = base64String + '/pg/v1/pay' + saltKey;
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++
  let sha256_val = sha256(string);
  let checksum = sha256_val + '###' + saltIndex;
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++
  //console.log(checksum);
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++
  axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {
    'request': base64String
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'accept': 'application/json'
    }
  }).then(function (response) {
    res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
  }).catch(function (error) {
    res.render('index', { page_respond_data: JSON.stringify(error) });
  });
});
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
//PAY RETURN
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.all('/pay-return-url', async function (req, res) {
  if (req.body.code == 'PAYMENT_SUCCESS' && req.body.merchantId && req.body.transactionId && req.body.providerReferenceId) {
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // 1.In the live please match the amount you get byamount you send also so that hacker can't pass static value.
    // 2.Don't take Marchent ID directly validate it with yoir Marchent ID
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //if (req.body.transactionId == store.get('uuid').tx && req.body.merchantId == 'PGTESTPAYUAT' && req.body.amount == 1000) {
    if (req.body.transactionId) {
      //+++++++++++++++++++++++++++++++++++++++++++++++++++++
      let saltKey = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
      let saltIndex = 1
      //++++++++++++++++++++++++++++++++++++++++++++++++++++++
      let surl = 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/PGTESTPAYUAT/' + req.body.transactionId;
      //+++++++++++++++++++++++++++++++++++++++++++++++++++++
      let string = '/pg/v1/status/PGTESTPAYUAT/' + req.body.transactionId + saltKey;
      //+++++++++++++++++++++++++++++++++++++++++++++++++++++
      let sha256_val = sha256(string);
      let checksum = sha256_val + '###' + saltIndex;
      //+++++++++++++++++++++++++++++++++++++++++++++++++++++
      //console.log(checksum);
      //+++++++++++++++++++++++++++++++++++++++++++++++++++++
      axios.get(surl, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': req.body.transactionId,
          'accept': 'application/json'
        }
      }).then(function (response) {
        //+++++++++++++++++++++++++++++++++++++++++++++++++
        //DB OPERATION
        //+++++++++++++++++++++++++++++++++++++++++++++++++
        //{PLease add your code.}
        //+++++++++++++++++++++++++++++++++++++++++++++++++
        //RETURN TO VIEW
        //+++++++++++++++++++++++++++++++++++++++++++++++++
        //console.log(response);
        res.render('index', { page_respond_data: JSON.stringify(response.data) });
      }).catch(function (error) {
        res.render('index', { page_respond_data: JSON.stringify(error) });
      });
    } else {
      res.render('index', { page_respond_data: "Sorry!! Error1" });
    }
  } else {
    res.render('index', { page_respond_data: "Sorry!! Error2" });
  }
});
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
module.exports = router;
//++++++++++++++++++++++++++++++++++++++++++++++++++++++
