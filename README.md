# Bank Marketing

A term-deposit lead-scoring project using the UCI Bank Marketing dataset.

## Setup and run on Windows

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest
uvicorn backend.main:app --reload
```

## Setup and run on macOS/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn backend.main:app --reload
```
https://res.cloudinary.com/dckoipgrs/image/upload/v1790019646/OBJ_5.0_nduqor.png
