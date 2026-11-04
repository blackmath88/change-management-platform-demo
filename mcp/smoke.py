"""Exercise discovery, invalid input, rendering, and byte retrieval over MCP."""
import asyncio
import json
import sys
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamablehttp_client
from workbook import EXAMPLE, render

async def check(read,write):
    async with ClientSession(read,write) as client:
        await client.initialize()
        tools=await client.list_tools()
        assert {t.name for t in tools.tools}=={"get_capabilities","get_example","validate_case","render_case","retrieve_artifact"}
        async def call(name,args=None):
            result=await client.call_tool(name,args or {})
            assert not result.isError,result.content
            return result
        await call("get_capabilities")
        case=json.loads((await call("get_example")).content[0].text)
        assert case==EXAMPLE
        invalid=json.loads((await call("validate_case",{"case":{}})).content[0].text)
        assert not invalid["ok"]
        assert json.loads((await call("validate_case",{"case":case})).content[0].text)["ok"]
        result=json.loads((await call("render_case",{"case":case})).content[0].text)
        for name in result["files"]:
            response=await call("retrieve_artifact",{"render_id":result["renderId"],"filename":name})
            body=response.content[0].resource.text
            if name=="workbook.html":
                assert body==render(case)
            else:
                assert json.loads(body)==case

async def main():
    if len(sys.argv)>1:
        async with streamablehttp_client(sys.argv[1]) as (read,write,_):
            await check(read,write)
    else:
        params=StdioServerParameters(command=sys.executable,args=[str(Path(__file__).with_name("server.py"))])
        async with stdio_client(params) as (read,write):
            await check(read,write)
    print("Five-tool IMD round trip passed")

asyncio.run(main())
