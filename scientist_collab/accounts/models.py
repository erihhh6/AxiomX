from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    institution = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    field_of_study = models.CharField(max_length=100, blank=True)
    website = models.URLField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    following = models.ManyToManyField('self', through='Follow', related_name='followers', symmetrical=False)
    equipped_badge = models.ForeignKey('Badge', on_delete=models.SET_NULL, null=True, blank=True, related_name='equipped_by')

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def follow(self, profile):
        """Follow another user's profile if not already following"""
        follow, created = Follow.objects.get_or_create(follower=self, following=profile)
        return created

    def unfollow(self, profile):
        """Unfollow another user's profile"""
        Follow.objects.filter(follower=self, following=profile).delete()

    def is_following(self, profile):
        """Check if user is following another profile"""
        return self.following.filter(pk=profile.pk).exists()

class Follow(models.Model):
    follower = models.ForeignKey(Profile, related_name='following_relationships', on_delete=models.CASCADE)
    following = models.ForeignKey(Profile, related_name='follower_relationships', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        
    def __str__(self):
        return f"{self.follower.user.username} follows {self.following.user.username}"

class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='badges/', default='badges/default_badge.png')
    requirement_type = models.CharField(max_length=100, choices=[
        ('publications_count', 'Publications Count'),
        ('publication_likes', 'Publication Likes'),
        ('publication_favorites', 'Publication Favorites'),
        ('forum_replies', 'Forum Replies'),
        ('followers_count', 'Followers Count'),
        ('profile_completion', 'Profile Completion'),
        ('forums_diversity', 'Forums Diversity'),
    ])
    requirement_count = models.IntegerField(default=1)
    
    def __str__(self):
        return self.name

class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    progress = models.IntegerField(default=0)  # Progress toward earning the badge (0-100%)
    is_equipped = models.BooleanField(default=False)  # Flag to mark badge as equipped/favorite
    
    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"
    
    class Meta:
        unique_together = ('user', 'badge')

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
