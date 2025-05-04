from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.profile, name='profile'),
    path('password-change/', views.CustomPasswordChangeView.as_view(), name='password_change'),
    path('password-reset/', views.CustomPasswordResetView.as_view(), name='password_reset'),
    path('password-reset/done/', views.CustomPasswordResetDoneView.as_view(), name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/', views.CustomPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset-complete/', views.CustomPasswordResetCompleteView.as_view(), name='password_reset_complete'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),
    path('profile/<int:user_id>/', views.public_profile, name='public_profile'),
    path('profile/<int:user_id>/publications/', views.user_publications, name='user_publications'),
    path('profile/<int:user_id>/topics/', views.user_topics, name='user_topics'),
    path('profile/<int:user_id>/follow/', views.follow_user, name='follow_user'),
    path('profile/<int:user_id>/unfollow/', views.unfollow_user, name='unfollow_user'),
    path('profile/followers/', views.followers_list, name='followers'),
    path('profile/following/', views.following_list, name='following'),
    
    # Social Authentication URLs
    path('login/google/', views.google_login, name='google_login'),
    path('login/orcid/', views.orcid_login, name='orcid_login'),
]