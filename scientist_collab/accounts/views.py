from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, PasswordChangeView, PasswordResetView, PasswordResetDoneView, PasswordResetConfirmView, PasswordResetCompleteView
from django.contrib.auth import logout, get_user_model
from django.views.generic import CreateView
from django.http import JsonResponse
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm
from .models import Profile, Follow

User = get_user_model()

# Create your views here.

class CustomLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True

class RegisterView(CreateView):
    form_class = UserRegisterForm
    template_name = 'accounts/register.html'
    success_url = reverse_lazy('accounts:login')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, f'Your account has been created! You can now log in.')
        return response
    
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('home')
        return super().get(request, *args, **kwargs)

@login_required
def logout_view(request):
    """Simple logout view that works with both GET and POST requests"""
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('home')
    
class CustomPasswordChangeView(PasswordChangeView):
    template_name = 'accounts/password_change.html'
    success_url = reverse_lazy('accounts:profile')
    
    def form_valid(self, form):
        messages.success(self.request, 'Your password has been updated!')
        return super().form_valid(form)

class CustomPasswordResetView(PasswordResetView):
    template_name = 'accounts/password_reset.html'
    email_template_name = 'accounts/password_reset_email.html'
    success_url = reverse_lazy('accounts:password_reset_done')

class CustomPasswordResetDoneView(PasswordResetDoneView):
    template_name = 'accounts/password_reset_done.html'

class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    template_name = 'accounts/password_reset_confirm.html'
    success_url = reverse_lazy('accounts:password_reset_complete')

class CustomPasswordResetCompleteView(PasswordResetCompleteView):
    template_name = 'accounts/password_reset_complete.html'

@login_required
def profile(request):
    # Profil utilizator actual cu statistici de follow
    user_profile = request.user.profile
    followers_count = user_profile.followers.count()
    following_count = user_profile.following.count()
    
    if request.method == 'POST':
        user_form = UserUpdateForm(request.POST, instance=request.user)
        profile_form = ProfileUpdateForm(request.POST, request.FILES, instance=user_profile)
        
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, 'Your profile has been updated!')
            return redirect('accounts:profile')
    else:
        user_form = UserUpdateForm(instance=request.user)
        profile_form = ProfileUpdateForm(instance=user_profile)
        
    context = {
        'user_form': user_form,
        'profile_form': profile_form,
        'followers_count': followers_count,
        'following_count': following_count
    }
    return render(request, 'accounts/profile.html', context)

@login_required
def edit_profile(request):
    if request.method == 'POST':
        user_form = UserUpdateForm(request.POST, instance=request.user)
        profile_form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user.profile)
        
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, 'Your profile has been updated!')
            return redirect('accounts:profile')
    else:
        user_form = UserUpdateForm(instance=request.user)
        profile_form = ProfileUpdateForm(instance=request.user.profile)
        
    context = {
        'user_form': user_form,
        'profile_form': profile_form
    }
    return render(request, 'accounts/edit_profile.html', context)

def public_profile(request, user_id):
    """View for seeing another user's profile"""
    user = get_object_or_404(User, id=user_id)
    profile = user.profile
    
    # Nu îți poți vizualiza propriul profil ca profil public
    if request.user.id == user_id:
        return redirect('accounts:profile')
    
    # Verifică dacă utilizatorul curent urmărește acest profil
    is_following = False
    if request.user.is_authenticated:
        is_following = request.user.profile.is_following(profile)
    
    followers_count = profile.followers.count()
    following_count = profile.following.count()
    
    # Obține publicațiile utilizatorului
    publications = user.publications.all()[:5]  # Last 5 publications
    
    # Obține discuțiile recente
    topics = user.topics.all()[:5]  # Last 5 topics
    
    context = {
        'profile': profile,
        'user_viewed': user,
        'is_following': is_following,
        'followers_count': followers_count,
        'following_count': following_count,
        'publications': publications,
        'topics': topics
    }
    
    return render(request, 'accounts/public_profile.html', context)

def user_publications(request, user_id):
    """View all publications by a user"""
    user = get_object_or_404(User, id=user_id)
    publications = user.publications.all()
    
    context = {
        'user_viewed': user,
        'publications': publications,
        'page_title': f"All Publications by {user.get_full_name() or user.username}"
    }
    
    return render(request, 'accounts/user_publications.html', context)

def user_topics(request, user_id):
    """View all discussion topics by a user"""
    user = get_object_or_404(User, id=user_id)
    topics = user.topics.all()
    
    context = {
        'user_viewed': user,
        'topics': topics,
        'page_title': f"All Discussions by {user.get_full_name() or user.username}"
    }
    
    return render(request, 'accounts/user_topics.html', context)

@login_required
def follow_user(request, user_id):
    """Follow a user"""
    user_to_follow = get_object_or_404(User, id=user_id)
    
    # Nu te poți urmări pe tine însuți
    if request.user.id == user_id:
        messages.error(request, "You cannot follow yourself.")
        return redirect('accounts:public_profile', user_id=user_id)
    
    # Urmărește utilizatorul
    current_user_profile = request.user.profile
    followed = current_user_profile.follow(user_to_follow.profile)
    
    if followed:
        messages.success(request, f"You are now following {user_to_follow.username}.")
    else:
        messages.info(request, f"You are already following {user_to_follow.username}.")
    
    # Handle AJAX request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'followed': followed,
            'followers_count': user_to_follow.profile.followers.count()
        })
    
    # Return normal response if not AJAX
    return redirect('accounts:public_profile', user_id=user_id)

@login_required
def unfollow_user(request, user_id):
    """Unfollow a user"""
    user_to_unfollow = get_object_or_404(User, id=user_id)
    
    # Dezurmărește utilizatorul
    current_user_profile = request.user.profile
    unfollowed = current_user_profile.unfollow(user_to_unfollow.profile)
    
    if unfollowed:
        messages.success(request, f"You have unfollowed {user_to_unfollow.username}.")
    else:
        messages.info(request, f"You were not following {user_to_unfollow.username}.")
    
    # Handle AJAX request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'unfollowed': unfollowed,
            'followers_count': user_to_unfollow.profile.followers.count()
        })
    
    # Return normal response if not AJAX
    return redirect('accounts:public_profile', user_id=user_id)

@login_required
def followers_list(request):
    """View all followers of current user"""
    user_profile = request.user.profile
    followers = user_profile.followers.all()
    
    context = {
        'title': 'My Followers',
        'users': followers,
    }
    
    return render(request, 'accounts/followers.html', context)

@login_required
def following_list(request):
    """View all users that current user follows"""
    user_profile = request.user.profile
    
    # Get the actual profiles of users being followed instead of the Follow relationships
    following_profiles = Profile.objects.filter(followers=user_profile)
    
    context = {
        'following': following_profiles,
    }
    
    return render(request, 'accounts/following.html', context)

# Social Authentication Views
def google_login(request):
    """Handle Google authentication"""
    # This is a placeholder - in a real implementation, we would:
    # 1. Initialize Google OAuth flow
    # 2. Redirect user to Google's auth page
    # 3. Handle callback after successful login
    # 4. Create or get user and log them in
    
    messages.info(request, "Google login feature is coming soon! The integration is currently in development.")
    return redirect('accounts:login')

def orcid_login(request):
    """Handle ORCID authentication"""
    # This is a placeholder - in a real implementation, we would:
    # 1. Initialize ORCID OAuth flow
    # 2. Redirect user to ORCID's auth page
    # 3. Handle callback after successful login
    # 4. Create or get user and log them in
    
    messages.info(request, "ORCID login feature is coming soon! The integration is currently in development.")
    return redirect('accounts:login')
