from django.db import models
from django.db.models.signals import post_migrate
from django.dispatch import receiver


# Define GENRE_CHOICES as a constant that can be imported by other files
GENRE_CHOICES = [
    ('fiction', 'Fiction'),
    ('non-fiction', 'Non-Fiction'),
    ('sci-fi', 'Science Fiction'),
    ('fantasy', 'Fantasy'),
    ('mystery', 'Mystery'),
    ('biography', 'Biography'),
    ('history', 'History'),
    ('romance', 'Romance'),
    ('thriller', 'Thriller'),
    ('horror', 'Horror'),
    ('young-adult', 'Young Adult'),
    ('children', 'Children'),
    ('dystopian', 'Dystopian'),
    ('utopian', 'Utopian'),
    ('supernatural', 'Supernatural'),
    ('paranormal', 'Paranormal'),
    ('graphic-novel', 'Graphic Novel'),
    ('poetry', 'Poetry'),
    ('drama', 'Drama'),
    ('classic', 'Classic'),
    ('unknown', 'Unknown'),
]


# Genre model - simple and clean
class Genre(models.Model):
    """
    Genre model to categorize books.
    The code field is the primary key and corresponds to GENRE_CHOICES codes.
    """
    code = models.CharField(
        max_length=50, 
        primary_key=True,
        choices=GENRE_CHOICES
    )
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Genre'
        verbose_name_plural = 'Genres'


# Book model - with genre as CharField to match API expectations
class Book(models.Model):
    """
    Book model representing a book in the collection.
    Contains all book details.
    """
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    
    # Changed from ForeignKey to CharField to match API expectations
    genre = models.CharField(
        max_length=50,
        choices=GENRE_CHOICES,
        default='unknown',
        blank=True
    )
    
    # Book details
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        blank=True, 
        null=True
    )
    book_notes = models.TextField(blank=True, null=True)
    
    # Reading status fields
    toBeRead = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    shelved = models.BooleanField(default=False)
    
    # New reading status fields
    currently_reading = models.BooleanField(default=False)
    did_not_finish = models.BooleanField(default=False)
    recommended_to_me = models.BooleanField(default=False)
    favorite = models.BooleanField(default=False)
    
    # Additional metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    isbn = models.CharField(max_length=13, blank=True, null=True)  # Remove unique constraint for flexibility
    language = models.CharField(max_length=50, blank=True, null=True)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    page_count = models.PositiveIntegerField(blank=True, null=True)
    
    # User-added metadata
    vibes = models.CharField(max_length=255, blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)
    content_warnings = models.TextField(blank=True, null=True)
    emoji = models.CharField(max_length=10, blank=True, null=True, default="📚")

    def __str__(self):
        return f'{self.title} by {self.author}'

    class Meta:
        ordering = ['-created_at']  # Newest books first by default
        verbose_name = 'Book'
        verbose_name_plural = 'Books'
        
    # Method to get the Genre object associated with this book
    def get_genre_object(self):
        """Get the Genre object for this book"""
        try:
            return Genre.objects.get(code=self.genre)
        except Genre.DoesNotExist:
            return Genre.objects.get(code='unknown')


# Ensure all genres from GENRE_CHOICES exist in the database
@receiver(post_migrate)
def create_default_genres(sender, **kwargs):
    if sender.name == 'books':  # Only run for our app
        for code, name in GENRE_CHOICES:
            Genre.objects.get_or_create(code=code, defaults={'name': name})