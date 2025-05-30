from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Book, Genre
from .serializers import BookSerializer, GenreSerializer

# Create your views here.
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-created_at')  # Order by creation date, newest first
    permission_classes = [permissions.AllowAny]  # Allow any user to access this view
    serializer_class = BookSerializer

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