import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    const logContext = context || this.context;
    console.log(
      `[${new Date().toISOString()}] [LOG] [${logContext}] ${message}`,
    );
  }

  error(message: string, trace?: string, context?: string) {
    const logContext = context || this.context;
    console.error(
      `[${new Date().toISOString()}] [ERROR] [${logContext}] ${message}`,
      trace || '',
    );
  }

  warn(message: string, context?: string) {
    const logContext = context || this.context;
    console.warn(
      `[${new Date().toISOString()}] [WARN] [${logContext}] ${message}`,
    );
  }

  debug(message: string, context?: string) {
    const logContext = context || this.context;
    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        `[${new Date().toISOString()}] [DEBUG] [${logContext}] ${message}`,
      );
    }
  }

  verbose(message: string, context?: string) {
    const logContext = context || this.context;
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[${new Date().toISOString()}] [VERBOSE] [${logContext}] ${message}`,
      );
    }
  }
}
