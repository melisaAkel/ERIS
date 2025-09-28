from fastapi import APIRouter, UploadFile, File
from services import upload_service

router = APIRouter()

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    return await upload_service.upload_image(file)

@router.get("/status/{job_id}")
async def get_status(job_id: str):
    return await upload_service.get_status(job_id)

@router.get("/result/{job_id}")
async def get_result(job_id: str):
    return await upload_service.get_result(job_id)
