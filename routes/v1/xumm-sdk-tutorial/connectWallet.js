const { XummSdk } = require("xumm-sdk");
const { XUM_KEY, XUM_SECRET } = require("../../../config");
const { TxData } = require("xrpl-txdata");

const Sdk = new XummSdk(XUM_KEY, XUM_SECRET);
// const Verify = new TxData();

const connectXumWallet = async (req, res) => {
  console.log("connect Xum wallet func called");
  // console.log("id", req.params.id);
  // console.log(req.io);
  // setInterval(() => {
  // 	req.io.to(req.params.id).emit("liveXum", {
  // 		text: req.params.id
  // 	});
  // }, 2000);
  const appInfo = await Sdk.ping();
  console.log(appInfo);
  const request = {
    txjson: {
      TransactionType: "SignIn",
    },
  };
  const subscription = await Sdk.payload.createAndSubscribe(
    request,
    (event) => {
      console.log("New payload event:", event.data);
      req.io.to(req.params.id).emit("liveXum", {
        data: event.data,
      });
      if (event.data.signed === true) {
        // console.log("Woohoo! The sign request was signed :)");
        // console.log("data", event.data);
        return event.data;
      }

      if (event.data.signed === false) {
        // console.log("The sign request was rejected :(");
        return false;
      }
    }
  );
  res.send({
    status: 200,
    message: subscription.created.refs.qr_png,
	link: subscription.created.next.always,
  });
  console.log("New payload created, URL:", subscription.created);

  const resolveData = await subscription.resolved;

  if (resolveData.signed === false) {
    console.log("The sign request was rejected :(");
    // req.io.to(req.params.id).emit("result", );
  }

  if (resolveData.signed === true) {
    console.log("Woohoo! The sign request was signed :)");

    /**
     * Let's fetch the full payload end result, and get the issued
     * user token, we can use to send our next payload per Push notification
     */
    const result = await Sdk.payload.get(resolveData.payload_uuidv4);
    console.log("result:", result);
    console.log("User token:", result.application.issued_user_token);
    req.io.to(req.params.id).emit("result", result);
  }

  // console.log(subscription);
  // res.send("subscription");
};
module.exports = connectXumWallet;
