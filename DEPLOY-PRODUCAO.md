# 📈 GUIA DE DEPLOY & PRODUÇÃO - SCRUM-MARKOV APP

## 🚀 Pipeline de Deployment

### Estratégia de Deploy

O Scrum-Markov App suporta múltiplas estratégias de deployment para diferentes cenários:

```
┌─────────────────────────────────────────────┐
│              DEPLOYMENT FLOW                │
├─────────────────────────────────────────────┤
│  Development  →  Staging  →  Production     │
│      ↓            ↓           ↓            │
│   localhost    teste.com   app.com         │
│   Hot Reload   QA Tests    Load Balanced    │
└─────────────────────────────────────────────┘
```

### Build Configurations

#### 1. Development Build

```json
// package.json - scripts de desenvolvimento
{
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 3000",
    "dev:network": "vite --host --port 3000",
    "dev:debug": "vite --host 0.0.0.0 --port 3000 --debug",
    "dev:https": "vite --https --host 0.0.0.0 --port 3443"
  }
}
```

```typescript
// vite.config.ts - desenvolvimento
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    hmr: {
      overlay: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  define: {
    __DEV__: true,
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
```

#### 2. Production Build

```json
// package.json - scripts de produção
{
  "scripts": {
    "build": "tsc && vite build",
    "build:analyze": "tsc && vite build --mode analyze",
    "build:staging": "tsc && vite build --mode staging",
    "build:production": "tsc && vite build --mode production",
    "preview": "vite preview --port 4173 --host"
  }
}
```

```typescript
// vite.config.ts - produção
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react(),
      // Bundle analyzer para otimização
      mode === 'analyze' && bundleAnalyzer(),
      // PWA plugin para Service Worker
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        }
      })
    ].filter(Boolean),
    
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : undefined,
      
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['src/utils/markov.ts', 'src/utils/storage.ts'],
            ui: ['lucide-react']
          }
        }
      },
      
      chunkSizeWarningLimit: 1000
    },
    
    define: {
      __DEV__: !isProduction,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  };
});
```

## 🌐 Deployment Environments

### 1. Local Development

```powershell
# executar-local.ps1
Write-Host "🚀 Iniciando Scrum-Markov App localmente..." -ForegroundColor Green

# Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Instale em: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar versão do Node.js
$nodeVersion = node --version
Write-Host "📦 Node.js version: $nodeVersion" -ForegroundColor Blue

# Instalar dependências se necessário
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha na instalação das dependências" -ForegroundColor Red
        exit 1
    }
}

# Verificar se o build existe
if (-not (Test-Path "dist")) {
    Write-Host "🔨 Gerando build de produção..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha no build" -ForegroundColor Red
        exit 1
    }
}

# Iniciar servidor local
Write-Host "🌐 Iniciando servidor em http://localhost:3000" -ForegroundColor Green
Write-Host "🛑 Para parar o servidor, pressione Ctrl+C" -ForegroundColor Cyan

npx serve -s dist -l 3000
```

### 2. Static Hosting (Netlify/Vercel)

#### Netlify Configuration

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 3. Docker Deployment

#### Multi-stage Dockerfile

```dockerfile
# Dockerfile
# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.cjs ./
COPY postcss.config.cjs ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY index.html ./
COPY public/ ./public/

# Build application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine as production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

```nginx
# nginx.conf
user nginx;
worker_processes auto;

