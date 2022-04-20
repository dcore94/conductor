# Docker
## Conductor layout for D4SCience 
Layout of Conductor for different D4Science layouts

## Building the image
Run the following command from inside the conductor root folder:

`docker build -t nubisware/conductor-server -f docker/d4science/Dockerfile-server .`
`docker build -t nubisware/conductor-frontend -f docker/d4science/Dockerfile-frontend .`

## Running the conductor server
 - Standalone server (in memory DB, no frontend, no elasticsearch): `docker run -p 8080:8080 -d -t conductor:serverAndUI`
 - Simple swarm (NGINX based UI and PEP, server with no elasticsearch and in memory db): ``
