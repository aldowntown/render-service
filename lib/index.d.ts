export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3
}
declare type RenderResult = string;
export declare type RenderMethod<T> = (x: T, props: any) => RenderResult;
export interface RendererOptions<T> {
    logLevel?: LogLevel;
    logColors?: boolean;
    render: RenderMethod<T>;
}
/**
 * Renderer class
 */
export declare class Renderer<T> {
    /**
     * The registry holds references to all component values by their key
     */
    private _registry;
    /**
     * The render method takes the component value together with the request
     * props and returns the rendered value
     */
    private _renderMethod;
    /**
     * The log level to output
     */
    private _logLevel;
    /**
     * Whether or not to log in colors
     */
    private _logColors;
    /**
     * @param options RendererOptions
     */
    constructor(options: RendererOptions<T>);
    /**
     * _log
     *
     * @param level The log level
     * @param message Message to be logged
     */
    private _log;
    /**
     * Render request
     *
     */
    private _render;
    /**
     * Register a component in the Renderer
     *
     * @param key Key identifier used to query the component
     * @param component The component value
     */
    register(key: string, component: T): void;
    /**
     * Start the GRPC server
     */
    start(): void;
}
export default Renderer;
