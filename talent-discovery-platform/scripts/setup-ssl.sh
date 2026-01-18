#!/bin/bash
# ==============================================
# Get-Noticed - SSL Certificate Setup Script
# Domain: get-noticed.net
# ==============================================
# This script sets up Let's Encrypt SSL certificates
# for production deployment on EC2/VPS
# ==============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN="get-noticed.net"
API_DOMAIN="api.get-noticed.net"
EMAIL="${SSL_EMAIL:-admin@get-noticed.net}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL Certificate Setup for Get-Noticed${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Install certbot
install_certbot() {
    echo -e "${YELLOW}Installing Certbot...${NC}"

    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        yum install -y certbot python3-certbot-nginx
    else
        echo -e "${RED}Unsupported package manager. Please install certbot manually.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Certbot installed successfully.${NC}"
}

# Obtain certificates
obtain_certificates() {
    echo -e "${YELLOW}Obtaining SSL certificates...${NC}"

    certbot certonly \
        --nginx \
        --non-interactive \
        --agree-tos \
        --email $EMAIL \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d $API_DOMAIN

    echo -e "${GREEN}Certificates obtained successfully.${NC}"
}

# Copy certificates for Docker
copy_for_docker() {
    echo -e "${YELLOW}Copying certificates for Docker...${NC}"

    local ssl_dir="./docker/nginx/ssl"
    mkdir -p $ssl_dir

    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $ssl_dir/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $ssl_dir/

    chmod 644 $ssl_dir/fullchain.pem
    chmod 600 $ssl_dir/privkey.pem

    echo -e "${GREEN}Certificates copied to $ssl_dir${NC}"
}

# Setup auto-renewal
setup_renewal() {
    echo -e "${YELLOW}Setting up auto-renewal...${NC}"

    # Create renewal hook script
    cat > /etc/letsencrypt/renewal-hooks/deploy/copy-certs.sh << 'EOF'
#!/bin/bash
DOMAIN="get-noticed.net"
SSL_DIR="/path/to/your/project/docker/nginx/ssl"

cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/

# Reload nginx if running in Docker
docker exec get-noticed-nginx nginx -s reload 2>/dev/null || true
EOF

    chmod +x /etc/letsencrypt/renewal-hooks/deploy/copy-certs.sh

    # Test renewal
    certbot renew --dry-run

    echo -e "${GREEN}Auto-renewal configured successfully.${NC}"
}

# Main
main() {
    install_certbot
    obtain_certificates
    copy_for_docker
    setup_renewal

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}SSL Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Certificates are located at:"
    echo "  - /etc/letsencrypt/live/$DOMAIN/"
    echo "  - ./docker/nginx/ssl/"
    echo ""
    echo "Auto-renewal is configured via certbot's systemd timer."
    echo "Run 'systemctl status certbot.timer' to verify."
    echo ""
}

# Parse arguments
case "${1:-setup}" in
    setup)
        main
        ;;
    renew)
        certbot renew
        copy_for_docker
        ;;
    status)
        certbot certificates
        ;;
    *)
        echo "Usage: $0 [setup|renew|status]"
        exit 1
        ;;
esac
