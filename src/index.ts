import path from "path";
import chalk from "chalk";
import grpc from "grpc";
import * as protoLoader from "@grpc/proto-loader";

export enum LogLevel {
  DEBUG,
  INFO,
  WARNING,
  ERROR
}

type RenderResult = string;

export type RenderMethod<T> = (x: T, props: any) => RenderResult;

export interface RendererOptions<T> {
  logLevel?: LogLevel;
  logColors?: boolean;
  render: RenderMethod<T>;
}

const colorMap = {
  [LogLevel.DEBUG]: chalk.gray,
  [LogLevel.INFO]: chalk.blue,
  [LogLevel.WARNING]: chalk.yellow,
  [LogLevel.ERROR]: chalk.red
};

const levelTagMap = {
  [LogLevel.DEBUG]: "[DEBUG]",
  [LogLevel.INFO]: "[INFO]",
  [LogLevel.WARNING]: "[WARNING]",
  [LogLevel.ERROR]: "[ERROR]"
};

/**
 * Renderer class
 */
export class Renderer<T> {
  /**
   * The registry holds references to all component values by their key
   */
  private _registry: { [key: string]: T } = {};

  /**
   * The render method takes the component value together with the request
   * props and returns the rendered value
   */
  private _renderMethod: RenderMethod<T>;

  /**
   * The log level to output
   */
  private _logLevel: LogLevel;

  /**
   * Whether or not to log in colors
   */
  private _logColors: boolean;

  /**
   * @param options RendererOptions
   */
  constructor(options: RendererOptions<T>) {
    this._logLevel =
      options.logLevel !== undefined ? options.logLevel : LogLevel.DEBUG;
    this._logColors = options.logColors || false;
    this._renderMethod = options.render;
  }

  /**
   * _log
   *
   * @param level The log level
   * @param message Message to be logged
   */
  private _log(level: LogLevel, message: string) {
    // Only log if the log level exceeds the selected minimum
    if (level >= this._logLevel) {
      // Only apply colors if logColors is turned  on
      const color = this._logColors ? colorMap[level] : chalk.reset;

      // Log to console
      console.log(
        color(`${new Date().toISOString()} ${levelTagMap[level]} ${message}`)
      );
    }
  }

  /**
   * Render streamed requests
   *
   * @param call Duplex streaming GRPC call
   */
  private _render(call: grpc.ClientDuplexStream<any, any>) {
    call.on("data", ({ request_key, name, props }) => {
      if (!this._registry[name]) {
        this._log(LogLevel.WARNING, `Name "${name}" not registered`);
        return call.write({
          request_key,
          content: null
        });
      }

      try {
        const content = this._renderMethod(name, props);

        this._log(
          LogLevel.DEBUG,
          `Rendered ${name} (${request_key}) with props ${JSON.stringify(
            props
          )}`
        );

        call.write({
          request_key,
          content
        });
      } catch (e) {
        this._log(LogLevel.ERROR, e.message);
        call.write({
          request_key,
          content: null
        });
      }
    });

    call.on("end", () => {
      this._log(LogLevel.INFO, "Closed connection");
      call.end();
    });
  }

  /**
   * Register a component in the Renderer
   *
   * @param key Key identifier used to query the component
   * @param component The component value
   */
  register(key: string, component: T): void {
    this._registry[key] = component;
  }

  /**
   * Start the GRPC server
   */
  start() {
    const pkgDef = protoLoader.loadSync(
      path.join(__dirname, "../render_service.proto"),
      {
        keepCase: true
      }
    );
    const protoDesc = grpc.loadPackageDefinition(pkgDef);
    const server = new grpc.Server();

    // @ts-ignore
    server.addService(protoDesc.render_service.RenderService.service, {
      render: this._render.bind(this)
    });

    this._log(LogLevel.INFO, "Serving on port 50051");
    server.bind("0.0.0.0:50051", grpc.ServerCredentials.createInsecure());
    server.start();
  }
}

export default Renderer;