error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    server {
        listen 80;
        listen [::]:80;
        server_name localhost;
        
        root /usr/share/nginx/html;
        index index.html;

        # Security
        server_tokens off;
        
        # Cache static assets
        location /assets/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff";
        }
        
        # Cache JS/CSS files
        location ~* \.(js|css|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  scrum-markov-app:
    build: 
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
  # Optional: Load balancer for multiple instances
  nginx-lb:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - scrum-markov-app
    restart: unless-stopped
```

### 4. Cloud Deployment (AWS/Azure/GCP)

#### AWS S3 + CloudFront

```bash
#!/bin/bash
# deploy-aws.sh

# Configurações
S3_BUCKET="scrum-markov-app-prod"
CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC"
AWS_REGION="us-east-1"

echo "🚀 Deploying to AWS S3 + CloudFront..."

# Build da aplicação
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Upload para S3
echo "📤 Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --delete \
    --cache-control "max-age=31536000" \
    --exclude "*.html" \
    --exclude "service-worker.js"

# Upload HTML files com cache curto
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate"

# Invalidar CloudFront
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"

echo "✅ Deployment completed successfully!"
echo "🌐 Application available at: https://yourapp.com"
```

#### Terraform Configuration

```hcl
# main.tf - AWS Infrastructure
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket
resource "aws_s3_bucket" "app_bucket" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_website_configuration" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "app_distribution" {
  origin {
    domain_name = aws_s3_bucket.app_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.app_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.app_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.app_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.app_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 31536000
    default_ttl            = 31536000
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "https-only"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
}
```

## 🔧 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Scrum-Markov App

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 18

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-production:
    needs: [test, deploy-staging]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }}/ \
            --delete \
            --cache-control "max-age=31536000" \
            --exclude "*.html"
          
          aws s3 cp dist/index.html s3://${{ secrets.S3_BUCKET }}/index.html \
            --cache-control "max-age=0, no-cache, no-store, must-revalidate"
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

## 📊 Monitoring & Observability

### Application Performance Monitoring

```typescript
// utils/monitoring.ts
export class ProductionMonitoring {
  private static analyticsEnabled = process.env.NODE_ENV === 'production';
  
  static initializeMonitoring(): void {
    if (!this.analyticsEnabled) return;
    
    // Performance Observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceMetric(entry);
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
    
    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandledrejection',
        reason: event.reason
      });
    });
  }
  
  static trackPageView(page: string): void {
    if (!this.analyticsEnabled) return;
    
    // Analytics tracking (ex: Google Analytics, Mixpanel, etc.)
    this.sendAnalyticsEvent('page_view', {
      page,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`
    });
  }
  
  static trackUserAction(action: string, properties: Record<string, any> = {}): void {
    if (!this.analyticsEnabled) return;
    
    this.sendAnalyticsEvent('user_action', {
      action,
      ...properties,
      timestamp: new Date().toISOString()
    });
  }
  
  private static trackPerformanceMetric(entry: PerformanceEntry): void {
    this.sendAnalyticsEvent('performance_metric', {
      name: entry.name,
      duration: entry.duration,
      entry_type: entry.entryType,
      timestamp: new Date().toISOString()
    });
  }
  
  private static trackError(error: Error, context: any = {}): void {
    this.sendAnalyticsEvent('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent
    });
  }
  
  private static async sendAnalyticsEvent(
    event: string, 
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Em produção, enviar para seu serviço de analytics
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data })
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }
}

// Inicializar monitoramento na aplicação
ProductionMonitoring.initializeMonitoring();
```

### Health Check Endpoint

```typescript
// public/health.js
// Health check script para monitoramento externo
(function() {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: window.__APP_VERSION__ || 'unknown',
    checks: {}
  };
  
  // Check localStorage availability
  try {
    localStorage.setItem('health-check', 'test');
    localStorage.removeItem('health-check');
    healthStatus.checks.localStorage = 'ok';
  } catch (e) {
    healthStatus.checks.localStorage = 'failed';
    healthStatus.status = 'degraded';
  }
  
  // Check if main app loaded
  healthStatus.checks.appLoaded = document.querySelector('#root') ? 'ok' : 'failed';
  if (healthStatus.checks.appLoaded === 'failed') {
    healthStatus.status = 'unhealthy';
  }
  
  // Expose health status
  window.__HEALTH_STATUS__ = healthStatus;
  
  // Send to monitoring if configured
  if (window.__MONITORING_ENDPOINT__) {
    fetch(window.__MONITORING_ENDPOINT__, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(healthStatus)
    }).catch(() => {}); // Fail silently
  }
})();
```

## 🔐 Security in Production

### Security Headers

```typescript
// utils/securityHeaders.ts
export const SecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Needed for Vite
    "style-src 'self' 'unsafe-inline'",  // Needed for Tailwind
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "child-src 'none'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};
```

### Environment Variables

```bash
# .env.production
NODE_ENV=production
VITE_APP_VERSION=$npm_package_version
VITE_BUILD_TIME=$BUILD_TIME
VITE_COMMIT_HASH=$COMMIT_HASH

# Analytics & Monitoring
VITE_ANALYTICS_ID=GA-XXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_MONITORING_ENDPOINT=https://monitoring.yourapp.com/api/events

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] **Code Quality**
  - [ ] All tests passing
  - [ ] Linting without errors
  - [ ] Type checking successful
  - [ ] Bundle size analysis acceptable

- [ ] **Security**
  - [ ] Dependencies audit clean
  - [ ] Security headers configured
  - [ ] Sensitive data removed from client code
  - [ ] CSP policy validated

- [ ] **Performance**
  - [ ] Bundle optimization complete
  - [ ] Images optimized
  - [ ] Lazy loading implemented
  - [ ] Cache strategies configured

### Post-Deployment

- [ ] **Verification**
  - [ ] Application loads correctly
  - [ ] All features functional
  - [ ] Mobile responsiveness working
  - [ ] Cross-browser compatibility verified

- [ ] **Monitoring**
  - [ ] Health checks responding
  - [ ] Analytics tracking active
  - [ ] Error monitoring functional
  - [ ] Performance metrics collecting

- [ ] **Documentation**
  - [ ] Deployment notes updated
  - [ ] Version changelog updated
  - [ ] Rollback procedures documented
  - [ ] Team notified of deployment

---

## 🔧 Troubleshooting Common Issues

### Build Issues

```bash
# Clear cache and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build

# Debug build process
npm run build -- --debug
npm run build:analyze

# Check for TypeScript errors
npm run type-check
```

### Deployment Issues

```bash
# Test production build locally
npm run build
npm run preview

# Check for missing environment variables
printenv | grep VITE_

# Validate service worker
npx workbox-cli --help
```

### Performance Issues

```bash
# Analyze bundle size
npm run build:analyze

# Audit dependencies
npm audit
npm audit fix

# Check for unused dependencies
npx depcheck
```

---

**Guia de Deploy mantido por:** DevOps Team  
**Última atualização:** 27 de Setembro de 2025  
**Versão do Deploy:** 3.2