"""
Enhanced Database Population Script
Creates comprehensive sample data including all 5 Super Admins and sample recipes
Ensures Ninang Rhobby's Ultimate Bacsilog starts as Hall of Fame champion
"""
import os
import django
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cookbook.settings')
django.setup()

from recipes.models import User, Recipe, Rating, HomepageContent

def populate_data():
    """
    Populate the database with comprehensive sample data
    Creates Super Admins, sample recipes, ratings, and homepage content
    """
    print("Populating Ninang Rhobby's Cookbook with delicious data...")
    
    # ==================== CREATE SUPER ADMINS ====================
    super_admins_data = [
        {
            'username': 'rhobby',
            'email': 'rhobby@cookbook.com',
            'first_name': 'Rhobby Jay',
            'last_name': 'Calixtro',
            'bio': 'Frontend wizard making interfaces as smooth as perfectly cooked rice — our very own tita Rhobby, yours truly.',
            'github_link': 'https://github.com/JayLarkspur20'
        },
        {
            'username': 'rixzel',
            'email': 'rixzel@cookbook.com',
            'first_name': 'Rixzel Jhay',
            'last_name': 'Avendano',
            'bio': 'Solutions architect for AWS, making sure every deployment is as seamless as every delicious bite.',
            'github_link': 'https://github.com/Meowers22'
        },
        {
            'username': 'joshua',
            'email': 'joshua@cookbook.com',
            'first_name': 'Joshua Robert',
            'last_name': 'Bejo',
            'bio': 'Backend specialist who loves optimizing database queries as much as perfecting adobo recipes.',
            'github_link': 'https://github.com/JoshuaBejo'
        },
        {
            'username': 'john',
            'email': 'john@cookbook.com',
            'first_name': 'John Michael',
            'last_name': 'Ocampo',
            'bio': 'DevOps engineer who deploys applications faster than you can say "sarap!"',
            'github_link': 'https://github.com/Kaels10'
        },
        {
            'username': 'guian',
            'email': 'guian@cookbook.com',
            'first_name': 'Guian Karlo',
            'last_name': 'Pimentel',
            'bio': 'UI/UX designer who believes good design is like good food — it brings people together.',
            'github_link': 'https://github.com/gypimentel'
        }
    ]
    
    super_admins = []
    for admin_data in super_admins_data:
        user, created = User.objects.get_or_create(
            username=admin_data['username'],
            defaults={
                'email': admin_data['email'],
                'first_name': admin_data['first_name'],
                'last_name': admin_data['last_name'],
                'role': 'super_admin',
                'bio': admin_data['bio'],
                'github_link': admin_data['github_link']
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"✅ Created super admin: {user.username}")
        else:
            print(f"👤 Super admin already exists: {user.username}")
        super_admins.append(user)
    
    # ==================== CREATE SAMPLE RECIPES ====================
    recipes_data = [
        {
            'title': "Ninang Rhobby's Ultimate Bacsilog",
            'description': "The crown jewel of Filipino breakfast! Perfectly seasoned beef tapa, garlic fried rice, and a sunny-side-up egg that'll make you cry tears of joy, anak.",
            'ingredients': [
                "500g beef sirloin, sliced thin",
                "1/4 cup soy sauce",
                "2 tbsp brown sugar",
                "4 cloves garlic, minced",
                "3 cups day-old rice",
                "4 eggs",
                "Salt and pepper to taste",
                "Cooking oil for frying"
            ],
            'steps': "1. Marinate beef in soy sauce, sugar, and half the garlic for 2 hours.\n2. Fry marinated beef until caramelized and crispy.\n3. Make garlic fried rice with remaining garlic and day-old rice.\n4. Fry eggs sunny-side up with runny yolks.\n5. Serve together with love and a big smile, anak!",
            'servings': 4,
            'author': super_admins[0],  # Rhobby
            'is_signature': True
        },
        {
            'title': "Lola's Secret Adobo",
            'description': "Passed down through generations, this adobo recipe will make your neighbors peek over the fence wondering what smells so amazing!",
            'ingredients': [
                "1 kg pork belly, cut in chunks",
                "1/2 cup soy sauce",
                "1/4 cup white vinegar",
                "1 head garlic, crushed",
                "3 bay leaves",
                "1 tsp black peppercorns",
                "2 tbsp brown sugar"
            ],
            'steps': "1. Brown pork belly in a pot until golden.\n2. Add all ingredients and bring to a boil.\n3. Simmer for 45 minutes until tender.\n4. Let it reduce until sauce is thick and glossy.\n5. Serve with steaming rice, apo!",
            'servings': 6,
            'author': super_admins[1],  # Rixzel
            'is_signature': True
        },
        {
            'title': "Crispy Pata Paradise",
            'description': "Deep-fried pork leg so crispy it sings, so tender it melts. This is what dreams are made of, mga anak!",
            'ingredients': [
                "1 whole pork leg (pata)",
                "2 tbsp salt",
                "1 tbsp black pepper",
                "4 bay leaves",
                "Oil for deep frying",
                "Soy sauce and vinegar for dipping"
            ],
            'steps': "1. Boil pata with salt, pepper, and bay leaves for 1 hour.\n2. Let it cool and dry completely overnight.\n3. Deep fry until golden and crispy all around.\n4. Serve with sawsawan and lots of rice, mga apo!",
            'servings': 8,
            'author': super_admins[2],  # Joshua
            'is_signature': True
        },
        {
            'title': "Sinigang na Baboy Supreme",
            'description': "Sour, savory, and soul-warming. This tamarind-based soup will cure whatever ails you, guaranteed by Ninang!",
            'ingredients': [
                "1 kg pork ribs",
                "2 packs sinigang mix",
                "2 tomatoes, quartered",
                "1 onion, quartered",
                "2 cups kangkong",
                "1 cup string beans",
                "2 pieces radish, sliced",
                "3 pieces green chili"
            ],
            'steps': "1. Boil pork ribs until tender, about 1 hour.\n2. Add tomatoes and onions, cook until soft.\n3. Add sinigang mix and bring to a boil.\n4. Add vegetables and simmer until cooked.\n5. Season with salt and serve hot with rice!",
            'servings': 6,
            'author': super_admins[3],  # John
            'is_signature': True
        },
        {
            'title': "Pancit Canton Fiesta",
            'description': "Long noodles for long life! This colorful stir-fried noodle dish brings the party to your plate, mga anak.",
            'ingredients': [
                "500g pancit canton noodles",
                "200g pork, sliced thin",
                "200g shrimp, peeled",
                "2 cups mixed vegetables",
                "4 cloves garlic, minced",
                "2 tbsp soy sauce",
                "1 tbsp oyster sauce",
                "2 cups chicken broth"
            ],
            'steps': "1. Soak noodles in warm water until soft.\n2. Stir-fry pork and shrimp with garlic until cooked.\n3. Add vegetables and sauces, cook until tender.\n4. Toss in noodles and broth gradually.\n5. Cook until noodles absorb all the flavors!",
            'servings': 8,
            'author': super_admins[4],  # Guian
            'is_signature': True
        },
        {
            'title': "Chicken Tinola Comfort",
            'description': "A warm hug in a bowl! This ginger-infused chicken soup with green papaya will heal your body and soul.",
            'ingredients': [
                "1 whole chicken, cut into pieces",
                "2 inches ginger, sliced",
                "1 onion, quartered",
                "2 cups green papaya, cubed",
                "2 cups malunggay leaves",
                "Fish sauce to taste",
                "6 cups water"
            ],
            'steps': "1. Saute ginger and onion until fragrant.\n2. Add chicken pieces and brown lightly.\n3. Pour water and simmer until chicken is tender.\n4. Add papaya and cook until soft.\n5. Add malunggay leaves and season with fish sauce.",
            'servings': 6,
            'author': super_admins[0],  # Rhobby
            'is_signature': False
        },
        {
            'title': "Beef Kare-Kare Royalty",
            'description': "Rich, nutty, and absolutely divine! This peanut-based stew with oxtail is fit for royalty, apo.",
            'ingredients': [
                "2 kg oxtail, cut into pieces",
                "1 cup ground peanuts",
                "1/4 cup rice flour",
                "2 bundles pechay",
                "1 bundle string beans",
                "2 pieces eggplant",
                "Bagoong alamang for serving"
            ],
            'steps': "1. Boil oxtail until very tender, about 2-3 hours.\n2. Mix ground peanuts and rice flour with broth.\n3. Add peanut mixture to pot and simmer.\n4. Add vegetables and cook until tender.\n5. Serve with bagoong alamang and steamed rice.",
            'servings': 8,
            'author': super_admins[1],  # Rixzel
            'is_signature': False
        },
        {
            'title': "Lechon Kawali Perfection",
            'description': "Crispy outside, tender inside! This deep-fried pork belly will make you forget all your troubles, anak.",
            'ingredients': [
                "2 kg pork belly, whole",
                "2 tbsp salt",
                "1 tbsp black pepper",
                "4 bay leaves",
                "Oil for deep frying",
                "Lechon sauce for serving"
            ],
            'steps': "1. Boil pork belly with salt, pepper, and bay leaves for 1 hour.\n2. Let cool and dry completely.\n3. Deep fry until golden and crispy.\n4. Chop into serving pieces.\n5. Serve with lechon sauce and rice.",
            'servings': 8,
            'author': super_admins[2],  # Joshua
            'is_signature': False
        }
    ]
    
    # Create recipes
    created_recipes = []
    for recipe_data in recipes_data:
        recipe, created = Recipe.objects.get_or_create(
            title=recipe_data['title'],
            defaults={
                'description': recipe_data['description'],
                'ingredients': recipe_data['ingredients'],
                'steps': recipe_data['steps'],
                'servings': recipe_data['servings'],
                'author': recipe_data['author'],
                'status': 'approved',  # All sample recipes are pre-approved
                'is_signature': recipe_data['is_signature']
            }
        )
        if created:
            print(f"🍽️ Created recipe: {recipe.title}")
        else:
            print(f"📖 Recipe already exists: {recipe.title}")
        created_recipes.append(recipe)
    
    # ==================== CREATE RATINGS ====================
    # Rate all recipes 5/5 by all super admins to establish baseline
    for recipe in created_recipes:
        for admin in super_admins:
            rating, created = Rating.objects.get_or_create(
                recipe=recipe,
                user=admin,
                defaults={'score': 5}
            )
            if created:
                print(f"⭐ {admin.username} rated {recipe.title}: 5/5")
    
    # ==================== CREATE HOMEPAGE CONTENT ====================
    homepage_content, created = HomepageContent.objects.get_or_create(
        id=1,
        defaults={
            'welcome_message': "Welcome to my kitchen, anak. I'm Ninang Rhobby — your tita-slash-lola from the province. Pull up a chair. The food is hot and the love is hotter."
        }
    )
    if created:
        print("🏠 Created homepage content")
    else:
        print("🏠 Homepage content already exists")
    
    print("\n" + "="*60)
    print("🎉 Database populated successfully!")
    print("🍽️ Kain na, mga anak! The kitchen is ready!")
    print("="*60)
    
    # Print login credentials
    print("\n👑 SUPER ADMIN ACCOUNTS:")
    print("-" * 40)
    for admin in super_admins:
        print(f"Username: {admin.username}")
        print(f"Password: password123")
        print(f"Name: {admin.first_name} {admin.last_name}")
        print("-" * 40)

if __name__ == '__main__':
    populate_data()
