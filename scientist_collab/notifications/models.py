from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Notification(models.Model):
    # Notification types
    LIKE = 'like'
    DISLIKE = 'dislike'
    FAVORITE = 'favorite'
    REPLY = 'reply'
    FOLLOW = 'follow'
    SOLUTION = 'solution'
    
    NOTIFICATION_TYPES = [
        (LIKE, 'Like'),
        (DISLIKE, 'Dislike'),
        (FAVORITE, 'Favorite'),
        (REPLY, 'Reply'),
        (FOLLOW, 'Follow'),
        (SOLUTION, 'Solution'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    
    # For generic relations to handle different content types
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.sender.username} {self.get_notification_type_display()} on {self.content_type}"
        
    def mark_as_read(self):
        self.read = True
        self.save()
