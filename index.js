const Switchbot = require('switchbot');

let Service;
let Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-switchbot', 'SwitchBot', SwitchBotAccessory);
}

class SwitchBotAccessory {
  constructor(log, config) {
    this.log = log;
    this.config = config;
    this.switchbot = Switchbot(config.macAddress);
    this.active = false;
  }

  getServices() {
    const accessoryInformationService = new Service.AccessoryInformation();
    accessoryInformationService
      .setCharacteristic(Characteristic.Manufacturer, 'Yuji Nakayama')

    const switchService = new Service.Switch();
    switchService
      .getCharacteristic(Characteristic.On)
        .on('get', this.getOn.bind(this))
        .on('set', this.setOn.bind(this));

    return [accessoryInformationService, switchService];
  }

  getOn(callback) {
    callback(null, this.active);
  }

  isStateLess() {
    const { stateLess } = config;
    return !!stateLess;
  }

  async setOn(value, callback) {
    const humanState = value ? 'on' : 'off';
    this.log(`Turning ${humanState}...`);

    try {
      const action = value ? this.switchbot.turnOn : this.switchbot.turnOff;
      await action();
      this.active = value;
      this.log(`Turned ${humanState}`);
      if (this.isStateLess()) {
        setTimeout(async () => {
          await this.switchbot.turnOff();
          this.active = false;
          callback();
        }, 1000);
      } else {
        callback();
      }
    } catch (error) {
      this.log(`Failed turning ${humanState}`, error);
      callback(`Failed turning ${humanState}`);
    }
  }
}
