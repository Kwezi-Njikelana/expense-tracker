# Docker Command Reference

A reusable cheat sheet for building and running apps with Docker. Commands marked
**this project** use the Expense Tracker's Compose services (`app`, `db`, and
`migrate`).

Run Compose commands from the directory containing `compose.yaml`.

## Check Docker

```bash
docker --version
docker compose version
docker info
docker run --rm hello-world
```

- `--version` checks the Docker CLI and Compose versions.
- `docker info` displays information about the Docker engine.
- `docker run --rm hello-world` downloads and runs a test container, then
  removes that container when it exits.

## Build and inspect images

```bash
docker build -t my-app:local .
docker image ls
docker image inspect my-app:local
```

- `docker build` builds an image using the `Dockerfile` and the current
  directory as its build context (`.`).
- `-t my-app:local` assigns the image a name and tag.
- `docker image ls` lists locally available images.
- `docker image inspect` displays image configuration and metadata.

**This project:**

```bash
docker build -t expense-tracker:local .
```

## Run and inspect services with Compose

```bash
docker compose config -q
docker compose up --build -d
docker compose ps
docker compose logs -f
docker compose logs --tail=50 SERVICE
docker compose exec SERVICE sh
```

- `config -q` validates the Compose configuration quietly.
- `up --build -d` builds images if needed, creates and starts the services in
  the background.
- `ps` shows the Compose services and their status.
- `logs -f` follows logs from all services; press Ctrl-C to stop following.
- `logs --tail=50 SERVICE` prints the last 50 lines for one service.
- `exec SERVICE sh` opens a shell inside a running service's container; type
  `exit` to leave it.

**This project:**

```bash
docker compose logs --tail=50 app
docker compose logs --tail=50 db
curl -i http://localhost:8000/healthz
```

The health endpoint checks that the app can reach its database.

## Stop, restart, and remove services

```bash
docker compose stop
docker compose start
docker compose restart SERVICE
docker compose down
```

- `stop` stops services but keeps their containers. `start` starts those
  existing containers again.
- `restart SERVICE` restarts one service.
- `down` stops and removes the Compose containers and network. Named volumes
  are kept by default.

**Data warning:** `docker compose down -v` also removes Compose-managed volumes.
For this project, that deletes the PostgreSQL data stored in the `postgres_data`
volume. Only use it when you intentionally want to erase that data.

## Run a one-off task

```bash
docker compose run --rm SERVICE COMMAND
```

This creates a temporary container to run a task and removes it when it exits.
For this project, run the database migrations with:

```bash
docker compose run --rm migrate
```

## List Docker resources

```bash
docker container ls
docker container ls -a
docker image ls
docker volume ls
docker network ls
```

These list running containers, all containers (including stopped ones), local
images, volumes, and networks, respectively.

## Remove a specific resource

```bash
docker rm CONTAINER
docker rmi IMAGE
docker volume rm VOLUME
```

These remove a specific container, image, or volume. Removing a database volume
erases the data stored in it. Check the resource name before removing it.
Avoid broad cleanup commands such as `docker system prune` until you understand
exactly which resources they can remove.

## Concepts to remember

- **Image:** a built template from which containers are created.
- **Container:** a running instance of an image.
- **Compose service:** a container and its configuration, such as `app` or
  `db`.
- **Port mapping:** `8000:8000` maps port 8000 on your computer to port 8000
  inside the app container.
- **Volume:** persistent storage that can outlive a container. This project
  uses one for PostgreSQL data.
- **Service networking:** Compose services can reach each other by service
  name. For example, the app connects to PostgreSQL at `db:5432`. Inside a
  container, `localhost` refers to that same container, not another service
  or your computer.

For another project, the commands are mostly the same. Update the image name,
Compose service names, ports, and project-specific tasks as needed.
