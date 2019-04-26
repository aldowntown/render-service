import { Renderer, LogLevel } from "../src";

const renderer = new Renderer({
  logColors: true,
  logLevel: LogLevel.DEBUG,
  render(obj, props) {
    const exclamate = props.exclamate === "true" ? true : false;
    return `hello ${obj}${exclamate ? "!" : "."}`;
  }
});

renderer.register("gunnar", "gunnar");

renderer.start();
