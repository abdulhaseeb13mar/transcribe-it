export const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = meta
      ? `[${timestamp}] INFO: ${message} ${JSON.stringify(meta)}`
      : `[${timestamp}] INFO: ${message}`;
    console.log(logMessage);
  },

  error: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = meta
      ? `[${timestamp}] ERROR: ${message} ${JSON.stringify(meta)}`
      : `[${timestamp}] ERROR: ${message}`;
    console.error(logMessage);
  },

  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = meta
      ? `[${timestamp}] WARN: ${message} ${JSON.stringify(meta)}`
      : `[${timestamp}] WARN: ${message}`;
    console.warn(logMessage);
  },

  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString();
      const logMessage = meta
        ? `[${timestamp}] DEBUG: ${message} ${JSON.stringify(meta)}`
        : `[${timestamp}] DEBUG: ${message}`;
      console.debug(logMessage);
    }
  },
};
