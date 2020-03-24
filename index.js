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
        .on('get', this.get.bind(this))
        .on('set', this.set.bind(this));

    this.switchService = switchService;

    return [accessoryInformationService, switchService];
  }

  get(callback) {
    callback(null, this.active);
  }

  async set(value, callback) {
    const humanState = value ? 'on' : 'off';
    this.log(`Turning ${humanState}...`);

    try {
      if (this.config.stateLess) {
        await this.switchbot.press();
        this.active = value;
        callback();
        setTimeout(() => {
          this.active = false;
          this.switchService.setCharacteristic(Characteristic.On, false);
        }, 1000);
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
