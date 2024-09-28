type LogLevel = 'info' | 'warn' | 'error';

const logger = {
  info: (message: string, data?: any) => log('info', message, data),
  warn: (message: string, data?: any) => log('warn', message, data),
  error: (message: string, data?: any) => log('error', message, data),
};

function log(level: LogLevel, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  console[level](logMessage);
  if (data) {
    console[level](JSON.stringify(data, null, 2));
  }
}

export default logger;