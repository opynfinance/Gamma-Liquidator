import winston from "winston";
import Transport from "winston-transport";

class StackTransport extends Transport {
  log(info: any, callback: any) {
    setImmediate(() => {
      if (info && info.error) {
        console.error(info.error.stack);
      }
    });
    if (callback) {
      callback();
    }
  }
}

const alignedWithColorsAndTime = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf((info) => {
    const { timestamp, level, ...args } = info;

    const ts = timestamp.slice(0, 19).replace("T", " ");
    return `${ts} [${level}]: ${
      Object.keys(args).length ? JSON.stringify(args, null, 2) : ""
    }`;
  })
);

const transports = [
  new StackTransport({
    level: "error",
    handleExceptions: true,
  }),
];

if (process.env.LOGS === "true") {
  transports.push(
    new winston.transports.Console({
      level: "debug",
      handleExceptions: true,
      format: alignedWithColorsAndTime,
    }) as any
  );
}

const Logger = winston.createLogger({
  format: winston.format.combine(
    winston.format((info) => info)(),
    winston.format.json()
  ),
  transports,
  exitOnError: false,
});

export default Logger;
