"""
Complete URL Configuration for Ninang Rhobby's Cookbook
Maps all API endpoints to their corresponding views
"""
from django.urls import path
from . import views

urlpatterns = [
    # ==================== AUTHENTICATION ENDPOINTS ====================
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/profile/', views.profile, name='profile'),
    path('auth/profile/update/', views.update_profile, name='update_profile'),
    
    # ==================== RECIPE ENDPOINTS ====================
    path('recipes/', views.RecipeListCreateView.as_view(), name='recipe_list_create'),
    path('recipes/<int:pk>/', views.RecipeDetailView.as_view(), name='recipe_detail'),
    path('recipes/<int:recipe_id>/rate/', views.rate_recipe, name='rate_recipe'),
    path('recipes/<int:recipe_id>/approve/', views.approve_recipe, name='approve_recipe'),
    path('recipes/<int:recipe_id>/decline/', views.decline_recipe, name='decline_recipe'),
    path('recipes/<int:recipe_id>/signature/', views.toggle_signature, name='toggle_signature'),
    path('recipes/<int:recipe_id>/photo/', views.update_recipe_photo, name='update_recipe_photo'),
    
    # ==================== HOMEPAGE ENDPOINTS ====================
    path('homepage/', views.homepage_data, name='homepage_data'),
    path('homepage/update/', views.update_homepage, name='update_homepage'),
    
    # ==================== USER MANAGEMENT ENDPOINTS ====================
    path('users/', views.users_list, name='users_list'),
    path('users/<int:user_id>/role/', views.update_user_role, name='update_user_role'),
    path('users/<int:user_id>/update/', views.update_user_profile_admin, name='update_user_profile_admin'),
    path('users/<int:user_id>/delete/', views.delete_user, name='delete_user'),
    path('team/create/', views.create_team_member, name='create_team_member'),

    # ==================== PUBLIC ENDPOINTS ====================
    path('team/public/', views.public_team_members, name='public_team_members'),
]
