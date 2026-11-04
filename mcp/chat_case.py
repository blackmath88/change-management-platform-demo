"""Render private chat attachments through the repository's stdio MCP server."""
import argparse
import asyncio
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from tempfile import TemporaryDirectory

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class RecordParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_record = False
        self.records = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("id") == "record" and attrs.get("type") == "application/json":
            self.in_record = True
            self.records.append("")

    def handle_data(self, text):
        if self.in_record:
            self.records[-1] += text

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_record = False


def read_case(path):
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".html":
        parser = RecordParser()
        parser.feed(text)
        if len(parser.records) != 1:
            raise ValueError("Expected one embedded Changefield case record.")
        text = parser.records[0]
    return json.loads(text)


async def render(source, destination):
    if destination.exists():
        raise FileExistsError(f"Use a new output directory: {destination}")
    params = StdioServerParameters(command=sys.executable, args=[str(Path(__file__).with_name("server.py"))])
    async with stdio_client(params) as (read, write), ClientSession(read, write) as client:
        await client.initialize()

        async def call(name, args=None):
            response = await client.call_tool(name, args or {})
            if response.isError:
                raise ValueError(response.content[0].text)
            return response.content[0]

        await call("get_capabilities")
        example = json.loads((await call("get_example")).text)
        case = example if source is None else read_case(source)
        check = json.loads((await call("validate_case", {"case": case})).text)
        if not check["ok"]:
            raise ValueError("\n".join(check["errors"]))
        result = json.loads((await call("render_case", {"case": case})).text)
        destination.parent.mkdir(parents=True, exist_ok=True)
        with TemporaryDirectory(dir=destination.parent) as temp:
            output = Path(temp) / "result"
            output.mkdir()
            for name in ("project.json", "workbook.html"):
                item = await call("retrieve_artifact", {"render_id": result["renderId"], "filename": name})
                (output / name).write_text(item.resource.text, encoding="utf-8")
            if read_case(output / "workbook.html") != case or read_case(output / "project.json") != case:
                raise ValueError("The returned files do not contain the submitted case.")
            output.rename(destination)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--case", type=Path, help="An authored JSON or saved workbook HTML")
    action.add_argument("--example", action="store_true", help="Render the complete fictional IMD example")
    action.add_argument("--extract", type=Path, help="Print the embedded record for revision without executing HTML")
    parser.add_argument("--out", type=Path, help="New directory for both attachments")
    args = parser.parse_args()
    if args.extract:
        print(json.dumps(read_case(args.extract), ensure_ascii=False, indent=2))
    elif args.out is None:
        parser.error("--out is required for rendering")
    else:
        asyncio.run(render(args.case, args.out))
