from django.contrib import admin
from .models import Profile, Follow, Badge, UserBadge

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'institution', 'position', 'field_of_study', 'created_at')
    search_fields = ('user__username', 'user__email', 'institution', 'field_of_study')
    list_filter = ('institution', 'field_of_study')

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'requirement_type', 'requirement_count')
    list_filter = ('requirement_type',)
    search_fields = ('name', 'description')

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'earned_date', 'progress', 'is_equipped')
    list_filter = ('badge', 'is_equipped')
    search_fields = ('user__username', 'badge__name')
    raw_id_fields = ('user', 'badge')
