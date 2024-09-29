# TikTak - TikTok Clone

**TikTak** is a TikTok-like application built with Django (backend), MySQL (database), AWS S3 & CloudFront (for video storage and delivery), and React Native with Expo (frontend). The project also leverages Zustand for state management on the frontend.

## Features
- **User Authentication**: Register and login using username, email, and password.
- **Video Upload**: Users can upload videos using AWS S3 for storage and AWS CloudFront for delivery.
- **Like & Comment System**: Users can like and comment on videos.
- **Video Feed**: View a video feed sorted by trending.
- **Notifications**: Video owners are notified when someone likes or comments on their videos.
- **Recording & Upload**: Users can record or upload videos from their phone gallery.
- **Following System**: Users can follow other users to keep up with their content.

## Tech Stack

### Backend
- **Django**: REST API built with Django using Django REST Framework.
- **MySQL**: Used as the database to store user data, video metadata, and other app data.
- **AWS S3**: Used for scalable video file storage.
- **AWS CloudFront**: Used to distribute video content with low latency.

### Frontend
- **React Native (Expo)**: For building the mobile app with cross-platform capabilities.
- **Zustand**: Used for state management across the app.

## State Management

The project uses **Zustand** for managing global state across the React Native app, including user authentication, video uploads, and video feed state.

## AWS Setup Instructions

1. **AWS S3**: Create an S3 bucket for storing video files. Update your Django settings with the correct credentials and bucket information.
2. **CloudFront**: Set up CloudFront to serve videos from the S3 bucket for optimal performance and low-latency delivery.

## License

This project is licensed under the MIT License.

## Authors

- **Yassir Benmoussa** - [kratos606](https://github.com/kratos606)

Feel free to reach out if you have any questions or contributions!
