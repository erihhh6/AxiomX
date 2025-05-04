from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, PasswordChangeView, PasswordResetView, PasswordResetDoneView, PasswordResetConfirmView, PasswordResetCompleteView
from django.contrib.auth import logout, get_user_model
from django.views.generic import CreateView
from django.http import JsonResponse
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm
from .models import Profile, Follow, Badge, UserBadge

# Import notification utilities
from notifications.utils import create_notification
from notifications.models import Notification

# Import models from other apps
from publications.models import Publication
from discussions.models import Topic

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
        
    # Get user's badge information
    equipped_badge = None
    user_badges = []
    
    # Get equipped badge
    user_badge_equipped = UserBadge.objects.filter(user=request.user, is_equipped=True).first()
    if user_badge_equipped:
        equipped_badge = user_badge_equipped
    
    # Get user's earned badges
    earned_badges = UserBadge.objects.filter(user=request.user, progress=100).select_related('badge')
    user_badges = earned_badges
    
    followers_count = Follow.objects.filter(following__user=request.user).count()
    following_count = Follow.objects.filter(follower__user=request.user).count()
    
    context = {
        'user_form': user_form,
        'profile_form': profile_form,
        'followers_count': followers_count,
        'following_count': following_count,
        'equipped_badge': equipped_badge,
        'user_badges': user_badges,
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
    try:
        user_viewed = User.objects.get(id=user_id)
        profile = Profile.objects.get(user=user_viewed)
        
        # Check if the current user follows the viewed user
        is_following = False
        if request.user.is_authenticated:
            follower_count = Follow.objects.filter(follower__user=request.user, following__user=user_viewed).count()
            is_following = follower_count > 0
        
        # Get recent publications
        publications = Publication.objects.filter(author=user_viewed).order_by('-publication_date')[:5]
        
        # Get recent discussion topics
        topics = Topic.objects.filter(author=user_viewed).order_by('-created_at')[:5]
        
        # Get follow counts
        followers_count = Follow.objects.filter(following__user=user_viewed).count()
        following_count = Follow.objects.filter(follower__user=user_viewed).count()
        
        # Get equipped badge
        equipped_badge = UserBadge.objects.filter(user=user_viewed, is_equipped=True).select_related('badge').first()
        
        context = {
            'user_viewed': user_viewed,
            'profile': profile,
            'is_following': is_following,
            'publications': publications,
            'topics': topics,
            'followers_count': followers_count,
            'following_count': following_count,
            'equipped_badge': equipped_badge,
        }
        
        return render(request, 'accounts/public_profile.html', context)
        
    except (User.DoesNotExist, Profile.DoesNotExist):
        messages.error(request, "User not found.")
        return redirect('home')

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

def user_topics(request, user_id=None, username=None):
    """View all discussion topics by a user. Accept either user_id or username."""
    if user_id:
        user = get_object_or_404(User, id=user_id)
    elif username:
        user = get_object_or_404(User, username=username)
    else:
        # If neither is provided, redirect to home
        messages.error(request, "User not found.")
        return redirect('home')
        
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
        
        # Create a notification for the followed user
        create_notification(
            recipient=user_to_follow, 
            sender=request.user, 
            obj=user_to_follow.profile, 
            notification_type=Notification.FOLLOW
        )
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

@login_required
def user_badges(request):
    user = request.user
    
    # Get all badges in the system
    all_badges = Badge.objects.all()
    
    # Get user's earned badges
    user_badges = UserBadge.objects.filter(user=user)
    
    # Create a dictionary of badges the user has earned or is progressing toward
    badges_data = []
    
    for badge in all_badges:
        user_badge = user_badges.filter(badge=badge).first()
        
        if user_badge:
            # User has this badge or is making progress
            badges_data.append({
                'badge': badge,
                'progress': user_badge.progress,
                'earned': user_badge.progress == 100,
                'earned_date': user_badge.earned_date if user_badge.progress == 100 else None,
                'is_equipped': user_badge.is_equipped,
                'remaining': calculate_remaining_for_badge(user, badge, user_badge.progress)
            })
        else:
            # User doesn't have this badge yet
            progress = calculate_badge_progress(user, badge)
            badges_data.append({
                'badge': badge,
                'progress': progress,
                'earned': False,
                'earned_date': None,
                'is_equipped': False,
                'remaining': calculate_remaining_for_badge(user, badge, progress)
            })
    
    return render(request, 'accounts/badges.html', {
        'badges_data': badges_data
    })

@login_required
def equip_badge(request, badge_id):
    user = request.user
    
    try:
        # Unequip all currently equipped badges
        UserBadge.objects.filter(user=user, is_equipped=True).update(is_equipped=False)
        
        # Equip the selected badge
        user_badge = UserBadge.objects.get(user=user, badge_id=badge_id, progress=100)
        user_badge.is_equipped = True
        user_badge.save()
        
        messages.success(request, "Badge equipped successfully!")
    except UserBadge.DoesNotExist:
        messages.error(request, "You haven't earned this badge yet.")
    
    return redirect('accounts:user_badges')

def calculate_badge_progress(user, badge):
    """Calculate progress toward earning a badge."""
    try:
        if badge.requirement_type == 'publications_count':
            # Count user's publications
            try:
                from publications.models import Publication
                count = Publication.objects.filter(author=user).count()
                progress = min(100, int((count / badge.requirement_count) * 100))
                return progress
            except (ImportError, ModuleNotFoundError):
                return 0
            
        elif badge.requirement_type == 'publication_likes':
            # Count likes on user's publications
            try:
                from publications.models import Publication
                # Check if Like model exists
                try:
                    from publications.models import Like
                    publications = Publication.objects.filter(author=user)
                    likes_count = sum(p.likes.count() for p in publications)
                    progress = min(100, int((likes_count / badge.requirement_count) * 100))
                    return progress
                except ImportError:
                    # If Like model doesn't exist, assume 0 progress
                    return 0
            except (ImportError, ModuleNotFoundError):
                return 0
            
        elif badge.requirement_type == 'publication_favorites':
            # Count favorites on user's publications
            try:
                from publications.models import Publication
                # Check if Favorite model exists
                try:
                    from publications.models import Favorite
                    publications = Publication.objects.filter(author=user)
                    favorites_count = sum(p.favorites.count() for p in publications)
                    progress = min(100, int((favorites_count / badge.requirement_count) * 100))
                    return progress
                except ImportError:
                    # If Favorite model doesn't exist, assume 0 progress
                    return 0
            except (ImportError, ModuleNotFoundError):
                return 0
            
        elif badge.requirement_type == 'forum_replies':
            # Count user's forum replies
            try:
                from discussions.models import Reply
                replies_count = Reply.objects.filter(author=user).count()
                progress = min(100, int((replies_count / badge.requirement_count) * 100))
                return progress
            except (ImportError, ModuleNotFoundError):
                return 0
            
        elif badge.requirement_type == 'followers_count':
            # Count user's followers
            try:
                followers_count = Follow.objects.filter(following__user=user).count()
                progress = min(100, int((followers_count / badge.requirement_count) * 100))
                return progress
            except Exception:
                return 0
            
        elif badge.requirement_type == 'profile_completion':
            # Check if profile is complete
            try:
                profile = Profile.objects.get(user=user)
                fields = [profile.institution, profile.field_of_study, profile.bio, profile.website]
                filled_fields = sum(1 for field in fields if field)
                completion_percentage = (filled_fields / len(fields)) * 100
                progress = min(100, int(completion_percentage))
                return progress
            except Exception:
                return 0
            
        elif badge.requirement_type == 'forums_diversity':
            # Check if user has posted in different forums
            try:
                from discussions.models import Forum, Topic, Reply
                forums = Forum.objects.all()
                forum_count = forums.count()
                
                if forum_count == 0:
                    return 0
                    
                forums_participated = set()
                for topic in Topic.objects.filter(author=user):
                    forums_participated.add(topic.forum_id)
                    
                for reply in Reply.objects.filter(author=user):
                    forums_participated.add(reply.topic.forum_id)
                    
                progress = min(100, int((len(forums_participated) / forum_count) * 100))
                return progress
            except (ImportError, ModuleNotFoundError):
                return 0
    except Exception:
        # For any other unexpected error, return 0 progress
        return 0
    
    return 0

def calculate_remaining_for_badge(user, badge, current_progress):
    """Calculate what's remaining to earn a badge."""
    try:
        if current_progress >= 100:
            return "Badge earned!"
            
        if badge.requirement_type == 'publications_count':
            try:
                from publications.models import Publication
                count = Publication.objects.filter(author=user).count()
                remaining = badge.requirement_count - count
                return f"Need {remaining} more publications"
            except (ImportError, ModuleNotFoundError):
                return "Need publications"
            
        elif badge.requirement_type == 'publication_likes':
            try:
                from publications.models import Publication
                try:
                    from publications.models import Like
                    publications = Publication.objects.filter(author=user)
                    likes_count = sum(p.likes.count() for p in publications)
                    remaining = badge.requirement_count - likes_count
                    return f"Need {remaining} more likes"
                except ImportError:
                    return "Need likes on publications"
            except (ImportError, ModuleNotFoundError):
                return "Need likes on publications"
            
        elif badge.requirement_type == 'publication_favorites':
            try:
                from publications.models import Publication
                try:
                    from publications.models import Favorite
                    publications = Publication.objects.filter(author=user)
                    favorites_count = sum(p.favorites.count() for p in publications)
                    remaining = badge.requirement_count - favorites_count
                    return f"Need {remaining} more favorites"
                except ImportError:
                    return "Need favorites on publications"
            except (ImportError, ModuleNotFoundError):
                return "Need favorites on publications"
            
        elif badge.requirement_type == 'forum_replies':
            try:
                from discussions.models import Reply
                replies_count = Reply.objects.filter(author=user).count()
                remaining = badge.requirement_count - replies_count
                return f"Need {remaining} more replies"
            except (ImportError, ModuleNotFoundError):
                return "Need forum replies"
            
        elif badge.requirement_type == 'followers_count':
            try:
                followers_count = Follow.objects.filter(following__user=user).count()
                remaining = badge.requirement_count - followers_count
                return f"Need {remaining} more followers"
            except Exception:
                return "Need followers"
            
        elif badge.requirement_type == 'profile_completion':
            return "Complete your profile"
            
        elif badge.requirement_type == 'forums_diversity':
            try:
                from discussions.models import Forum, Topic, Reply
                forums = Forum.objects.all()
                
                forums_participated = set()
                for topic in Topic.objects.filter(author=user):
                    forums_participated.add(topic.forum_id)
                    
                for reply in Reply.objects.filter(author=user):
                    forums_participated.add(reply.topic.forum_id)
                    
                remaining = forums.count() - len(forums_participated)
                return f"Participate in {remaining} more forums"
            except (ImportError, ModuleNotFoundError):
                return "Participate in forums"
    except Exception:
        return "Keep going!"
    
    return "Keep going!"
