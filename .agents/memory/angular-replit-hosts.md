---
name: Angular Replit host allowlist
description: Replit preview host configuration for Angular CLI applications using Vite internally.
---

Angular CLI projects that use the application dev-server builder should configure Replit preview host suffixes through `serve.options.allowedHosts` in `angular.json`; a standalone `vite.config.js` is not required.

**Why:** Replit preview domains are generated and can change, so allowing the `.replit.dev` and `.repl.co` suffixes is more durable than hard-coding one hostname.

**How to apply:** Keep the suffix allowlist on the Angular `serve` target and restart the managed web workflow after changing it.