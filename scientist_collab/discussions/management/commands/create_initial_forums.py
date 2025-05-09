from django.core.management.base import BaseCommand
from discussions.models import Forum

class Command(BaseCommand):
    help = 'Creates initial forums for the discussions app'

    

    def handle(self, *args, **options):

        deleted_count, _ = Forum.objects.all().delete()
        self.stdout.write(self.style.WARNING(f'Forums deleted: {deleted_count}'))

        forums = [
            {
                'name': 'Energy',
                'description': 'General discussions about energy, including concepts, sources, and applications.'
            },
            {
                'name': 'Physical Energy',
                'description': 'Explore the principles of physical energy, including kinetic and potential energy, and energy conservation.'
            },
            {
                'name': 'Chemical Energy',
                'description': 'Discuss the chemical processes that release or store energy, including combustion and reactions.'
            },
            {
                'name': 'Nuclear Energy',
                'description': 'Conversations about nuclear energy, including fission, fusion, and nuclear reactors.'
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