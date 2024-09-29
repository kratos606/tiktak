from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models
import uuid
import os

from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models
import uuid
import os

# Custom function to upload profile pictures
def upload_to_profile_picture(instance, filename):
    # Extract the file extension
    ext = filename.split('.')[-1]
    # Generate a unique UUID and append the file extension
    new_filename = f"{uuid.uuid4()}.{ext}"
    # Return the full path for the profile picture file
    return os.path.join('profile_pictures/', new_filename)

class User(AbstractUser):
    profile_picture = models.ImageField(upload_to=upload_to_profile_picture, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username

def upload_to_video(instance, filename):
    # Extract the file extension
    ext = filename.split('.')[-1]
    # Generate a unique UUID and append the file extension
    new_filename = f"{uuid.uuid4()}.{ext}"
    # Return the full path for the file
    return os.path.join('videos/', new_filename)

def upload_to_thumbnail(instance, filename):
    # Extract the file extension
    ext = filename.split('.')[-1]
    # Generate a unique UUID and append the file extension
    new_filename = f"{uuid.uuid4()}.{ext}"
    # Return the full path for the thumbnail file
    return os.path.join('thumbnails/', new_filename)

class Video(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    video_file = models.FileField(upload_to=upload_to_video)  # Use the custom upload function here
    thumbnail = models.ImageField(upload_to=upload_to_thumbnail, blank=True, null=True)  # Add thumbnail field
    created_at = models.DateTimeField(auto_now_add=True)
    view_count = models.IntegerField(default=0)
    likes_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)

    def __str__(self):
        return self.title

class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='likes')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='favorites')
    created_at = models.DateTimeField(auto_now_add=True)

class Follower(models.Model):
    follower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=50, choices=[
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('follow', 'Follow')
    ])
    seen = models.BooleanField(default=False)
    # Add a field to store the user who triggered the notification
    triggering_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='triggered_notifications')