from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from .models import Forum, Topic, Reply
from .forms import TopicForm, ReplyForm

class ForumListView(ListView):
    model = Forum
    template_name = 'discussions/forum_list.html'
    context_object_name = 'forums'

class ForumDetailView(DetailView):
    model = Forum
    template_name = 'discussions/forum_detail.html'
    context_object_name = 'forum'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['topics'] = self.object.topics.all()
        return context

class TopicDetailView(DetailView):
    model = Topic
    template_name = 'discussions/topic_detail.html'
    context_object_name = 'topic'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['replies'] = self.object.replies.all()
        context['reply_form'] = ReplyForm()
        return context

class TopicCreateView(LoginRequiredMixin, CreateView):
    model = Topic
    form_class = TopicForm
    template_name = 'discussions/topic_form.html'
    
    def form_valid(self, form):
        form.instance.author = self.request.user
        messages.success(self.request, 'Topic created successfully!')
        return super().form_valid(form)
    
    def get_initial(self):
        initial = super().get_initial()
        if 'forum' in self.kwargs:
            initial['forum'] = get_object_or_404(Forum, pk=self.kwargs['forum'])
        return initial

class TopicUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Topic
    form_class = TopicForm
    template_name = 'discussions/topic_form.html'
    
    def test_func(self):
        topic = self.get_object()
        return self.request.user == topic.author
    
    def form_valid(self, form):
        messages.success(self.request, 'Topic updated successfully!')
        return super().form_valid(form)

class TopicDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Topic
    template_name = 'discussions/topic_confirm_delete.html'
    
    def test_func(self):
        topic = self.get_object()
        return self.request.user == topic.author
    
    def get_success_url(self):
        return reverse_lazy('discussions:forum_detail', kwargs={'pk': self.object.forum.pk})
    
    def delete(self, request, *args, **kwargs):
        messages.success(self.request, 'Topic deleted successfully!')
        return super().delete(request, *args, **kwargs)

@login_required
def add_reply(request, pk):
    topic = get_object_or_404(Topic, pk=pk)
    
    if request.method == 'POST':
        form = ReplyForm(request.POST)
        if form.is_valid():
            reply = form.save(commit=False)
            reply.topic = topic
            reply.author = request.user
            reply.save()
            messages.success(request, 'Your reply has been posted!')
            return redirect('discussions:topic_detail', pk=topic.pk)
    
    return redirect('discussions:topic_detail', pk=topic.pk)

class ReplyDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Reply
    template_name = 'discussions/reply_confirm_delete.html'
    
    def test_func(self):
        reply = self.get_object()
        return self.request.user == reply.author
    
    def get_success_url(self):
        return reverse_lazy('discussions:topic_detail', kwargs={'pk': self.object.topic.pk})
    
    def delete(self, request, *args, **kwargs):
        messages.success(self.request, 'Reply deleted successfully!')
        return super().delete(request, *args, **kwargs)
