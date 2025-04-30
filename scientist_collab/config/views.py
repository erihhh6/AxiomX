from django.shortcuts import render
from publications.models import Publication
from discussions.models import Topic

def home_view(request):
    """
    View for the home page showing recent publications and discussions
    """
    recent_publications = Publication.objects.all().order_by('-created_at')[:3]
    recent_discussions = Topic.objects.all().order_by('-created_at')[:5]
    
    context = {
        'recent_publications': recent_publications,
        'recent_discussions': recent_discussions
    }
    
    return render(request, 'base/home.html', context) 