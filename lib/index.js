"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var _a, _b;
var path_1 = __importDefault(require("path"));
var chalk_1 = __importDefault(require("chalk"));
var grpc_1 = __importDefault(require("grpc"));
var protoLoader = __importStar(require("@grpc/proto-loader"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARNING"] = 2] = "WARNING";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var colorMap = (_a = {},
    _a[LogLevel.DEBUG] = chalk_1.default.gray,
    _a[LogLevel.INFO] = chalk_1.default.blue,
    _a[LogLevel.WARNING] = chalk_1.default.yellow,
    _a[LogLevel.ERROR] = chalk_1.default.red,
    _a);
var levelTagMap = (_b = {},
    _b[LogLevel.DEBUG] = "[DEBUG]",
    _b[LogLevel.INFO] = "[INFO]",
    _b[LogLevel.WARNING] = "[WARNING]",
    _b[LogLevel.ERROR] = "[ERROR]",
    _b);
/**
 * Renderer class
 */
var Renderer = /** @class */ (function () {
    /**
     * @param options RendererOptions
     */
    function Renderer(options) {
        /**
         * The registry holds references to all component values by their key
         */
        this._registry = {};
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
    Renderer.prototype._log = function (level, message) {
        // Only log if the log level exceeds the selected minimum
        if (level >= this._logLevel) {
            // Only apply colors if logColors is turned  on
            var color = this._logColors ? colorMap[level] : chalk_1.default.reset;
            // Log to console
            console.log(color(new Date().toISOString() + " " + levelTagMap[level] + " " + message));
        }
    };
    /**
     * Render request
     *
     */
    Renderer.prototype._render = function (call, callback) {
        var _a = call.request, name = _a.name, props = _a.props;
        console.log(call.request);
        if (!this._registry[name]) {
            var issue = "Name \"" + name + "\" not registered";
            this._log(LogLevel.ERROR, issue);
            callback({
                name: "ERROR",
                code: grpc_1.default.status.INVALID_ARGUMENT,
                message: issue
            });
        }
        try {
            var content = this._renderMethod(this._registry[name], props);
            this._log(LogLevel.DEBUG, "Rendered " + name + " with props " + JSON.stringify(props));
            return callback(null, {
                content: content
            });
        }
        catch (e) {
            this._log(LogLevel.ERROR, e.message);
            return callback({
                name: "ERROR",
                code: grpc_1.default.status.UNKNOWN,
                message: e.message
            });
        }
    };
    /**
     * Register a component in the Renderer
     *
     * @param key Key identifier used to query the component
     * @param component The component value
     */
    Renderer.prototype.register = function (key, component) {
        this._registry[key] = component;
    };
    /**
     * Start the GRPC server
     */
    Renderer.prototype.start = function () {
        var pkgDef = protoLoader.loadSync(path_1.default.join(__dirname, "../render_service.proto"), {
            keepCase: true
        });
        var protoDesc = grpc_1.default.loadPackageDefinition(pkgDef);
        var server = new grpc_1.default.Server();
        // @ts-ignore
        server.addService(protoDesc.render_service.RenderService.service, {
            render: this._render.bind(this)
        });
        this._log(LogLevel.INFO, "Serving on port 50051");
        server.bind("0.0.0.0:50051", grpc_1.default.ServerCredentials.createInsecure());
        server.start();
    };
    return Renderer;
}());
exports.Renderer = Renderer;
exports.default = Renderer;
