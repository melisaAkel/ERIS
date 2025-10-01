Instructions to Run the Backend
1. Clone the repo
2. Create a folder named graphhopper-data under the root (ERIS)
  mkdir graphhopper-data
3. From https://download.geofabrik.de/europe/ find turkey-latest.osm.pbf file, download it and move it under the graphhopper-data
4. Move to the backend folder
cd ..
cd backend
6. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate or source venv/bin/Activate.ps1 in powershell
7. Install requirements:
pip install -r requirements.txt
8. Run the backend with
uvicorn main:app --reload
10. Make sure you have docker installed and you are inside the backend folder.
Run   docker-compose up -d

11. check if the container is created by:
docker ps
if no id is found check docker ps -a for terminated containers. check the error by
docker logs -f <container-id>
by replacing container id from the result of docker ps -a 

12. Once successfully created and docker logs -f <container-id> shows Started Server@ visit http://localhost:8989, you should see the graphhopper UI.
16. With backend and docker running at the same time, use curl or postman to test requests by:
    post request to   http://localhost:8000/api/blocked-roads
    {"id": "4477300", "blocked": true}
    to block a specific road
    post request to  http://localhost:8000/api/route
    {
    "from": {"lat": 41.0082, "lng": 28.9784},
    "to": {"lat": 41.0138, "lng": 28.9496}

  }
  to get the road between 2 points avoiding the blocked roads.
  
