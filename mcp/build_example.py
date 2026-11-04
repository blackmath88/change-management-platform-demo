"""Write the fictional example to the static hosting output."""
import sys
from pathlib import Path
from workbook import EXAMPLE, render

target = Path(sys.argv[1])
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(render(EXAMPLE), encoding="utf-8")
