from django.contrib.auth import authenticate
from django.shortcuts import render
from rest_framework.permissions import AllowAny,IsAuthenticated,IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied,ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics, permissions,status
from rest_framework.response import Response
from django.db.models import F , Count , OuterRef, Subquery, BooleanField, Case, When
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializer import UserSerializer,UserRegistrationSerializer,VideoSerializer,LikeSerializer, CommentSerializer, FavoriteSerializer, FollowerSerializer, NotificationSerializer, ProfilePictureSerializer, UsernameUpdateSerializer
from .models import User,Video,Like,Comment,Favorite,Follower,Notification

# Create your views here.

def get_auth_for_user(user):
	tokens = RefreshToken.for_user(user)
	return {
		'user': UserSerializer(user).data,
		'tokens': {
			'access': str(tokens.access_token),
			'refresh': str(tokens),
		}
	}


class SignInView(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')

		if not username or not password:
			return Response({'error': 'Username and password are required.'}, status=400)
		
		user = authenticate(username=username, password=password)
		if not user:
			return Response({'error': 'Invalid credentials.'}, status=401)

		user_data = get_auth_for_user(user)

		return Response(user_data)
	
class SignUpView(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		new_user = UserRegistrationSerializer(data=request.data)

		try:
			new_user.is_valid(raise_exception=True)
		except ValidationError as e:
			return Response({'errors': new_user.errors}, status=400)
		
		user = new_user.save()

		user_data = get_auth_for_user(user)

		return Response(user_data)
	
class VideoListCreateView(generics.ListCreateAPIView):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class VideoDetailView(generics.RetrieveDestroyAPIView):  # No update functionality
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get_queryset(self):
        return Video.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied("You do not have permission to delete this video.")
        instance.delete()

class LikeCreateDeleteView(generics.CreateAPIView):
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]


    def post(self, request, *args, **kwargs):
        video_id = self.kwargs['video_id']
        user = request.user

        like, created = Like.objects.get_or_create(user=user, video_id=video_id)
        if created:
            video = like.video
            video.likes_count = F('likes_count') + 1
            video.save(update_fields=['likes_count'])

            Notification.objects.create(
                user=video.user,
                content=f"{user.username} liked your video",
                video=video,
                notification_type='like',
                triggering_user=user  # Add triggering_user here
            )
            return Response(status=status.HTTP_201_CREATED)

        else:
            like.delete()
            video = Video.objects.get(pk=video_id)
            video.likes_count = F('likes_count') - 1
            video.save(update_fields=['likes_count'])

            return Response(status=status.HTTP_204_NO_CONTENT)

class CommentCreateDeleteView(generics.CreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]


    def post(self, request, *args, **kwargs):
        video_id = self.kwargs['video_id']
        user = request.user
        text = request.data.get('text')

        comment = Comment.objects.create(user=user, video_id=video_id, text=text)
        video = comment.video
        video.comment_count = F('comment_count') + 1
        video.save(update_fields=['comment_count'])

        Notification.objects.create(
            user=video.user,
            content=f"{user.username} commented on your video",
            video=video,
            notification_type='comment',
            triggering_user=user  # Add triggering_user here
        )
        return Response(status=status.HTTP_201_CREATED)

    def delete(self, request, *args, **kwargs):
        comment_id = self.kwargs['comment_id']
        comment = Comment.objects.get(pk=comment_id)
        video = comment.video
        comment.delete()
        video.comment_count = F('comment_count') - 1
        video.save(update_fields=['comment_count'])

        return Response(status=status.HTTP_204_NO_CONTENT)

class FavoriteCreateDeleteView(generics.CreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]


    def post(self, request, *args, **kwargs):
        video_id = self.kwargs['video_id']
        user = request.user

        favorite, created = Favorite.objects.get_or_create(user=user, video_id=video_id)
        if created:
            return Response(status=status.HTTP_201_CREATED)
        else:
            favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

class FollowCreateDeleteView(generics.CreateAPIView):
    serializer_class = FollowerSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        following_id = self.kwargs['user_id']
        follower = request.user

        follow, created = Follower.objects.get_or_create(follower=follower, following_id=following_id)
        if created:
            Notification.objects.create(
                user=follow.following,
                content=f"{follower.username} started following you",
                notification_type='follow',
                triggering_user=follower  # Add triggering_user here
            )
            return Response(status=status.HTTP_201_CREATED)
        else:
            follow.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return the notifications for the authenticated user, ordered by creation time (newest first)
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Serialize all notifications and return them as a list
        serialized_notifications = NotificationSerializer(queryset, many=True).data

        return Response(serialized_notifications)

class TrendingVideosPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class TrendingVideosView(generics.ListAPIView):
    serializer_class = VideoSerializer
    pagination_class = TrendingVideosPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Video.objects.annotate(
            trending_score=F('view_count') + F('likes_count') + F('comment_count')
        ).order_by('-trending_score', '-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
class VideoCommentsView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Allow authenticated users to post comments, but everyone can view

    def get_queryset(self):
        video_id = self.kwargs['video_id']
        
        # Return all comments for the video, no need to restrict to video owner
        return Comment.objects.filter(video_id=video_id).order_by('-created_at')
    
class UserVideosView(generics.ListAPIView):
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get the user_id from the URL parameters
        user_id = self.kwargs.get('user_id')
        
        # Get videos uploaded by the specified user
        return Video.objects.filter(user_id=user_id).order_by('-created_at')

class FollowingVideosView(generics.ListAPIView):
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        following_users = Follower.objects.filter(follower=self.request.user).values_list('following_id', flat=True)
        return Video.objects.filter(user_id__in=following_users).order_by('-created_at')
    
class VideoRetrieveView(generics.RetrieveAPIView):
    queryset = Video.objects.all()  # Fetch all videos
    serializer_class = VideoSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can access the view

    def get(self, request, *args, **kwargs):
        video_id = kwargs.get('id')  # Get the video id from the URL
        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist:
            return Response({'error': 'Video not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(video)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        current_user = self.request.user

        # Get the users followed by the current user
        followed_users = Follower.objects.filter(follower=current_user).values_list('following_id', flat=True)

        # Exclude the current user and the followed users, limit the result to 10 users
        return User.objects.exclude(id=current_user.id).exclude(id__in=followed_users)[:10]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Serialize the user data
        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data)
    
class FriendListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        current_user = self.request.user

        # Get the users that the current user follows
        follows = Follower.objects.filter(follower=current_user).values_list('following_id', flat=True)

        # Get the users that follow the current user
        followers = Follower.objects.filter(following=current_user).values_list('follower_id', flat=True)

        # Get the intersection of follows and followers to find mutual relationships
        mutual_friends_ids = follows.intersection(followers)

        # Return the users who are mutual friends
        return User.objects.filter(id__in=mutual_friends_ids)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        # Serialize the user data
        serializer = self.get_serializer(queryset, many=True)

        return Response(serializer.data)
    
class VideoLikeStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        user = request.user
        liked = Like.objects.filter(user=user, video_id=video_id).exists()
        return Response({'liked': liked})
    
class UserPagination(PageNumberPagination):
    page_size = 10  # You can adjust this size as needed
    page_size_query_param = 'page_size'
    max_page_size = 100

class UserSearchView(generics.ListAPIView):
    serializer_class = UserSerializer
    pagination_class = UserPagination

    def get_queryset(self):
        query = self.request.query_params.get('search', '')  # Fetch the search query from the request
        return User.objects.annotate(
            follower_count=Count('followers')  # Assuming there's a reverse relation 'followers' in the User model
        ).filter(username__icontains=query).order_by('-follower_count')
    
class UserRetrieveView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = kwargs.get('user_id')  # Get the user ID from the URL
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class FollowStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        follower = request.user
        is_following = Follower.objects.filter(follower=follower, following_id=user_id).exists()
        return Response({'is_following': is_following})

class UserFollowingListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs['user_id']  # Get the user ID from the URL
        # Get the users that the current user is following
        following_ids = Follower.objects.filter(follower_id=user_id).values_list('following_id', flat=True)
        # Return the User objects for those following users
        return User.objects.filter(id__in=following_ids)

class UserFollowersListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs['user_id']  # Get the user ID from the URL
        
        # Subquery to check if the follower is also following the current user
        is_following_subquery = Follower.objects.filter(
            follower_id=OuterRef('pk'),
            following_id=user_id
        ).values('id')
        
        # Annotate the queryset with isFollowing field
        queryset = User.objects.filter(
            id__in=Follower.objects.filter(following_id=user_id).values_list('follower_id', flat=True)
        ).annotate(
            isFollowing=Case(
                When(id__in=Subquery(is_following_subquery), then=True),
                default=False,
                output_field=BooleanField(),
            )
        )
        return queryset
    
class ProfilePictureUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = ProfilePictureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Return the currently authenticated user
        return self.request.user

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)
    
class UpdateUsernameView(generics.UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = UsernameUpdateSerializer

    def get_object(self):
        # Return the currently authenticated user
        return self.request.user

    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(instance=self.get_object(), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class MarkAllNotificationsAsSeenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Mark all notifications of the authenticated user as seen
        Notification.objects.filter(user=request.user, seen=False).update(seen=True)
        return Response({'message': 'All notifications marked as seen.'}, status=status.HTTP_200_OK)