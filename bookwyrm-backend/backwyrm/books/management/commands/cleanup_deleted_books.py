from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from books.models import Book
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Permanently delete books that have been soft-deleted for more than 30 days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Days to keep deleted books before permanent deletion (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually deleting anything'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        # Calculate the cutoff date
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Get books deleted before the cutoff date
        books_to_delete = Book.objects.filter(
            is_deleted=True,
            deleted_at__lt=cutoff_date
        )
        
        count = books_to_delete.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No books to delete.'))
            return
            
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {count} books that were soft-deleted more than {days} days ago')
            )
            for book in books_to_delete:
                deleted_days = (timezone.now() - book.deleted_at).days
                self.stdout.write(f' - "{book.title}" by {book.author} (deleted {deleted_days} days ago)')
        else:
            for book in books_to_delete:
                book_title = book.title
                book_author = book.author
                deleted_days = (timezone.now() - book.deleted_at).days
                
                # Log before deletion to ensure we have a record
                logger.info(f'Permanently deleting book: "{book_title}" by {book_author} (deleted {deleted_days} days ago)')
                
                # Permanently delete the book
                book.delete()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {count} books that were soft-deleted more than {days} days ago')
            )
