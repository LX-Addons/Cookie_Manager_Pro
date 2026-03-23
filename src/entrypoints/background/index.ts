import { BackgroundBootstrap } from "./runtime/bootstrap";

export default defineBackground(() => {
  const bootstrap = new BackgroundBootstrap();
  bootstrap.initialize();
});
