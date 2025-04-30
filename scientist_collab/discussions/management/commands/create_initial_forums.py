from django.core.management.base import BaseCommand
from discussions.models import Forum

class Command(BaseCommand):
    help = 'Creates initial forums for the discussions app'

    def handle(self, *args, **options):
        forums = [
            {
                'name': 'Physics',
                'description': 'Discuss physics topics including quantum mechanics, relativity, particle physics, and more.'
            },
            {
                'name': 'Biology',
                'description': 'Share insights about genetics, evolution, ecology, molecular biology, and related topics.'
            },
            {
                'name': 'Chemistry',
                'description': 'Exchange ideas about organic chemistry, biochemistry, analytical chemistry, and chemical engineering.'
            },
            {
                'name': 'Mathematics',
                'description': 'Discuss pure and applied mathematics, including algebra, calculus, statistics, and computational methods.'
            },
            {
                'name': 'Computer Science',
                'description': 'Talk about algorithms, artificial intelligence, machine learning, data science, and software engineering.'
            },
            {
                'name': 'Interdisciplinary Research',
                'description': 'A place for cross-disciplinary discussions and collaborations that span multiple scientific fields.'
            },
        ]
        
        created_count = 0
        existing_count = 0
        
        for forum_data in forums:
            forum, created = Forum.objects.get_or_create(
                name=forum_data['name'],
                defaults={'description': forum_data['description']}
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created forum: {forum.name}'))
            else:
                existing_count += 1
                self.stdout.write(self.style.WARNING(f'Forum already exists: {forum.name}'))
        
        self.stdout.write(self.style.SUCCESS(f'Forums created: {created_count}'))
        if existing_count:
            self.stdout.write(self.style.WARNING(f'Forums already existing: {existing_count}')) 