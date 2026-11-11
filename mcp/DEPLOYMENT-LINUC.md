# Changefield MCP on linuc

Prepared 2026-11-11 against commit e0fcaa8. The MCP service is installed, running and
verified on linuc. The ChatGPT connection is **not** established: the tunnel and the
ChatGPT app registration need credentials and UI steps that only the owner's OpenAI
Platform account can supply. Nothing in this document has been tested from a ChatGPT
client, on desktop or on mobile.

## What the host already had

`msteams-personas` runs the established private-tunnel pattern on the same machine:

| Component | Where |
| --- | --- |
| Renderer + gateway | `msteams-personas-renderer.service` → `~/.local/share/msteams-personas-fleet/control/fleet-host.mjs` |
| Tunnel poller | `msteams-personas-tunnel.service` → bundled `bin/tunnel-client` with `tunnel.yaml` |
| ChatGPT path | OpenAI MCP tunnel, control plane `https://api.openai.com`, forwarding to `http://127.0.0.1:8790/mcp` |
| Fleet | linuc `100.97.81.120`, bruh `100.69.198.101`, blackbird `100.71.135.63`, private adapter on port 8791 behind a bearer token |

Changefield reuses the pattern, not the deployment: its own install root, its own
virtualenv, its own tunnel profile and its own systemd units. No Personas unit, secret,
tunnel or config file was changed.

## What is installed

Install root `~/.local/share/changefield` (mode 700).

    repo/          pinned checkout of e0fcaa8
    repo/.venv/    isolated virtualenv, mcp==1.30.0
    bin/           copy of tunnel-client 0.0.20
    secrets/       empty, mode 700, waiting for the runtime key
    logs/
    tunnel.yaml    profile template, mode 600
    COMMIT

`changefield-mcp.service` is **enabled and running**. It starts
`repo/.venv/bin/python repo/mcp/server.py --http` with `PORT=8789`. User lingering is on,
so it comes back after a reboot without a login.

`changefield-tunnel.service` is **installed but disabled**. It cannot start before the
tunnel ID and runtime key exist. It declares `BindsTo=changefield-mcp.service`, so the
poller can never outlive the MCP process.

`CHANGEFIELD_PUBLIC_URL` is deliberately unset. `retrieve_artifact` therefore returns the
workbook and the project JSON as embedded MCP resources, and no authored case is served
from a public origin. The server writes no case to disk; renders live in memory for
30 minutes or the most recent 24 renders.

## Endpoint

`http://127.0.0.1:8789/mcp` on linuc, loopback only. Verified not reachable on the
Tailscale address. A foreign `Host` header is answered with 421 and a cross-origin
request with 403, by the server's own transport security.

## Verified on 2026-11-11

Against the running service, using a private fictional six-module case that is not in Git:

- stdio smoke test (`mcp/smoke.py`) passes on the installed copy.
- Five tools discovered over streamable HTTP: `get_capabilities`, `get_example`,
  `validate_case`, `render_case`, `retrieve_artifact`.
- `get_capabilities` reports `imd/v1`, six units and six facilitation questions.
- `validate_case` rejects an empty case and accepts the fictional case.
- `render_case` returns a render handle and both files.
- `retrieve_artifact` returns both as embedded resources.
- Round trip: the returned `project.json` is byte-identical to the submitted case, the
  record embedded in `workbook.html` is identical, and all 19 IDs survive unchanged.
- `mcp/chat_case.py --extract` recovers the same case, with the same IDs, from a saved
  workbook. The revision path preserves identity.
- All six unit pages are embedded; the workbook renders its overview and its unit pages
  with the authored content in a browser.
- With `CHANGEFIELD_PUBLIC_URL` set, `retrieve_artifact` returns download URLs instead and
  `/files/<handle>/<name>` serves the bytes with `Content-Disposition: attachment`,
  `Cache-Control: no-store`, `nosniff` and `no-referrer`. An unknown handle gives 404.
- Service restart, and SIGKILL of the main process, both recover automatically.

## Remaining manual steps

These need the owner's OpenAI Platform and ChatGPT accounts. Steps 1 and 2 cannot be done
from this host: `tunnel-client admin tunnels create` requires an admin API key, and no
admin key or admin profile exists here.

1. Create a tunnel for Changefield at
   <https://platform.openai.com/settings/organization/tunnels>, in the same workspace that
   already carries the Personas tunnel. Give it its own name and description; do not reuse
   the Personas tunnel.
2. Issue a runtime API key at
   <https://platform.openai.com/settings/organization/api-keys> and write it to
   `~/.local/share/changefield/secrets/tunnel-key`, then `chmod 600` it. Keep it out of
   chat, screenshots, command arguments and Git.
3. Put the new tunnel ID into `control_plane.tunnel_id` in
   `~/.local/share/changefield/tunnel.yaml`, replacing `REPLACE_WITH_CHANGEFIELD_TUNNEL_ID`.
4. `~/.local/share/changefield/bin/tunnel-client doctor --profile-file ~/.local/share/changefield/tunnel.yaml --explain`
   must pass. It currently stops at the missing key file; the rest of the profile parses.
5. `systemctl --user enable --now changefield-tunnel.service` and confirm the poller starts
   and the MCP session initialises in `logs/tunnel.log`.
6. In ChatGPT, Settings → Connectors → add a custom MCP server, connection type Tunnel,
   selecting the new Changefield tunnel. Check the workspace association. Configure app
   authentication deliberately; do not allow anonymous access.
7. From ChatGPT on desktop, confirm the five tools are discovered, then run
   `get_capabilities` → `get_example` → `validate_case` → `render_case` →
   `retrieve_artifact` on a fictional case and confirm the workbook and the project JSON
   come back.
8. Repeat step 7 from ChatGPT on a phone, including opening the returned workbook. How an
   embedded MCP resource is offered for download differs per client, and this is the step
   most likely to behave differently on mobile. Only after this passes is mobile readiness
   established.

## Failover

Changefield render handles live in the MCP process. A second instance would not resolve a
handle issued by the first, so `retrieve_artifact` would fail intermittently behind any
round-robin. Do not give Changefield the Personas fleet's multi-host routing.

bruh is therefore a cold standby, not an active second writer. To fail over: stop
`changefield-tunnel.service` on linuc, install the same root on bruh with a launchd agent,
and only then start the poller there. The tunnel ID and the runtime key move with it. Never
run the poller on both hosts against the same tunnel. In-flight render handles are lost on
failover; the chat re-renders.

`nuc@bruh` has no SSH authorisation from linuc, so the standby has to be installed from
bruh itself.

## Operating

    systemctl --user status changefield-mcp.service
    systemctl --user restart changefield-mcp.service
    journalctl --user -u changefield-mcp.service -n 50

To move to a newer commit, fetch into `~/.local/share/changefield/repo`, reinstall the
requirements into the existing virtualenv, run `mcp/smoke.py`, then restart the service.
