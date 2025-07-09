from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import json

class User(AbstractUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
        ('super_admin', 'Super Admin'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    bio = models.TextField(blank=True)
    github_link = models.URLField(blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class Recipe(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    ingredients = models.JSONField(default=list)  # Array of strings
    steps = models.TextField()
    servings = models.IntegerField(default=2)
    image = models.ImageField(upload_to='recipes/', null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipes')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_signature = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def average_rating(self):
        ratings = self.ratings.all()
        if ratings:
            return sum(r.score for r in ratings) / len(ratings)
        return 0
    
    @property
    def total_ratings(self):
        return self.ratings.count()

class Rating(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('recipe', 'user')
    
    def __str__(self):
        return f"{self.user.username} rated {self.recipe.title}: {self.score}/5"

class HomepageContent(models.Model):
    welcome_message = models.TextField(default="Welcome to my kitchen, anak. I'm Ninang Rhobby — your tita‑slash‑lola from the province. Pull up a chair. The food is hot and the love is hotter.")
    aunt_rhobby_image = models.ImageField(upload_to='homepage/', null=True, blank=True)
    
    class Meta:
        verbose_name = "Homepage Content"
        verbose_name_plural = "Homepage Content"
    
    def __str__(self):
        return "Homepage Content"
