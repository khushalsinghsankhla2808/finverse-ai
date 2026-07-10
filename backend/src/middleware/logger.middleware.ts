import winston from 'winston';
import morgan from 'morgan';
import path from 'path';

// Configure Winston Logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../../logs/combined.log'),
    }),
  ],
});

// Create stream for Morgan to pipe into Winston info
const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Morgan request logging middleware
export const morganMiddleware = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
);

export default logger;
