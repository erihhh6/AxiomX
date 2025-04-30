from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from .models import Publication
from .forms import PublicationForm

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
