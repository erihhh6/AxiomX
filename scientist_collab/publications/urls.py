from django.urls import path
from . import views

app_name = 'publications'

urlpatterns = [
    path('', views.PublicationListView.as_view(), name='list'),
    path('my-publications/', views.MyPublicationListView.as_view(), name='my_publications'),
    path('create/', views.PublicationCreateView.as_view(), name='create'),
    path('<int:pk>/', views.PublicationDetailView.as_view(), name='detail'),
    path('<int:pk>/update/', views.PublicationUpdateView.as_view(), name='update'),
    path('<int:pk>/delete/', views.PublicationDeleteView.as_view(), name='delete'),
    path('<int:pk>/download/', views.download_publication, name='download'),
] 