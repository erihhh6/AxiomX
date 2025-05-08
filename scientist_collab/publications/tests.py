from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Publication, Favorite
from datetime import date
import os
import tempfile

class PublicationsModelTests(TestCase):
    """Tests for the publications app models"""
    
    def setUp(self):
        """Setup test data"""
        # Create a test user
        self.user = User.objects.create_user(
            username='researcher',
            email='researcher@example.com',
            password='testpassword123'
        )
        
        # Create a test document
        self.document = SimpleUploadedFile(
            "test_document.pdf",
            b"file content",
            content_type="application/pdf"
        )
        
        # Create a publication
        self.publication = Publication.objects.create(
            title='Test Publication',
            abstract='This is a test abstract for a scientific paper',
            author=self.user,
            publication_date=date.today(),
            keywords='test, science, research',
            document=self.document
        )
    
    def test_publication_creation(self):
        """Check if the publication was created correctly"""
        self.assertEqual(self.publication.title, 'Test Publication')
        self.assertEqual(self.publication.author, self.user)
    
    def test_publication_str_method(self):
        """Check if the publication's __str__ method returns the expected value"""
        expected_str = 'Test Publication'
        self.assertEqual(str(self.publication), expected_str)
    
    def test_favorite_creation(self):
        """Check the creation of a favorite for a publication"""
        favorite = Favorite.objects.create(
            publication=self.publication,
            user=self.user
        )
        
        self.assertEqual(favorite.publication, self.publication)
        self.assertEqual(favorite.user, self.user)

class PublicationsViewTests(TestCase):
    """Tests for the publications app views"""
    
    def setUp(self):
        """Setup test data"""
        # Create a test client
        self.client = Client()
        
        # Create a test user
        self.user = User.objects.create_user(
            username='researcher',
            email='researcher@example.com',
            password='testpassword123'
        )
        
        # Create a test document
        self.document = SimpleUploadedFile(
            "test_document.pdf",
            b"file content",
            content_type="application/pdf"
        )
        
        # Create a publication
        self.publication = Publication.objects.create(
            title='Test Publication',
            abstract='This is a test abstract for a scientific paper',
            author=self.user,
            publication_date=date.today(),
            keywords='test, science, research',
            document=self.document
        )
    
    def test_publications_list_view(self):
        """Check if the publications list page loads correctly"""
        # Any user can see the publications list
        response = self.client.get(reverse('publications:list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Publication')
    
    def test_publication_detail_view(self):
        """Check if the publication detail page loads correctly"""
        # Use HttpResponse-checking instead of template context to avoid document URL issues
        response = self.client.get(
            reverse('publications:detail', kwargs={'pk': self.publication.pk})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Publication')
        self.assertContains(response, 'This is a test abstract')
    
    def test_create_publication_authentication(self):
        """Check if creating a publication requires authentication"""
        # Try to access the creation page without being authenticated
        response = self.client.get(reverse('publications:create'))
        
        # Should be redirected to the login page
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)
        
        # Login - using the client's login method which bypasses django-axes
        self.client.force_login(self.user)
        
        # Now we should be able to access the creation page
        response = self.client.get(reverse('publications:create'))
        self.assertEqual(response.status_code, 200)
    
    def test_like_publication(self):
        """Check the like functionality"""
        # Login the user - using force_login to bypass django-axes
        self.client.force_login(self.user)
        
        # Submit the like request
        response = self.client.post(
            reverse('publications:like_publication', kwargs={'pk': self.publication.pk})
        )
        
        # Check if the response was successful (redirect)
        self.assertIn(response.status_code, [200, 302])
        
        # Refresh the publication from the database
        self.publication.refresh_from_db()
        
        # Check if the like was registered
        self.assertEqual(self.publication.likes.count(), 1)
