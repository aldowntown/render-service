import path from "path";
import grpc from "grpc";
import * as protoLoader from "@grpc/proto-loader";

const pkgDef = protoLoader.loadSync(
  path.join(__dirname, "../render_service.proto"),
  {
    keepCase: true
  }
);
const protoDesc = grpc.loadPackageDefinition(pkgDef);
const renderService = protoDesc.render_service;

// @ts-ignore
const client = new renderService.RenderService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

const start = Date.now();
const call = client.render();
const contents: string[] = [];

call.on("data", (res: any) => {
  console.log(res);
  contents.push(res.request_key);

  if (contents.length === 6) {
    call.end();
    console.log(Date.now() - start, "ms");
  }
});

call.write({
  request_key: "a",
  name: "test",
  props: null
});

call.write({
  request_key: "b",
  name: "gunnar",
  props: {
    exclamate: false
  }
});

call.write({
  request_key: "c",
  name: "gunnar",
  props: {
    exclamate: true
  }
});

call.write({
  request_key: "d",
  name: "gunnar",
  props: {
    exclamate: true
  }
});

call.write({
  request_key: "e",
  name: "gunnar",
  props: {
    exclamate: true
  }
});

call.write({
  request_key: "f",
  name: "gunnar",
  props: {
    exclamate: true
  }
});
