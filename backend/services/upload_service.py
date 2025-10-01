import uuid, os, asyncio
from fastapi import UploadFile
from typing import Dict

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

jobs: Dict[str, dict] = {}

async def upload_image(file: UploadFile):
    job_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(await file.read())

    jobs[job_id] = {"status": "processing", "file": file_path, "result": None}
    asyncio.create_task(simulate_processing(job_id))
    return {"job_id": job_id, "status": "processing"}

async def simulate_processing(job_id: str):
    await asyncio.sleep(1)
    jobs[job_id]["status"] = "finished"
    jobs[job_id]["result"] = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [37.5832862, 36.9300109]},
                "properties": {"status": "blocked", "id": f"damage_{job_id}"}
            }
        ]
    }

async def get_status(job_id: str):
    if job_id not in jobs:
        return {"error": "not found"}
    return {"job_id": job_id, "status": jobs[job_id]["status"]}

async def get_result(job_id: str):
    if job_id not in jobs:
        return {"error": "not found"}
    if jobs[job_id]["status"] != "finished":
        return {"error": "Job not ready"}
    return jobs[job_id]["result"]
