import winston from "winston";
import SlackHook from "winston-slack-webhook-transport";
import Transport from "winston-transport";
import Sentry from "winston-transport-sentry-node";

class StackTransport extends Transport {
  log(info: Record<string, any>, callback: () => void) {
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
    }) as StackTransport
  );
}

if (process.env.SLACK_WEBHOOK) {
  transports.push(
    new SlackHook({
      level: "error",
      formatter: (info: any) => {
        delete info.level;
        let filteredInfo = info;

        if (info.error) {
          if (
            info.error.code === "SERVER_ERROR" ||
            info.error.code === "TIMEOUT"
          ) {
            filteredInfo = {};
          } else {
            delete filteredInfo.error;
          }
        }

        const stringifiedInfo = JSON.stringify(filteredInfo, null, " ");
        const formattedInfo = stringifiedInfo.replace(/["{}]/g, "");
        return { text: formattedInfo };
      },
      webhookUrl: process.env.SLACK_WEBHOOK,
    }) as StackTransport
  );
}

if (process.env.SENTRY_DSN) {
  transports.push(
    new Sentry({
      sentry: {
        dsn: process.env.SENTRY_DSN,
        ignoreErrors: [
          /502/,
          /503/,
          /504/,
          /bad response/,
          "Request failed with status code 400",
        ],
      },
      level: "error",
    })
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
