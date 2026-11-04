"""Changefield MCP. Run locally over stdio or behind an authenticated HTTPS proxy."""
import json
import os
import secrets
import sys
from collections import OrderedDict
from threading import Lock
from time import monotonic
from urllib.parse import urlsplit

from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import EmbeddedResource, TextResourceContents
from starlette.responses import Response
from workbook import EXAMPLE, UNITS, render, validate

PUBLIC = os.getenv("CHANGEFIELD_PUBLIC_URL", "").rstrip("/")
if PUBLIC and (urlsplit(PUBLIC).scheme != "https" or not urlsplit(PUBLIC).netloc or urlsplit(PUBLIC).path):
    raise ValueError("CHANGEFIELD_PUBLIC_URL must be an HTTPS origin")
hosts = ["localhost:*","127.0.0.1:*","[::1]:*"]
if PUBLIC:
    hosts.append(urlsplit(PUBLIC).netloc)
app = FastMCP("Changefield", instructions=(
    "Build one complete IMD change case from the user's brief. Get the example, keep its native "
    "field types and stable IDs, and draft all six units. Label assumptions and open questions in "
    "the appropriate notes. If asked to facilitate, use the six questions from get_capabilities "
    "one at a time and carry each answer into the downstream units. If asked for the whole process, "
    "draft all six in one pass. Cite user-supplied PDF page numbers only when known. Ask only for "
    "missing details that change the work. Validate, render, retrieve the workbook and native JSON. "
    "For revisions start from the user's latest exported JSON. Never silently import into the IMD demo service."
), host="127.0.0.1", port=int(os.getenv("PORT","8789")), stateless_http=True, json_response=True,
    transport_security=TransportSecuritySettings(allowed_hosts=hosts,allowed_origins=[PUBLIC] if PUBLIC else []))

# Opaque handles are short-lived bearer capabilities. No case files are written to disk.
artifacts=OrderedDict()
lock=Lock()

def expire():
    now=monotonic()
    while artifacts and next(iter(artifacts.values()))[0] < now:
        artifacts.popitem(last=False)

@app.tool()
def get_capabilities() -> dict:
    """Describe the six-unit IMD authoring profile, workflow and outputs."""
    return {"version":"imd/v1","units":UNITS,"outputs":["workbook.html","project.json"],
            "facilitation":[
                {"unit":"vision","ask":"What should someone be able to do differently?","produce":"Current situation, desired outcome and an observable signal"},
                {"unit":"forces","ask":"What makes that change easier or harder?","produce":"Driving and resisting forces with a provisional strength"},
                {"unit":"stakeholders","ask":"Who experiences the change and who can decide?","produce":"Actor IDs, roles, influence and questions to verify"},
                {"unit":"communication","ask":"What should each audience know, feel or do?","produce":"One message, audience-specific invitations and communication risks"},
                {"unit":"nudges","ask":"What small action will we test, with whom and when?","produce":"Adoption map tied to actor IDs, barriers, actions and timing"},
                {"unit":"coordinate","ask":"Which disagreement can remain while work proceeds?","produce":"Both positions, holders and a practice linked to the difference ID"}
            ],
            "workflow":["get_example","validate_case","render_case","retrieve_artifact"],
            "authoring":"Use the example as the minimum supported shape. Keep the same case and actor IDs across edits. An unknown is an explicit question, not evidence.",
            "maxCaseKB":160,"retention":"30 minutes or the most recent 24 renders"}

@app.tool()
def get_example() -> dict:
    """Return one complete, fictional native IMD project as an authoring template."""
    return EXAMPLE

@app.tool()
def validate_case(case: dict) -> dict:
    """Check a complete six-unit draft and identify fields needing revision."""
    errors=validate(case)
    return {"ok":not errors,"errors":errors}

@app.tool()
def render_case(case: dict) -> dict:
    """Validate and render editable offline HTML and native project JSON."""
    html=render(case)
    handle=secrets.token_urlsafe(32)
    with lock:
        expire()
        artifacts[handle]=(monotonic()+1800,{"workbook.html":html,"project.json":json.dumps(case,ensure_ascii=False,indent=2)})
        while len(artifacts)>24:
            artifacts.popitem(last=False)
    return {"renderId":handle,"files":["workbook.html","project.json"]}

def artifact(handle,name):
    with lock:
        expire()
        entry=artifacts.get(handle)
        if not entry or name not in entry[1]:
            raise ValueError("Unknown or expired artifact. Render the case again.")
        return entry[1][name]

@app.tool()
def retrieve_artifact(render_id: str, filename: str):
    """Retrieve one rendered file. With a public origin, give the user the returned download URL."""
    body=artifact(render_id,filename)
    mime="text/html" if filename=="workbook.html" else "application/json"
    if PUBLIC:
        return {"filename":filename,"mimeType":mime,"bytes":len(body.encode()),
                "downloadUrl":f"{PUBLIC}/files/{render_id}/{filename}"}
    return [EmbeddedResource(type="resource",resource=TextResourceContents(
        uri=f"changefield://renders/{render_id}/{filename}",mimeType=mime,text=body))]

@app.custom_route("/files/{render_id}/{filename}",methods=["GET"])
async def download(request):
    name=request.path_params["filename"]
    try:
        body=artifact(request.path_params["render_id"],name)
    except ValueError:
        return Response("Expired or unknown artifact",status_code=404)
    return Response(body,media_type="text/html" if name=="workbook.html" else "application/json",
                    headers={"Content-Disposition":f'attachment; filename="{name}"',"Cache-Control":"no-store",
                             "Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"})

if __name__=="__main__":
    app.run(transport="streamable-http" if "--http" in sys.argv else "stdio")
