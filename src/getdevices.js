const mdns_js = require("mdns-js");
const wifi = require("node-wifi");
const axios = require("axios");
const firebaseService = require("./firebaseService");
const { response } = require("express");
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
    console.log("founded devices : ", foundedDevices);

    await deviceDiscovery()
      .then()
      .catch((error) => {
        console.log("Error in device finding : ", error);
      });


    firebaseService.addDevices(foundedDevices);

    // try {
    //   console.log("Inside post call---------------");
    //   const response = await fetch(
    //     "https://ig.mobiusdtaas.ai/tf-entity-ingestion/v1.0/schemas/66976e30c8014c6d68992390/instances?upsert=true",
    //     {
    //       method: "POST",
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3Ny1NUVdFRTNHZE5adGlsWU5IYmpsa2dVSkpaWUJWVmN1UmFZdHl5ejFjIn0.eyJleHAiOjE3MjEyMzE0NDYsImlhdCI6MTcyMTE5NTQ0NiwianRpIjoiMmU3OGIwNmItNzNiNi00NWU4LWI5MDAtZjRkOGQyOWQ0NGY3IiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLmtleWNsb2FrLnN2Yy5jbHVzdGVyLmxvY2FsOjgwODAvcmVhbG1zL21hc3RlciIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJlMDY2YmJlNC1jOGFjLTRiMTQtOTQxZS0yNGQ4Y2M4NmU5ZjciLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJIT0xBQ1JBQ1kiLCJzZXNzaW9uX3N0YXRlIjoiYjJjOGE1MWQtYjM4YS00NWUzLWIyZjYtYTYxOGQ1MzU3ZWU0IiwibmFtZSI6Ik1vYml1cyBpbXByZXNzaW9AbW9iaXVzZHRhYXMuYWkiLCJnaXZlbl9uYW1lIjoiTW9iaXVzIiwiZmFtaWx5X25hbWUiOiJpbXByZXNzaW9AbW9iaXVzZHRhYXMuYWkiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJwYXNzd29yZF90ZW5hbnRfaW1wcmVzc2lvQG1vYml1c2R0YWFzLmFpIiwiZW1haWwiOiJwYXNzd29yZF90ZW5hbnRfaW1wcmVzc2lvQG1vYml1c2R0YWFzLmFpIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7IkhPTEFDUkFDWSI6eyJyb2xlcyI6WyJIT0xBQ1JBQ1lfVVNFUiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwic2lkIjoiYjJjOGE1MWQtYjM4YS00NWUzLWIyZjYtYTYxOGQ1MzU3ZWU0IiwidGVuYW50SWQiOiJlMDY2YmJlNC1jOGFjLTRiMTQtOTQxZS0yNGQ4Y2M4NmU5ZjcifQ==.gD4SPmJeu9yayTl8lgViRsh3l7mONE19x1xTXph8uXtqy4TZVz-OBaEYpv1sae3-LabpXGoPWXRIPXmEQu97hhicYUq5I5xyWutGC0xaA67mPNkqWfDh6NsFOKT6zBO3Myhr19dFNUQoTDAAgdBxx0U8KIz4GawORELo5KO5I4xVHDF0GLlzwDYNLFoIg1VTkpJHOTq-tnGr-dIK3TT7M4UJMir404r4JpZcf_ch1pU5Z3WpLer9q1tT-r5vCZxWAzwH32kEnnnsd0IdemXy_f5d903_t_JoBkwub5WNbk-t6159jG1dExyRizlvI0ozcmM4ZCZXI4FsQup-kZEDvg"
    //       },
    //       body: JSON.stringify(foundedDevices),
    //     }
    //   );
      
    //   const jsonResponse = await response.json();
    //   console.log("Post call response:", jsonResponse);
    // } catch (error) {
    //   console.error("There was a problem with the fetch operation:", error);
    // }


    setTimeout(continuousDiscovery, 50000);
  } catch (error) {
    console.log("Error", error);
  }
  console.log(response);
}

// Start the device discovery
module.exports = {
  continuousDiscovery
};
