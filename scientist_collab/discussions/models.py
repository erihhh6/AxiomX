from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse

class Forum(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('discussions:forum_detail', kwargs={'pk': self.pk})
    
    class Meta:
        ordering = ['name']

class Topic(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    forum = models.ForeignKey(Forum, on_delete=models.CASCADE, related_name='topics')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topics')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='liked_topics', blank=True)
    dislikes = models.ManyToManyField(User, related_name='disliked_topics', blank=True)
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('discussions:topic_detail', kwargs={'pk': self.pk})
    
    def total_likes(self):
        return self.likes.count()
    
    def total_dislikes(self):
        return self.dislikes.count()
    
    class Meta:
        ordering = ['-created_at']

class Reply(models.Model):
    content = models.TextField()
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='replies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='liked_replies', blank=True)
    
    def __str__(self):
        return f"Reply by {self.author.username} on {self.topic.title}"
    
    def total_likes(self):
        return self.likes.count()
    
    class Meta:
        ordering = ['created_at']
        verbose_name_plural = 'Replies'
