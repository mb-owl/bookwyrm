from django.db import models


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
    ('unknown', 'Unknown'),
]


# Create your models here.
class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    genre = models.CharField(
        max_length=100,
        choices=GENRE_CHOICES,
        blank=True,
        null=True
    )  # genre of the book, optional
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
    cover = models.ImageField(upload_to='covers/', blank=True, null=True)  # uploaded book cover, optional
    created_at = models.DateTimeField(auto_now_add=True)  # when the book was added to the database
    updated_at = models.DateTimeField(auto_now=True)  # when the book was last updated
    isbn = models.CharField(max_length=13, unique=True, blank=True, null=True)  # ISBN number, optional
    language = models.CharField(max_length=50, blank=True, null=True)  # language of the book, optional
    publisher = models.CharField(max_length=255, blank=True, null=True)  # publisher of the book, optional
    page_count = models.PositiveIntegerField(blank=True, null=True)  # number of pages in the book, optional
    vibes = models.CharField(max_length=255, blank=True, null=True)  # vibes of the book, optional
    tags = models.CharField(max_length=255, blank=True, null=True)  # tags associated with the book, optional

    def __str__(self):
        return f'{self.title} by {self.author}'