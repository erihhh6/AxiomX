from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Forum, Topic, Reply

class DiscussionsModelTests(TestCase):
    """Tests for the discussions app models"""
    
    def setUp(self):
        """Setup test data"""
        # Create a test user
        self.user = User.objects.create_user(
            username='scientist',
            email='scientist@example.com',
            password='testpassword123'
        )
        
        # Create a forum
        self.forum = Forum.objects.create(
            name='General Science',
            description='General scientific discussions'
        )
        
        # Create a topic
        self.topic = Topic.objects.create(
            title='Test Topic',
            content='This is a test topic for scientific discussions',
            author=self.user,
            forum=self.forum
        )
        
        # Create a reply
        self.reply = Reply.objects.create(
            content='This is a test reply',
            author=self.user,
            topic=self.topic
        )
    
    def test_forum_creation(self):
        """Check if the forum was created correctly"""
        self.assertEqual(self.forum.name, 'General Science')
        self.assertEqual(self.forum.description, 'General scientific discussions')
    
    def test_topic_creation(self):
        """Check if the topic was created correctly"""
        self.assertEqual(self.topic.title, 'Test Topic')
        self.assertEqual(self.topic.author, self.user)
        self.assertEqual(self.topic.forum, self.forum)
    
    def test_reply_creation(self):
        """Check if the reply was created correctly"""
        self.assertEqual(self.reply.content, 'This is a test reply')
        self.assertEqual(self.reply.author, self.user)
        self.assertEqual(self.reply.topic, self.topic)
    
    def test_forum_str_method(self):
        """Check if the forum's __str__ method returns the expected value"""
        expected_str = 'General Science'
        self.assertEqual(str(self.forum), expected_str)
    
    def test_topic_str_method(self):
        """Check if the topic's __str__ method returns the expected value"""
        expected_str = 'Test Topic'
        self.assertEqual(str(self.topic), expected_str)

class DiscussionsViewTests(TestCase):
    """Tests for the discussions app views"""
    
    def setUp(self):
        """Setup test data"""
        # Create a test client
        self.client = Client()
        
        # Create a test user
        self.user = User.objects.create_user(
            username='scientist',
            email='scientist@example.com',
            password='testpassword123'
        )
        
        # Create a forum
        self.forum = Forum.objects.create(
            name='General Science',
            description='General scientific discussions'
        )
        
        # Create a topic
        self.topic = Topic.objects.create(
            title='Test Topic',
            content='This is a test topic for scientific discussions',
            author=self.user,
            forum=self.forum
        )
    
    def test_forums_list_view(self):
        """Check if the forums list page loads correctly"""
        response = self.client.get(reverse('discussions:forum_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'General Science')
    
    def test_forum_detail_view(self):
        """Check if the forum detail page loads correctly"""
        response = self.client.get(
            reverse('discussions:forum_detail', kwargs={'pk': self.forum.pk})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'General Science')
        self.assertContains(response, 'Test Topic')
    
    def test_topic_detail_view(self):
        """Check if the topic detail page loads correctly"""
        response = self.client.get(
            reverse('discussions:topic_detail', kwargs={'pk': self.topic.pk})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Topic')
        self.assertContains(response, 'This is a test topic for scientific discussions')
    
    def test_create_topic_authentication(self):
        """Check if creating a topic requires authentication"""
        # Try to access the creation page without being authenticated
        response = self.client.get(
            reverse('discussions:topic_create_forum', kwargs={'forum': self.forum.pk})
        )
        
        # Should be redirected to the login page
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)
        
        # Authenticate the user - using force_login to bypass django-axes
        self.client.force_login(self.user)
        
        # Now we should be able to access the creation page
        response = self.client.get(
            reverse('discussions:topic_create_forum', kwargs={'forum': self.forum.pk})
        )
        self.assertEqual(response.status_code, 200)
    
    def test_add_reply_authentication(self):
        """Check if adding a reply requires authentication"""
        # Try to submit a reply without being authenticated
        reply_data = {
            'content': 'This is a test reply from an unauthenticated user'
        }
        
        response = self.client.post(
            reverse('discussions:add_reply', kwargs={'pk': self.topic.pk}),
            reply_data
        )
        
        # Should be redirected to the login page
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)
        
        # Authenticate the user - using force_login to bypass django-axes
        self.client.force_login(self.user)
        
        # Submit the reply
        response = self.client.post(
            reverse('discussions:add_reply', kwargs={'pk': self.topic.pk}),
            reply_data,
            follow=True
        )
        
        # Check if we were redirected back to the topic page
        self.assertEqual(response.status_code, 200)
        
        # Check if the reply was created
        self.assertContains(response, 'This is a test reply from an unauthenticated user')
