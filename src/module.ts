import { createExtension } from "@cognigy/extension-tools";

import { validateToken } from "./nodes/flowNode";

export default createExtension({
  connections: [],
  nodes: [
    validateToken
  ],
  options: { label: "Validate OIDC Token" }
});