from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import Badge, UserBadge
from django.utils import timezone

class Command(BaseCommand):
    help = 'Unlocks all badges for a specified user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user to unlock badges for')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            self.stdout.write(f'Processing badges for user: {username}')
            
            # Get all badges
            badges = Badge.objects.all()
            self.stdout.write(f'Found {badges.count()} badges')
            
            for badge in badges:
                # Get or create user badge with 100% progress
                user_badge, created = UserBadge.objects.get_or_create(
                    user=user,
                    badge=badge,
                    defaults={
                        'progress': 100,
                        'earned_date': timezone.now()
                    }
                )
                
                if not created:
                    # Update existing badge to be complete
                    user_badge.progress = 100
                    user_badge.earned_date = timezone.now()
                    user_badge.save()
                
                self.stdout.write(self.style.SUCCESS(
                    f'Badge {badge.name} unlocked for {username}'
                ))
            
            self.stdout.write(self.style.SUCCESS(f'All badges unlocked for {username}'))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} does not exist')) 