const mdns_js = require("mdns-js");
const wifi = require("node-wifi");
const axios = require("axios");
const firebaseService = require("./firebaseService");
const foundedDevices = [];

// Discover Chromecast devices
async function deviceDiscovery() {
  console.log("Inside Device Discovery Function");
  return new Promise((resolve, reject) => {
    const browser = mdns_js.createBrowser(mdns_js.tcp("googlecast"));

    browser.on("ready", () => {
      browser.discover();
    });

    browser.on("update", async (data) => {
      if (data.txt) {
        const txtAttributes = txtIttr(data.txt);
        const deviceName = txtAttributes.fn;
        const ipAddress = data.addresses[0];

        const timestamp = new Date().getTime();

        const isChromecastDevice = data?.fullname?.includes("googlecast");

        if (isChromecastDevice) {
          const existingDevice = foundedDevices.find(
            (device) => device.ip === ipAddress
          );

          if (!existingDevice) {

            foundedDevices.push({
              ip: ipAddress,
              name: deviceName,
            });

            console.log("New Device found : ", deviceName);
          }
        }
      }
    });

    setTimeout(() => {
      browser.stop();
      resolve();
    }, 5000);
  });
}

function txtIttr(txtArray) {
  // console.log("txtArray : ",txtArray);
  return txtArray.reduce((attributes, txt) => {
    const [key, value] = txt.split("=");
    attributes[key] = value;
    return attributes;
  }, {});
}

// Recursive function for continuous discovery
async function continuousDiscovery() {
  try {
    // console.log("founded devices : ", foundedDevices);

    await deviceDiscovery()
      .then()
      .catch((error) => {
        console.log("Error in device finding : ", error);
      });


    firebaseService.addDevices(foundedDevices);

    setTimeout(continuousDiscovery, 5000);
  } catch (error) {
    console.log("Error", error);
  }
}

// Start the device discovery
module.exports = {
  continuousDiscovery
};
