import dotenv from "dotenv";
import axios from "axios";
import Period from "./enums/Period";
import Candle from "./models/Candle";
import { createMessageChannel } from "./messages/messageChannel";

dotenv.config();

const readMarketPrice = async (): Promise<number> => {
  const result = await axios.get(process.env.PRICES_API);

  const price = result.data.bitcoin.usd;
  console.log(price);
  return price;
};

const generateCandles = async () => {
  const messageChannel = await createMessageChannel();

  if (messageChannel === null) {
    return console.log("There was an error connecting");
  }

  while (true) {
    const loopTimes = Period.FIVE_MINUTES / Period.THIRTY_SECONDS;
    const candle = new Candle("BTC", new Date());

    console.log("------------------------------------------");
    console.log("Generating new candle");

    for (let i = 0; i < loopTimes; i++) {
      const price = await readMarketPrice();
      candle.addValue(price);
      console.log(`Market price #${i + 1} of ${loopTimes}`);
      if (i + 1 === loopTimes) {
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    candle.closeCandle();
    console.log("Candle close");

    const candleObj = candle.toSimpleObject();
    console.log(candleObj);
    const candleJson = JSON.stringify(candleObj);
    messageChannel.sendToQueue(process.env.QUEUE_NAME, Buffer.from(candleJson));
    console.log("Candle enqueued");
  }
};

generateCandles();
