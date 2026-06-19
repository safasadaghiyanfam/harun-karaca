import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`Harun Karaca is running`);
  console.log(`Open: http://127.0.0.1:${config.port}`);
  console.log(`API health: http://127.0.0.1:${config.port}/api/health`);
});
