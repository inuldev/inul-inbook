# Panduan Deployment

Dokumen ini berisi panduan lengkap untuk men-deploy aplikasi media sosial ke berbagai lingkungan, termasuk Vercel, AWS, dan Docker.

## Deployment ke Vercel (Rekomendasi untuk Hobby/Startup)

Vercel adalah platform deployment yang sangat cocok untuk aplikasi Next.js dan Express.js. Berikut adalah langkah-langkah untuk men-deploy aplikasi ke Vercel:

### Prasyarat

- Akun Vercel (bisa mendaftar dengan GitHub, GitLab, atau email)
- Repositori Git (GitHub, GitLab, atau Bitbucket)
- Node.js v18 atau lebih tinggi

### Deployment Frontend

1. **Persiapan Konfigurasi**

   Pastikan file `.env.production` sudah dikonfigurasi dengan benar:

   ```
   NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
   NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   NEXT_PUBLIC_APP_ENV=production
   ```

2. **Import Proyek ke Vercel**

   - Login ke [Vercel Dashboard](https://vercel.com/dashboard)
   - Klik "Add New" > "Project"
   - Pilih repositori Git yang berisi aplikasi
   - Klik "Import"

3. **Konfigurasi Proyek**

   - **Framework Preset**: Pilih "Next.js"
   - **Root Directory**: Atur ke `frontend`
   - **Build Command**: Biarkan default (`npm run build`)
   - **Output Directory**: Biarkan default (`.next`)
   - **Environment Variables**: Tambahkan semua variabel dari `.env.production`

4. **Deploy**

   - Klik "Deploy"
   - Tunggu proses build dan deployment selesai
   - Setelah selesai, Anda akan mendapatkan URL untuk aplikasi frontend

### Deployment Backend

1. **Persiapan Konfigurasi**

   Pastikan file `.env.production` sudah dikonfigurasi dengan benar:

   ```
   PORT=8000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   JWT_SECRET=your_jwt_secret
   SESSION_SECRET=your_session_secret
   LOG_LEVEL=error
   JWT_EXPIRES_IN=30d
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   FRONTEND_URL=https://yourdomain.com
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
   NODE_ENV=production
   ```

2. **Import Proyek ke Vercel**

   - Dari Vercel Dashboard, klik "Add New" > "Project"
   - Pilih repositori Git yang sama
   - Klik "Import"

3. **Konfigurasi Proyek**

   - **Framework Preset**: Pilih "Other"
   - **Root Directory**: Atur ke `backend`
   - **Build Command**: `npm install`
   - **Output Directory**: Biarkan kosong
   - **Install Command**: `npm install`
   - **Environment Variables**: Tambahkan semua variabel dari `.env.production`

4. **Deploy**

   - Klik "Deploy"
   - Tunggu proses build dan deployment selesai
   - Setelah selesai, Anda akan mendapatkan URL untuk API backend

### Menghubungkan Frontend dan Backend

Setelah kedua deployment selesai:

1. **Perbarui Environment Variables**

   - Di pengaturan proyek frontend, atur `NEXT_PUBLIC_BACKEND_URL` ke URL deployment backend
   - Di pengaturan proyek backend, atur `FRONTEND_URL` ke URL deployment frontend

2. **Redeploy Kedua Proyek**

   - Picu deployment baru untuk kedua proyek untuk menerapkan variabel lingkungan yang diperbarui
   - Ini bisa dilakukan dengan klik "Redeploy" di dashboard Vercel

### Konfigurasi Domain Kustom

1. **Tambahkan Domain ke Vercel**

   - Di dashboard proyek, klik "Settings" > "Domains"
   - Tambahkan domain kustom Anda (misalnya `yourdomain.com` untuk frontend dan `api.yourdomain.com` untuk backend)
   - Ikuti instruksi untuk mengkonfigurasi DNS

2. **Perbarui Environment Variables**

   - Perbarui `NEXT_PUBLIC_BACKEND_URL` dan `FRONTEND_URL` untuk menggunakan domain kustom
   - Redeploy kedua proyek

### Optimasi untuk Vercel Hobby Plan

Vercel Hobby Plan memiliki beberapa batasan yang perlu diperhatikan:

1. **Batasan Payload 4MB**

   - Gunakan upload langsung ke Cloudinary untuk file besar
   - Implementasi sudah ada di aplikasi ini

2. **Timeout Fungsi Serverless (10s)**

   - Optimalkan query database
   - Hindari operasi yang berjalan lama di API routes

3. **Cold Starts**

   - Gunakan connection pooling untuk database
   - Minimalkan dependensi yang tidak perlu

## Deployment ke AWS

AWS menawarkan skalabilitas dan fleksibilitas yang lebih besar untuk aplikasi produksi.

### Deployment dengan AWS Elastic Beanstalk

#### Prasyarat

- Akun AWS
- AWS CLI terinstal dan dikonfigurasi
- EB CLI terinstal

#### Langkah-langkah Deployment

1. **Inisialisasi Aplikasi Elastic Beanstalk**

   ```bash
   # Untuk backend
   cd backend
   eb init -p node.js social-media-backend
   
   # Untuk frontend
   cd frontend
   eb init -p node.js social-media-frontend
   ```

2. **Konfigurasi Environment Variables**

   Buat file `.ebextensions/env.config` di direktori backend dan frontend:

   ```yaml
   option_settings:
     aws:elasticbeanstalk:application:environment:
       NODE_ENV: production
       # Tambahkan variabel lingkungan lainnya
   ```

3. **Deploy Aplikasi**

   ```bash
   # Untuk backend
   cd backend
   eb create social-media-backend-prod
   
   # Untuk frontend
   cd frontend
   eb create social-media-frontend-prod
   ```

4. **Konfigurasi Domain**

   - Gunakan Route 53 untuk mengatur domain kustom
   - Konfigurasikan HTTPS dengan AWS Certificate Manager

### Deployment dengan AWS ECS (Container)

Untuk aplikasi yang lebih kompleks, Anda dapat menggunakan container dengan Amazon ECS:

1. **Buat Dockerfile untuk Backend**

   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   EXPOSE 8000
   
   CMD ["node", "index.js"]
   ```

2. **Buat Dockerfile untuk Frontend**

   ```dockerfile
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci
   
   COPY . .
   
   RUN npm run build
   
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY --from=builder /app/package*.json ./
   COPY --from=builder /app/next.config.js ./
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/node_modules ./node_modules
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

3. **Build dan Push Image ke ECR**

   ```bash
   # Login ke ECR
   aws ecr get-login-password --region region | docker login --username AWS --password-stdin account-id.dkr.ecr.region.amazonaws.com
   
   # Buat repositori
   aws ecr create-repository --repository-name social-media-backend
   aws ecr create-repository --repository-name social-media-frontend
   
   # Build dan push image
   docker build -t account-id.dkr.ecr.region.amazonaws.com/social-media-backend:latest ./backend
   docker push account-id.dkr.ecr.region.amazonaws.com/social-media-backend:latest
   
   docker build -t account-id.dkr.ecr.region.amazonaws.com/social-media-frontend:latest ./frontend
   docker push account-id.dkr.ecr.region.amazonaws.com/social-media-frontend:latest
   ```

4. **Buat Cluster ECS dan Service**

   - Gunakan AWS Management Console atau AWS CLI untuk membuat cluster ECS
   - Buat task definition untuk backend dan frontend
   - Buat service untuk menjalankan task
   - Konfigurasikan Application Load Balancer

## Deployment dengan Docker Compose (Pengembangan Lokal atau VPS)

Docker Compose sangat berguna untuk pengembangan lokal atau deployment ke VPS tunggal.

### Prasyarat

- Docker dan Docker Compose terinstal
- VPS dengan Docker terinstal (untuk deployment)

### Langkah-langkah

1. **Buat file docker-compose.yml di root proyek**

   ```yaml
   version: '3'
   
   services:
     mongodb:
       image: mongo:4.4
       container_name: mongodb
       restart: always
       volumes:
         - mongo-data:/data/db
       environment:
         - MONGO_INITDB_ROOT_USERNAME=admin
         - MONGO_INITDB_ROOT_PASSWORD=password
       networks:
         - app-network
   
     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       container_name: backend
       restart: always
       depends_on:
         - mongodb
       environment:
         - NODE_ENV=production
         - PORT=8000
         - MONGO_URI=mongodb://admin:password@mongodb:27017/social-media?authSource=admin
         - JWT_SECRET=your_jwt_secret
         - SESSION_SECRET=your_session_secret
         - FRONTEND_URL=http://localhost:3000
         # Tambahkan variabel lingkungan lainnya
       ports:
         - "8000:8000"
       networks:
         - app-network
   
     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       container_name: frontend
       restart: always
       depends_on:
         - backend
       environment:
         - NODE_ENV=production
         - NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
       ports:
         - "3000:3000"
       networks:
         - app-network
   
   networks:
     app-network:
       driver: bridge
   
   volumes:
     mongo-data:
       driver: local
   ```

2. **Jalankan Docker Compose**

   ```bash
   docker-compose up -d
   ```

3. **Untuk Deployment ke VPS**

   - Upload kode ke VPS
   - Jalankan Docker Compose
   - Konfigurasikan Nginx sebagai reverse proxy

   Contoh konfigurasi Nginx:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Konfigurasikan HTTPS dengan Certbot**

   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

## Continuous Deployment (CD)

### GitHub Actions untuk Vercel

Buat file `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Backend to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_BACKEND }}
          working-directory: ./backend
          vercel-args: '--prod'
  
  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_FRONTEND }}
          working-directory: ./frontend
          vercel-args: '--prod'
```

### GitHub Actions untuk AWS

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: social-media-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service --cluster social-media-cluster --service backend-service --force-new-deployment
  
  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: social-media-frontend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd frontend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service --cluster social-media-cluster --service frontend-service --force-new-deployment
```

## Monitoring dan Logging

### Vercel

Vercel menyediakan dashboard untuk monitoring:

- **Logs**: Tersedia di dashboard deployment
- **Analytics**: Tersedia di tab Analytics
- **Error Tracking**: Integrasi dengan Sentry

### AWS

AWS menawarkan berbagai layanan monitoring:

- **CloudWatch**: Untuk log dan metrik
- **X-Ray**: Untuk tracing
- **CloudTrail**: Untuk audit

Contoh konfigurasi CloudWatch untuk Node.js:

```js
// backend/config/logger.js
const winston = require('winston');
const { createLogger, format, transports } = winston;

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { service: 'social-media-backend' },
  transports: [
    new transports.Console(),
    // Tambahkan CloudWatch transport jika di production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.CloudWatch({
        logGroupName: '/aws/social-media/backend',
        logStreamName: `${new Date().toISOString().split('T')[0]}-${process.env.NODE_ENV}`,
        awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        messageFormatter: ({ level, message, ...meta }) => JSON.stringify({ level, message, ...meta })
      })
    ] : [])
  ]
});

module.exports = logger;
```

## Backup dan Disaster Recovery

### MongoDB Atlas

MongoDB Atlas menyediakan backup otomatis:

1. **Backup Otomatis**:
   - Login ke MongoDB Atlas
   - Pilih cluster Anda
   - Klik "Backup"
   - Aktifkan "Continuous Backup"

2. **Point-in-Time Recovery**:
   - Tersedia di plan M10 atau lebih tinggi
   - Memungkinkan recovery ke titik waktu tertentu

3. **Restore dari Backup**:
   - Pilih backup yang ingin di-restore
   - Klik "Restore"
   - Pilih cluster tujuan

### AWS Backup

Jika menggunakan AWS:

1. **Buat Backup Plan**:
   - Buka AWS Backup Console
   - Klik "Create backup plan"
   - Konfigurasikan jadwal backup

2. **Assign Resources**:
   - Pilih resources yang ingin di-backup (EBS volumes, RDS, dll.)
   - Konfigurasikan retention period

## Scaling

### Vercel

Vercel secara otomatis menangani scaling untuk serverless functions.

### AWS

AWS menawarkan berbagai opsi scaling:

1. **Horizontal Scaling dengan ECS**:
   - Konfigurasikan Auto Scaling Group
   - Atur target tracking scaling policy

   ```bash
   aws application-autoscaling register-scalable-target \
     --service-namespace ecs \
     --scalable-dimension ecs:service:DesiredCount \
     --resource-id service/social-media-cluster/backend-service \
     --min-capacity 2 \
     --max-capacity 10
   
   aws application-autoscaling put-scaling-policy \
     --service-namespace ecs \
     --scalable-dimension ecs:service:DesiredCount \
     --resource-id service/social-media-cluster/backend-service \
     --policy-name cpu-tracking-policy \
     --policy-type TargetTrackingScaling \
     --target-tracking-scaling-policy-configuration '{ 
       "TargetValue": 70.0, 
       "PredefinedMetricSpecification": { 
         "PredefinedMetricType": "ECSServiceAverageCPUUtilization" 
       }
     }'
   ```

2. **Database Scaling**:
   - Gunakan MongoDB Atlas dengan auto-scaling
   - Atau gunakan Amazon DocumentDB dengan read replicas

## Keamanan

### SSL/TLS

1. **Vercel**:
   - SSL/TLS disediakan secara otomatis

2. **AWS**:
   - Gunakan AWS Certificate Manager untuk SSL/TLS
   - Konfigurasikan Application Load Balancer dengan HTTPS listener

3. **VPS**:
   - Gunakan Certbot dengan Let's Encrypt
   - Konfigurasikan Nginx untuk HTTPS

### Firewall dan Security Groups

1. **AWS Security Groups**:
   - Batasi akses ke port yang diperlukan saja
   - Gunakan prinsip least privilege

   ```bash
   aws ec2 create-security-group \
     --group-name social-media-backend-sg \
     --description "Security group for social media backend"
   
   aws ec2 authorize-security-group-ingress \
     --group-name social-media-backend-sg \
     --protocol tcp \
     --port 8000 \
     --source-group social-media-alb-sg
   ```

2. **VPS Firewall**:
   - Gunakan UFW (Uncomplicated Firewall) di Ubuntu
   - Batasi akses ke port yang diperlukan saja

   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

## Kesimpulan

Deployment aplikasi media sosial memerlukan perencanaan dan konfigurasi yang tepat. Dokumen ini telah memberikan panduan untuk berbagai opsi deployment, dari yang sederhana (Vercel) hingga yang lebih kompleks (AWS).

Pilih opsi deployment yang sesuai dengan kebutuhan dan anggaran Anda. Untuk startup atau proyek hobby, Vercel adalah pilihan yang sangat baik karena kemudahan penggunaan dan fitur yang ditawarkan. Untuk aplikasi yang lebih besar dan kompleks, AWS menawarkan skalabilitas dan fleksibilitas yang lebih besar.

Untuk pertanyaan atau masalah terkait deployment, silakan hubungi tim DevOps atau buka issue di repositori GitHub.
