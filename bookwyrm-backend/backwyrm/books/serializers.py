from rest_framework import serializers
from .models import Book, Genre

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ('__all__') #serializer for all fields in the Book model

class GenreSerializer(serializers.ModelSerializer):
    """
    Serializer for the Genre model
    """
    class Meta:
        model = Genre
        fields = ['id', 'code', 'name']