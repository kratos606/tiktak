from rest_framework import serializers
from .models import User,Video,Like,Comment,Favorite,Follower,Notification
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    video_count = serializers.SerializerMethodField()
    heart_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def get_follower_count(self, obj):
        return Follower.objects.filter(following=obj).count()

    def get_following_count(self, obj):
        return Follower.objects.filter(follower=obj).count()

    def get_video_count(self, obj):
        return Video.objects.filter(user=obj).count()

    def get_heart_count(self, obj):
        return Like.objects.filter(user=obj).count()

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        # Hash the password before saving
        username = validated_data['username'].lower()
        email = validated_data['email'].lower()

        user = User.objects.create(
            username=username,
            email=email
        )

        password = validated_data['password']
        user.set_password(password)
        user.save()
        return user

class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = '__all__'

    def get_username(self, obj):
        return obj.user.username  # Assuming 'user' is a foreign key in Comment model to the User

    def get_profile_picture(self, obj):
        if obj.user and obj.user.profile_picture:
            return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{obj.user.profile_picture}"
        return ''  # Return default profile picture URL if needed

class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = '__all__'

class FollowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follower
        fields = '__all__'

from rest_framework import serializers
from .models import Notification

from rest_framework import serializers
from django.conf import settings
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'content', 'video', 'notification_type', 'created_at', 'profile_picture', 'seen']

    def get_profile_picture(self, obj):
        if obj.triggering_user and obj.triggering_user.profile_picture:
            return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{obj.triggering_user.profile_picture}"
        return ''  # or a default image URL

from rest_framework import serializers
from .models import User

class ProfilePictureSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_picture']

    def update(self, instance, validated_data):
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.save()
        return instance
    
class UsernameUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value