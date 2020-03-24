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

    this.switchService = new Service.Switch();
    this.switchService
      .getCharacteristic(Characteristic.On)
        .on('get', this.getStatus.bind(this))
        .on('set', this.setStatus.bind(this));

    return [accessoryInformationService, this.switchService];
  }

  resetSwitchWithTimeout() {
    setTimeout(() => {
      this.switchService.setCharacteristic(Characteristic.On, false);
    }, 1000);
  }

  getStatus(callback) {
    callback(null, this.active);
  }

  async setStatus(value, callback) {
    const humanState = value ? 'on' : 'off';
    this.log(`Turning ${humanState}...`);

    try {
      if (this.config.stateLess) {
        this.active = false;
        await this.switchbot.press();
        this.resetSwitchWithTimeout();
        callback();
      } else {
        const action = value ? this.switchbot.turnOn : this.switchbot.turnOff;
        await action();
        this.active = value;
        callback();
      }
    } catch (error) {
      this.log(`Failed turning ${humanState}`, error);
      callback(`Failed turning ${humanState}`);
    }
  }
}
