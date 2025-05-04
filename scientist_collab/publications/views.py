from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.http import JsonResponse
from .models import Publication, Favorite
from .forms import PublicationForm

# Import notification utilities
from notifications.utils import create_notification
from notifications.models import Notification

# Create your views here.

class PublicationListView(ListView):
    model = Publication
    template_name = 'publications/publication_list.html'
    context_object_name = 'publications'
    paginate_by = 10
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Implement search functionality
        query = self.request.GET.get('q')
        if query:
            queryset = queryset.filter(
                title__icontains=query
            ) | queryset.filter(
                abstract__icontains=query
            ) | queryset.filter(
                keywords__icontains=query
            )
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['query'] = self.request.GET.get('q', '')
        return context

class MyPublicationListView(LoginRequiredMixin, ListView):
    model = Publication
    template_name = 'publications/my_publications.html'
    context_object_name = 'publications'
    
    def get_queryset(self):
        return Publication.objects.filter(author=self.request.user)

class PublicationDetailView(DetailView):
    model = Publication
    template_name = 'publications/publication_detail.html'
    context_object_name = 'publication'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        publication = self.get_object()
        
        # Check if user liked or disliked this publication
        if self.request.user.is_authenticated:
            context['is_liked'] = publication.likes.filter(id=self.request.user.id).exists()
            context['is_disliked'] = publication.dislikes.filter(id=self.request.user.id).exists()
            context['is_favorited'] = Favorite.objects.filter(
                user=self.request.user, 
                publication=publication
            ).exists()
        
        return context

class PublicationCreateView(LoginRequiredMixin, CreateView):
    model = Publication
    form_class = PublicationForm
    template_name = 'publications/publication_form.html'
    success_url = reverse_lazy('publications:my_publications')
    
    def form_valid(self, form):
        form.instance.author = self.request.user
        messages.success(self.request, 'Publication uploaded successfully!')
        return super().form_valid(form)

class PublicationUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Publication
    form_class = PublicationForm
    template_name = 'publications/publication_form.html'
    
    def test_func(self):
        publication = self.get_object()
        return self.request.user == publication.author
    
    def form_valid(self, form):
        messages.success(self.request, 'Publication updated successfully!')
        return super().form_valid(form)
    
    def get_success_url(self):
        return self.object.get_absolute_url()

class PublicationDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Publication
    template_name = 'publications/publication_confirm_delete.html'
    success_url = reverse_lazy('publications:my_publications')
    
    def test_func(self):
        publication = self.get_object()
        return self.request.user == publication.author
    
    def delete(self, request, *args, **kwargs):
        messages.success(self.request, 'Publication deleted successfully!')
        return super().delete(request, *args, **kwargs)

@login_required
def download_publication(request, pk):
    publication = get_object_or_404(Publication, pk=pk)
    response = redirect(publication.document.url)
    return response

@login_required
def like_publication(request, pk):
    publication = get_object_or_404(Publication, pk=pk)
    
    # Remove dislike if exists when liking
    if publication.dislikes.filter(id=request.user.id).exists():
        publication.dislikes.remove(request.user)
    
    # Check if the user already liked this publication
    if publication.likes.filter(id=request.user.id).exists():
        # Unlike
        publication.likes.remove(request.user)
        liked = False
    else:
        # Like
        publication.likes.add(request.user)
        liked = True
        
        # Create a notification for the publication author
        create_notification(
            recipient=publication.author, 
            sender=request.user, 
            obj=publication, 
            notification_type=Notification.LIKE
        )
    
    # For AJAX requests
    if request.method in ['POST', 'GET'] and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'liked': liked,
            'total_likes': publication.total_likes(),
            'total_dislikes': publication.total_dislikes()
        })
    
    # Redirect to publication detail page
    return redirect('publications:detail', pk=publication.pk)

@login_required
def dislike_publication(request, pk):
    publication = get_object_or_404(Publication, pk=pk)
    
    # Remove like if exists when disliking
    if publication.likes.filter(id=request.user.id).exists():
        publication.likes.remove(request.user)
    
    # Check if the user already disliked this publication
    if publication.dislikes.filter(id=request.user.id).exists():
        # Undislike
        publication.dislikes.remove(request.user)
        disliked = False
    else:
        # Dislike
        publication.dislikes.add(request.user)
        disliked = True
        
        # Create a notification for the publication author
        create_notification(
            recipient=publication.author, 
            sender=request.user, 
            obj=publication, 
            notification_type=Notification.DISLIKE
        )
    
    # For AJAX requests
    if request.method in ['POST', 'GET'] and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'disliked': disliked,
            'total_likes': publication.total_likes(),
            'total_dislikes': publication.total_dislikes()
        })
    
    # Redirect to publication detail page
    return redirect('publications:detail', pk=publication.pk)

@login_required
def favorite_publication(request, pk):
    publication = get_object_or_404(Publication, pk=pk)
    
    # Check if already favorited
    favorite, created = Favorite.objects.get_or_create(
        user=request.user,
        publication=publication
    )
    
    if created:
        messages.success(request, f'"{publication.title}" added to your favorites!')
        
        # Create a notification for the publication author
        create_notification(
            recipient=publication.author, 
            sender=request.user, 
            obj=publication, 
            notification_type=Notification.FAVORITE
        )
    else:
        messages.info(request, f'"{publication.title}" is already in your favorites!')
    
    # For AJAX requests
    if request.method in ['POST', 'GET'] and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'favorited': True
        })
    
    return redirect('publications:detail', pk=publication.pk)

@login_required
def unfavorite_publication(request, pk):
    publication = get_object_or_404(Publication, pk=pk)
    
    # Remove from favorites
    favorite = Favorite.objects.filter(
        user=request.user,
        publication=publication
    )
    
    if favorite.exists():
        favorite.delete()
        messages.success(request, f'"{publication.title}" removed from your favorites!')
    
    # For AJAX requests
    if request.method in ['POST', 'GET'] and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'favorited': False
        })
    
    return redirect('publications:detail', pk=publication.pk)

@login_required
def favorite_publications_list(request):
    favorites = Favorite.objects.filter(user=request.user).select_related('publication')
    publications = [favorite.publication for favorite in favorites]
    
    context = {
        'publications': publications,
        'is_favorites_list': True
    }
    
    return render(request, 'publications/favorites_list.html', context)
