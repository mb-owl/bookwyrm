from django.db import models
from django.db.models.signals import post_migrate
from django.dispatch import receiver


# Define GENRE_CHOICES as a constant here that can be imported by other files
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


# Move Genre to be a top-level model
class Genre(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']


# Create your models here.
class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    genre = models.ForeignKey(
        Genre, 
        on_delete=models.SET_NULL,
        blank=True, 
        null=True, 
        related_name='books'
    )  # genres of the book, now a foreign key
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        blank=True, 
        null=True
    )  # rating of the book, optional
    book_notes = models.TextField(blank=True, null=True)  # notes about the book, optional
    toBeRead = models.BooleanField(default=False)  # whether the book is to be read or not
    is_read = models.BooleanField(default=False)  # whether the book has been read or not
    shelved = models.BooleanField(default=False)  # whether the book is shelved or not
    publication_date = models.DateField(blank=True, null=True)  # publication date of the book, optional
    created_at = models.DateTimeField(auto_now_add=True)  # when the book was added to the database
    updated_at = models.DateTimeField(auto_now=True)  # when the book was last updated
    isbn = models.CharField(max_length=13, unique=True, blank=True, null=True)  # ISBN number, optional
    language = models.CharField(max_length=50, blank=True, null=True)  # language of the book, optional
    publisher = models.CharField(max_length=255, blank=True, null=True)  # publisher of the book, optional
    page_count = models.PositiveIntegerField(blank=True, null=True)  # number of pages in the book, optional
    vibes = models.CharField(max_length=255, blank=True, null=True)  # vibes of the book, optional
    tags = models.CharField(max_length=255, blank=True, null=True)  # tags associated with the book, optional
    content_warnings = models.TextField(blank=True, null=True)  # content warnings for sensitive topics
    emoji = models.CharField(max_length=10, blank=True, null=True, default="📚")  # emoji rating for the book

    def __str__(self):
        return f'{self.title} by {self.author}'


# Function to ensure all genres from GENRE_CHOICES exist in the database
@receiver(post_migrate)
def create_default_genres(sender, **kwargs):
    if sender.name == 'books':  # Only run for our app
        for code, name in GENRE_CHOICES:
            Genre.objects.get_or_create(code=code, defaults={'name': name})


# Function to update a book's genre from string to foreign key relationship
def update_book_genres():
    """
    Helper function to migrate books from string genre to foreign key relationship.
    Run this after adding new genres or after migrations.
    """
    for book in Book.objects.all():
        if hasattr(book, 'genre_old') and book.genre_old:
            try:
                # Try to find a matching genre
                genre = Genre.objects.get(code=book.genre_old)
                book.genre = genre
                book.save(update_fields=['genre'])
            except Genre.DoesNotExist:
                # If genre doesn't exist, create it
                new_genre = Genre.objects.create(
                    code=book.genre_old,
                    name=book.genre_old.replace('-', ' ').title()
                )
                book.genre = new_genre
                book.save(update_fields=['genre'])