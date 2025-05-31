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
    
    # New field to store additional genres beyond the primary one
    additional_genres = models.TextField(
        blank=True, 
        null=True, 
        help_text="Comma-separated list of additional genres beyond the primary genre"
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
    number_of_chapters = models.PositiveIntegerField(blank=True, null=True)  # New field for number of chapters
    publication_date = models.DateField(blank=True, null=True)  # New field for publication date
    
    # User-added metadata
    vibes = models.CharField(max_length=255, blank=True, null=True)
    tags = models.CharField(max_length=255, blank=True, null=True)
    content_warnings = models.TextField(blank=True, null=True)
    emoji = models.CharField(max_length=10, blank=True, null=True, default="📚")
    
    # Add fields for tracking deleted books
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

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
    
    # Enhanced methods for soft delete functionality
    def soft_delete(self):
        """Mark book as deleted and set deletion timestamp"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
        
    def restore(self):
        """Restore a deleted book"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Restoring book {self.id}: {self.title}")
        
        if not self.is_deleted:
            logger.warning(f"Attempted to restore book {self.id} that is not deleted")
            return False
            
        self.is_deleted = False
        self.deleted_at = None
        self.save()
        
        # Verify the restoration was successful
        self.refresh_from_db()
        success = not self.is_deleted
        logger.info(f"Book {self.id} restoration {'successful' if success else 'failed'}")
        return success
    
    @property
    def days_until_permanent_deletion(self):
        """Calculate days remaining until permanent deletion"""
        if not self.is_deleted or not self.deleted_at:
            return None
            
        from django.utils import timezone
        from datetime import timedelta
        
        # Books remain in trash for 30 days
        deletion_date = self.deleted_at + timedelta(days=30)
        days_left = (deletion_date - timezone.now()).days
        
        return max(0, days_left)


# New model for book photos
class BookPhoto(models.Model):
    """
    Model to store photos related to books uploaded by users.
    """
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='photos')
    photo = models.ImageField(upload_to='book_photos/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Photo for {self.book.title}"
    
    class Meta:
        ordering = ['-uploaded_at']


# New model for tracking reading days
class ReadingDay(models.Model):
    """
    Model to track days when the user has read.
    Each record represents a single day of reading.
    """
    read_date = models.DateField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Reading on {self.read_date}"
    
    class Meta:
        ordering = ['-read_date']
        verbose_name = 'Reading Day'
        verbose_name_plural = 'Reading Days'


# Ensure all genres from GENRE_CHOICES exist in the database
@receiver(post_migrate)
def create_default_genres(sender, **kwargs):
    if sender.name == 'books':  # Only run for our app
        for code, name in GENRE_CHOICES:
            Genre.objects.get_or_create(code=code, defaults={'name': name})