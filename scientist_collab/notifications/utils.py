from django.contrib.contenttypes.models import ContentType
from .models import Notification

def create_notification(recipient, sender, obj, notification_type):
    """
    Create a notification for a user
    
    Args:
        recipient: The user receiving the notification
        sender: The user triggering the notification
        obj: The object associated with the notification (e.g., Publication, Topic)
        notification_type: The type of notification ('like', 'dislike', 'favorite', etc.)
    
    Returns:
        The created notification or None if recipient and sender are the same
    """
    # Don't notify users about their own actions
    if recipient == sender:
        return None
    
    content_type = ContentType.objects.get_for_model(obj)
    
    # Create the notification
    notification = Notification.objects.create(
        recipient=recipient,
        sender=sender,
        content_type=content_type,
        object_id=obj.id,
        notification_type=notification_type
    )
    
    return notification 