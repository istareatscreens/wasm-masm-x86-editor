import { useEffect, useState } from "react";
import { useStore } from "../session/debugStore";

// An open section's rows (session/viewData.ts). Until the rows for the view come, and while the program runs, the
// last rows stay, as `stale`. `source` ({ key(view), load(view) }) must be the same object on every render.
export default function useRows(controller, id, source) {
  const key = useStore(controller.store, (view) => (view.phase === "stopped" ? source.key(view) : null));
  const idle = useStore(controller.store, (view) => view.phase === "idle");
  const [, arrived] = useState(0);

  useEffect(() => controller.views.register(id, source), [controller, id, source]);

  const latest = idle ? undefined : controller.views.latest(id);
  const current = !!latest && key !== null && latest.key === key;
  useEffect(() => {
    if (key === null || current) return undefined;
    let live = true;
    controller.views.request(id, source, controller.store.drawn()).then(() => live && arrived((count) => count + 1));
    return () => {
      live = false;
    };
  }, [controller, id, source, key, current]);

  return { rows: latest ? latest.rows : null, error: current ? latest.error : "", stale: !current };
}

// one "scopes" request for a frame at a stop, whichever sections ask
const scopesAsked = new WeakMap();
function scopesOf(controller, view) {
  const key = view.version + ":" + view.frame;
  const asked = scopesAsked.get(controller);
  if (asked && asked.key === key) return asked.answer;
  const answer = controller.client.request("scopes", { frameId: view.frame }).then((body) => body.scopes);
  scopesAsked.set(controller, { key, answer });
  return answer;
}

// One of the shown frame's scopes (Registers, Locals, Autos, Globals, Stack) as a section's rows.
export const scopeSource = (controller, name) => ({
  key: (view) => view.version + ":" + view.frame + ":" + view.settings.hex,
  load: async (view) => {
    const scope = (await scopesOf(controller, view)).filter((entry) => entry.name === name)[0];
    if (!scope) return { reference: 0, rows: [] };
    const body = await controller.client.request("variables", { variablesReference: scope.variablesReference, format: { hex: view.settings.hex } });
    return { reference: scope.variablesReference, rows: body.variables };
  },
});
