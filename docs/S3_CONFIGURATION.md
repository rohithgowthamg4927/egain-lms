# S3 Bucket Configuration for Resources

This guide provides detailed instructions for configuring an AWS S3 bucket to store course resources (assignments, documents, etc.) for the Knowledge Factory System.

## Bucket Creation

1. Log in to the AWS Management Console
2. Navigate to the S3 service
3. Click "Create bucket"
4. Enter a globally unique bucket name (e.g., `knowledge-factory-resources`)
5. Select the AWS Region closest to your users
6. Choose "Block all public access" for the initial setup (we'll configure specific access later)
7. Enable versioning (recommended for tracking changes to resources)
8. Click "Create bucket"

## Bucket Policy

Create a bucket policy that allows:

- Authenticated users to read resources
- Admin/instructor users to upload resources
- Deny public access to resources

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAuthenticatedRead",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
      },
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::knowledge-factory-resources/assignments/*"
    },
    {
      "Sid": "AllowAdminInstructorUpload",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
      },
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::knowledge-factory-resources/assignments/*"
    },
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::knowledge-factory-resources",
        "arn:aws:s3:::knowledge-factory-resources/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

## CORS Configuration

Enable CORS to allow uploads from your application:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Folder Structure

Create the following folder structure in your bucket:

- `/assignments/` - For storing assignment documents
- `/recordings/` - For future use with video recordings

## Environment Variables

Add the following variables to your `.env` file:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=knowledge-factory-resources
```

## Security Considerations

1. **IAM User**: Create a dedicated IAM user with limited permissions for S3 access
2. **Access Keys**: Rotate access keys regularly
3. **Encryption**: Enable server-side encryption for all objects
4. **Lifecycle Rules**: Consider setting up lifecycle rules to archive or delete old resources
5. **Monitoring**: Enable CloudTrail and S3 access logs for audit purposes

## File Naming Convention

Resources should be stored with their original filenames in the appropriate folder:

- Assignments: `/assignments/filename.pdf`
- Recordings: `/recordings/filename.mp4` (future implementation)

## Access Control

1. **Students**: Can only read/download resources for batches they're enrolled in
2. **Instructors**: Can upload/delete resources for batches they teach
3. **Admins**: Can manage all resources across all batches

## Implementation Notes

1. Use pre-signed URLs for secure, time-limited access to resources
2. Implement client-side validation for file types and sizes
3. Use multipart uploads for large files
4. Implement proper error handling for upload failures
5. Add progress indicators for upload status
