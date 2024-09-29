from django.contrib import admin
from .models import User, Video, Like, Comment, Follower, Notification, Favorite

admin.site.register(User)
admin.site.register(Video)
admin.site.register(Like)
admin.site.register(Comment)
admin.site.register(Follower)
admin.site.register(Notification)
admin.site.register(Favorite)

# Register your models here.
