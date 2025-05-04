from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'sender', 'notification_type', 'content_type', 'read', 'created_at')
    list_filter = ('notification_type', 'read', 'created_at')
    search_fields = ('recipient__username', 'sender__username')
    readonly_fields = ('content_type', 'object_id')
