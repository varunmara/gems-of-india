# Docker Setup Guide

This project supports Docker for both development and production environments with Node.js 22, PostgreSQL 17, and Redis 7.

## Quick Reference

```bash
# Development
pnpm docker:up:dev      # Start all services (background)
pnpm docker:logs        # View logs
pnpm docker:down        # Stop all services

# Production
pnpm docker:up:prod     # Start production
pnpm docker:logs:prod   # View production logs
pnpm docker:down:prod   # Stop production
```

**Default Credentials (Development):**

- PostgreSQL: `gems` / `gems_password` @ `localhost:5432/gems_of_india`
- Redis: `localhost:6379` (no password)
- Test Users: See [Test Users](#test-users) section below

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (for cloning the repository)

## Quick Start (Development)

1. **Clone the repository and navigate to the project directory**

2. **Configure environment variables**

   ```bash
   # The .env.docker file is already configured for development
   # You can modify it if needed
   ```

3. **Start all services**

   ```bash
   pnpm docker:up:dev
   ```

   This will:
   - Start PostgreSQL 17
   - Start Redis 7
   - Build and start the Next.js application
   - Automatically run database migrations
   - **Seed the database with dummy data**
   - Enable hot reload for development
   - Run in background (detached mode)

4. **View logs to monitor startup**

   ```bash
   pnpm docker:logs
   ```

   Wait for the message "✅ Database seeding completed successfully!" and then the Next.js dev server to start.

5. **Access the application**
   - App: http://localhost:3000
   - PostgreSQL: localhost:5432 (user: `gems`, password: `gems_password`, db: `gems_of_india`)
   - Redis: localhost:6379

## Development Commands

```bash
# Start services in background (default for dev)
pnpm docker:up:dev

# Stop services
pnpm docker:down

# View logs (follow mode)
pnpm docker:logs

# View logs for specific service
docker logs -f gems-app
docker logs -f gems-postgres
docker logs -f gems-redis

# Rebuild images
pnpm docker:build

# Rebuild and start
pnpm docker:build && pnpm docker:up:dev

# Check running services
docker ps

# Access app shell
docker exec -it gems-app sh

# Re-seed database
docker exec gems-app pnpm db:seed
```

## Production Deployment

### 1. Configure Production Environment

```bash
# Copy the example file
cp .env.prod.example .env.prod

# Edit .env.prod with your production values
# IMPORTANT: Change ALL passwords and secrets!
```

**Critical production settings to configure:**

- `POSTGRES_PASSWORD` - Strong password for PostgreSQL
- `REDIS_PASSWORD` - Strong password for Redis
- `BETTER_AUTH_SECRET` - Cryptographically secure random string (min 32 chars)
- `NEXT_PUBLIC_URL` - Your production domain
- All API keys and OAuth credentials

### 2. Build Production Images

```bash
pnpm docker:build:prod
```

### 3. Start Production Services

```bash
pnpm docker:up:prod
```

### 4. Production Commands

```bash
# View production logs
pnpm docker:logs:prod

# Stop production services
pnpm docker:down:prod

# Restart production services
pnpm docker:down:prod && pnpm docker:up:prod
```

## Architecture

### Services

1. **postgres** (PostgreSQL 17)
   - Database for application data
   - Volume: `postgres_data`
   - Port: 5432 (localhost only in production)

2. **redis** (Redis 7)
   - Caching and session storage
   - Volume: `redis_data`
   - Port: 6379 (localhost only in production)

3. **app** (Node.js 22 + Next.js)
   - Main application
   - Port: 3000
   - Development: Uses `Dockerfile.dev` with hot reload
   - Production: Uses `Dockerfile` with optimized multi-stage build

### Production Security Features

- **Read-only containers** - Application containers run with read-only filesystems
- **No new privileges** - Prevents privilege escalation
- **Resource limits** - CPU and memory limits configured
- **Network isolation** - Services communicate via dedicated network
- **Port binding** - Database and Redis only bind to localhost
- **Secrets management** - All secrets required via environment variables
- **Health checks** - All services have health monitoring

## Database Management

### Seed Database

The database is automatically seeded with dummy data when you first start the development environment. To re-seed manually:

```bash
# Re-seed the database (will add to existing data)
docker exec gems-app pnpm db:seed

# To completely reset and re-seed (⚠️ destroys all data):
docker-compose down -v  # Stop and remove volumes
pnpm docker:up:dev       # Start fresh with auto-seed
```

**Important:** The seed script will skip categories if they already exist, but will attempt to insert other data. If you want a completely fresh start, use the reset method above.

**Dummy data includes:**

- 5 test users (admin, moderator, 3 regular users)
- 27 categories (government agencies, departments, infrastructure types)
- 3 notable people (politicians, activists, philanthropists)
- 4 organizations (municipal corporations, government agencies, educational institutions)
- 2 infrastructure projects (airports, bridges)
- 8 reviews with ratings and detailed feedback
- 15 upvotes across various entities
- Role assignments linking people to organizations
- Entity relationships showing organizational hierarchies

### Test Users

After seeding, you can use these test accounts (passwords would need to be set via your auth system):

| Name         | Email                    | Role      |
| ------------ | ------------------------ | --------- |
| Rajesh Kumar | rajesh.kumar@example.com | Admin     |
| Priya Sharma | priya.sharma@example.com | Moderator |
| Amit Patel   | amit.patel@example.com   | User      |
| Sneha Reddy  | sneha.reddy@example.com  | User      |
| Vikram Singh | vikram.singh@example.com | User      |

**Note:** These are dummy accounts for development testing only.

### Run Migrations

Development:

```bash
docker exec gems-app pnpm db:push
```

Production (run migrations BEFORE starting the app):

```bash
# Option 1: Run migrations from a temporary container
docker-compose -f docker-compose.prod.yml run --rm app sh -c "pnpm db:push"

# Option 2: Run migrations locally if you have node/pnpm installed
pnpm db:push

# Then start the production services
pnpm docker:up:prod
```

**Note**: It's recommended to run migrations as a separate deployment step rather than automatically in the container startup.

### Access Database

```bash
# Development
docker exec -it gems-postgres psql -U gems -d gems_of_india

# Production
docker exec -it gems-postgres-prod psql -U gems -d gems_of_india
```

### Backup Database

```bash
# Create backup
docker exec gems-postgres-prod pg_dump -U gems gems_of_india > backup.sql

# Restore backup
cat backup.sql | docker exec -i gems-postgres-prod psql -U gems gems_of_india
```

## Redis Management

### Access Redis CLI

```bash
# Development (no password)
docker exec -it gems-redis redis-cli

# Production (requires password)
docker exec -it gems-redis-prod redis-cli -a YOUR_REDIS_PASSWORD
```

### Monitor Redis

```bash
docker exec -it gems-redis-prod redis-cli -a YOUR_REDIS_PASSWORD MONITOR
```

## Troubleshooting

### View Application Logs

```bash
# All services
pnpm docker:logs

# Specific service
docker logs gems-app
docker logs gems-postgres
docker logs gems-redis
```

### Restart a Service

```bash
docker restart gems-app
```

### Clean Everything (⚠️ Destroys all data)

```bash
# Development
docker-compose down -v

# Production
docker-compose -f docker-compose.prod.yml down -v
```

### Check Service Health

```bash
docker ps
```

Look for "healthy" status in the STATUS column.

## Volume Management

### List Volumes

```bash
docker volume ls
```

### Backup Volumes

```bash
# Backup PostgreSQL data
docker run --rm -v gems-of-india_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Backup Redis data
docker run --rm -v gems-of-india_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .
```

## Performance Optimization

### Production Recommendations

1. **Use a reverse proxy** (nginx/Caddy) in front of the app
2. **Enable HTTPS** via Let's Encrypt
3. **Configure CDN** for static assets
4. **Monitor resources** using Docker stats:
   ```bash
   docker stats
   ```
5. **Regular backups** of PostgreSQL and Redis data
6. **Update images regularly** for security patches

## Development Tips

- Hot reload is enabled in development mode
- Database changes are persisted in volumes
- Use `docker:logs` to debug issues
- Environment variables in `.env.docker` can be customized

## Common Issues

### Port Already in Use

If ports 3000, 5432, or 6379 are in use:

```bash
# Find what's using the port
lsof -i :3000

# Kill the process or change the port in docker-compose.yml
```

### Permission Issues

```bash
# Fix permissions
sudo chown -R $USER:$USER .
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a --volumes
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
