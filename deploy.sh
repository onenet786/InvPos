#!/bin/bash
set -e

# InvPos Deploy & Update Script
# Usage:
#   ./deploy.sh         — Full deploy (first time or after config changes)
#   ./deploy.sh update  — Git pull + rebuild + restart (for code updates)
#   ./deploy.sh logs    — Show backend logs
#   ./deploy.sh stop    — Stop all services
#   ./deploy.sh restart — Restart all services

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

case "$1" in
  "" | "deploy")
    echo "=== InvPos Full Deploy ==="

    # Check .env files
    if [ ! -f .env ]; then
      warn ".env not found. Copying from .env.example..."
      cp .env.example .env
      warn "Edit .env with your values, then re-run: ./deploy.sh"
      exit 0
    fi

    if [ ! -f backend/.env ]; then
      warn "backend/.env not found. Copying from backend/.env.example..."
      cp backend/.env.example backend/.env
      warn "Edit backend/.env with your values, then re-run: ./deploy.sh"
      exit 0
    fi

    log "Building and starting containers..."
    docker-compose up -d --build

    log "Running database migrations..."
    docker exec invpos_backend npm run migrate

    log "Seeding database (skip if already seeded)..."
    docker exec invpos_backend npm run seed || warn "Seed may have already been run — this is OK."

    log "Deployment complete!"
    echo ""
    echo "  Frontend:  http://localhost:${FRONTEND_PORT:-3021}"
    echo "  Backend:   http://localhost:5005/api"
    echo "  Health:    http://localhost:5005/api/health"
    echo ""
    echo "  Logs:      ./deploy.sh logs"
    echo "  Update:    ./deploy.sh update"
    ;;

  "update")
    echo "=== InvPos Update (Git Pull + Rebuild) ==="

    log "Pulling latest code from git..."
    git pull origin main || git pull origin master

    log "Rebuilding and restarting containers..."
    docker-compose up -d --build

    log "Running new migrations (if any)..."
    docker exec invpos_backend npm run migrate || warn "No new migrations or migration skipped."

    log "Update complete! Services restarted."
    echo ""
    echo "  Check logs: ./deploy.sh logs"
    ;;

  "logs")
    log "Showing backend logs (Ctrl+C to exit)..."
    docker exec invpos_backend npm run dev 2>/dev/null || docker-compose logs -f backend
    ;;

  "stop")
    log "Stopping all services..."
    docker-compose down
    log "All services stopped."
    ;;

  "restart")
    log "Restarting all services..."
    docker-compose restart
    log "Services restarted."
    ;;

  "reset-db")
    warn "This will DELETE all data and re-seed. Continue? (y/N)"
    read -r confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
      log "Stopping services..."
      docker-compose down
      log "Removing database volume..."
      docker volume rm invpos_pgdata 2>/dev/null || true
      log "Starting services..."
      docker-compose up -d
      sleep 5
      log "Running migrations..."
      docker exec invpos_backend npm run migrate
      log "Seeding database..."
      docker exec invpos_backend npm run seed
      log "Database reset complete!"
    else
      warn "Cancelled."
    fi
    ;;

  *)
    echo "InvPos Deploy Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     Full deploy (default) — build, migrate, seed"
    echo "  update     Git pull + rebuild + restart"
    echo "  logs       Show backend logs"
    echo "  stop       Stop all services"
    echo "  restart    Restart all services"
    echo "  reset-db   Delete all data and re-seed (destructive!)"
    ;;
esac
