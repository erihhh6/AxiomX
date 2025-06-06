# Generated by Django 5.1.7 on 2025-05-01 11:21

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('publications', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='publication',
            name='likes',
            field=models.ManyToManyField(blank=True, related_name='liked_publications', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('publication', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='publications.publication')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'publication')},
            },
        ),
    ]
