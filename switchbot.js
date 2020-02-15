const noble = require('@abandonware/noble');

const uuidPrimary = 'cba20d00224d11e69fb80002a5d5c51b';
const uuidWrite = 'cba20002224d11e69fb80002a5d5c51b';
const commands = {
  turnOn: '570101',
  turnOff: '570102'
};

const Switchbot = address => {
  let peripheral;

  noble.on('stateChange', state => {
    if (state === 'poweredOn') {
      noble.startScanning([uuidPrimary], false);
    } else {
      noble.stopScanning();
    }
  });

  noble.on('discover', discoveredPeripheral => {
    if (discoveredPeripheral.address.match(new RegExp(address.replace(/:/g, '.'), 'i'))) {
      peripheral = discoveredPeripheral;
    }
  });

  const getState = () => {
    const advertisement = peripheral.advertisement;
    const serviceData = advertisement.serviceData;
    const buf = serviceData[0].data;
    const byte1 = buf.readUInt8(1);
    return byte1 & 0b01000000 ? true : false;
  };

  const exec = command => {
    new Promise((resolve, reject) => {
      peripheral.connect(error => {
        peripheral.discoverAllServicesAndCharacteristics((error, services, chars) => {
          chars.forEach(char => {
            if (char.uuid === uuidWrite) {
              const cmd = new Buffer.from(commands[command], 'hex');
              char.write(cmd, false, error => {
                peripheral.disconnect();
                resolve();
              });
            }
          });
        });
      });
    });
  };

  const turnOn = () => {
    if (!getState()) {
      return Promise.resolve();
    }
    return exec('turnOn');
  };

  const turnOff = () => {
    if (getState()) {
      return Promise.resolve();
    }
    return exec('turnOff');
  };

  return { turnOn, turnOff };
};

module.exports = Switchbot;
