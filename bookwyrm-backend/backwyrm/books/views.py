from django.shortcuts import render
from django.utils import timezone
from datetime import date, datetime, timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Book, Genre, ReadingDay
from .serializers import BookSerializer, GenreSerializer
from rest_framework.views import APIView

# Create your views here.
class BookViewSet(viewsets.ModelViewSet):
    """
    API endpoint for books
    """
    serializer_class = BookSerializer
    
    def get_queryset(self):
        """Override queryset to exclude soft-deleted books by default"""
        queryset = Book.objects.all()
        
        # Only include non-deleted books unless specifically requesting trash
        # or using a restore action
        if self.action != 'trash' and self.action != 'restore':
            queryset = queryset.filter(is_deleted=False)
            
        return queryset
    
    def get_object(self):
        """
        Override get_object to handle soft-deleted items in restoration
        """
        # Get the object ID from the URL
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        
        # For restore action, we need to find the book even if it's deleted
        if self.action == 'restore':
            # Get all books including deleted ones
            queryset = Book.objects.all()
            obj = get_object_or_404(queryset, **filter_kwargs)
            
            # Check object permissions
            self.check_object_permissions(self.request, obj)
            return obj
        
        # For other actions, use the standard behavior
        return super().get_object()
    
    def destroy(self, request, *args, **kwargs):
        """Override delete to perform soft delete instead of hard delete"""
        book = self.get_object()
        book.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def trash(self, request):
        """Get all books in trash (deleted but not yet permanently removed)"""
        # Get books that are marked as deleted
        deleted_books = Book.objects.filter(is_deleted=True)
        serializer = self.get_serializer(deleted_books, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a book from trash and return complete book data"""
        try:
            # Get the book using our overridden get_object method
            # which will find books even if they're deleted
            book = self.get_object()
            
            # Log the book we're trying to restore
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Attempting to restore book: {pk} - {book.title}")
            
            if not book.is_deleted:
                return Response(
                    {"detail": "This book is not in trash."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Restore the book
            book.restore()
            logger.info(f"Book {pk} restored successfully")
            
            # Get fresh book data after restoration
            book.refresh_from_db()
            
            # Verify the restoration was successful
            if book.is_deleted:
                logger.error(f"Book {pk} is still marked as deleted after restore")
                return Response(
                    {"detail": "Failed to restore the book. It's still marked as deleted."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Return the complete serialized book data
            serializer = self.get_serializer(book)
            return Response(serializer.data)
            
        except Exception as e:
            # Log the detailed error
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Error restoring book {pk}: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Return a helpful error response
            return Response(
                {"detail": f"Server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        """Permanently delete a book from the database"""
        book = self.get_object()
        book.delete()  # Actually delete from database
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def empty_trash(self, request):
        """Permanently delete all books in trash"""
        deleted_books = Book.objects.filter(is_deleted=True)
        count = deleted_books.count()
        deleted_books.delete()
        return Response({"detail": f"Permanently deleted {count} books."})

class GenreViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing book genres
    """
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """
        Sync genres from the mobile app to the backend
        """
        genres_data = request.data
        
        if not isinstance(genres_data, list):
            return Response(
                {"error": "Expected a list of genre objects"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        results = []
        for genre_data in genres_data:
            code = genre_data.get('value')
            name = genre_data.get('label')
            
            if not code or not name:
                results.append({
                    "status": "error",
                    "message": "Missing code or name",
                    "data": genre_data
                })
                continue
                
            genre, created = Genre.objects.update_or_create(
                code=code,
                defaults={'name': name}
            )
            
            results.append({
                "status": "created" if created else "updated",
                "code": code,
                "name": name
            })
            
        return Response(results)

class ReadingStatsView(APIView):
    """
    API view to handle reading statistics
    """
    def get(self, request):
        """Get reading statistics"""
        # Get the current year
        current_year = date.today().year
        
        # Count total reading days for the current year
        total_days = ReadingDay.objects.filter(
            read_date__year=current_year
        ).count()
        
        return Response({
            'total_days_read': total_days,
            'current_year': current_year
        })
    
    def post(self, request):
        """Record a new reading day"""
        try:
            # Get the date from request or use today
            read_date_str = request.data.get('read_date')
            if read_date_str:
                read_date = datetime.strptime(read_date_str, '%Y-%m-%d').date()
            else:
                read_date = date.today()
            
            # Check if already recorded
            if ReadingDay.objects.filter(read_date=read_date).exists():
                return Response(
                    {'detail': 'Reading already recorded for this date'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new reading day record
            ReadingDay.objects.create(read_date=read_date)
            
            # Get updated count for current year
            current_year = date.today().year
            total_days = ReadingDay.objects.filter(
                read_date__year=current_year
            ).count()
            
            return Response({
                'success': True,
                'read_date': read_date,
                'total_days_read': total_days
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )