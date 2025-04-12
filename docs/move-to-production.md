# Production Deployment Guide

## Overview

This guide outlines the steps required to move the Knowledge Factory System to production using AWS services:

- Frontend: S3 + CloudFront
- Backend: ECS (Elastic Container Service)
- Database: Amazon RDS for PostgreSQL

## 1. Database Migration to RDS

### 1.1 RDS Setup

1. Create an Amazon RDS PostgreSQL instance:
   - Choose PostgreSQL version matching your local setup
   - Select appropriate instance size based on expected load
   - Configure VPC and security groups
   - Enable automated backups
   - Set up monitoring and alerts

### 1.2 Database Migration

1. Create a new database in RDS
2. Update the DATABASE_URL in your environment variables:
   ```
   DATABASE_URL="postgresql://<username>:<password>@<rds-endpoint>:5432/<database-name>"
   ```
3. Run Prisma migrations on the new database:
   ```bash
   npx prisma migrate deploy
   ```

## 2. Backend Deployment to ECS

### 2.1 Containerization

1. Create a Dockerfile for the backend
2. Build and test the container locally
3. Push the container to Amazon ECR (Elastic Container Registry)

### 2.2 ECS Setup

1. Create an ECS cluster
2. Configure task definition
3. Set up service with appropriate scaling policies
4. Configure load balancer and target groups
5. Set up health checks using the `/api/health` endpoint

### 2.3 Environment Configuration

1. Create a new `.env` file for production with:
   - Updated DATABASE_URL
   - AWS credentials for S3 access
   - Any other environment-specific variables

## 3. Frontend Deployment to S3 + CloudFront

### 3.1 S3 Setup

1. Create an S3 bucket for static hosting
2. Configure bucket policy for public access
3. Enable static website hosting
4. Upload built frontend files

### 3.2 CloudFront Setup

1. Create a CloudFront distribution
2. Configure origin to point to S3 bucket
3. Set up SSL certificate
4. Configure caching behavior
5. Set up custom domain (if required)

## 4. API Endpoint Updates

### 4.1 Backend API URL

1. Update all API calls in the frontend code to use the production backend URL
2. Replace `http://localhost:3001` with your ECS service URL
3. Update health check endpoints to use the production URL

### 4.2 CORS Configuration

1. Update CORS settings in the backend to allow requests from the production frontend domain
2. Configure appropriate security headers

## 5. Security Considerations

### 5.1 Environment Variables

1. Move all sensitive credentials to AWS Secrets Manager or Parameter Store
2. Update application code to fetch secrets from AWS services
3. Remove hardcoded credentials from codebase

### 5.2 Network Security

1. Configure VPC security groups appropriately
2. Set up WAF (Web Application Firewall) for CloudFront
3. Enable AWS Shield for DDoS protection

## 6. Monitoring and Logging

### 6.1 CloudWatch Setup

1. Configure CloudWatch Logs for ECS tasks
2. Set up CloudWatch Alarms for:
   - CPU/Memory utilization
   - Error rates
   - Response times
   - Database connections

### 6.2 Application Monitoring

1. Set up AWS X-Ray for distributed tracing
2. Configure error tracking and monitoring
3. Set up performance monitoring

## 7. Backup and Disaster Recovery

### 7.1 Database Backups

1. Configure automated RDS snapshots
2. Set up cross-region replication
3. Test backup restoration procedures

### 7.2 Application Data

1. Configure S3 versioning
2. Set up cross-region replication for S3
3. Document recovery procedures

## 8. Testing and Validation

### 8.1 Pre-deployment Checks

1. Run security scans
2. Perform load testing
3. Validate all API endpoints
4. Test database connections
5. Verify file uploads to S3

### 8.2 Post-deployment Validation

1. Monitor application logs
2. Verify all features are working
3. Check database performance
4. Validate backup procedures
5. Test failover scenarios

## 9. Maintenance and Updates

### 9.1 Update Procedures

1. Document deployment process
2. Create rollback procedures
3. Set up CI/CD pipeline
4. Configure automated testing

### 9.2 Regular Maintenance

1. Schedule database maintenance windows
2. Plan for regular security updates
3. Monitor and optimize costs
4. Review and update scaling policies

## 10. Cost Optimization

### 10.1 Resource Sizing

1. Right-size RDS instance
2. Optimize ECS task definitions
3. Configure appropriate auto-scaling
4. Set up cost alerts

### 10.2 Storage Optimization

1. Configure S3 lifecycle policies
2. Implement CloudFront caching rules
3. Optimize database storage

## Important Notes

1. Always test changes in a staging environment before production
2. Keep documentation updated with any changes
3. Regularly review and update security configurations
4. Monitor costs and optimize resources
5. Maintain backup and recovery procedures
6. Keep all dependencies and packages updated
7. Regularly review and update SSL certificates
