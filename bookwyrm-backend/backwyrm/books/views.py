from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Book
from .serializers import BookSerializer

# Create your views here.
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('-created_at')  # Order by creation date, newest first
    permission_classes = [permissions.AllowAny]  # Allow any user to access this view
    serializer_class = BookSerializer