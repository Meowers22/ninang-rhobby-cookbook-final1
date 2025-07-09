"""
Enhanced WebSocket Consumer for Real-time Updates
Handles all real-time communication between server and clients
Broadcasts recipe updates, user changes, and homepage modifications
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class RecipeConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time updates
    Manages connections and broadcasts updates to all connected clients
    """
    
    async def connect(self):
        """
        Accept WebSocket connection and add to recipes group
        All clients join the same group for broadcast updates
        """
        await self.channel_layer.group_add(
            'recipes',  # Group name for all recipe-related updates
            self.channel_name
        )
        await self.accept()
        print(f"WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        """
        Remove client from recipes group when disconnecting
        Clean up connection to prevent memory leaks
        """
        await self.channel_layer.group_discard(
            'recipes',
            self.channel_name
        )
        print(f"WebSocket disconnected: {self.channel_name} (code: {close_code})")

    async def recipe_update(self, event):
        """
        Handle recipe-related updates and send to client
        Covers: create, update, delete, rate, approve, decline, signature_toggle, photo_update
        """
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'recipe_update',
            'data': message
        }))

    async def user_update(self, event):
        """
        Handle user-related updates and send to client
        Covers: register, profile_update, role_update, create_team_member, delete_user
        """
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'user_update',
            'data': message
        }))

    async def homepage_update(self, event):
        """
        Handle homepage content updates and send to client
        Covers: homepage_update (welcome message and Ninang Rhobby's image)
        """
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'homepage_update',
            'data': message
        }))
