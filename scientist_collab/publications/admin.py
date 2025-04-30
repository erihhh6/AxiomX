from django.contrib import admin
from .models import Publication

@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'publication_date', 'created_at')
    search_fields = ('title', 'abstract', 'keywords', 'author__username', 'author__email')
    list_filter = ('publication_date', 'created_at')
    date_hierarchy = 'publication_date'
