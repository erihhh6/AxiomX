from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'institution', 'position', 'field_of_study', 'created_at')
    search_fields = ('user__username', 'user__email', 'institution', 'field_of_study')
    list_filter = ('institution', 'field_of_study')
