# Profile Picture Handling in LMS

## Overview

This document explains how profile pictures are handled in the Learning Management System (LMS). The system supports profile pictures for all users (students, instructors, and admins).

## Database Structure

Profile pictures are stored in the `ProfilePicture` table with the following structure:

```typescript
interface ProfilePicture {
  pictureId: number;
  userId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}
```

## File Storage

- Profile pictures are stored in the `/uploads/profile-pictures` directory
- Each file is renamed to a unique name using the format: `user_{userId}_{timestamp}.{extension}`
- Supported file types: JPG, PNG, JPEG
- Maximum file size: 5MB

## Implementation Details

### 1. Uploading Profile Pictures

The admin can upload profile pictures for any user through the user management interface:

```typescript
// API Endpoint: POST /api/users/:userId/profile-picture
async function uploadProfilePicture(userId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/users/${userId}/profile-picture`, {
    method: "POST",
    body: formData,
  });

  return response.json();
}
```

### 2. Displaying Profile Pictures

Profile pictures are displayed in various places:

- User profile page
- Course instructor list
- Student list
- Comments and discussions
- Navigation bar (for logged-in user)

The `User` interface includes profile picture information:

```typescript
interface User {
  // ... other fields
  profilePictureId?: number;
  profilePicture?: ProfilePicture;
  photoUrl?: string;
}
```

### 3. Default Profile Pictures

If a user doesn't have a profile picture:

- A default avatar is shown using the first letter of their name
- The background color is randomly generated but consistent for each user
- The default avatar is rendered using the `Avatar` component

### 4. Updating Profile Pictures

To update a profile picture:

1. Admin navigates to the user's profile
2. Clicks on the profile picture or "Change Picture" button
3. Selects a new image file
4. The system:
   - Validates the file type and size
   - Uploads the new image
   - Deletes the old image file
   - Updates the database record

### 5. Implementation Example

```typescript
// Component for displaying profile picture
function UserAvatar({ user }) {
  if (user.photoUrl) {
    return <img src={user.photoUrl} alt={user.fullName} className="avatar" />;
  }

  return (
    <div className="default-avatar">
      {user.fullName.charAt(0).toUpperCase()}
    </div>
  );
}

// Upload handler
async function handleProfilePictureUpload(event, userId) {
  const file = event.target.files[0];

  if (!file) return;

  // Validate file
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    toast.error("Please upload a JPG or PNG file");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error("File size must be less than 5MB");
    return;
  }

  try {
    await uploadProfilePicture(userId, file);
    toast.success("Profile picture updated successfully");
  } catch (error) {
    toast.error("Failed to update profile picture");
  }
}
```

## Security Considerations

1. File type validation on both frontend and backend
2. File size limits
3. Secure file storage outside of public web root
4. Access control to prevent unauthorized updates
5. Sanitization of file names
6. Rate limiting on upload endpoints

## Best Practices

1. Use WebP format for better performance when supported
2. Implement image optimization and resizing
3. Use CDN for faster delivery
4. Implement lazy loading for images
5. Cache profile pictures in the browser
6. Handle image loading errors gracefully
