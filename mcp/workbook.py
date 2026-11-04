"""Authoring and portable rendering for the six IMD workspaces."""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
IMD = HERE.parent / "public" / "imd"
EXAMPLE = json.loads((HERE / "example.json").read_text())
UNITS = list(EXAMPLE["modules"])


def validate(case):
    errors = []
    def check(value, shape, path):
        if type(value) is not type(shape):
            errors.append(f"{path}: expected {type(shape).__name__}")
        elif isinstance(shape, dict):
            if path.endswith(".bridges"):
                for key, child in value.items():
                    check(child,next(iter(shape.values())),f"{path}.{key}")
                return
            for key, child in shape.items():
                if key not in value:
                    errors.append(f"{path}.{key}: missing")
                else:
                    check(value[key], child, f"{path}.{key}")
        elif isinstance(shape, list):
            if not value and path.rsplit(".", 1)[-1] not in ("signals", "resisting", "driving"):
                errors.append(f"{path}: provide at least one entry")
            for i, entry in enumerate(value):
                check(entry, shape[0], f"{path}[{i}]")
        elif isinstance(shape, str) and shape and not value.strip():
            errors.append(f"{path}: add content or mark the question as open")
    if len(json.dumps(case)) > 160_000:
        return ["case: maximum size 160 KB"]
    check(case, EXAMPLE, "case")
    def inspect(value, path):
        if isinstance(value, dict):
            for key, child in value.items():
                if key in ("__proto__", "constructor", "prototype"):
                    errors.append(f"{path}.{key}: reserved")
                elif key == "id" and (not isinstance(child,str) or not re.fullmatch(r"[a-zA-Z0-9_-]{1,100}",child)):
                    errors.append(f"{path}.id: use letters, digits, underscore or hyphen")
                elif key in ("power","interest","strength","unresolvable_confidence") and (type(child) is not int or not 1<=child<=5):
                    errors.append(f"{path}.{key}: expected 1–5")
                inspect(child, f"{path}.{key}")
        elif isinstance(value,list):
            ids=[x["id"] for x in value if isinstance(x,dict) and isinstance(x.get("id"),str)]
            if len(ids)!=len(set(ids)):
                errors.append(f"{path}: duplicate entry IDs")
            for i,entry in enumerate(value):
                inspect(entry,f"{path}[{i}]")
    inspect(case,"case")
    if not errors:
        units=case["modules"]
        actors={x["id"] for x in units["stakeholders"]["stakeholders"]}
        tensions={x["id"] for x in units["coordinate"]["differences"]}
        for i,row in enumerate(units["nudges"]["adoption_map"]):
            if row["id"] not in actors:
                errors.append(f"case.modules.nudges.adoption_map[{i}].id: use an existing stakeholder ID")
        for i,row in enumerate(units["coordinate"]["practices"]):
            for ref in row["bridges"]:
                if ref not in tensions:
                    errors.append(f"case.modules.coordinate.practices[{i}].bridges: unknown difference {ref}")
    return errors


def embed(obj):
    return json.dumps(obj,ensure_ascii=False).replace("<","\\u003c")


def render(case):
    errors=validate(case)
    if errors:
        raise ValueError("\n".join(errors[:20]))
    pages={}
    for p in sorted(IMD.glob("unit*.html")):
        page=p.read_text().replace('window.location.pathname',json.dumps(p.name))
        page=page.replace('localStorage.', 'caseStorage.')
        page=page.replace('<script src="cmt-client.js"></script>','')
        page=page.replace('<script src="cmt-shell.js"></script>', '<!--BOOT--><script>'+ (IMD/"cmt-shell.js").read_text().replace("localStorage.", "caseStorage.").replace("Change Management Platform","Changefield")+'</script>')
        page=page.replace('<link rel="stylesheet" href="cmt-system.css">','<!--STYLE-->')
        page=re.sub(r'<link[^>]+href="favicon.svg"[^>]*>','',page)
        page=page.replace("init();", "CMTShell.mountSidebar(); init().then(() => parent.postMessage({type:'ready'}, '*'));")
        page=page.replace("document.getElementById('topbar-sep').style.display = 'inline';","document.getElementById('topbar-sep')?.style.setProperty('display','inline');")
        pages[p.name]=page
    return (HERE/"shell.html").read_text().replace("<!--BUNDLE-->",'<script type="application/json" id="bundle">'+embed({"pages":pages,"css":re.sub(r"^@import[^\n]+", "", (IMD/"cmt-system.css").read_text()),"bridge":(HERE/"bridge.js").read_text()})+'</script>').replace("<!--CASE-->",'<script type="application/json" id="record">'+embed(case)+'</script>')
