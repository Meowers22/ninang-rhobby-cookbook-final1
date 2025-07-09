from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Recipe, Rating, HomepageContent

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'first_name', 'last_name', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'profile_image', 'bio', 'github_link')}),
    )

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'is_signature', 'created_at')
    list_filter = ('status', 'is_signature', 'created_at')
    search_fields = ('title', 'description', 'author__username')

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('recipe', 'user', 'score', 'created_at')
    list_filter = ('score', 'created_at')

@admin.register(HomepageContent)
class HomepageContentAdmin(admin.ModelAdmin):
    list_display = ('__str__',)
