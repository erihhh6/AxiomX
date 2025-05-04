from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.notification_list, name='list'),
    path('mark-as-read/<int:pk>/', views.mark_as_read, name='mark_as_read'),
    path('mark-all-as-read/', views.mark_all_as_read, name='mark_all_as_read'),
    path('api/count/', views.notification_count, name='count'),
    path('api/list/', views.notification_list_api, name='list_api'),
] 