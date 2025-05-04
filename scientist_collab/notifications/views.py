from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.urls import reverse
from django.contrib import messages
from django.template.loader import render_to_string
from .models import Notification

@login_required
def notification_list(request):
    notifications = request.user.notifications.all()
    return render(request, 'notifications/notification_list.html', {
        'notifications': notifications,
    })

@login_required
def notification_list_api(request):
    """API endpoint to get notifications as JSON"""
    notifications = request.user.notifications.all()[:5]  # Get only the 5 most recent
    
    notification_data = []
    for notification in notifications:
        redirect_url = reverse('notifications:mark_as_read', args=[notification.pk])
        
        notification_data.append({
            'id': notification.pk,
            'sender': notification.sender.username,
            'type': notification.notification_type,
            'content_type': notification.content_type.model,
            'read': notification.read,
            'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'time_since': notification.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'redirect_url': redirect_url,
        })
    
    return JsonResponse({
        'notifications': notification_data,
        'unread_count': request.user.notifications.filter(read=False).count(),
    })

@login_required
def mark_as_read(request, pk):
    notification = get_object_or_404(Notification, pk=pk, recipient=request.user)
    notification.mark_as_read()
    
    # Get URL to redirect to based on notification type and content
    if hasattr(notification.content_object, 'get_absolute_url'):
        redirect_url = notification.content_object.get_absolute_url()
    else:
        redirect_url = reverse('notifications:list')
    
    return redirect(redirect_url)

@login_required
def mark_all_as_read(request):
    request.user.notifications.filter(read=False).update(read=True)
    messages.success(request, 'All notifications marked as read.')
    return redirect('notifications:list')

@login_required
def notification_count(request):
    count = request.user.notifications.filter(read=False).count()
    return JsonResponse({'count': count})
