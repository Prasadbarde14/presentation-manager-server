const nodecastor = require("nodecastor");
const { Client } = require("castv2-client");
const { DefaultMediaReceiver } = require("castv2-client");
const ping = require("ping");
const util = require('util');
// const { devices } = require('./server');
let device = [];

const retrieveData = (req, res) => {
  device = req.body;
  console.log("DATA");
  console.log(device);
  main();

  res.send("SUCCESS");
};

nodecastor.scan().on('offline', device => {
  try {
    console.log(util.inspect(device));
  } catch(error) {
    console.log(error);
  }
}).on('online', device => {
  // console.log(util.inspect(device));
}).start();

const startCasting = async (device) => {
  try {
    const { device_name, device_ip, url, x1, x2, y1, y2 } = device;
    console.log("Casting to device:", device_name);

    let res = await ping.promise.probe(device_ip);
    console.log("alive : ", res.alive);
    if (!res.alive) return "Device not found on network"; 
    let finalUrl = url;

    console.log("final url ,", finalUrl);
    const deviceObject = new nodecastor.CastDevice({
      friendlyName: device_name,
      name: device_name,
      address: device_ip,
    });

    await new Promise((resolve, reject) => {
      deviceObject.on("connect", () => {
        deviceObject.status((err, status) => {
          if (err) {
            console.error("Device status error:", err);
            reject(err);
            return;
          }
          console.log("Device status done");
          if (device.device && device.device.casterId) {
            sendDeviceStatus({
              casterId: device.device.casterId,
              chromecastId: device.host,
              timestamp: Date.now(),
              state: "success",
            });
          }

          try {
            deviceObject.application("5CB45E5A", (err, application) => {
              if (err) {
                console.error("Application error:", err);
                reject(err);
                return;
              }
              application.run("urn:x-cast:com.url.cast", (err, session) => {
                if (err) {
                  console.error("Run error:", err);
                  reject(err);
                  return;
                }
                session.send({ type: "loc", url: finalUrl }, (err, data) => {
                  if (err) {
                    console.error("Send error:", err);
                    reject(err);
                    return;
                  }
                  console.log("Casting success to device:", device_name);
                  resolve();
                });
              });
            });
          } catch (error) {
            console.error("Casting error:", error);
            reject(error);
          }
        });
      });
    });

    return "casting done";
  } catch (error) {
    console.error("Error in casting:", error);
  }
};

const stopCasting = async (device) => {
  console.log("Stopping casting");
  try {
    const { device_ip } = device;

    let res = await ping.promise.probe(device_ip);
    console.log("alive : ", res.alive);
    if (!res.alive) return "Device not found on network";

    const client = new Client();
    await new Promise((resolve, reject) => {
      client.connect(device_ip, () => {
        client.launch(DefaultMediaReceiver, (err) => {
          if (err) {
            console.error("Launch error:", err);
            reject(err);
            return;
          }
          console.log("Stopped casting to device:", device.device_name);
          client.close();
          resolve();
        });
      });
      client.on("error", (err) => {
        console.error("Error occurred for stopping the casting:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Stop casting error:", error);
  }
};

async function main() {
  for (let index = 0; index < device.length; index++) {
    if(device[index].isStop) await stopCasting(device[index]);
    else {
      await stopCasting(device[index]);
      await startCasting(device[index]);
    }
  }
  console.log("inside stop cast-------");
}

module.exports = { retrieveData };