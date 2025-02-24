
import express from 'express';
import bodyParser from 'body-parser';
import { CONFIG } from './src/config.js';
import { LOGGER } from './src/logger.js';
import { WaterHeater } from './src/waterheater.js';
import { MQTT } from './src/mqtt.js';

LOGGER.debug({message: 'Loaded Config', CONFIG});

const WATER_HEATERS = {};
const MQTT_BROKER = new MQTT(WATER_HEATERS);

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.json()); // support json encoded bodies
app.use(express.urlencoded({ extended: true })); // support encoded bodies

const getCreateWaterHeater = async (queryParams) => {
    const deviceId = queryParams.DeviceText;

    if (deviceId in WATER_HEATERS) {
        await WATER_HEATERS[deviceId].updateData(queryParams);
        return WATER_HEATERS[deviceId]
    } else {
        const waterHeater = new WaterHeater(MQTT_BROKER, queryParams);
        await waterHeater.updateMQTTData();
        WATER_HEATERS[deviceId] = waterHeater;

       return waterHeater;
    }
}

app.use(async (req, res) => {
    LOGGER.debug({message: "Got Request", req, body: req.body, path: req.path});
    const waterHeater = await getCreateWaterHeater(req.body);
    res.status(200).end(JSON.stringify(waterHeater.toResponse()));
})

app.listen(8001);

LOGGER.info({message: "Server listening on 80"});