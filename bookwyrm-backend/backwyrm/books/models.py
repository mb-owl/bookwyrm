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
    cover = models.ImageField(upload_to='covers/', blank=True, null=True) #uploaded book cover, optional
    created_at = models.DateTimeField(auto_now_add=True) # when the book was added to the database

    def __str__(self):
        return f'{self.title} by {self.author}'