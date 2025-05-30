from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Book, Genre, BookPhoto, ReadingDay
from .serializers import BookSerializer, GenreSerializer
from rest_framework.views import APIView
from datetime import date, datetime

# Create your views here.
class BookViewSet(viewsets.ModelViewSet):
    """
    API endpoint for books
    """
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context for URL generation"""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    def create(self, request, *args, **kwargs):
        """Create a new book with optional photos"""
        try:
            # Log incoming data for debugging
            print(f"Creating book with data: {request.data}")
            
            # Get photo count from request
            photo_count = int(request.data.get('book_photo_count', 0))
            print(f"Photo count: {photo_count}")
            
            # Process book data first
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            book = serializer.save()
            
            # Process and save photos if any exist
            if photo_count > 0:
                for i in range(photo_count):
                    photo_field = f'book_photo_{i}'
                    if photo_field in request.FILES:
                        # Log photo data
                        photo_file = request.FILES[photo_field]
                        print(f"Processing photo {i}: {photo_file.name}, size: {photo_file.size}")
                        
                        # Create BookPhoto object with the uploaded file
                        book_photo = BookPhoto.objects.create(
                            book=book, 
                            photo=photo_file
                        )
                        print(f"Created photo with ID: {book_photo.id}")
            
            # Return the serialized book including the photos
            serializer = self.get_serializer(book)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(f"Error creating book: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update a book with optional photos"""
        try:
            print(f"Updating book with data: {request.data}")
            
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            
            # Get photo count from request
            photo_count = int(request.data.get('book_photo_count', 0))
            print(f"Photo count: {photo_count}")
            
            # Process book data first
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            book = serializer.save()
            
            # Process photos if any exist
            if photo_count > 0:
                # Remove existing photos if we're replacing them
                # Only when explicitly specified or in a full update
                if not partial or request.data.get('replace_photos') == 'true':
                    print(f"Deleting existing photos for book: {book.id}")
                    BookPhoto.objects.filter(book=book).delete()
                
                # Add the new photos
                for i in range(photo_count):
                    photo_field = f'book_photo_{i}'
                    if photo_field in request.FILES:
                        # Log photo data
                        photo_file = request.FILES[photo_field]
                        print(f"Processing photo {i}: {photo_file.name}, size: {photo_file.size}")
                        
                        # Create BookPhoto object with the uploaded file
                        book_photo = BookPhoto.objects.create(
                            book=book, 
                            photo=photo_file
                        )
                        print(f"Created photo with ID: {book_photo.id}")
            
            if getattr(instance, '_prefetched_objects_cache', None):
                # If 'prefetch_related' has been applied, clear the cache
                instance._prefetched_objects_cache = {}
            
            # Return the serialized book including the photos
            serializer = self.get_serializer(book)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error updating book: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update for books"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

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