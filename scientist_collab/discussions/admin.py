from django.contrib import admin
from .models import Forum, Topic, Reply

@admin.register(Forum)
class ForumAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'topic_count')
    search_fields = ('name', 'description')
    
    def topic_count(self, obj):
        return obj.topics.count()
    topic_count.short_description = 'Topics'

@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('title', 'forum', 'author', 'created_at', 'reply_count')
    list_filter = ('forum', 'created_at')
    search_fields = ('title', 'content', 'author__username')
    
    def reply_count(self, obj):
        return obj.replies.count()
    reply_count.short_description = 'Replies'

@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ('topic', 'author', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'author__username', 'topic__title')
