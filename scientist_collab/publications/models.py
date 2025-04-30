from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse

class Publication(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='publications')
    co_authors = models.CharField(max_length=500, blank=True, help_text="Comma-separated list of co-authors")
    abstract = models.TextField()
    document = models.FileField(upload_to='publications/')
    keywords = models.CharField(max_length=200, blank=True, help_text="Comma-separated list of keywords")
    publication_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-publication_date']
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('publications:detail', kwargs={'pk': self.pk})
    
    def get_keywords_list(self):
        if self.keywords:
            return [word.strip() for word in self.keywords.split(',')]
        return []
    
    def get_co_authors_list(self):
        if self.co_authors:
            return [author.strip() for author in self.co_authors.split(',')]
        return []
