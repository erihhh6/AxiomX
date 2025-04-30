from django import forms
from .models import Publication

class PublicationForm(forms.ModelForm):
    class Meta:
        model = Publication
        fields = ['title', 'abstract', 'document', 'co_authors', 'keywords', 'publication_date']
        widgets = {
            'publication_date': forms.DateInput(attrs={'type': 'date'}),
            'abstract': forms.Textarea(attrs={'rows': 5}),
        }
    
    def clean_document(self):
        document = self.cleaned_data.get('document')
        if document:
            # Check if it's a PDF file
            if not document.name.endswith('.pdf'):
                raise forms.ValidationError("Only PDF files are allowed.")
            # Check file size (max 10MB)
            if document.size > 10 * 1024 * 1024:
                raise forms.ValidationError("File size should not exceed 10MB.")
        return document 