# Chat-authored IMD workbooks

ChatGPT drafts a native IMD project and its six modules. The renderer uses the same HTML units, sidebar and CSS as the Command Center. Each workbook embeds those assets and a private in-memory copy of the project, with no connection to the IMD demo database. Export JSON to revise the case in chat or explicitly import it into the hosted Command Center. Save workbook writes an offline HTML copy with the latest edits.

## Run

From the repository root with Python 3.11+:

    python -m venv .venv
    .venv/bin/pip install -r mcp/requirements.txt
    .venv/bin/python mcp/smoke.py
    .venv/bin/python mcp/server.py --http

The server binds to 127.0.0.1:8789. For a local MCP client use the same interpreter and server path without --http.

## Connect ChatGPT

For the same private setup as MS Teams Personas, configure a **separate Changefield profile** on the always-on tunnel host. Its stdio command is the absolute path to the project virtualenv's Python followed by the absolute path to mcp/server.py. Register the Changefield tunnel as its own ChatGPT app. Run the five tools through ChatGPT to verify the connection. In this mode retrieve_artifact returns file content as an embedded MCP resource; how the chat presents a download depends on the client. See the [Personas private tunnel handoff](https://github.com/blackmath88/msteams-personas/blob/main/docs/CHATGPT-CUSTOM-MCP-SETUP.md) for the established host workflow.

Alternatively, for native HTTPS download links, give this service its own authenticated HTTPS tunnel or reverse proxy. Forward to 127.0.0.1:8789, set CHANGEFIELD_PUBLIC_URL to the tunnel's HTTPS origin and restart. Register the origin plus /mcp as a custom MCP app in ChatGPT, using the authentication method supplied by your gateway. This repository does not provision an identity provider or tunnel. The same origin must route /files/ to the server. Downloads are short-lived bearer URLs, with a maximum of 24 recent renders per server process. Run a single worker. Keep these URLs out of access logs.

A chat can now use get_capabilities → get_example → validate_case → render_case → retrieve_artifact. Deliver both the HTML workbook and the native project JSON. GitHub Pages hosts the public fictional example only; the MCP does not publish authored cases there.

## Starter prompt

Use Changefield. Read my briefing or attached PDF and prepare the full IMD process. Carry the same stakeholder roles from Vision and Forces through Stakeholders, Messaging, Nudges and Coordinate. Cite PDF pages in the relevant notes where available, mark assumptions, and turn unresolved points into workshop questions. Ask me only questions that change the draft. Validate the case, render it and give me the editable offline workbook and project JSON. If I later upload a revised JSON export, update that version and retain its IDs.
