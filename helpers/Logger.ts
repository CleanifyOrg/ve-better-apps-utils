import winston, { transports as winstonTransports } from "winston";

const timestamp = new Date().toISOString().replace(/:/g, "-"); // Replace ':' with '-'

// Define the log file path
const logFilePath = `./logs/${timestamp}.log`;

// Define the transports array with the correct types
const transports: winston.transport[] = [
  new winstonTransports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message }) => {
        return `${level}: ${message}`;
      })
    ),
  }),
];

// Add file transport only if not in test environment
if (process.env["NODE_ENV"] !== "test") {
  transports.push(
    new winstonTransports.File({
      filename: logFilePath,
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env["NODE_ENV"] === "test" ? "silent" : "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports,
});
