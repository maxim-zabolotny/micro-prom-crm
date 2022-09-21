/*external modules*/
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as path from 'path';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as _ from 'lodash';
import { ConfigService } from '@nestjs/config';
import { ILog, IOptions, IPublicOptions } from '@common/interfaces/ngrok';
/*services*/
/*@common*/
/*@entities*/

/*@interfaces*/

@Injectable()
export class NgrokService implements OnModuleDestroy {
  private readonly logger = new Logger(this.constructor.name);

  private readonly defaultDirPath = path.join(__dirname, '../../../bin');
  private readonly binFileName: string;

  private readonly readyMessage = 'started tunnel';

  private processPromise: Promise<string> | null;
  private activeProcess: ChildProcessWithoutNullStreams | null;

  private processUrl: string | null = null;

  constructor(private configService: ConfigService) {
    this.binFileName = path.join(this.configService.get('ngrok.fileName'));
  }

  async onModuleDestroy() {
    await this.killProcess();
  }

  private parseLog(message: string): ILog | null {
    if (message[0] === '{') {
      return JSON.parse(message);
    } else {
      return null;
    }
  }

  private getDefaultOpts(opts: IPublicOptions): IOptions {
    const resultOpts: IOptions = _.cloneDeep(opts) as IOptions;

    if (!resultOpts.proto) resultOpts.proto = 'http';
    if (!resultOpts.hostHeader) resultOpts.hostHeader = 'rewrite';
    if (!resultOpts.logLevel) resultOpts.logLevel = 'info';

    // default auth token
    if (!resultOpts.authToken) {
      resultOpts.authToken = this.configService.get('ngrok.token');
    }

    resultOpts.log = 'stdout';
    resultOpts.logFormat = 'json';

    return resultOpts;
  }

  private async startProcess(opts: IOptions) {
    const start: string[] = [
      opts.proto,
      `--log=${opts.log}`,
      `--log-format=${opts.logFormat}`,
    ];

    if (opts.authToken) start.push(`--authtoken=${opts.authToken}`);
    if (opts.hostHeader) start.push(`--host-header=${opts.hostHeader}`);
    if (opts.logLevel) start.push(`--log-level=${opts.logLevel}`);

    start.push(String(opts.port));

    const ngrok = spawn(
      path.join(this.defaultDirPath, this.binFileName),
      start,
      { windowsHide: true },
    );

    try {
      const url = await new Promise<string>((resolve, reject) => {
        ngrok.stdout.on('data', (data) => {
          const logMsgs = data.toString().trim().split(/\n/);

          logMsgs.forEach((logMsg) => {
            const logData = this.parseLog(logMsg);
            if (!logData) {
              this.logger.warn(`skip message: "${logMsg}"`);
              return;
            }

            this.logger.debug(logData.msg, logData);

            if (logData.msg === this.readyMessage) {
              resolve(logData.url);
            }
          });
        });

        ngrok.stderr.on('data', (data) => {
          const msg = data.toString().substring(0, 10000);
          reject(new Error(msg));
        });

        ngrok.on('exit', () => {
          this.processPromise = null;
          this.activeProcess = null;

          this.logger.log('process terminated');
        });
      });

      this.activeProcess = ngrok;

      return url;
    } catch (ex) {
      ngrok.kill();
      throw ex;
    } finally {
      ngrok.stdout.removeAllListeners('data');
      ngrok.stderr.removeAllListeners('data');
    }
  }

  private async getProcess(opts: IOptions) {
    if (this.processPromise) return this.processPromise;

    try {
      this.processPromise = this.startProcess(opts);
      return await this.processPromise;
    } catch (ex) {
      this.processPromise = null;
      throw ex;
    }
  }

  private async killProcess() {
    if (!this.activeProcess) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.activeProcess.on('exit', () => resolve());
      this.activeProcess.kill();
    });
  }

  public async connect(opts: IPublicOptions) {
    const resultOpts = this.getDefaultOpts(opts);

    this.processUrl = await this.getProcess(resultOpts);
    return this.processUrl;
  }

  public async kill() {
    if (!this.processUrl) return;

    await this.killProcess();
    this.processUrl = null;
  }

  public getUrl() {
    return this.processUrl;
  }
}
