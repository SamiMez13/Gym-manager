import {
  findClosestIonContent,
  scrollToTop
} from "./chunk-WJMNHZSX.js";
import "./chunk-34VAAOD3.js";
import {
  componentOnReady
} from "./chunk-6MZ4JMDS.js";
import {
  readTask,
  writeTask
} from "./chunk-SDK22IUT.js";
import {
  __async
} from "./chunk-QHQP2P2Z.js";

// ../../node_modules/.pnpm/@ionic+core@7.8.6/node_modules/@ionic/core/components/status-tap.js
var startStatusTap = () => {
  const win = window;
  win.addEventListener("statusTap", () => {
    readTask(() => {
      const width = win.innerWidth;
      const height = win.innerHeight;
      const el = document.elementFromPoint(width / 2, height / 2);
      if (!el) {
        return;
      }
      const contentEl = findClosestIonContent(el);
      if (contentEl) {
        new Promise((resolve) => componentOnReady(contentEl, resolve)).then(() => {
          writeTask(() => __async(null, null, function* () {
            contentEl.style.setProperty("--overflow", "hidden");
            yield scrollToTop(contentEl, 300);
            contentEl.style.removeProperty("--overflow");
          }));
        });
      }
    });
  });
};
export {
  startStatusTap
};
/*! Bundled license information:

@ionic/core/components/status-tap.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=status-tap-BXSCFIOX.js.map
