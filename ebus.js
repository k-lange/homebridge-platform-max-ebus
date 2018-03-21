const execFile = require('util').promisify(require('child_process').execFile);

const runEbusCommand = (...args) => execFile('ebusctl', args).then(({stdout, stderr}) => {
    if (stderr) {
        throw new Error('ebus stderr: ' + stderr);
    }

    return stdout.trim();
});

const getCurrentTemp = () => runEbusCommand('r', '-f', 'DisplayedRoomTemp').then(parseFloat);
const setTemp = temp => runEbusCommand('w', '-c', '350', 'Hc1DayTemp', temp);

const setHeatingTemperature = (log, devices) => {
    const maxValveState = devices.reduce(
        (acc, {valve}) => Number.isInteger(valve) ? Math.max(acc, valve) : acc, 0);
    const offset = (maxValveState / 10) - 2;

    getCurrentTemp()
        .then(currentTemp => {
            const heatingTemp = currentTemp + offset;
            log(`Current temp ${currentTemp}. Heating to ${heatingTemp}.`);
            return setTemp(heatingTemp);
        })
        .catch(error => {
            log('Error while setting heating temp: ' + error);
        });
};

module.exports = {
    setHeatingTemperature
};
