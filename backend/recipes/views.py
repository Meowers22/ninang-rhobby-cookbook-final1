"""
Complete Views for Ninang Rhobby's Cookbook
Handles all recipe, user, and homepage management with comprehensive permissions
Includes real-time WebSocket broadcasting for all operations
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Avg, Q
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json
import os
import logging

from .models import User, Recipe, Rating, HomepageContent
from .serializers import (
    UserSerializer, UserRegistrationSerializer, LoginSerializer,
    RecipeSerializer, RatingSerializer, HomepageContentSerializer
)

# Configure logging
logger = logging.getLogger(__name__)

# Helper function to broadcast WebSocket messages
def broadcast_update(group_name, message_type, data):
    """
    Broadcast updates to all connected WebSocket clients
    Used for real-time updates across the application
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': message_type,
            'message': data
        }
    )

# ==================== AUTHENTICATION VIEWS ====================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """
    User registration endpoint
    Creates new user account and returns JWT tokens
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        # Broadcast new user registration (for admin dashboards)
        broadcast_update('recipes', 'user_update', {
            'action': 'register',
            'user': UserSerializer(user).data
        })
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """
    User login endpoint
    Authenticates user and returns JWT tokens
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def profile(request):
    """
    Get current user's profile information
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT'])
def update_profile(request):
    """
    Update current user's profile
    Handles profile image uploads and basic info updates
    """
    # Handle file upload for profile image
    if 'profile_image' in request.FILES:
        # Delete old profile image if exists
        if request.user.profile_image:
            if default_storage.exists(request.user.profile_image.name):
                default_storage.delete(request.user.profile_image.name)
        
        request.user.profile_image = request.FILES['profile_image']
    
    # Update other fields
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        updated_user = serializer.save()
        
        # Broadcast profile update
        broadcast_update('recipes', 'user_update', {
            'action': 'profile_update',
            'user': UserSerializer(updated_user).data
        })
        
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ==================== RECIPE VIEWS ====================

class RecipeListCreateView(generics.ListCreateAPIView):
    """
    List all recipes or create a new recipe
    Filters recipes based on user role and approval status
    """
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """
        Return recipes based on user permissions
        Guests: only approved
        Users: approved + their own (all statuses)
        Admins/SuperAdmins: all recipes
        """
        queryset = Recipe.objects.all()
        user = self.request.user
        if not user.is_authenticated:
            return queryset.filter(status='approved').order_by('-created_at')
        elif user.role == 'user':
            # Users see approved + their own (all statuses)
            return queryset.filter(Q(status='approved') | Q(author=user)).order_by('-created_at')
        elif user.role in ['admin', 'super_admin']:
            # Admins/SuperAdmins see all
            return queryset.order_by('-created_at')
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """
        Create new recipe and broadcast to all connected clients
        Auto-approve recipes from Admins and Super Admins
        """
        # Determine initial status based on user role
        initial_status = 'pending'  # Default for regular users
        if self.request.user.role in ['admin', 'super_admin']:
            initial_status = 'approved'  # Auto-approve for admins and super admins
        
        recipe = serializer.save(author=self.request.user, status=initial_status)
        
        # Broadcast new recipe creation
        broadcast_update('recipes', 'recipe_update', {
            'action': 'create',
            'recipe': RecipeSerializer(recipe, context={'request': self.request}).data
        })
    
    def get(self, request, *args, **kwargs):
        logger.info('GET /api/recipes/ called')
        response = super().get(request, *args, **kwargs)
        logger.info(f'Response data: {response.data}')
        return response

class RecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific recipe
    Handles permissions and image updates
    """
    serializer_class = RecipeSerializer

    def get_permissions(self):
        from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
        if self.request.method in ['GET']:
            return [AllowAny()]
        return [IsAuthenticatedOrReadOnly()]
    
    def get_queryset(self):
        queryset = Recipe.objects.all()
        user = self.request.user
        if not user.is_authenticated:
            # Unauthenticated: only approved
            return queryset.filter(status='approved')
        elif user.role == 'user':
            # Users see approved + their own (all statuses)
            return queryset.filter(Q(status='approved') | Q(author=user))
        elif user.role in ['admin', 'super_admin']:
            # Admins/SuperAdmins see all
            return queryset
        return queryset
    
    def perform_update(self, serializer):
        """
        Update recipe and handle image replacement
        """
        # Handle image upload
        if 'image' in self.request.FILES:
            # Delete old image if exists
            if serializer.instance.image:
                if default_storage.exists(serializer.instance.image.name):
                    default_storage.delete(serializer.instance.image.name)
            serializer.instance.image = self.request.FILES['image']
        serializer.save()
        # Broadcast recipe update
        broadcast_update('recipes', 'recipe_update', {
            'action': 'update',
            'recipe': RecipeSerializer(serializer.instance, context={'request': self.request}).data
        })
    
    def perform_destroy(self, instance):
        """
        Delete recipe and clean up associated files
        """
        # Delete associated image file
        if instance.image:
            if default_storage.exists(instance.image.name):
                default_storage.delete(instance.image.name)
        
        recipe_data = RecipeSerializer(instance).data
        instance.delete()
        
        # Broadcast recipe deletion
        broadcast_update('recipes', 'recipe_update', {
            'action': 'delete',
            'recipe': recipe_data
        })
    
    def get(self, request, *args, **kwargs):
        logger.info(f'GET /api/recipes/<id>/ called with id={kwargs.get("pk") or kwargs.get("id")}')
        response = super().get(request, *args, **kwargs)
        logger.info(f'Response data: {response.data}')
        return response

@api_view(['POST'])
def rate_recipe(request, recipe_id):
    """
    Rate a recipe (1-5 stars)
    Each user can only rate a recipe once
    """
    try:
        recipe = Recipe.objects.get(id=recipe_id)
    except Recipe.DoesNotExist:
        return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)
    
    score = request.data.get('score')
    if not score or not (1 <= int(score) <= 5):
        return Response({'error': 'Score must be between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create or update rating
    rating, created = Rating.objects.update_or_create(
        recipe=recipe,
        user=request.user,
        defaults={'score': int(score)}
    )
    
    # Broadcast rating update
    broadcast_update('recipes', 'recipe_update', {
        'action': 'rate',
        'recipe': RecipeSerializer(recipe, context={'request': request}).data
    })
    
    return Response(RatingSerializer(rating).data)

@api_view(['POST'])
def approve_recipe(request, recipe_id):
    """
    Approve a pending recipe (Admin/Super Admin only)
    """
    if request.user.role not in ['admin', 'super_admin']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        recipe = Recipe.objects.get(id=recipe_id)
        recipe.status = 'approved'
        recipe.save()
        
        # Broadcast approval
        broadcast_update('recipes', 'recipe_update', {
            'action': 'approve',
            'recipe': RecipeSerializer(recipe, context={'request': request}).data
        })
        
        return Response(RecipeSerializer(recipe, context={'request': request}).data)
    except Recipe.DoesNotExist:
        return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def decline_recipe(request, recipe_id):
    """
    Decline a pending recipe (Admin/Super Admin only)
    """
    if request.user.role not in ['admin', 'super_admin']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        recipe = Recipe.objects.get(id=recipe_id)
        recipe.status = 'declined'
        recipe.save()
        
        # Broadcast decline
        broadcast_update('recipes', 'recipe_update', {
            'action': 'decline',
            'recipe': RecipeSerializer(recipe, context={'request': request}).data
        })
        
        return Response(RecipeSerializer(recipe, context={'request': request}).data)
    except Recipe.DoesNotExist:
        return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def toggle_signature(request, recipe_id):
    """
    Toggle signature status of a recipe
    Permissions: Users (own recipes), Admins (own recipes), Super Admins (any recipe)
    """
    try:
        recipe = Recipe.objects.get(id=recipe_id)
        
        # Check permissions based on user role
        if request.user.role == 'user' and recipe.author != request.user:
            return Response({'error': 'Users can only tag their own recipes as signature'}, 
                          status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'admin' and recipe.author != request.user:
            return Response({'error': 'Admins can only tag their own recipes as signature'}, 
                          status=status.HTTP_403_FORBIDDEN)
        # Super admins can tag any recipe as signature
        
        recipe.is_signature = not recipe.is_signature
        recipe.save()
        
        # Broadcast signature toggle
        broadcast_update('recipes', 'recipe_update', {
            'action': 'signature_toggle',
            'recipe': RecipeSerializer(recipe, context={'request': request}).data
        })
        
        return Response(RecipeSerializer(recipe, context={'request': request}).data)
    except Recipe.DoesNotExist:
        return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)

# ==================== HOMEPAGE VIEWS ====================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def homepage_data(request):
    """
    Get all homepage data including content and recipe sections
    Public endpoint accessible to all users
    """
    # Get or create homepage content
    homepage_content, created = HomepageContent.objects.get_or_create(id=1)
    
    # Hall of Fame - highest rated recipe
    hall_of_fame = Recipe.objects.filter(status='approved').annotate(
        avg_rating=Avg('ratings__score')
    ).order_by('-avg_rating').first()
    
    # Top 3 dishes by average rating
    top_dishes = Recipe.objects.filter(status='approved').annotate(
        avg_rating=Avg('ratings__score')
    ).order_by('-avg_rating')[:3]
    
    # Signature dishes
    signature_dishes = Recipe.objects.filter(status='approved', is_signature=True)[:6]
    
    # Recently added recipes
    recent_recipes = Recipe.objects.filter(status='approved').order_by('-created_at')[:6]
    
    # Serialize data with proper context
    context = {'request': request} if request else {}
    
    return Response({
        'homepage_content': HomepageContentSerializer(homepage_content).data,
        'hall_of_fame': RecipeSerializer(hall_of_fame, context=context).data if hall_of_fame else None,
        'top_dishes': RecipeSerializer(top_dishes, many=True, context=context).data,
        'signature_dishes': RecipeSerializer(signature_dishes, many=True, context=context).data,
        'recent_recipes': RecipeSerializer(recent_recipes, many=True, context=context).data,
    })

@api_view(['PUT'])
def update_homepage(request):
    """
    Update homepage content (Super Admin only)
    Handles welcome message and Ninang Rhobby's image updates
    """
    if request.user.role != 'super_admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    homepage_content, created = HomepageContent.objects.get_or_create(id=1)
    
    # Handle image upload
    if 'aunt_rhobby_image' in request.FILES:
        # Delete old image if exists
        if homepage_content.aunt_rhobby_image:
            if default_storage.exists(homepage_content.aunt_rhobby_image.name):
                default_storage.delete(homepage_content.aunt_rhobby_image.name)
        
        homepage_content.aunt_rhobby_image = request.FILES['aunt_rhobby_image']
    
    # Update welcome message
    if 'welcome_message' in request.data:
        homepage_content.welcome_message = request.data['welcome_message']
    
    homepage_content.save()
    
    # Broadcast homepage update
    broadcast_update('recipes', 'homepage_update', {
        'action': 'homepage_update',
        'content': HomepageContentSerializer(homepage_content).data
    })
    
    return Response(HomepageContentSerializer(homepage_content).data)

# ==================== USER MANAGEMENT VIEWS ====================

@api_view(['GET'])
def users_list(request):
    """
    List all users (Super Admin only)
    Used for user management dashboard
    """
    if request.user.role != 'super_admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all().order_by('date_joined')
    return Response(UserSerializer(users, many=True).data)

@api_view(['PUT'])
def update_user_role(request, user_id):
    """
    Update user role (Super Admin only)
    Allows promotion/demotion between User, Admin, and Super Admin
    """
    if request.user.role != 'super_admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        new_role = request.data.get('role')
        
        if new_role in ['user', 'admin', 'super_admin']:
            user.role = new_role
            user.save()
            
            # Broadcast user role update
            broadcast_update('recipes', 'user_update', {
                'action': 'role_update',
                'user': UserSerializer(user).data
            })
            
            return Response(UserSerializer(user).data)
        else:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def update_user_profile_admin(request, user_id):
    """
    Update any user's profile (Super Admin only)
    Used by TeamMemberManager for editing team member details
    """
    if request.user.role != 'super_admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user_to_update = User.objects.get(id=user_id)
        
        # Handle profile image upload
        if 'profile_image' in request.FILES:
            # Delete old image if exists
            if user_to_update.profile_image:
                if default_storage.exists(user_to_update.profile_image.name):
                    default_storage.delete(user_to_update.profile_image.name)
            
            user_to_update.profile_image = request.FILES['profile_image']
        
        # Update other fields
        user_to_update.first_name = request.data.get('first_name', user_to_update.first_name)
        user_to_update.last_name = request.data.get('last_name', user_to_update.last_name)
        user_to_update.username = request.data.get('username', user_to_update.username)
        user_to_update.email = request.data.get('email', user_to_update.email)
        user_to_update.bio = request.data.get('bio', user_to_update.bio)
        user_to_update.github_link = request.data.get('github_link', user_to_update.github_link)
        
        # Update role if provided
        new_role = request.data.get('role')
        if new_role in ['user', 'admin', 'super_admin']:
            user_to_update.role = new_role
        
        user_to_update.save()
        
        # Broadcast user profile update
        broadcast_update('recipes', 'user_update', {
            'action': 'profile_update',
            'user': UserSerializer(user_to_update).data
        })
        
        return Response(UserSerializer(user_to_update).data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def create_team_member(request):
    """
    Create new team member (Super Admin only)
    Used by TeamMemberManager for adding new team members
    """
    if request.user.role != 'super_admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Create user with provided data
    user_data = {
        'username': request.data.get('username'),
        'email': request.data.get('email'),
        'password': request.data.get('password', 'defaultpassword123'),
        'password_confirm': request.data.get('password', 'defaultpassword123'),
        'first_name': request.data.get('first_name', ''),
        'last_name': request.data.get('last_name', ''),
    }
    
    serializer = UserRegistrationSerializer(data=user_data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Set additional fields
        user.role = request.data.get('role', 'super_admin')
        user.bio = request.data.get('bio', '')
        user.github_link = request.data.get('github_link', '')
        
        # Handle profile image
        if 'profile_image' in request.FILES:
            user.profile_image = request.FILES['profile_image']
        
        user.save()
        
        # Broadcast new team member creation
        broadcast_update('recipes', 'user_update', {
            'action': 'create_team_member',
            'user': UserSerializer(user).data
        })
        
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_user(request, user_id):
    """
    Delete user account (Super Admin only)
    Cannot delete own account
    """
    if request.user.role != 'super_admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.user.id == int(user_id):
        return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_to_delete = User.objects.get(id=user_id)
        
        # Delete profile image if exists
        if user_to_delete.profile_image:
            if default_storage.exists(user_to_delete.profile_image.name):
                default_storage.delete(user_to_delete.profile_image.name)
        
        user_data = UserSerializer(user_to_delete).data
        user_to_delete.delete()
        
        # Broadcast user deletion
        broadcast_update('recipes', 'user_update', {
            'action': 'delete_user',
            'user': user_data
        })
        
        return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# ==================== PHOTO UPDATE ENDPOINTS ====================

@api_view(['POST'])
def update_recipe_photo(request, recipe_id):
    """
    Update recipe photo via dedicated endpoint
    Used by RecipeCard Update Photo button
    """
    try:
        recipe = Recipe.objects.get(id=recipe_id)
        
        # Check permissions
        if request.user.role == 'user' and recipe.author != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role == 'admin' and recipe.author != request.user:
            return Response({'error': 'Admins can only update photos of their own recipes'}, 
                          status=status.HTTP_403_FORBIDDEN)
        # Super admins can update any recipe photo
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete old image if exists
        if recipe.image:
            if default_storage.exists(recipe.image.name):
                default_storage.delete(recipe.image.name)
        
        # Save new image
        recipe.image = request.FILES['image']
        recipe.save()
        
        # Broadcast photo update
        broadcast_update('recipes', 'recipe_update', {
            'action': 'photo_update',
            'recipe': RecipeSerializer(recipe, context={'request': request}).data
        })
        
        return Response(RecipeSerializer(recipe, context={'request': request}).data)
    except Recipe.DoesNotExist:
        return Response({'error': 'Recipe not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_team_members(request):
    """
    Get team members for public About Us page
    Returns only super admins with limited information
    """
    super_admins = User.objects.filter(role='super_admin').order_by('date_joined')
    
    # Return limited public information
    team_data = []
    for admin in super_admins:
        team_data.append({
            'id': admin.id,
            'first_name': admin.first_name,
            'last_name': admin.last_name,
            'role': admin.role,
            'bio': admin.bio,
            'github_link': admin.github_link,
            'profile_image': admin.profile_image.url if admin.profile_image else None
        })
    
    return Response(team_data)
