# Directus CMS — self-hosted deployment

Self-hosted **Directus Core** (free) for the finco marketing site.

- **Host:** local VPS, Ubuntu, 1 vCPU / 1 GB RAM / 15 GB disk
- **Database:** SQLite (chosen for the 1 GB box; the DB holds only text/metadata — files live in R2)
- **File storage:** Cloudflare R2 (S3-compatible)
- **Public hostname:** `cms.finco.design`, published via Cloudflare Tunnel (no open ports)
- **Frontend:** unchanged — Nuxt on Cloudflare Workers, reads published content through its own server boundary

> **Capacity reality:** 1 GB is below Directus's recommended 2 GB. It works here because public
> traffic is absorbed by Cloudflare's edge cache — only editors and SSR cache-misses hit this box.
> The swapfile + `mem_limit` + `--max-old-space-size` settings keep it from OOM-ing. Do **not**
> run image transforms on this box (transforms happen at Cloudflare); do not add Redis.

---

## 1. Prepare the server (once)

```bash
# as root
apt update && apt upgrade -y
adduser finco && usermod -aG sudo finco
# add your SSH public key to /home/finco/.ssh/authorized_keys
# in /etc/ssh/sshd_config: set  PermitRootLogin no  and  PasswordAuthentication no
systemctl restart ssh

# firewall — only SSH is exposed; Directus is reached via Cloudflare Tunnel, not a public port
ufw allow OpenSSH && ufw enable
```

### Swap (required on 1 GB RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
```

### Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker finco   # then log out and back in
```

## 2. Cloudflare setup (once)

1. **R2 media bucket** — create `finco-cms-media`. Create an R2 API token (Object Read & Write); keep the Access Key ID / Secret. Bind a public hostname (e.g. `media.finco.design`) to the bucket for the website read path.
2. **R2 backup bucket** — create `finco-cms-backups` (private).
3. **Tunnel** — Zero Trust → Networks → Tunnels → Create a tunnel (token type). Add a Public Hostname: `cms.finco.design` → Service `http://directus:8055`. Copy the tunnel token.

## 3. Deploy Directus

```bash
# copy this directus/ folder to the VPS, e.g. /home/finco/directus
cd /home/finco/directus
mkdir -p database extensions
sudo chown -R 1000:1000 database extensions   # directus container runs as uid 1000

cp .env.example .env
# fill in .env: KEY/SECRET (openssl rand -hex 32), ADMIN_*, R2 keys, CF_TUNNEL_TOKEN

docker compose up -d
docker compose logs -f directus   # watch for "Server started"
```

Visit `https://cms.finco.design` and log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then change the password.

## 4. Backups

```bash
# on the VPS: install tools + configure rclone R2 remote named "r2"
sudo apt install -y sqlite3 rclone
rclone config    # new remote "r2", type=s3, provider=Cloudflare, endpoint = R2 S3 endpoint

chmod +x backup-to-r2.sh
crontab -e
# nightly at 03:00:
0 3 * * * /home/finco/directus/backup-to-r2.sh >> /home/finco/directus/backups/backup.log 2>&1
```

**Restore:** stop Directus, `gunzip` a backup over `database/data.db`, `chown 1000:1000`, start Directus.

## 5. Upgrades (deliberate only)

1. Bump the pinned tag in `docker-compose.yml` to a specific new version.
2. Back up first (run `backup-to-r2.sh`).
3. `docker compose pull && docker compose up -d`, then verify `/server/health` and the admin app.
   Never track a moving tag — a surprise migration on this box is how you lose a weekend.

## 6. Next steps (per the migration plan)

This box is the staging/production Directus for the plan in `../directus-cms-replacement-plan.md`.
Next: create the `languages` + `news`/`news_translations` collections and the Admin/Publisher/Editor
policies (Phase 1), then prove secure live preview against one news article before migrating the rest.
