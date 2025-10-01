from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers import roads_controller, route_controller, upload_controller
from data import road_repository
app = FastAPI()

#app.add_middleware(
    #CORSMiddleware,
    #allow_origins=["*"],
    #allow_methods=["*"],
    #allow_headers=["*"],
#)
origins = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",  # alternate localhost
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register routers
app.include_router(roads_controller.router, prefix="/api")
app.include_router(route_controller.router, prefix="/api")
app.include_router(upload_controller.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    global roads_data
    # Set the bounding box for your area
    bbox = [37.575275, 36.922821, 37.60, 36.95]
    roads_data = road_repository.fetch_and_cache_roads(bbox)
    print(f"Startup: loaded {len(roads_data)} roads")
