import sys
import os

# Add the current directory to python path
sys.path.append(os.getcwd())

from backend.database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE hcps ADD COLUMN region VARCHAR;'))
        conn.commit()
    print("Column added successfully!")
except Exception as e:
    print("Error:", e)
