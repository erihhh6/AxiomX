from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.http import JsonResponse
from .models import Forum, Topic, Reply
from .forms import TopicForm, ReplyForm

# Import notification utilities
from notifications.utils import create_notification
from notifications.models import Notification

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
        topic = self.get_object()
        context['replies'] = topic.replies.all()
        context['reply_form'] = ReplyForm()
        
        # Check if user has liked/disliked this topic
        if self.request.user.is_authenticated:
            context['is_topic_liked'] = topic.likes.filter(id=self.request.user.id).exists()
            context['is_topic_disliked'] = topic.dislikes.filter(id=self.request.user.id).exists()
            
            # Check if user has liked each reply
            user_liked_replies = Reply.objects.filter(
                id__in=[reply.id for reply in context['replies']], 
                likes=self.request.user
            ).values_list('id', flat=True)
            context['user_liked_replies'] = user_liked_replies
        
        # Add solution information to each reply
        for reply in context['replies']:
            reply.is_solution = (topic.solution and topic.solution.id == reply.id)
        
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
            
            # Create a notification for the topic author
            create_notification(
                recipient=topic.author, 
                sender=request.user, 
                obj=topic, 
                notification_type=Notification.REPLY
            )
            
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

@login_required
def like_topic(request, pk):
    topic = get_object_or_404(Topic, pk=pk)
    
    # Remove dislike if exists when liking
    if topic.dislikes.filter(id=request.user.id).exists():
        topic.dislikes.remove(request.user)
    
    # Check if the user already liked this topic
    if topic.likes.filter(id=request.user.id).exists():
        # Unlike
        topic.likes.remove(request.user)
        liked = False
    else:
        # Like
        topic.likes.add(request.user)
        liked = True
        
        # Create a notification for the topic author
        create_notification(
            recipient=topic.author, 
            sender=request.user, 
            obj=topic, 
            notification_type=Notification.LIKE
        )
    
    # For AJAX requests
    if request.method in ['POST', 'GET'] and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'liked': liked,
            'total_likes': topic.total_likes(),
            'total_dislikes': topic.total_dislikes()
        })
    
    # Redirect to topic detail page
    return redirect('discussions:topic_detail', pk=topic.pk)

@login_required
def dislike_topic(request, pk):
    topic = get_object_or_404(Topic, pk=pk)
    
    # Remove like if exists when disliking
    if topic.likes.filter(id=request.user.id).exists():
        topic.likes.remove(request.user)
    
    # Check if the user already disliked this topic
    if topic.dislikes.filter(id=request.user.id).exists():
        # Undislike
        topic.dislikes.remove(request.user)
        disliked = False
    else:
        # Dislike
        topic.dislikes.add(request.user)
        disliked = True
        
        # Create a notification for the topic author
        create_notification(
            recipient=topic.author, 
            sender=request.user, 
            obj=topic, 
            notification_type=Notification.DISLIKE
        )
    
    # For AJAX requests
    if request.method in ['POST', 'GET'] and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'disliked': disliked,
            'total_likes': topic.total_likes(),
            'total_dislikes': topic.total_dislikes()
        })
    
    # Redirect to topic detail page
    return redirect('discussions:topic_detail', pk=topic.pk)

@login_required
def like_reply(request, pk):
    reply = get_object_or_404(Reply, pk=pk)
    
    # Check if the user already liked this reply
    if reply.likes.filter(id=request.user.id).exists():
        # Unlike
        reply.likes.remove(request.user)
        liked = False
    else:
        # Like
        reply.likes.add(request.user)
        liked = True
        
        # Create a notification for the reply author
        create_notification(
            recipient=reply.author, 
            sender=request.user, 
            obj=reply, 
            notification_type=Notification.LIKE
        )
    
    # For AJAX requests
    if request.method in ['POST', 'GET'] and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'liked': liked,
            'total_likes': reply.total_likes()
        })
    
    # Redirect to topic detail page
    return redirect('discussions:topic_detail', pk=reply.topic.pk)

@login_required
def mark_solution(request, pk):
    """Mark a reply as the solution to a topic"""
    reply = get_object_or_404(Reply, pk=pk)
    topic = reply.topic
    
    # Only the topic author can mark a solution
    if request.user != topic.author:
        messages.error(request, "Only the topic author can mark a solution.")
        return redirect('discussions:topic_detail', pk=topic.pk)
    
    # Mark this reply as the solution
    topic.solution = reply
    topic.is_solved = True
    topic.save()
    
    # Create a notification for the solution author
    if reply.author != request.user:
        create_notification(
            recipient=reply.author, 
            sender=request.user, 
            obj=reply, 
            notification_type=Notification.SOLUTION
        )
    
    messages.success(request, "Reply marked as solution!")
    return redirect('discussions:topic_detail', pk=topic.pk)

@login_required
def unmark_solution(request, pk):
    """Remove solution mark from a topic"""
    topic = get_object_or_404(Topic, pk=pk)
    
    # Only the topic author can unmark a solution
    if request.user != topic.author:
        messages.error(request, "Only the topic author can remove a solution mark.")
        return redirect('discussions:topic_detail', pk=topic.pk)
    
    # Remove solution mark
    topic.solution = None
    topic.is_solved = False
    topic.save()
    
    messages.success(request, "Solution mark removed.")
    return redirect('discussions:topic_detail', pk=topic.pk)
