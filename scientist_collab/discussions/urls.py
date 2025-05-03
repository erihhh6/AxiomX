from django.urls import path
from . import views

app_name = 'discussions'

urlpatterns = [
    path('', views.ForumListView.as_view(), name='forum_list'),
    path('forum/<int:pk>/', views.ForumDetailView.as_view(), name='forum_detail'),
    path('topic/new/', views.TopicCreateView.as_view(), name='topic_create'),
    path('forum/<int:forum>/topic/new/', views.TopicCreateView.as_view(), name='topic_create_forum'),
    path('topic/<int:pk>/', views.TopicDetailView.as_view(), name='topic_detail'),
    path('topic/<int:pk>/update/', views.TopicUpdateView.as_view(), name='topic_update'),
    path('topic/<int:pk>/delete/', views.TopicDeleteView.as_view(), name='topic_delete'),
    path('topic/<int:pk>/reply/', views.add_reply, name='add_reply'),
    path('topic/<int:pk>/like/', views.like_topic, name='like_topic'),
    path('topic/<int:pk>/dislike/', views.dislike_topic, name='dislike_topic'),
    path('reply/<int:pk>/delete/', views.ReplyDeleteView.as_view(), name='reply_delete'),
    path('reply/<int:pk>/like/', views.like_reply, name='like_reply'),
] 