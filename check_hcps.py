import sys
import os
sys.path.append(os.getcwd())

from backend.database import engine
from sqlalchemy import text
import json

try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT name, sentiment FROM hcps')).fetchall()
        print(json.dumps([dict(row._mapping) for row in result]))
except Exception as e:
    print("Error:", e)
