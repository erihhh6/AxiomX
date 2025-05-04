from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import Badge, UserBadge, Profile
from accounts.views import calculate_badge_progress

class Command(BaseCommand):
    help = 'Updates badge progress for all users'

    def handle(self, *args, **options):
        self.stdout.write('Starting badge update process...')
        
        # Get all users
        users = User.objects.all()
        self.stdout.write(f'Found {users.count()} users')
        
        # Get all badges
        badges = Badge.objects.all()
        self.stdout.write(f'Found {badges.count()} badges')
        
        for user in users:
            self.stdout.write(f'Updating badges for user: {user.username}')
            
            for badge in badges:
                # Calculate current progress
                progress = calculate_badge_progress(user, badge)
                
                # Get or create user badge
                user_badge, created = UserBadge.objects.get_or_create(
                    user=user,
                    badge=badge,
                    defaults={'progress': progress}
                )
                
                if not created:
                    # Update progress
                    user_badge.progress = progress
                    user_badge.save()
                
                # Log badge earned
                if progress == 100 and (created or user_badge.progress < 100):
                    self.stdout.write(self.style.SUCCESS(
                        f'User {user.username} earned badge: {badge.name}'
                    ))
        
        self.stdout.write(self.style.SUCCESS('Badge update process completed successfully')) 